/**
 * Server-Side Video Renderer
 *
 * Resource-efficient pipeline:
 * 1. Generate TTS audio for each slide (reuses src/lib/tts.ts)
 * 2. Draw frames using node-canvas (reuses canvas-drawer.ts logic)
 * 3. Pipe raw RGBA bytes directly to FFmpeg stdin — NO disk PNG files
 * 4. Mux audio + video into MP4
 *
 * Memory profile: only 1 canvas object + 1 frame buffer in memory at any time.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createCanvas } from 'canvas';
import ffmpegStatic from '@ffmpeg-installer/ffmpeg';
import { generateSpeech } from './tts';
import { RenderJob, getJobTempDir } from './render-job-manager';
import {
    drawNeonBackground,
    drawRetroBackground,
    drawSlideContent,
} from './canvas-drawer-node';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Ffmpeg = require('fluent-ffmpeg') as typeof import('fluent-ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffprobeStatic = require('@ffprobe-installer/ffprobe') as { path: string };
Ffmpeg.setFfmpegPath((ffmpegStatic as any).path ?? ffmpegStatic);
Ffmpeg.setFfprobePath(ffprobeStatic.path);

/**
 * Get precise audio file duration in seconds using ffprobe.
 * Falls back to a safe minimum if probe fails.
 */
function getAudioDurationSeconds(filePath: string): Promise<number> {
    return new Promise((resolve) => {
        Ffmpeg.ffprobe(filePath, (err: Error | null, metadata: any) => {
            if (err || !metadata?.format?.duration) {
                console.warn(`[ffprobe] Could not probe ${filePath}: ${err?.message ?? 'no duration'} — using 5s fallback`);
                resolve(5);
            } else {
                resolve(parseFloat(String(metadata.format.duration)));
            }
        });
    });
}

/**
 * Normalise any audio file to a canonical PCM WAV:
 *   22050 Hz · stereo (2ch) · signed 16-bit little-endian
 *
 * This is the SINGLE most important step for sync.
 * Different TTS providers return MP3 / WAV at varying rates and channel counts.
 * By decoding every clip to the same format BEFORE probing its duration,
 * we guarantee that:
 *   • ffprobe's reported duration == actual decoded sample count
 *   • concat filter never gets mismatched sample-rates / channel layouts
 */
function normaliseAudio(inputPath: string, outputPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        Ffmpeg()
            .input(inputPath)
            .outputOptions([
                '-c:a',  'pcm_s16le',   // raw PCM, no encoder delay/padding
                '-ar',   '22050',
                '-ac',   '2',
            ])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err: Error) =>
                reject(new Error(`Audio normalise failed (${path.basename(inputPath)}): ${err.message}`))
            )
            .run();
    });
}

/**
 * Generate a silent PCM WAV segment of the given duration.
 * Used as a placeholder for slides whose TTS generation failed.
 */
function generateSilenceWav(outputPath: string, durationSeconds: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        Ffmpeg()
            .input('anullsrc=r=22050:cl=stereo')
            .inputOptions(['-f', 'lavfi'])
            .outputOptions([
                '-t',   durationSeconds.toFixed(6),
                '-c:a', 'pcm_s16le',
                '-ar',  '22050',
                '-ac',  '2',
            ])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(new Error(`Silence gen failed: ${err.message}`)))
            .run();
    });
}

/**
 * Concatenate normalised per-slide PCM WAV clips into one combined WAV.
 *
 * All inputs MUST already be 22050 Hz · stereo · pcm_s16le (guaranteed by
 * the normalise step in Phase 1). Therefore concat is format-safe and the
 * output duration equals exactly the sum of all clip durations.
 */
