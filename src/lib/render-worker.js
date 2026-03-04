#!/usr/bin/env node
/**
 * render-worker.js — Native Puppeteer Server Render Worker
 *
 * This worker directly controls a headless Chromium browser to render React frames.
 * Unlike html-to-image/WebCodecs, this uses a pure native `page.screenshot` to 
 * perfectly capture the Chrome compositor, ensuring zero UI artifacts or scrollbars.
 * The raw PNG buffer frames are directly piped into an FFmpeg instance.
 *
 * Audio Pipeline (sync-safe):
 *   1. Fetch TTS → save raw file
 *   2. Normalise → canonical 22050Hz/stereo/PCM s16le WAV (eliminates encoder delays)
 *   3. ffprobe normalised file → exact decoded duration
 *   4. Build timeline from probed durations (NOT schema `slide.duration`)
 *   5. Concat all normalised clips into one combined WAV
 *   6. Mux combined WAV + video frames → MP4
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

// ── Puppeteer / Chromium — environment-aware ───────────────────────────────────
// On Vercel (or any serverless env), use puppeteer-core + @sparticuz/chromium.
// Locally, use full puppeteer which bundles its own Chromium.
const IS_VERCEL = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
let puppeteer;
let chromiumArgs;
let executablePath;

if (IS_VERCEL) {
    puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');
    chromiumArgs = chromium.args;
    executablePath = chromium.executablePath();
} else {
    puppeteer = require('puppeteer');
    chromiumArgs = null;
    executablePath = null;
}

const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Ffmpeg = require('fluent-ffmpeg');
Ffmpeg.setFfmpegPath(ffmpegInstaller.path);
Ffmpeg.setFfprobePath(ffprobeInstaller.path);

const jobId = process.argv[2];

if (!jobId) {
    console.error('Usage: node render-worker.js <jobId>');
    process.exit(1);
}

const tmpDir = path.join(os.tmpdir(), `narrate-${jobId}`);
const paramsPath = path.join(tmpDir, 'params.json');
const statusPath = path.join(tmpDir, 'status.json');
const outputsDir = path.join(process.cwd(), 'outputs');
if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
const outputPath = path.join(outputsDir, `video-${jobId.slice(0, 8)}.mp4`);

// Basic API Client to fetch TTS audio directly from the Next dev server
// Because this is a Node process, we can just call our own API
async function fetchTTS(text, voice, provider) {
    const res = await fetch('http://localhost:3000/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, provider })
    });
    if (!res.ok) throw new Error(`TTS HTTP error: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

function writeStatus(update) {
    try {
        let current = {};
        if (fs.existsSync(statusPath)) {
            try { current = JSON.parse(fs.readFileSync(statusPath, 'utf8')); } catch { }
        }
        fs.writeFileSync(statusPath, JSON.stringify({ ...current, ...update }));
    } catch { /* ignore */ }
}

// ── Audio helpers ──────────────────────────────────────────────────────────────

/**
 * Probe the exact decoded duration of an audio file using ffprobe.
 * Always probe a NORMALISED PCM file for accurate results.
 */
function getAudioDuration(filePath) {
    return new Promise((resolve) => {
        Ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err || !metadata?.format?.duration) {
                console.warn(`[worker] ffprobe failed for ${path.basename(filePath)}: ${err?.message ?? 'no duration'} — fallback 5s`);
                resolve(5);
            } else {
                resolve(parseFloat(String(metadata.format.duration)));
            }
        });
    });
}

/**
 * Normalise any audio to canonical 22050Hz/stereo/PCM s16le WAV.
 * Eliminates encoder delay drift so ffprobe gives exact decoded duration.
 */
function normaliseAudio(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        Ffmpeg()
            .input(inputPath)
            .outputOptions(['-c:a', 'pcm_s16le', '-ar', '22050', '-ac', '2'])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(new Error(`Normalise failed (${path.basename(inputPath)}): ${err.message}`)))
            .run();
    });
}

/**
 * Generate a silent PCM WAV of the given duration (fallback for failed TTS).
 */
function generateSilence(outputPath, durationSeconds) {
    return new Promise((resolve, reject) => {
        Ffmpeg()
            .input('anullsrc=r=22050:cl=stereo')
            .inputOptions(['-f', 'lavfi'])
            .outputOptions(['-t', durationSeconds.toFixed(6), '-c:a', 'pcm_s16le', '-ar', '22050', '-ac', '2'])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(new Error(`Silence gen failed: ${err.message}`)))
            .run();
    });
}

