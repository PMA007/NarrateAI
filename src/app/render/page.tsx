'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Loader2, Download, AlertCircle, CheckCircle2, ArrowLeft, Info, Monitor, Cloud, Clock } from 'lucide-react';
import Link from 'next/link';
import { ComponentRenderer, RenderState } from '@/lib/component-renderer';
import { detectPlatform, PlatformInfo } from '@/lib/universal-renderer';
import { FONT_OPTIONS, FontKey } from '@/lib/fonts';
import { SlideRenderer } from '@/components/canvas/SlideRenderer';
import dynamic from 'next/dynamic';

type RenderMode = 'choose' | 'local' | 'server';

type ServerJobStatus = 'queued' | 'audio' | 'rendering' | 'complete' | 'error';

interface ServerJobState {
    jobId: string | null;
    status: ServerJobStatus | null;
    progress: number;
    message: string;
    queuePosition: number;
}

const NeonSequence = dynamic(() => import('@/components/canvas/NeonSequence').then(m => m.NeonSequence), { ssr: false });
const RetroSequence = dynamic(() => import('@/components/canvas/RetroSequence').then(m => m.RetroSequence), { ssr: false });
const BrutalistSequence = dynamic(() => import('@/components/canvas/BrutalistSequence').then(m => m.BrutalistSequence), { ssr: false });
const NanoBannaSequence = dynamic(() => import('@/components/canvas/NanoBannaSequence').then(m => m.NanoBannaSequence), { ssr: false });

