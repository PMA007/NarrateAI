
import * as Mp4Muxer from 'mp4-muxer';
import { toCanvas } from 'html-to-image';
import { Slide, Script } from '@/lib/store';

interface RenderOptions {
    width?: number;
    height?: number;
    fps?: number;
    fast?: boolean;
}

interface SlideTimeline {
    slideId: number;
    startTime: number;
    endTime: number;
    duration: number;
    slide: Slide;
}

export type RenderState = {
    isRendering: boolean;
    currentScript: Script | null;
    currentSlideIndex: number; // Index in the script.slides array
    currentLocalTime: number; // Time relative to the current slide start
    progress: number;
};


export class ComponentRenderer {
    private width: number;
    private height: number;
    private fps: number;
    private frameInterval: number;
    private fast: boolean;

    // Callbacks to drive the React UI
    private onUpdateState: (state: Partial<RenderState>) => void;
    private getContainer: () => HTMLElement | null;

    constructor(
        options: RenderOptions = {},
        onUpdateState: (state: Partial<RenderState>) => void,
        getContainer: () => HTMLElement | null
    ) {
        this.width = options.width || 1280;
        this.height = options.height || 720;
        this.fps = options.fps || 24;
        this.frameInterval = 1_000_000 / this.fps;
        this.fast = options.fast || false;
        this.onUpdateState = onUpdateState;
        this.getContainer = getContainer;
    }

