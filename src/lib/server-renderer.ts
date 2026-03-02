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
Ffmpeg.setFfmpegPath((ffmpegStatic as any).path ?? ffmpegStatic);

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

    const audioPaths: string[] = [];
    const durations: number[] = [];

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        const text = slide.narration || slide.title;
        const audioPath = path.join(tmpDir, `slide-${i}.mp3`);

        job.message = `Generating audio (${i + 1}/${slides.length})...`;
        job.progress = Math.round((i / slides.length) * 30); // 0–30%

        try {
            const buffer = await generateSpeech(text, params.voice, params.provider);
            fs.writeFileSync(audioPath, buffer);
            audioPaths.push(audioPath);

            // Estimate duration from file size (MP3 ~128kbps ≈ 16000 bytes/sec)
            const fileSizeBytes = buffer.byteLength;
            const estimatedDuration = Math.max(3, fileSizeBytes / 16000);
            durations.push(estimatedDuration);
        } catch (err) {
            console.warn(`[RenderJob ${job.id}] TTS failed for slide ${i}, using default duration`);
            // Write empty audio as silent placeholder
            audioPaths.push('');
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

    // ── Phase 3: Render Frames + Mux ──────────────────────────────────────
    job.status = 'rendering';
    job.message = 'Starting video encoder...';
    job.progress = 30;

    await muxVideoWithFramePipe(
        job,
        timeline,
        audioPaths,
        outputPath,
        { width, height, fps, totalFrames, template, fontKey: params.font }
    );

    // ── Cleanup audio temp files ────────────────────────────────────────────
    audioPaths.forEach(p => {
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
// FFmpeg + Frame Pipe
// ----------------------------------------------------------------

function muxVideoWithFramePipe(
    job: RenderJob,
    timeline: SlideTimeline[],
    audioPaths: string[],
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

        // Build FFmpeg command
        // -f rawvideo reads raw RGBA from stdin
        let cmd = Ffmpeg()
            .input('pipe:0')
            .inputOptions([
                '-f', 'rawvideo',
                '-pix_fmt', 'rgba',
                `-s`, `${width}x${height}`,
                `-r`, `${fps}`,
            ]);

        // Add one audio input per slide that has audio
        const validAudio = audioPaths.filter(p => p && fs.existsSync(p));
        validAudio.forEach(audioPath => {
            cmd = cmd.input(audioPath);
        });

        // Build filter_complex to concatenate audio files in order
        const audioCount = validAudio.length;
        let audioFilter = '';
        if (audioCount === 1) {
            audioFilter = '[1:a]anull[aout]';
        } else if (audioCount > 1) {
            const inputs = validAudio.map((_, i) => `[${i + 1}:a]`).join('');
            audioFilter = `${inputs}concat=n=${audioCount}:v=0:a=1[aout]`;
        }

        const outputOptions = [
            '-c:v', 'libx264',
            '-preset', 'fast',       // fast encoding, reasonable quality
            '-crf', '23',            // quality: lower = better (23 is default)
            '-pix_fmt', 'yuv420p',   // broadest compatibility
            '-movflags', '+faststart', // enables streaming from beginning
        ];

        if (audioCount > 0) {
            outputOptions.push('-c:a', 'aac', '-b:a', '128k');
            if (audioFilter) {
                cmd = cmd.complexFilter(audioFilter).outputOptions([...outputOptions, '-map', '0:v', '-map', '[aout]']);
            } else {
                cmd = cmd.outputOptions([...outputOptions, '-map', '0:v', '-map', '1:a']);
            }
        } else {
            cmd = cmd.outputOptions(outputOptions);
        }

        cmd = cmd.output(outputPath);

        cmd.on('error', (err: Error) => {
            job.status = 'error';
            job.message = `FFmpeg error: ${err.message}`;
            reject(err);
        });

        cmd.on('end', () => resolve());

        // Get the underlying child process to write to stdin
        cmd.run();

        // Give FFmpeg a moment to start, then get the stdin pipe
        setTimeout(async () => {
            // @ts-ignore – Access internal process
            const ffmpegProc = (cmd as any)._ffmpegProc;
            if (!ffmpegProc || !ffmpegProc.stdin) {
                reject(new Error('Could not access FFmpeg stdin'));
                return;
            }

            const stdin = ffmpegProc.stdin;

            // Create the canvas ONCE and reuse it across all frames
            const canvas = createCanvas(width, height);
            const ctx = canvas.getContext('2d');

            // Dynamically import canvas-compatible drawers (static at top now)
            // drawNeonBackground, drawRetroBackground, drawSlideContent imported at top

            for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
                const currentTime = frameIndex / fps;

                // Find active slide
                const entry = timeline.find(t => currentTime >= t.startTime && currentTime < t.endTime);
                const localTime = entry ? currentTime - entry.startTime : 0;

                // Clear canvas
                ctx.clearRect(0, 0, width, height);

                if (entry) {
                    // Draw background
                    if (template === 'retro') {
                        drawRetroBackground(ctx as unknown as CanvasRenderingContext2D, width, height);
                    } else {
                        drawNeonBackground(ctx as unknown as CanvasRenderingContext2D, width, height, localTime);
                    }

                    // Draw slide content
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
                    // Black frame (end of presentation)
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(0, 0, width, height);
                }

                // Get raw RGBA buffer and write to FFmpeg stdin
                // node-canvas toBuffer('raw') returns BGRA by default; use 'image/png' then we'll
                // actually use the rawPixels which are RGBA ordered in node-canvas
                const rawBuffer = (canvas as any).toBuffer('raw') as Buffer;
                const canWrite = stdin.write(rawBuffer);

                // Update progress (frames are 30–95% of the total progress range)
                if (frameIndex % 15 === 0) {
                    job.progress = 30 + Math.round((frameIndex / totalFrames) * 65);
                    job.message = `Rendering frame ${frameIndex + 1} / ${totalFrames}`;
                }

                // Yield to event loop:
                // - If stdin buffer is full: wait for drain (backpressure-safe)
                // - Otherwise: yield every 10 frames to keep server responsive
                if (!canWrite) {
                    await new Promise<void>(res => stdin.once('drain', res));
                } else if (frameIndex % 10 === 0) {
                    await new Promise<void>(res => setImmediate(res));
                }
            }

            // Signal to FFmpeg that all frames have been written
            stdin.end();
            job.message = 'Finalizing MP4...';
            job.progress = 97;
        }, 300);
    });
}