export default function RenderPage() {
    const router = useRouter();
    const {
        script,
        audioUrls,
        setAudioUrl,
        selectedFont,
        ttsProvider,
        selectedVoice,
        narrationLanguage
    } = useStore();

    // ── Render mode ──────────────────────────────────────────────────────────
    const [renderMode, setRenderMode] = useState<RenderMode>('choose');

    // ── Local render state ───────────────────────────────────────────────────
    const [status, setStatus] = useState<'idle' | 'audio' | 'loading' | 'rendering' | 'complete' | 'error'>('idle');
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState('');
    const [platformInfo, setPlatformInfo] = useState<PlatformInfo | null>(null);
    const [fontCss, setFontCss] = useState('');

    // Renderer State
    const [renderState, setRenderState] = useState<RenderState>({
        isRendering: false,
        currentScript: null,
        currentSlideIndex: 0,
        currentLocalTime: 0,
        progress: 0
    });

    const containerRef = useRef<HTMLDivElement>(null);

    // ── Server render state ───────────────────────────────────────────────────
    const [serverJob, setServerJob] = useState<ServerJobState>({
        jobId: null,
        status: null,
        progress: 0,
        message: '',
        queuePosition: 0,
    });
    const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!script) {
            router.push('/');
            return;
        }

        const platform = detectPlatform();
        setPlatformInfo(platform);

        if (!platform.isSupported) {
            setStatus('error');
            setErrorMsg('Your browser does not support WebCodecs. Please use Chrome 94+, Edge 94+, or Safari 16.4+');
            return;
        }

        // Fetch Font CSS to avoid CORS issues with html-to-image
        const fontConfig = FONT_OPTIONS[selectedFont as FontKey] || FONT_OPTIONS['Modern'];
        const fontUrlsToFetch: string[] = [fontConfig.url];

        // Add Theme Specific Fonts
        const currentTemplate = script.template || 'neon';
        if (currentTemplate === 'brutalist') {
            fontUrlsToFetch.push('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap');
            fontUrlsToFetch.push('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&display=swap');
        }
        if (currentTemplate === 'nanobanna') {
            fontUrlsToFetch.push('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Fira+Code&display=swap');
        }
        // Retro fonts (Georgia, Trebuchet MS) are system fonts, no fetch needed.

        Promise.all(fontUrlsToFetch.map(url => fetch(url).then(res => res.text())))
            .then(cssArray => {
                setFontCss(cssArray.join('\n'));
            })
            .catch(err => console.error("Failed to load font CSS", err));

        // NOTE: We do NOT auto-start rendering here.
        // The user must explicitly choose Local or Server mode first.
    }, [script, selectedFont]); // Added selectedFont to dependencies to refetch CSS if font changes

    const startRenderProcess = async () => {
        useStore.setState({ isPlaying: false });
        setStatus('audio');
        setProgress(0);

        try {
            // PHASE 1: AUDIO GENERATION
            const slides = script?.slides || [];
            let processed = 0;

            for (const slide of slides) {
                if (audioUrls[slide.slide_id]) {
                    processed++;
                    setProgress(Math.round((processed / slides.length) * 100));
                    continue;
                }

                const text = slide.narration || slide.title;

                let url: string;
                try {
                    const res = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voice: selectedVoice, provider: ttsProvider, narrationLanguage })
                    });

                    if (!res.ok) {
                        const errBody = await res.text().catch(() => res.status.toString());
                        console.warn(`TTS failed for slide ${slide.slide_id}: ${errBody}`);
                        setAudioUrl(slide.slide_id, '', slide.duration || 5);
                        processed++;
                        setProgress(Math.round((processed / slides.length) * 100));
                        continue;
                    }
                    const blob = await res.blob();
                    url = URL.createObjectURL(blob);
                } catch (fetchErr) {
                    console.warn(`TTS network error for slide ${slide.slide_id}:`, fetchErr);
                    setAudioUrl(slide.slide_id, '', slide.duration || 5);
                    processed++;
                    setProgress(Math.round((processed / slides.length) * 100));
                    continue;
                }

                const audio = new Audio(url);
                await new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        // Fallback if metadata load fails
                        console.warn("Audio metadata timeout");
                        setAudioUrl(slide.slide_id, url, 10);
                        resolve(true);
                    }, 5000);

                    audio.onloadedmetadata = () => {
                        clearTimeout(timeout);
                        setAudioUrl(slide.slide_id, url, audio.duration);
                        resolve(true);
                    };
                    audio.onerror = () => {
                        clearTimeout(timeout);
                        setAudioUrl(slide.slide_id, url, 10);
                        resolve(true);
                    };
                });

                processed++;
                setProgress(Math.round((processed / slides.length) * 100));
            }

            // PHASE 2: SETUP
            setStatus('loading');
            setStatusMessage('Initializing renderer...');
            setProgress(100);
            await new Promise(r => setTimeout(r, 500));

            // Wait for fonts to load
            await document.fonts.ready;

            // PRELOAD IMAGES to avoid 404s and redundant network requests during render
            const imagesToPreload: string[] = [
                // '/brutalist-bg.webp', // Removed to reduce memory load
            ];

            const loadedImages: Record<string, string> = {};

            setStatusMessage('Preloading assets...');
            await Promise.all(imagesToPreload.map(async (src) => {
                try {
                    const response = await fetch(src);
                    if (!response.ok) throw new Error(`Failed to load ${src}`);
                    const blob = await response.blob();
                    const objectUrl = URL.createObjectURL(blob);
                    loadedImages[src] = objectUrl;
                } catch (e) {
                    console.warn(`Failed to preload image: ${src}`, e);
                    // If it fails, we just don't put it in the map, and the component might try to fetch it normally (and likely fail again, but graceful degradation)
                }
            }));

            // Save to store
            useStore.getState().setPreloadedAssets(loadedImages);


            // PHASE 3: RENDER VIDEO
            setStatus('rendering');
            setStatusMessage('Rendering video...');
            setProgress(0);

            const width = 1280;
            const height = 720;
            const fps = 30;

            // Instantiate ComponentRenderer
            const renderer = new ComponentRenderer(
                { width, height, fps },
                (newState) => {
                    setRenderState(prev => ({ ...prev, ...newState }));
                },
                () => document.getElementById('render-container') // Direct DOM access
            );

            const currentAudioUrls = useStore.getState().audioUrls;
            const currentScript = useStore.getState().script!;

            const totalDuration = currentScript.slides.reduce((acc, s) => acc + (s.duration || 5), 0);
            const totalFrames = Math.ceil(totalDuration * fps);

            const blob = await renderer.render(
                currentScript,
                currentAudioUrls,
                (p) => {
                    setProgress(p);
                    if (p < 10) setStatusMessage('Encoding audio...');
                    else if (p < 95) setStatusMessage(`Rendering frame ${Math.round((p - 10) / 85 * totalFrames)}/${totalFrames}`);
                    else setStatusMessage('Finalizing MP4...');
                }
            );

            const videoUrlObj = URL.createObjectURL(blob);
            setVideoUrl(videoUrlObj);
            setStatus('complete');

            // CLEANUP: Revoke Preloaded Assets to free memory
            const preloaded = useStore.getState().preloadedAssets;
            Object.values(preloaded).forEach(url => URL.revokeObjectURL(url));
            useStore.getState().setPreloadedAssets({}); // Clear from store

        } catch (e) {
            console.error(e);
            setErrorMsg(String(e));
            setStatus('error');
        }
    };

    // ── Server-side render: start job ─────────────────────────────────────────
    const startServerRender = async () => {
        if (!script) return;
        setRenderMode('server');
        setServerJob(prev => ({ ...prev, status: 'queued', message: 'Submitting job to server...', progress: 0 }));

        try {
            const res = await fetch('/api/render/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    script,
                    voice: selectedVoice,
                    provider: ttsProvider,
                    narrationLanguage,
                    font: selectedFont,
                    width: 1280,
                    height: 720,
                    fps: 30,
                }),
            });

            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const { jobId } = await res.json();

            setServerJob(prev => ({ ...prev, jobId, message: 'Job queued. Waiting to start...' }));

            // Start polling
            pollIntervalRef.current = setInterval(async () => {
                try {
                    const pollRes = await fetch(`/api/render/status?jobId=${jobId}`);
                    if (!pollRes.ok) return;
                    const data = await pollRes.json();

                    setServerJob(prev => ({
                        ...prev,
                        status: data.status,
                        progress: data.progress ?? 0,
                        message: data.message ?? '',
                        queuePosition: data.queuePosition ?? 0,
                    }));

                    if (data.status === 'complete' || data.status === 'error') {
                        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                    }
                } catch { /* network blip, keep polling */ }
            }, 2000);

        } catch (err: any) {
            setServerJob(prev => ({ ...prev, status: 'error', message: err.message }));
        }
    };

    // Cleanup polling on unmount
    useEffect(() => {
        return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current); };
    }, []);

    if (!script) return null;

    const fontConfig = FONT_OPTIONS[selectedFont as FontKey] || FONT_OPTIONS['Modern'];

    // Determine current slide for renderer
    const currentSlide = renderState.currentScript?.slides[renderState.currentSlideIndex];
    const activeScript = renderState.isRendering ? renderState.currentScript : script;

    // Select Sequence Component based on the ACTIVE script
    const templateName = activeScript?.template || 'neon';
    const SequenceComponent =
        templateName === 'retro' ? RetroSequence :
            templateName === 'brutalist' ? BrutalistSequence :
                templateName === 'nanobanna' ? NanoBannaSequence :
                    NeonSequence;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans selection:bg-cyan-500/30">
            {/* Font Loader */}
            {fontCss ? (
                <style>{fontCss}</style>
            ) : (
                <link href={fontConfig.url} rel="stylesheet" />
            )}
            <div style={{ fontFamily: fontConfig.family, position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                Font Loader ఫాంట్ ప్రీలోడ్
            </div>

            {/* OFF-SCREEN RENDER CONTAINER */}
            {/* We use fixed position with z-index -1 instead of display none to ensure layout is calculated */}
            <div
                id="render-container"
                ref={containerRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '-9999px',     // Off-screen so frames never bleed through
                    width: '1280px',
                    height: '720px',
                    zIndex: -9999,
                    overflow: 'hidden',
                    visibility: 'visible', // Must remain visible for html-to-image capture
                    fontFamily: fontConfig.family,
                    color: 'initial'
                }}
            >
                {renderState.isRendering && currentSlide && activeScript && (
                    <>
                        {/* 1. Retro Background Override (Matches Canvas) */}
                        {templateName === 'retro' && (
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'radial-gradient(120% 120% at 20% 18%, #f2f6ff 0%, #d5e3f6 36%, #a4bcd6 72%, #8aa3be 100%)',
                                zIndex: -1 // Behind sequence
                            }}>
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    background: `
                                        radial-gradient(110% 110% at 50% 10%, rgba(255,255,255,.26) 0%, rgba(255,255,255,0) 42%),
                                        radial-gradient(110% 110% at 80% 70%, rgba(0,0,0,.16) 0%, rgba(0,0,0,0) 55%),
                                        radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,.20) 100%)
                                    `,
                                }} />
                            </div>
                        )}

                        <SequenceComponent
                            slide={currentSlide}
                            index={renderState.currentSlideIndex}
                            localTime={renderState.currentLocalTime}
                            width={1280}
                            height={720}
                            fontFamily={fontConfig.family}
                            fontUrl={fontConfig.url}
                            fontCss={fontCss}
                            // Pass Localized Animations
                            elementAnimations={
                                Object.entries(useStore.getState().elementAnimations)
                                    .reduce((acc, [key, anim]) => {
                                        if (key.startsWith(`slide-${renderState.currentSlideIndex}-`)) {
                                            const localKey = key.replace(`slide-${renderState.currentSlideIndex}-`, '');
                                            acc[localKey] = anim;
                                        }
                                        return acc;
                                    }, {} as any)
                            }
                            // Pass Localized Styles
                            elementStyles={
                                Object.entries(useStore.getState().elementStyles)
                                    .reduce((acc, [key, style]) => {
                                        if (key.startsWith(`slide-${renderState.currentSlideIndex}-`)) {
                                            const localKey = key.replace(`slide-${renderState.currentSlideIndex}-`, '');
                                            acc[localKey] = style;
                                        }
                                        return acc;
                                    }, {} as any)
                            }
                        />
                    </>
                )}
            </div>

            <div className="max-w-2xl mx-auto space-y-12">
                <div className="flex items-center gap-4 text-cyan-400/50 hover:text-cyan-400 transition-colors">
                    <Link href="/">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                </div>

                {/* ── MODE PICKER ─────────────────────────────────────────── */}
                {renderMode === 'choose' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-white">Export Video</h1>
                            <p className="text-neutral-400 mt-2 text-sm">Choose how you want to render your presentation</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Local option */}
                            <button
                                onClick={() => {
                                    setRenderMode('local');
                                    setTimeout(startRenderProcess, 200);
                                }}
                                className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-neutral-700 bg-neutral-900/60 hover:border-cyan-500/60 hover:bg-neutral-800/80 transition-all duration-200 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                                        <Monitor className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <span className="font-semibold text-white">Local Rendering</span>
                                </div>
                                <p className="text-sm text-neutral-400">Renders in your browser using WebCodecs. Fast for short videos. Requires Chrome or Edge 94+.</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full px-2 py-0.5">WebCodecs</span>
                                    <span className="text-xs bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-full px-2 py-0.5">Chrome/Edge only</span>
                                </div>
                            </button>

                            {/* Server option */}
                            <button
                                onClick={startServerRender}
                                className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-neutral-700 bg-neutral-900/60 hover:border-violet-500/60 hover:bg-neutral-800/80 transition-all duration-200 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center">
                                        <Cloud className="w-5 h-5 text-violet-400" />
                                    </div>
                                    <span className="font-semibold text-white">Server Rendering</span>
                                </div>
                                <p className="text-sm text-neutral-400">Rendered on our server using FFmpeg. Works on any browser or device. No GPU required.</p>
                                <div className="flex gap-2 mt-1">
                                    <span className="text-xs bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full px-2 py-0.5">FFmpeg</span>
                                    <span className="text-xs bg-neutral-800 text-neutral-400 border border-neutral-700 rounded-full px-2 py-0.5">Any browser</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── SERVER RENDER UI ─────────────────────────────────────── */}
                {renderMode === 'server' && (
                    <div className="space-y-8">
                        <div className="flex items-center gap-3">
                            <Cloud className="w-5 h-5 text-violet-400" />
                            <h2 className="font-semibold text-white">Server Rendering</h2>
                            {serverJob.status !== 'complete' && serverJob.status !== 'error' && (
                                <Loader2 className="w-4 h-4 text-violet-400 animate-spin ml-auto" />
                            )}
                        </div>

                        {/* Queue position banner */}
                        {serverJob.queuePosition > 0 && serverJob.status === 'queued' && (
                            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 text-amber-300">
                                <Clock className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">Position <strong>{serverJob.queuePosition}</strong> in queue. Your job will start shortly.</span>
                            </div>
                        )}

                        {/* Progress steps */}
                        <div className="space-y-5">
                            {/* Audio step */}
                            <div className={`space-y-2 transition-opacity ${serverJob.status === 'audio' ? 'opacity-100' : serverJob.status === 'queued' ? 'opacity-40' : 'opacity-60'}`}>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        {serverJob.status === 'audio' && <Loader2 className="w-4 h-4 animate-spin text-violet-400" />}
                                        {(serverJob.status === 'rendering' || serverJob.status === 'complete') && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        🎙️ Generating Audio
                                    </span>
                                    <span className="text-neutral-400">
                                        {serverJob.status === 'audio' ? `${serverJob.progress}%` :
                                            (serverJob.status === 'rendering' || serverJob.status === 'complete') ? '100%' : '–'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-violet-500 transition-all duration-500 ease-out rounded-full"
                                        style={{
                                            width: `${serverJob.status === 'audio' ? serverJob.progress :
                                                (serverJob.status === 'rendering' || serverJob.status === 'complete') ? 100 : 0
                                                }%`
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Rendering step */}
                            <div className={`space-y-2 transition-opacity ${serverJob.status === 'rendering' ? 'opacity-100' : serverJob.status === 'complete' ? 'opacity-60' : 'opacity-40'}`}>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        {serverJob.status === 'rendering' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                                        {serverJob.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        🎬 Rendering & Encoding
                                    </span>
                                    <span className="text-neutral-400">
                                        {serverJob.status === 'rendering' ? `${serverJob.progress}%` :
                                            serverJob.status === 'complete' ? '100%' : '–'}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-500 ease-out rounded-full"
                                        style={{
                                            width: `${serverJob.status === 'rendering' ? serverJob.progress :
                                                serverJob.status === 'complete' ? 100 : 0
                                                }%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status message */}
                        {serverJob.message && serverJob.status !== 'complete' && serverJob.status !== 'error' && (
                            <p className="text-sm text-neutral-400 text-center">{serverJob.message}</p>
                        )}

                        {/* Error */}
                        {serverJob.status === 'error' && (
                            <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 flex items-center gap-3 text-red-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="text-sm">{serverJob.message}</p>
                            </div>
                        )}

                        {/* Complete — Download button */}
                        {serverJob.status === 'complete' && serverJob.jobId && (
                            <div className="mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                                <div className="flex items-center gap-2 text-green-400">
                                    <CheckCircle2 className="w-5 h-5" />
                                    <span className="font-semibold">Your video is ready!</span>
                                </div>
                                <a
                                    href={`/api/render/download?jobId=${serverJob.jobId}`}
                                    download
                                    className="w-full bg-gradient-to-r from-violet-500 to-blue-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20"
                                >
                                    <Download className="w-5 h-5" />
                                    Download Video (MP4)
                                </a>
                                <div className="p-4 bg-neutral-900/50 border border-neutral-800 rounded-xl text-sm text-neutral-400 flex items-start gap-3">
                                    <Info className="w-4 h-4 flex-shrink-0 text-violet-400 mt-0.5" />
                                    <p>This link is valid for 30 minutes. The file will be automatically deleted from the server after download.</p>
                                </div>
                                <button
                                    onClick={() => setRenderMode('choose')}
                                    className="w-full py-3 rounded-xl border border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 transition-colors text-sm"
                                >
                                    ← Render Another Version
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── LOCAL RENDER UI (unchanged logic) ───────────────────── */}
                {renderMode === 'local' && (
                    <div className="space-y-8">
                        {status === 'error' && (
                            <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 flex items-center gap-4 text-red-200 mb-6">
                                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                                <p>{errorMsg}</p>
                            </div>
                        )}

                        {platformInfo?.warnings && platformInfo.warnings.length > 0 && status !== 'error' && (
                            <div className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-4 text-amber-200 mb-6">
                                <p className="text-sm">{platformInfo.warnings.join(' ')}</p>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Audio Step */}
                            <div className={`space-y-2 transition-opacity ${status === 'audio' ? 'opacity-100' : 'opacity-50'}`}>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        {status === 'audio' && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                                        {(status !== 'idle' && status !== 'audio') && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        🎙️ Generating Audio
                                    </span>
                                    <span>{status === 'audio' ? `${progress}%` : (status === 'idle' ? '0%' : '100%')}</span>
                                </div>
                                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-cyan-500 transition-all duration-300 ease-out"
                                        style={{ width: `${status === 'audio' ? progress : (status !== 'idle' ? 100 : 0)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Rendering Step */}
                            <div className={`space-y-2 transition-opacity ${status === 'rendering' || status === 'loading' ? 'opacity-100' : 'opacity-50'}`}>
                                <div className="flex justify-between items-center text-sm font-medium">
                                    <span className="flex items-center gap-2">
                                        {status === 'rendering' && <Loader2 className="w-4 h-4 animate-spin text-blue-400" />}
                                        {status === 'complete' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        {statusMessage || '🎬 Rendering Video'}
                                    </span>
                                    <span>
                                        {status === 'rendering' ? `${progress}%` :
                                            (status === 'complete' ? '100%' : '0%')}
                                    </span>
                                </div>
                                <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500 transition-all duration-300 ease-out"
                                        style={{
                                            width: `${status === 'rendering' ? progress :
                                                (status === 'complete' ? 100 : (status === 'loading' ? 5 : 0))}%`
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Completion State */}
                        {status === 'complete' && videoUrl && (
                            <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <video
                                    src={videoUrl}
                                    controls
                                    className="w-full aspect-video rounded-xl shadow-lg border border-neutral-800 mb-6"
                                />
                                <div className="flex gap-4">
                                    <a
                                        href={videoUrl}
                                        download={`${script.slides[0]?.title || 'video'}.mp4`}
                                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-lg shadow-cyan-500/20"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download Video
                                    </a>
                                </div>
                                <div className="mt-4 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800 text-sm text-neutral-400 flex items-start gap-3">
                                    <Info className="w-5 h-5 flex-shrink-0 text-cyan-500" />
                                    <p>Video rendered locally using WebCodecs.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