    async render(
        script: Script,
        audioUrls: Record<number, string>,
        onProgress: (progress: number) => void
    ): Promise<Blob> {
        console.log(`🎥 Rendering ${script.slides.length} slides @ ${this.width}x${this.height} ${this.fps}fps`);
        onProgress(1);

        // Build timeline
        const timeline = this.buildTimeline(script);
        const totalDuration = timeline.length > 0 ? timeline[timeline.length - 1].endTime : 0;
        const totalFrames = Math.ceil(totalDuration * this.fps);

        console.log(`📊 Timeline: ${timeline.length} slides, ${totalDuration.toFixed(2)}s, ${totalFrames} frames`);

        // Get codec
        const videoCodec = await this.getBestVideoCodec();

        // Setup MP4 Muxer
        const muxer = new Mp4Muxer.Muxer({
            target: new Mp4Muxer.ArrayBufferTarget(),
            video: {
                codec: 'avc',
                width: this.width,
                height: this.height
            },
            audio: {
                codec: 'aac',
                numberOfChannels: 1,
                sampleRate: 44100
            },
            fastStart: 'in-memory'
        });

        // Setup Video Encoder
        const videoEncoder = new VideoEncoder({
            output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
            error: (e) => console.error('❌ Video Encoder Error:', e)
        });

        videoEncoder.configure({
            codec: videoCodec,
            width: this.width,
            height: this.height,
            bitrate: 4_000_000,
            framerate: this.fps,
            hardwareAcceleration: 'prefer-hardware'
        });

        // Setup Audio Encoder
        const audioEncoder = new AudioEncoder({
            output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
            error: (e) => console.error('❌ Audio Encoder Error:', e)
        });

        audioEncoder.configure({
            codec: 'mp4a.40.2',
            numberOfChannels: 1,
            sampleRate: 44100,
            bitrate: 128_000
        });

        // Pre-decode and encode audio (Same as before)
        onProgress(5);
        const audioData = await this.decodeAllAudio(timeline, audioUrls);
        onProgress(10);
        await this.encodeAudioChunks(audioEncoder, audioData);

        // Wait for fonts to be fully loaded before starting capture
        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 500));

        // Start Rendering Loop
        this.onUpdateState({ isRendering: true, currentScript: script });

        // Frame rendering loop
        const startTime = performance.now();

        for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
            const frameStart = performance.now();
            const currentTime = frameIndex / this.fps; // Global video time
            const timestamp = frameIndex * this.frameInterval; // Microseconds

            // Find current slide
            const activeEntry = timeline.find(t => currentTime >= t.startTime && currentTime < t.endTime);

            if (activeEntry) {
                // Calculate local time for the slide
                const localTime = currentTime - activeEntry.startTime;

                // Update React State to render the correct frame
                // We find the index of the slide in the original script
                const slideIndex = script.slides.findIndex(s => s.slide_id === activeEntry.slideId);

                // We await a microtask to allow React to flush changes (though sync flush might happen)
                // In practice, we update the state, then wait a tick.

                // IMPORTANT: We need a mechanism to wait for the UI to actually update.
                // React 18 automatic batching might delay this.
                // We'll update state, then use setTimeout(0) to yield to event loop.

                // Since this is running in an async function, we can just await the state update "side effect".
                // But triggering the update is just a function call.
                this.onUpdateState({
                    currentSlideIndex: slideIndex,
                    currentLocalTime: localTime
                });

                // Wait for DOM to settle and fonts to load
                if (frameIndex === 0) {
                    await new Promise(r => setTimeout(r, 300));
                } else if (!this.fast) {
                    await new Promise(r => setTimeout(r, 50));
                } else {
                    await new Promise(r => setTimeout(r, 0));
                }

                // Ensure fonts are loaded before capturing
                await document.fonts.ready;


            }

            // Capture Frame
            const container = this.getContainer();
            if (!container) {
                console.error("❌ ComponentRenderer: Container not found!");
                continue; // Skip frame or abort?
            }

            try {
                // toCanvas is cleaner than toPixelData for VideoFrame if we can trust it
                // But VideoFrame needs Canvas/ImageBitmap/OffscreenCanvas
                let canvas = await toCanvas(container, {
                    width: this.width,
                    height: this.height,
                    pixelRatio: 1, // Capture at exact resolution
                    cacheBust: false, // CRITICAL: Prevent appending timestamp to URLs, which duplicates image data in memory
                    includeQueryParams: false, // Keep URLs clean
                    skipAutoScale: true, // Optimization: Prevent internal scaling logic
                    skipFonts: true, // Optimization: We inject fonts manually, don't fetch them again
                    style: {
                        transform: 'scale(1)', // Ensure no scaling
                        transformOrigin: 'top left'
                    }
                });

                // Create VideoFrame from Canvas
                const frame = new VideoFrame(canvas, {
                    timestamp: timestamp,
                    duration: this.frameInterval
                });

                const isKeyFrame = frameIndex % (this.fps * 2) === 0;
                videoEncoder.encode(frame, { keyFrame: isKeyFrame });
                frame.close();

                // Aggressive cleanup hint
                if (canvas) {
                    canvas.width = 0;
                    canvas.height = 0;
                    (canvas as any) = null;
                }

            } catch (err) {
                console.error(`❌ Frame capture error at ${currentTime}s:`, err);
            }


            // Progress
            if (frameIndex % 10 === 0) {
                const p = 10 + Math.round((frameIndex / totalFrames) * 85);
                onProgress(p);
                this.onUpdateState({ progress: p });
            }

            // Allow UI to breathe / prevent frozen browser
            // And also ensuring we don't go too fast if we want to debug, but generally we want max speed.
            // We use setTimeout(0) to release the thread.
            await new Promise(r => setTimeout(r, 0));
        }

        // Finalize
        await videoEncoder.flush();
        await audioEncoder.flush();
        videoEncoder.close();
        audioEncoder.close();
        muxer.finalize();

        this.onUpdateState({ isRendering: false, currentScript: null });

        onProgress(100);

        const { buffer } = muxer.target as { buffer: ArrayBuffer };
        console.log(`✅ Video ready: ${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB`);
        return new Blob([buffer], { type: 'video/mp4' });
    }

    private async getBestVideoCodec(): Promise<string> {
        const codecs = ['avc1.42001f', 'avc1.42E01E', 'avc1.4d001f'];
        for (const codec of codecs) {
            try {
                const support = await VideoEncoder.isConfigSupported({
                    codec,
                    width: this.width,
                    height: this.height,
                    bitrate: 4_000_000,
                    framerate: this.fps
                });
                if (support.supported) return codec;
            } catch (e) { }
        }
        return 'avc1.42001f';
    }

    private buildTimeline(script: Script): SlideTimeline[] {
        const timeline: SlideTimeline[] = [];
        let cumulativeTime = 0;

        for (const slide of script.slides) {
            const duration = slide.duration || 5;
            timeline.push({
                slideId: slide.slide_id,
                startTime: cumulativeTime,
                endTime: cumulativeTime + duration,
                duration,
                slide
            });
            cumulativeTime += duration;
        }

        return timeline;
    }

    private async decodeAllAudio(
        timeline: SlideTimeline[],
        audioUrls: Record<number, string>
    ): Promise<{ data: Float32Array; totalSamples: number }> {
        const SAMPLE_RATE = 44100;
        const totalDuration = timeline.length > 0 ? timeline[timeline.length - 1].endTime : 0;
        const totalSamples = Math.ceil(totalDuration * SAMPLE_RATE);
        const outputBuffer = new Float32Array(totalSamples);

        for (const entry of timeline) {
            const audioUrl = audioUrls[entry.slideId];
            if (!audioUrl) continue;

            try {
                const response = await fetch(audioUrl);
                if (!response.ok) continue;

                const arrayBuffer = await response.arrayBuffer();
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                try {
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const channelData = audioBuffer.getChannelData(0);
                    const startSample = Math.floor(entry.startTime * SAMPLE_RATE);
                    const ratio = audioBuffer.sampleRate / SAMPLE_RATE;

                    for (let i = 0; i < channelData.length && startSample + Math.floor(i / ratio) < totalSamples; i++) {
                        const outputIndex = startSample + Math.floor(i / ratio);
                        if (outputIndex < totalSamples) {
                            outputBuffer[outputIndex] = channelData[i];
                        }
                    }
                } finally {
                    await audioContext.close();
                }
            } catch (e) {
                console.warn(`⚠️ Audio decode failed for slide ${entry.slideId}:`, e);
            }
        }

        return { data: outputBuffer, totalSamples };
    }

    private async encodeAudioChunks(
        encoder: AudioEncoder,
        audioData: { data: Float32Array; totalSamples: number }
    ): Promise<void> {
        const CHUNK_SIZE = 4096;
        const SAMPLE_RATE = 44100;

        for (let i = 0; i < audioData.totalSamples; i += CHUNK_SIZE) {
            const chunk = audioData.data.subarray(i, i + CHUNK_SIZE);
            const paddedChunk = new Float32Array(CHUNK_SIZE);
            paddedChunk.set(chunk);

            const timestamp = Math.round((i / SAMPLE_RATE) * 1_000_000);

            try {
                const audioDataObj = new AudioData({
                    format: 'f32-planar',
                    sampleRate: SAMPLE_RATE,
                    numberOfFrames: CHUNK_SIZE,
                    numberOfChannels: 1,
                    timestamp: timestamp,
                    data: paddedChunk
                });

                encoder.encode(audioDataObj);
                audioDataObj.close();
            } catch (e) { }

            // Yield occasionally to prevent UI freeze during intensive audio encoding
            if (i % (CHUNK_SIZE * 50) === 0) {
                await new Promise(r => setTimeout(r, 0));
            }
        }
    }
}