async function buildCombinedAudio(
    normPaths: string[],        // already-normalised WAV for each slide
    durations: number[],        // for silence fallback only
    outputPath: string
): Promise<void> {
    const tmpDir = path.dirname(outputPath);

    // Replace missing/failed clips with exact-duration silence
    const resolvedPaths: string[] = await Promise.all(
        normPaths.map(async (p, i) => {
            if (p && fs.existsSync(p)) return p;
            const silPath = path.join(tmpDir, `silence-${i}.wav`);
            await generateSilenceWav(silPath, durations[i] ?? 5);
            return silPath;
        })
    );

    // Single slide: file is already normalised — just copy it
    if (resolvedPaths.length === 1) {
        fs.copyFileSync(resolvedPaths[0], outputPath);
        return;
    }

    // Multiple slides: simple sequential concat (safe because all formats match)
    let cmd = Ffmpeg();
    resolvedPaths.forEach(p => { cmd = cmd.input(p); });

    const n = resolvedPaths.length;
    const filterInputs = resolvedPaths.map((_, i) => `[${i}:a]`).join('');
    const filter = `${filterInputs}concat=n=${n}:v=0:a=1[aout]`;

    await new Promise<void>((resolve, reject) => {
        cmd
            .complexFilter(filter)
            .outputOptions([
                '-map',  '[aout]',
                '-c:a',  'pcm_s16le',
                '-ar',   '22050',
                '-ac',   '2',
            ])
            .output(outputPath)
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(new Error(`Audio concat failed: ${err.message}`)))
            .run();
    });
}

// ----------------------------------------------------------------
// Types
// ----------------------------------------------------------------

interface SlideTimeline {
    slideId: number;
    startTime: number;
    endTime: number;
    duration: number;
    slide: RenderJob['params']['script']['slides'][0];
}

// ----------------------------------------------------------------
// Main entry point
// ----------------------------------------------------------------

