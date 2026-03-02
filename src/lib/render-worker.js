#!/usr/bin/env node
/**
 * render-worker.js — Native Puppeteer Server Render Worker
 *
 * This worker directly controls a headless Chromium browser to render React frames.
 * Unlike html-to-image/WebCodecs, this uses a pure native `page.screenshot` to 
 * perfectly capture the Chrome compositor, ensuring zero UI artifacts or scrollbars.
 * The raw PNG buffer frames are directly piped into an FFmpeg instance.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const { PassThrough } = require('stream');

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

async function main() {
    if (!fs.existsSync(paramsPath)) {
        writeStatus({ status: 'error', message: 'params.json not found' });
        process.exit(1);
    }

    const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));
    const width = params.width || 1280;
    const height = params.height || 720;
    const fps = params.fps || 30;

    writeStatus({ status: 'audio', progress: 5, message: 'Generating audio via TTS...' });

    // ── 1. Generate All Audio Files ───────────────────────────────────────────
    const audioPaths = [];
    const validSlides = [];

    // Filter out potential malformed slides if they occur, though our script requires them.
    for (let i = 0; i < params.script.slides.length; i++) {
        const slide = params.script.slides[i];
        const text = slide.narration || slide.title;
        const outPath = path.join(tmpDir, `audio-${slide.slide_id}.mp3`);

        try {
            writeStatus({ status: 'audio', progress: Math.round(5 + (i / params.script.slides.length * 15)), message: `Audio ${i + 1}/${params.script.slides.length}...` });
            const buffer = await fetchTTS(text, params.voice, params.provider);
            fs.writeFileSync(outPath, buffer);
            audioPaths.push(outPath);
            validSlides.push(slide);
        } catch (err) {
            console.error(`[worker] Warning: Audio generation failed for slide ${slide.slide_id}`, err);
            // Push null so we know there's no audio for this slide, but it still has duration
            audioPaths.push(null);
            validSlides.push(slide);
        }
    }

    const totalDuration = validSlides.reduce((acc, slide) => acc + (slide.duration || 5), 0);
    const totalFrames = Math.ceil(totalDuration * fps);

    writeStatus({ status: 'rendering', progress: 20, message: 'Launching headless chromium...' });

    // ── 2. Launch headless Chromium ───────────────────────────────────────────
    const browser = await puppeteer.launch({
        headless: true, // MUST be true for the server
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--hide-scrollbars', // Ensure no scrollbars exist natively
            '--disable-web-security',
        ],
        defaultViewport: { width, height }
    });

    let page;
    let ffmpegProc;

    try {
        page = await browser.newPage();

        await page.evaluateOnNewDocument((renderParams) => {
            window.__RENDER_PARAMS__ = renderParams;
        }, params);

        console.log(`[worker] Navigating to auto-render engine...`);
        await page.goto('http://localhost:3000/auto-render', { waitUntil: 'networkidle0' });

        writeStatus({ status: 'rendering', progress: 30, message: 'Starting FFmpeg video encoder...' });

        // ── 3. Start FFmpeg Child Process ──────────────────────────────────────────
        // We use native child_process to pipe buffers directly to ffmpeg without RAM inflation

        const ffmpegArgs = [
            '-y', // Overwrite output
            '-f', 'image2pipe',
            '-vcodec', 'png',
            '-r', fps.toString(),
            '-i', '-' // Read images from stdin
        ];

        // Add audio inputs
        const validAudioPaths = audioPaths.filter(p => p !== null);
        for (const p of validAudioPaths) {
            ffmpegArgs.push('-i', p);
        }

        // Build precise delayed audio mapping using filter_complex
        let cumulativeTime = 0;
        const audioMixPairs = []; // { index, delayMs }
        let currentInputIndex = 1; // 0 is video

        for (let i = 0; i < params.script.slides.length; i++) {
            const slide = params.script.slides[i];
            const slideDuration = slide.duration || 5;

            if (audioPaths[i] !== null) {
                audioMixPairs.push({
                    index: currentInputIndex, // FFmpeg stream index
                    delayMs: Math.round(cumulativeTime * 1000)
                });
                currentInputIndex++;
            }
            cumulativeTime += slideDuration;
        }

        let audioFilter = '';
        if (audioMixPairs.length === 1) {
            audioFilter = `[1:a]adelay=${audioMixPairs[0].delayMs}|${audioMixPairs[0].delayMs}[aout]`;
        } else if (audioMixPairs.length > 1) {
            const delays = audioMixPairs.map(a => `[${a.index}:a]adelay=${a.delayMs}|${a.delayMs}[a${a.index}]`).join(';');
            const combines = audioMixPairs.map(a => `[a${a.index}]`).join('');
            audioFilter = `${delays};${combines}amix=inputs=${audioMixPairs.length}[aout]`;
        }

        const outputOptions = [
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-t', totalDuration.toString(), // Forcefully trim video to exact slide duration, preventing frozen trailing frames
        ];

        if (audioMixPairs.length > 0) {
            outputOptions.push('-c:a', 'aac', '-b:a', '128k');
            if (audioFilter) {
                ffmpegArgs.push('-filter_complex', audioFilter);
                ffmpegArgs.push('-map', '0:v', '-map', '[aout]');
            } else {
                ffmpegArgs.push('-map', '0:v', '-map', '1:a');
            }
        } else {
            ffmpegArgs.push('-map', '0:v'); // Video only fallback
        }

        ffmpegArgs.push(...outputOptions);
        ffmpegArgs.push(outputPath);

        console.log(`[worker] Spawning FFmpeg: ${ffmpegArgs.join(' ')}`);

        ffmpegProc = spawn(ffmpegInstaller.path, ffmpegArgs.flat(), {
            stdio: ['pipe', 'inherit', 'inherit'] // pipe stdin, inherit stdout/err for logging
        });

        ffmpegProc.on('error', (err) => {
            console.error('[worker] FFmpeg error:', err);
        });

        // ── 4. Main Render Loop ────────────────────────────────────────────────
        // Capture frames and pipe to ffmpeg directly.

        for (let frameNum = 0; frameNum < totalFrames; frameNum++) {

            // 1. Tell browser to seek
            await page.evaluate(async (f) => {
                if (window.seekToFrame) await window.seekToFrame(f);
            }, frameNum);

            // 2. Wait for React to finish rendering
            await page.waitForFunction('window.__FRAME_READY__ === true', { timeout: 10000 });

            // 3. Take perfect compositor screenshot
            const buffer = await page.screenshot({
                type: 'png',
                clip: { x: 0, y: 0, width, height }
            });

            // 4. Pipe to FFmpeg stdin
            if (ffmpegProc.stdin.writable) {
                const canWrite = ffmpegProc.stdin.write(buffer);
                if (!canWrite) {
                    await new Promise(r => ffmpegProc.stdin.once('drain', r));
                }
            } else {
                break; // stdin closed early (ffmpeg crashed/completed)
            }

            // Status updates
            if (frameNum % 10 === 0 || frameNum === totalFrames - 1) {
                const prog = 30 + Math.floor((frameNum / totalFrames) * 65);
                writeStatus({
                    status: 'rendering',
                    progress: prog,
                    message: `Rendering frame ${frameNum}/${totalFrames}`
                });
            }
        }

        // Close stdin so ffmpeg knows there are no more frames and finalizes MP4
        ffmpegProc.stdin.end();

        writeStatus({ status: 'rendering', progress: 95, message: 'Finalizing MP4 via FFmpeg...' });

        // Wait for FFmpeg to gracefully finish
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
        // In this architecture, we wrote output directly to the job dir. 
        // We do NOT need to POST back to the server. The /api/render/status 
        // will now just read the `complete` status directly from `status.json`.
        process.exit();
    }
}

main();
