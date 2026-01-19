'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Loader2, Download, AlertCircle, CheckCircle2, ArrowLeft, Info } from 'lucide-react';
import Link from 'next/link';
import { ComponentRenderer, RenderState } from '@/lib/component-renderer';
import { detectPlatform, PlatformInfo } from '@/lib/universal-renderer';
import { FONT_OPTIONS, FontKey } from '@/lib/fonts';
import { SlideRenderer } from '@/components/canvas/SlideRenderer';
import dynamic from 'next/dynamic';

const NeonSequence = dynamic(() => import('@/components/canvas/NeonSequence').then(m => m.NeonSequence), { ssr: false });
const RetroSequence = dynamic(() => import('@/components/canvas/RetroSequence').then(m => m.RetroSequence), { ssr: false });

export default function RenderPage() {
    const router = useRouter();
    const {
        script,
        audioUrls,
        setAudioUrl,
        selectedFont,
        ttsProvider,
        selectedVoice
    } = useStore();

    // Local state
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

    // We need a ref to access the container synchronously in the render loop if possible,
    // although the renderer class will call getContainer().
    const containerRef = useRef<HTMLDivElement>(null);
    const hasStartedRef = useRef(false);

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
        if (fontConfig.url) {
            fetch(fontConfig.url)
                .then(res => res.text())
                .then(css => setFontCss(css))
                .catch(err => console.error("Failed to load font CSS", err));
        }

        if (status === 'idle' && !hasStartedRef.current) {
            hasStartedRef.current = true;
            setTimeout(startRenderProcess, 500);
        }
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

                const res = await fetch('/api/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text, voice: selectedVoice, provider: ttsProvider })
                });

                if (!res.ok) throw new Error(`TTS failed for slide ${slide.slide_id}`);
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);

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

        } catch (e) {
            console.error(e);
            setErrorMsg(String(e));
            setStatus('error');
        }
    };

    if (!script) return null;

    const fontConfig = FONT_OPTIONS[selectedFont as FontKey] || FONT_OPTIONS['Modern'];

    // Determine current slide for renderer
    const currentSlide = renderState.currentScript?.slides[renderState.currentSlideIndex];
    const activeScript = renderState.isRendering ? renderState.currentScript : script;

    // Select Sequence Component based on the ACTIVE script
    const templateName = activeScript?.template || 'neon';
    const SequenceComponent = templateName === 'retro' ? RetroSequence : NeonSequence;

    return (
        <div className="min-h-screen bg-neutral-950 text-white p-8 font-sans selection:bg-cyan-500/30">
            {/* Font Loader - Inline Style to prevent CORS errors in html-to-image */}
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
                    width: '1280px',
                    height: '720px',
                    zIndex: -9999, // Way behind everything
                    overflow: 'hidden',
                    left: 0, // Keep it on screen so it renders
                    visibility: 'visible', // Explicitly visible
                    fontFamily: fontConfig.family // Ensure font is inherited
                }}
            >
                {renderState.isRendering && currentSlide && activeScript && (
                    <>
                        {console.log('🔤 Font Debug:', {
                            selectedFont,
                            fontFamily: fontConfig.family,
                            fontCssLength: fontCss?.length || 0,
                            fontCssPreview: fontCss?.substring(0, 200)
                        })}
                        <SequenceComponent
                            slide={currentSlide}
                            index={renderState.currentSlideIndex}
                            localTime={renderState.currentLocalTime}
                            width={1280}
                            height={720}
                            fontFamily={fontConfig.family} // Use actual CSS family, not key
                            fontUrl={fontConfig.url}
                            fontCss={fontCss} // Pass raw CSS
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

                <div className="space-y-8">
                    {/* Audio Step */}
                    <div className={`space-y-2 transition-opacity ${status === 'audio' ? 'opacity-100' : 'opacity-50'}`}>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="flex items-center gap-2">
                                {status === 'audio' && <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />}
                                {(status !== 'idle' && status !== 'audio') && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                Generating Audio
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
                                {statusMessage || 'Rendering Video'}
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
                            <p>
                                Video rendered using high-fidelity DOM capture.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