/**
 * Concatenate normalised per-slide PCM WAV clips into one combined WAV.
 * All inputs must be 22050Hz/stereo/pcm_s16le (guaranteed by normaliseAudio).
 */
async function buildCombinedAudio(normPaths, fallbackDurations, combinedPath) {
    const resolvedPaths = await Promise.all(
        normPaths.map(async (p, i) => {
            if (p && fs.existsSync(p)) return p;
            const silPath = path.join(tmpDir, `silence-${i}.wav`);
            await generateSilence(silPath, fallbackDurations[i] ?? 5);
            return silPath;
        })
    );

    if (resolvedPaths.length === 1) {
        fs.copyFileSync(resolvedPaths[0], combinedPath);
        return;
    }

    let cmd = Ffmpeg();
    resolvedPaths.forEach(p => { cmd = cmd.input(p); });
    const n = resolvedPaths.length;
    const filterInputs = resolvedPaths.map((_, i) => `[${i}:a]`).join('');
    const filter = `${filterInputs}concat=n=${n}:v=0:a=1[aout]`;

    await new Promise((resolve, reject) => {
        cmd
            .complexFilter(filter)
            .outputOptions(['-map', '[aout]', '-c:a', 'pcm_s16le', '-ar', '22050', '-ac', '2'])
            .output(combinedPath)
            .on('end', () => resolve())
            .on('error', (err) => reject(new Error(`Audio concat failed: ${err.message}`)))
            .run();
    });
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
    if (!fs.existsSync(paramsPath)) {
        writeStatus({ status: 'error', message: 'params.json not found' });
        process.exit(1);
    }

    const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
    const width = params.width || 1280;
    const height = params.height || 720;
    const fps = params.fps || 30;
    const slides = params.script.slides;

    // ── Phase 1: Fetch TTS → Normalise → Probe exact durations ────────────────
    // Run TTS + normalise in PARALLEL batches for speed (concurrency-limited)
    writeStatus({ status: 'audio', progress: 5, message: 'Generating audio via TTS...' });

    const CONCURRENCY = 3; // parallel TTS requests (avoid overwhelming Sarvam API)
    const normAudioPaths = new Array(slides.length).fill(null);
    const slideDurations = new Array(slides.length).fill(5);

    async function processSlideAudio(i) {
        const slide = slides[i];
        const text = slide.narration || slide.title;
        const rawPath = path.join(tmpDir, `audio-raw-${slide.slide_id}.wav`);
        const normPath = path.join(tmpDir, `audio-norm-${slide.slide_id}.wav`);

        try {
            const buffer = await fetchTTS(text, params.voice, params.provider);
            fs.writeFileSync(rawPath, buffer);
            await normaliseAudio(rawPath, normPath);
            normAudioPaths[i] = normPath;
            const dur = await getAudioDuration(normPath);
            console.log(`[worker] Slide ${slide.slide_id} audio: ${dur.toFixed(3)}s`);
            slideDurations[i] = dur;
        } catch (err) {
            console.error(`[worker] Audio failed for slide ${slide.slide_id}:`, err.message);
            normAudioPaths[i] = null;
            slideDurations[i] = slide.duration || 5;
        }
    }

    // Process in batches of CONCURRENCY
    for (let batch = 0; batch < slides.length; batch += CONCURRENCY) {
        const batchEnd = Math.min(batch + CONCURRENCY, slides.length);
        const promises = [];
        for (let i = batch; i < batchEnd; i++) {
            promises.push(processSlideAudio(i));
        }
        await Promise.all(promises);
        const pct = Math.round(5 + (batchEnd / slides.length) * 15);
        writeStatus({ status: 'audio', progress: pct, message: `Audio ${batchEnd}/${slides.length} done...` });
    }

    // ── Phase 2: Patch slide durations with PROBED values ─────────────────────
    // This is CRITICAL for sync: Stage.tsx uses slide.duration to decide which
    // slide to show at any given currentTime.  If we don't overwrite the original
    // schema durations with the real audio durations, the video frames will show
    // the wrong slide relative to the audio.
    for (let i = 0; i < slides.length; i++) {
        const old = slides[i].duration;
        slides[i].duration = slideDurations[i];
        console.log(`[worker] Slide ${slides[i].slide_id} duration: schema=${old}s → audio=${slideDurations[i].toFixed(3)}s`);
    }

    const totalDuration = slideDurations.reduce((a, b) => a + b, 0);
    const totalFrames = Math.ceil(totalDuration * fps);
    console.log(`[worker] Total duration: ${totalDuration.toFixed(3)}s | ${totalFrames} frames`);

    // ── Phase 2b: Build combined audio track ──────────────────────────────────
    writeStatus({ status: 'audio', progress: 22, message: 'Building combined audio track...' });
    const combinedAudioPath = path.join(tmpDir, 'combined-audio.wav');
    await buildCombinedAudio(normAudioPaths, slideDurations, combinedAudioPath);

    // ── SSR Static Branch ─────────────────────────────────────────────────────
    // When renderMode === 'ssr-static', skip Puppeteer entirely.
    // Draw one static PNG per slide with node-canvas, then stitch them with the
    // FFmpeg concat demuxer.  Much faster: O(slides) draws instead of O(slides×fps×dur).
    if (params.renderMode === 'ssr-static') {
        await renderSSRStatic({
            params, slides, width, height, fps,
            slideDurations, combinedAudioPath, tmpDir, outputPath,
        });
        process.exit(0);
    }

    writeStatus({ status: 'rendering', progress: 25, message: 'Launching headless Chromium...' });

    // ── Phase 3: Launch Puppeteer ──────────────────────────────────────────────
    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--run-all-compositor-stages-before-draw',
    ];

    const launchOptions = {
        headless: true,
        args: IS_VERCEL ? [...chromiumArgs, ...launchArgs] : launchArgs,
        defaultViewport: { width, height },
    };

    if (IS_VERCEL && executablePath) {
        launchOptions.executablePath = await executablePath;
    }

    const browser = await puppeteer.launch(launchOptions);

    let page;
    let ffmpegProc;

    try {
        page = await browser.newPage();

        await page.evaluateOnNewDocument((renderParams) => {
            window.__RENDER_PARAMS__ = renderParams;
        }, params);

        console.log(`[worker] Navigating to auto-render engine...`);
        await page.goto('http://localhost:3000/auto-render', { waitUntil: 'networkidle0' });

        // Force-hide any Next.js dev overlays that might appear in screenshots
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast],
                #__next-build-indicator, [data-next-mark], nextjs-dev-tools-widget,
                [class*="nextjs"], [id*="__nextjs"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `;
            document.head.appendChild(style);
        });

        writeStatus({ status: 'rendering', progress: 30, message: 'Starting FFmpeg video encoder...' });

        // ── Phase 4: Spawn FFmpeg — video frames from stdin, audio from combined WAV ──
        // PERF: Use JPEG pipe instead of PNG (5-10x faster screenshot + decode)
        //       Use ultrafast preset (2-3x faster encode at cost of ~10% larger file)
        const ffmpegArgs = [
            '-y',
            '-f', 'image2pipe',
            '-vcodec', 'mjpeg',                  // JPEG input (was: png)
            '-r', fps.toString(),
            '-i', '-',                           // [0] video frame pipe
            '-i', combinedAudioPath,             // [1] combined audio (perfectly synced)
            '-map', '0:v',
            '-map', '1:a',
            '-c:v', 'libx264',
            '-preset', 'ultrafast',              // was: fast — ~2-3x faster encoding
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',
            '-b:a', '128k',
            '-movflags', '+faststart',
            '-t', totalDuration.toFixed(6),      // hard-trim to exact audio length
            outputPath
        ];

        console.log(`[worker] Spawning FFmpeg: ${ffmpegArgs.join(' ')}`);

        ffmpegProc = spawn(ffmpegInstaller.path, ffmpegArgs, {
            stdio: ['pipe', 'inherit', 'inherit']
        });

        ffmpegProc.on('error', (err) => {
            console.error('[worker] FFmpeg spawn error:', err);
        });

        // CRITICAL: Wait for the React app to fully hydrate and expose the seek function
        console.log('[worker] Waiting for auto-render engine to be ready...');
        await page.waitForFunction('typeof window.seekToFrame === "function"', { timeout: 30000 });
        console.log('[worker] Auto-render engine ready. Starting capture...');

        // ── Phase 5: Render loop — capture every frame → pipe to FFmpeg stdin ──
        for (let frameNum = 0; frameNum < totalFrames; frameNum++) {
            await page.evaluate(async (f) => {
                // We know seekToFrame exists now, so we can call it directly
                // and await the promise which resolves only after frame is painted
                await window.seekToFrame(f);
            }, frameNum);

            // Removed explicit readiness check (waitForFunction) to speed up the loop.
            // window.seekToFrame is async and awaits the React update + font check itself.
            // Puppeteer's await page.evaluate(...) won't return until that promise resolves.
            // The --run-all-compositor-stages-before-draw flag ensures paint is done before screenshot.

            const buffer = await page.screenshot({
                // quality 80 is virtually indistinguishable from 90 for video frames but faster to encode/transmit
                type: 'jpeg',
                quality: 80, 
                clip: { x: 0, y: 0, width, height },
                // removed optimizeForSpeed as it might cause blank frames on some systems
            });

            if (ffmpegProc.stdin.writable) {
                const canWrite = ffmpegProc.stdin.write(buffer);
                if (!canWrite) {
                    await new Promise(r => ffmpegProc.stdin.once('drain', r));
                }
            } else {
                break;
            }

            if (frameNum % 30 === 0 || frameNum === totalFrames - 1) {
                const prog = 30 + Math.floor((frameNum / totalFrames) * 65);
                writeStatus({
                    status: 'rendering',
                    progress: prog,
                    message: `Rendering frame ${frameNum + 1}/${totalFrames}`
                });
            }
        }

        ffmpegProc.stdin.end();
        writeStatus({ status: 'rendering', progress: 95, message: 'Finalizing MP4 via FFmpeg...' });

        await new Promise((resolve, reject) => {
            ffmpegProc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
        });

        console.log(`[worker] FFmpeg finished successfully!`);
        writeStatus({ status: 'complete', progress: 100, message: 'Video ready for download.', outputPath });
        console.log(`[worker] ✅ Job complete!`);

    } catch (err) {
        console.error(`[worker] Error:`, err);
        writeStatus({ status: 'error', progress: 0, message: err.message });
    } finally {
        if (browser) await browser.close().catch(() => { });
        process.exit();
    }
}


// ════════════════════════════════════════════════════════════════════════════
// SSR STATIC RENDERER  (Puppeteer — one screenshot per slide)
// ════════════════════════════════════════════════════════════════════════════
//
// Uses the SAME headless Chromium + React pipeline as the full server render,
// guaranteeing identical visual fidelity (fonts, Telugu text, themes, etc.).
//
// Instead of capturing every animation frame (slides × fps × duration),
// we capture ONE settled screenshot per slide and use FFmpeg's concat demuxer
// to hold each image for its exact audio duration.
//
// Speed: N screenshots instead of N × fps × avg_duration  (e.g. 9 vs 2700).
// ════════════════════════════════════════════════════════════════════════════

async function renderSSRStatic({ params, slides, width, height, fps, slideDurations, combinedAudioPath, tmpDir, outputPath }) {

    writeStatus({ status: 'rendering', progress: 25, message: 'Launching headless Chromium...' });

    // ── Launch Puppeteer (identical to normal server render) ───────────────────
    const launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        '--disable-web-security',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--run-all-compositor-stages-before-draw',
    ];

    const launchOptions = {
        headless: true,
        args: IS_VERCEL ? [...chromiumArgs, ...launchArgs] : launchArgs,
        defaultViewport: { width, height },
    };

    if (IS_VERCEL && executablePath) {
        launchOptions.executablePath = await executablePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    let page;

    try {
        page = await browser.newPage();

        // Inject render params so the auto-render page can hydrate
        await page.evaluateOnNewDocument((renderParams) => {
            window.__RENDER_PARAMS__ = renderParams;
        }, params);

        console.log('[ssr-static] Navigating to auto-render engine...');
        await page.goto('http://localhost:3000/auto-render', { waitUntil: 'networkidle0' });

        // Hide Next.js dev overlays
        await page.evaluate(() => {
            const style = document.createElement('style');
            style.textContent = `
                nextjs-portal, [data-nextjs-dialog-overlay], [data-nextjs-toast],
                #__next-build-indicator, [data-next-mark], nextjs-dev-tools-widget,
                [class*="nextjs"], [id*="__nextjs"] {
                    display: none !important;
                    visibility: hidden !important;
                    opacity: 0 !important;
                    width: 0 !important;
                    height: 0 !important;
                }
            `;
            document.head.appendChild(style);
        });

        // Wait for the React app to expose seekToFrame
        console.log('[ssr-static] Waiting for auto-render engine to be ready...');
        await page.waitForFunction('typeof window.seekToFrame === "function"', { timeout: 30000 });
        console.log('[ssr-static] Ready. Capturing one frame per slide...');

        writeStatus({ status: 'rendering', progress: 30, message: 'Capturing slide frames...' });

        // ── Build cumulative timeline (start frame of each slide) ─────────────
        // We capture the LAST moment of each slide (just before transition)
        // so that ALL animations (flowcharts, staggered bullets, etc.) are 100% complete.
        const slideStartFrames = [];
        let cumulativeTime = 0;
        for (let i = 0; i < slides.length; i++) {
            const dur = slideDurations[i];
            // Seek to 0.1s before the slide ends — all animations are fully settled.
            // For very short slides (<0.5s), just take the midpoint.
            const settledOffset = dur > 0.5 ? dur - 0.1 : dur * 0.5;
            const seekTime = cumulativeTime + settledOffset;
            const seekFrame = Math.round(seekTime * fps);
            slideStartFrames.push(seekFrame);
            cumulativeTime += dur;
        }

        // ── Capture one PNG screenshot per slide ──────────────────────────────
        const framePaths = [];

        for (let i = 0; i < slides.length; i++) {
            const targetFrame = slideStartFrames[i];

            await page.evaluate(async (f) => {
                await window.seekToFrame(f);
            }, targetFrame);

            const framePath = path.join(tmpDir, `frame-${i}.png`);
            const buffer = await page.screenshot({
                type: 'png',
                clip: { x: 0, y: 0, width, height },
            });

            fs.writeFileSync(framePath, buffer);
            framePaths.push(framePath);

            const pct = 30 + Math.round(((i + 1) / slides.length) * 35);
            writeStatus({ status: 'rendering', progress: pct, message: `Captured slide ${i + 1}/${slides.length}` });
            console.log(`[ssr-static] Captured slide ${i + 1}/${slides.length} (frame ${targetFrame})`);
        }

        // ── Close browser — done with Puppeteer ──────────────────────────────
        await browser.close().catch(() => {});

        // ── Write FFmpeg concat manifest ──────────────────────────────────────
        // Every entry gets an explicit duration matching its audio clip.
        // The last entry is duplicated WITHOUT a duration line — this is required
        // by the concat demuxer to flush the final frame, but we hard-trim
        // the output with -t to prevent it from adding extra seconds.
        const totalAudioDuration = slideDurations.reduce((a, b) => a + b, 0);
        let concatContent = '';
        for (let i = 0; i < framePaths.length; i++) {
            const p = framePaths[i].replace(/\\/g, '/');
            concatContent += `file '${p}'\nduration ${slideDurations[i].toFixed(6)}\n`;
        }
        // Concat demuxer requires the last file repeated to display the final frame
        concatContent += `file '${framePaths[framePaths.length - 1].replace(/\\/g, '/')}'\n`;

        const concatFile = path.join(tmpDir, 'concat.txt');
        fs.writeFileSync(concatFile, concatContent, 'utf8');

        // ── FFmpeg: concat demuxer → H.264 + AAC ─────────────────────────────
        writeStatus({ status: 'rendering', progress: 68, message: 'Encoding video with FFmpeg...' });

        const hasAudio = fs.existsSync(combinedAudioPath);
        const ffmpegArgs = [
            '-y',
            '-f', 'concat', '-safe', '0', '-i', concatFile,
            ...(hasAudio ? ['-i', combinedAudioPath] : []),
            '-map', '0:v',
            ...(hasAudio ? ['-map', '1:a'] : []),
            '-c:v', 'libx264',
            '-preset', 'ultrafast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-r', fps.toString(),
            ...(hasAudio ? ['-c:a', 'aac', '-b:a', '128k'] : []),
            // Hard-trim to exact audio duration — prevents extra silent frames at the end
            '-t', totalAudioDuration.toFixed(6),
            '-movflags', '+faststart',
            outputPath,
        ];

        console.log(`[ssr-static] FFmpeg: ${ffmpegArgs.join(' ')}`);

        const ffmpegProc = spawn(ffmpegInstaller.path, ffmpegArgs, {
            stdio: ['ignore', 'inherit', 'inherit'],
        });

        await new Promise((resolve, reject) => {
            ffmpegProc.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`FFmpeg exited with code ${code}`));
            });
            ffmpegProc.on('error', reject);
        });

        writeStatus({ status: 'complete', progress: 100, message: 'Video ready for download.', outputPath });
        console.log('[ssr-static] ✅ Complete!');

    } catch (err) {
        console.error('[ssr-static] Error:', err);
        writeStatus({ status: 'error', progress: 0, message: err.message });
    } finally {
        if (browser) await browser.close().catch(() => {});
    }
}

main();