export async function renderVideo(job: RenderJob): Promise<void> {
    const { params } = job;
    const width = params.width ?? 1280;
    const height = params.height ?? 720;
    const fps = params.fps ?? 30;
    const slides = params.script.slides;
    const template = (params.script.template ?? 'neon') as 'neon' | 'retro';

    // Create per-job temp directory for audio files
    const tmpDir = getJobTempDir(job.id);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const outputPath = path.join(os.tmpdir(), `narrate-${job.id}.mp4`);

    // ── Phase 1: Audio Generation ──────────────────────────────────────────
    job.status = 'audio';
    job.message = 'Generating audio...';
    job.progress = 0;

    const audioPaths: string[] = [];   // normalised WAV paths (one per slide)
    const durations: number[] = [];     // exact durations from normalised WAVs
    // Write raw TTS output using the correct container extension
    const rawExt = params.provider === 'sarvam' ? '.wav' : '.mp3';

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const text = slide.narration || slide.title;
        const rawPath  = path.join(tmpDir, `slide-${i}-raw${rawExt}`);
        const normPath = path.join(tmpDir, `slide-${i}-norm.wav`);

        job.message = `Generating audio (${i + 1}/${slides.length})...`;
        job.progress = Math.round((i / slides.length) * 25); // 0–25 %

        try {
            // Step A: get TTS audio from provider
            const buffer = await generateSpeech(
                text, params.voice, params.provider, 'default',
                params.narrationLanguage ?? 'te-IN'
            );
            fs.writeFileSync(rawPath, buffer);

            // Step B: decode + re-encode to canonical PCM WAV (22050 Hz, stereo, s16le).
            //   • Removes MP3 encoder delay / padding frames.
            //   • Guarantees all clips share the exact same format for concat.
            await normaliseAudio(rawPath, normPath);

            // Step C: probe the NORMALISED file — its reported duration now equals
            //   the real decoded sample count. Build the video timeline from this.
            const exactDuration = await getAudioDurationSeconds(normPath);

            // Raw file no longer needed
            try { fs.unlinkSync(rawPath); } catch { /* ignore */ }

            audioPaths.push(normPath);
            durations.push(exactDuration);
        } catch (err) {
            console.warn(`[RenderJob ${job.id}] TTS failed for slide ${i + 1}:`, (err as Error).message);
            // Clean up any partial files
            [rawPath, normPath].forEach(p => { try { fs.unlinkSync(p); } catch { /* ignore */ } });
            audioPaths.push('');        // buildCombinedAudio will synthesise silence
            durations.push(slide.duration ?? 5);
        }
    }

    // ── Phase 2: Build Timeline ────────────────────────────────────────────
    const timeline: SlideTimeline[] = [];
    let cumulative = 0;
    for (let i = 0; i < slides.length; i++) {
        const duration = durations[i];
        timeline.push({
            slideId: slides[i].slide_id,
            startTime: cumulative,
            endTime: cumulative + duration,
            duration,
            slide: slides[i],
        });
        cumulative += duration;
    }

    const totalDuration = cumulative;
    const totalFrames = Math.ceil(totalDuration * fps);

    // ── Phase 2b: Pre-mix all audio clips into one combined track ─────────
    // Concatenate clips in slide order — since each slide's video duration = its
    // audio clip duration (from ffprobe), sequential concat IS perfectly in sync.
    job.status = 'audio';
    job.message = 'Mixing audio tracks...';
    job.progress = 28;

    const combinedAudioPath = path.join(tmpDir, 'combined_audio.wav');
    try {
        await buildCombinedAudio(audioPaths, durations, combinedAudioPath);
    } catch (audioMixErr) {
        console.error(`[RenderJob ${job.id}] Audio concat failed:`, audioMixErr);
    }

    // ── Phase 3: Render Frames + Mux ──────────────────────────────────────
    job.status = 'rendering';
    job.message = 'Starting video encoder...';
    job.progress = 30;

    await muxVideoWithFramePipe(
        job,
        timeline,
        combinedAudioPath,
        outputPath,
        { width, height, fps, totalFrames, template, fontKey: params.font }
    );

    // ── Cleanup ─────────────────────────────────────────────────────────────
    // audioPaths contains only normalised WAVs (raw files already deleted inline).
    // Also clean up any silence placeholder files generated by buildCombinedAudio.
    const silenceFiles = slides.map((_, i) => path.join(tmpDir, `silence-${i}.wav`));
    [...audioPaths, combinedAudioPath, ...silenceFiles].forEach(p => {
        if (p && fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch { /* ignore */ }
        }
    });
    try { fs.rmdirSync(tmpDir); } catch { /* may not be empty */ }

    job.outputPath = outputPath;
    job.status = 'complete';
    job.progress = 100;
    job.message = 'Video ready for download.';
}

// ----------------------------------------------------------------
// VIDEO PASS — Pipe raw frames + mux with pre-mixed audio
// ----------------------------------------------------------------

/**
 * VIDEO PASS
 *
 * Inputs:
 *   [0] stdin  — raw BGRA frames (node-canvas toBuffer('raw') is BGRA on all platforms)
 *   [1] file   — combined_audio.wav produced by buildCombinedAudio()
 *
 * Because audio timing is already baked into the combined WAV, this command
 * needs NO complex filter and no frame-rate hacks — audio and video simply
 * start at t=0 and run for exactly the same duration.
 */
function muxVideoWithFramePipe(
    job: RenderJob,
    timeline: SlideTimeline[],
    combinedAudioPath: string,
    outputPath: string,
    opts: {
        width: number;
        height: number;
        fps: number;
        totalFrames: number;
        template: 'neon' | 'retro';
        fontKey: string;
    }
): Promise<void> {
    return new Promise((resolve, reject) => {
        const { width, height, fps, totalFrames, template, fontKey } = opts;
        const hasAudio = fs.existsSync(combinedAudioPath);

        // ── Build FFmpeg command ──────────────────────────────────────────
        // node-canvas toBuffer('raw') returns pixels in BGRA order (Cairo native)
        let cmd = Ffmpeg()
            .input('pipe:0')
            .inputOptions([
                '-f', 'rawvideo',
                '-pix_fmt', 'bgra',          // ← BGRA not RGBA (node-canvas native)
                '-s', `${width}x${height}`,
                '-r', String(fps),
                '-thread_queue_size', '512',
            ]);

        if (hasAudio) {
            cmd = cmd
                .input(combinedAudioPath)
                .inputOptions(['-thread_queue_size', '512']);
        }

        const outputOptions = [
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-r', String(fps),               // enforce CFR output
            '-movflags', '+faststart',
            '-map', '0:v',
        ];

        if (hasAudio) {
            outputOptions.push('-map', '1:a', '-c:a', 'aac', '-b:a', '128k', '-shortest');
        }

        cmd = cmd.outputOptions(outputOptions).output(outputPath);

        // ── Event handlers ────────────────────────────────────────────────
        cmd.on('error', (err: Error) => {
            job.status = 'error';
            job.message = `FFmpeg error: ${err.message}`;
            reject(err);
        });

        cmd.on('end', () => resolve());

        // ── Start FFmpeg and write frames ─────────────────────────────────
        // Use the 'start' event (fired when process spawns) instead of a
        // brittle setTimeout.  _ffmpegProc is set synchronously inside run()
        // so it is guaranteed to exist when 'start' fires.
        cmd.on('start', (_cmdLine: string) => {

            const proc = (cmd as any)._ffmpegProc;
            if (!proc?.stdin) {
                reject(new Error('FFmpeg process stdin not available'));
                return;
            }
            const stdin = proc.stdin;

            // Frame writing loop — runs async so we don't block the event loop
            (async () => {
                try {
                    const canvas = createCanvas(width, height);
                    const ctx = canvas.getContext('2d');

                    for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                        const currentTime = frameIndex / fps;

                        // Find which slide owns this frame
                        const entry = timeline.find(
                            t => currentTime >= t.startTime && currentTime < t.endTime
                        );
                        const localTime = entry ? currentTime - entry.startTime : 0;

                        // Clear
                        ctx.clearRect(0, 0, width, height);

                        if (entry) {
                            if (template === 'retro') {
                                drawRetroBackground(ctx as unknown as CanvasRenderingContext2D, width, height);
                            } else {
                                drawNeonBackground(ctx as unknown as CanvasRenderingContext2D, width, height, localTime);
                            }
                            drawSlideContent(
                                ctx as unknown as CanvasRenderingContext2D,
                                entry.slide as any,
                                fontKey,
                                width,
                                height,
                                localTime,
                                template
                            );
                        } else {
                            ctx.fillStyle = '#000000';
                            ctx.fillRect(0, 0, width, height);
                        }

                        // Write raw BGRA pixels to FFmpeg stdin
                        const rawBuffer = (canvas as any).toBuffer('raw') as Buffer;
                        const canWrite = stdin.write(rawBuffer);

                        // Progress update
                        if (frameIndex % 15 === 0) {
                            job.progress = 30 + Math.round((frameIndex / totalFrames) * 67);
                            job.message = `Rendering frame ${frameIndex + 1} / ${totalFrames}`;
                        }

                        // Backpressure: wait for drain; yield every 10 frames otherwise
                        if (!canWrite) {
                            await new Promise<void>(res => stdin.once('drain', res));
                        } else if (frameIndex % 10 === 0) {
                            await new Promise<void>(res => setImmediate(res));
                        }
                    }

                    stdin.end();
                    job.message = 'Finalizing MP4...';
                    job.progress = 97;
                } catch (frameErr) {
                    const e = frameErr instanceof Error ? frameErr : new Error(String(frameErr));
                    job.status = 'error';
                    job.message = `Frame render error: ${e.message}`;
                    stdin.destroy();
                    reject(e);
                }
            })();
        });

        cmd.run();
    });
}

// ================================================================
// SSR STATIC RENDERER — one frame per slide, no animations
// ================================================================

/**
 * Ultra-fast server-side rendering pipeline.
 *
 * Instead of rendering every single frame (30fps × duration ≈ hundreds of
 * frames per slide), we draw ONE static frame per slide at localTime=0
 * (fully settled, no entrance animations), save it as a PNG, then use
 * FFmpeg's concat demuxer to hold each image for its exact audio duration.
 *
 * Speed comparison (5 slides × 5 s average × 30 fps):
 *   Puppeteer mode  : ~750 screenshot + encode cycles
 *   SSR static mode :   5 canvas draws  → 100×+ faster total render time
 */
export async function renderVideoSSRStatic(job: RenderJob): Promise<void> {
    const { params } = job;
    const width = params.width ?? 1280;
    const height = params.height ?? 720;
    const fps = params.fps ?? 30;
    const slides = params.script.slides;
    const template = (params.script.template ?? 'neon') as 'neon' | 'retro';

    const tmpDir = getJobTempDir(job.id);
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const outputsDir = path.join(process.cwd(), 'outputs');
    if (!fs.existsSync(outputsDir)) fs.mkdirSync(outputsDir, { recursive: true });
    const outputPath = path.join(outputsDir, `video-${job.id.slice(0, 8)}.mp4`);

    // ── Phase 1: Audio Generation (identical to renderVideo) ─────────────
    job.status = 'audio';
    job.message = 'Generating audio...';
    job.progress = 0;

    const audioPaths: string[] = [];
    const durations: number[] = [];
    const rawExt = params.provider === 'sarvam' ? '.wav' : '.mp3';

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const text = slide.narration || slide.title;
        const rawPath = path.join(tmpDir, `slide-${i}-raw${rawExt}`);
        const normPath = path.join(tmpDir, `slide-${i}-norm.wav`);

        job.message = `Generating audio (${i + 1}/${slides.length})...`;
        job.progress = Math.round((i / slides.length) * 25);

        try {
            const buffer = await generateSpeech(
                text, params.voice, params.provider, 'default',
                params.narrationLanguage ?? 'te-IN'
            );
            fs.writeFileSync(rawPath, buffer);
            await normaliseAudio(rawPath, normPath);
            const exactDuration = await getAudioDurationSeconds(normPath);
            try { fs.unlinkSync(rawPath); } catch { /* ignore */ }
            audioPaths.push(normPath);
            durations.push(exactDuration);
        } catch (err) {
            console.warn(`[SSR-Static ${job.id}] TTS failed for slide ${i + 1}:`, (err as Error).message);
            [rawPath, normPath].forEach(p => { try { fs.unlinkSync(p); } catch { /* ignore */ } });
            audioPaths.push('');
            durations.push(slide.duration ?? 5);
        }
    }

    // ── Phase 2: Mix combined audio track ────────────────────────────────
    job.status = 'audio';
    job.message = 'Mixing audio tracks...';
    job.progress = 28;

    const combinedAudioPath = path.join(tmpDir, 'combined_audio.wav');
    try {
        await buildCombinedAudio(audioPaths, durations, combinedAudioPath);
    } catch (audioMixErr) {
        console.error(`[SSR-Static ${job.id}] Audio concat failed:`, audioMixErr);
    }

    // ── Phase 3: Draw ONE static frame per slide ──────────────────────────
    job.status = 'rendering';
    job.message = 'Drawing static frames...';
    job.progress = 30;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const framePaths: string[] = [];

    for (let i = 0; i < slides.length; i++) {
        ctx.clearRect(0, 0, width, height);

        // Draw background — localTime=0 gives the fully-settled state (no animations)
        if (template === 'retro') {
            drawRetroBackground(ctx as unknown as CanvasRenderingContext2D, width, height);
        } else {
            // neon / brutalist / nanobanna all fall back to the neon canvas background
            drawNeonBackground(ctx as unknown as CanvasRenderingContext2D, width, height, 0);
        }

        // Draw slide content at localTime=0 (all elements fully visible, no entrance delay)
        drawSlideContent(
            ctx as unknown as CanvasRenderingContext2D,
            slides[i] as any,
            params.font,
            width,
            height,
            999, // large value → all entrance animations are fully eased in
            template
        );

        const framePath = path.join(tmpDir, `frame-${i}.png`);
        const pngBuffer = (canvas as unknown as { toBuffer(mime: string): Buffer }).toBuffer('image/png');
        fs.writeFileSync(framePath, pngBuffer);
        framePaths.push(framePath);

        job.progress = 30 + Math.round(((i + 1) / slides.length) * 35);
        job.message = `Drawing slide ${i + 1}/${slides.length}...`;
        console.log(`[SSR-Static ${job.id}] Drew frame ${i + 1}/${slides.length}`);
    }

    // ── Phase 4: Build FFmpeg concat manifest ─────────────────────────────
    // Format required by the FFmpeg concat demuxer:
    //   file '/abs/path/frame-0.png'
    //   duration 5.234000
    //   ...
    //   file '/abs/path/frame-N.png'   ← last file repeated (no duration) to
    //   file '/abs/path/frame-N.png'     flush the final frame properly
    let concatContent = '';
    for (let i = 0; i < framePaths.length; i++) {
        const safePath = framePaths[i].replace(/\\/g, '/');
        concatContent += `file '${safePath}'\n`;
        concatContent += `duration ${durations[i].toFixed(6)}\n`;
    }
    // Duplicate the final frame entry (required by concat demuxer to avoid
    // the last frame being trimmed when -shortest is used with audio).
    const lastSafe = framePaths[framePaths.length - 1].replace(/\\/g, '/');
    concatContent += `file '${lastSafe}'\n`;

    const concatFilePath = path.join(tmpDir, 'concat.txt');
    fs.writeFileSync(concatFilePath, concatContent, 'utf8');

    // ── Phase 5: FFmpeg — concat demuxer → H.264 + AAC ───────────────────
    job.message = 'Encoding video with FFmpeg...';
    job.progress = 68;

    const hasAudio = fs.existsSync(combinedAudioPath);

    await new Promise<void>((resolve, reject) => {
        let cmd = Ffmpeg()
            .input(concatFilePath)
            .inputOptions(['-f', 'concat', '-safe', '0']);

        if (hasAudio) {
            cmd = cmd
                .input(combinedAudioPath)
                .inputOptions(['-thread_queue_size', '512']);
        }

        const outOpts = [
            '-c:v', 'libx264',
            '-preset', 'ultrafast',   // fastest encode — size tradeoff acceptable for static slides
            '-crf', '23',
            '-pix_fmt', 'yuv420p',
            '-r', String(fps),
            '-movflags', '+faststart',
            '-map', '0:v',
        ];

        if (hasAudio) {
            outOpts.push('-map', '1:a', '-c:a', 'aac', '-b:a', '128k', '-shortest');
        }

        cmd
            .outputOptions(outOpts)
            .output(outputPath)
            .on('progress', (p: { percent?: number }) => {
                const pct = p.percent ?? 0;
                job.progress = 68 + Math.round(pct * 0.29); // 68→97
                job.message = `Encoding… ${Math.round(pct)}%`;
            })
            .on('end', () => resolve())
            .on('error', (err: Error) => reject(new Error(`FFmpeg concat error: ${err.message}`)))
            .run();
    });

    // ── Cleanup ────────────────────────────────────────────────────────────
    const silenceFiles = slides.map((_, i) => path.join(tmpDir, `silence-${i}.wav`));
    [...audioPaths, combinedAudioPath, ...silenceFiles, ...framePaths, concatFilePath].forEach(p => {
        if (p && fs.existsSync(p)) {
            try { fs.unlinkSync(p); } catch { /* ignore */ }
        }
    });
    try { fs.rmdirSync(tmpDir); } catch { /* may not be empty */ }

    job.outputPath = outputPath;
    job.status = 'complete';
    job.progress = 100;
    job.message = 'Video ready for download.';
    console.log(`[SSR-Static ${job.id}] ✅ Complete → ${outputPath}`);
}
