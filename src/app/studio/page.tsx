'use client';

import { Stage } from '@/components/canvas/Stage';
import { useStore } from '@/lib/store';
import { FONT_OPTIONS, type FontKey } from '@/lib/fonts'; // Import fonts
import { SlideList } from '@/components/studio/SlideList';
import { AnimationPanel } from '@/components/studio/AnimationPanel';
import { Play, Pause, Download, RotateCcw, Home as HomeIcon, Loader2, Settings, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';



function StudioContent() {
    const router = useRouter();
    const {
        isPlaying, togglePlay, currentTime, totalDuration, seek,
        script, audioUrls, setScript, setAudioUrl,
        generationState, setGenerationState, setAudioStatus,
        renderMode, setRenderMode, selectedFont, setFont, fontScale, setFontScale, selectedVoice, ttsProvider, narrationLanguage, suggestions
    } = useStore();


    const audioRef = useRef<HTMLAudioElement | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const exportBlockingRef = useRef(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportStatus, setExportStatus] = useState<string>('');
    const [exportProgress, setExportProgress] = useState(0);
    const [isRenderModalOpen, setIsRenderModalOpen] = useState(false);
    const [showAnimationPanel, setShowAnimationPanel] = useState(true);

    const handleExport = () => {
        router.push('/render');
    };

    const handleExportPDF = async () => {
        // PDF Logic remains same... simplified for brevity if untouched, but I must preserve it if I don't want to delete it.
        // Wait, the User Instruction says "Change the entire rendering engine". 
        // I should PROBABLY keep PDF export as is? Yes.
        // I will just return the original PDF code here to be safe or assuming the user meant Video Engine.
        if (!svgRef.current || !script || isExporting) return;
        setIsExporting(true);
        setExportStatus('Generating PDF...');

        // Dynamically import jsPDF to avoid SSR issues
        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1920, 1080],
            hotfixes: ['px_scaling']
        });

        const slides = script.slides;

        for (let i = 0; i < slides.length; i++) {
            const slide = slides[i];
            setExportStatus(`Capturing Slide ${i + 1}/${slides.length}...`);
            setExportProgress(Math.round((i / slides.length) * 100));

            // 1. Move time to end of slide animation
            const time = (slide.startTime || 0) + (slide.duration || 10) - 0.1;
            seek(time);

            // 2. Wait a tick for React to update the DOM
            await new Promise(r => setTimeout(r, 100));

            // 3. Capture
            if (svgRef.current) {
                const canvas = document.createElement('canvas');
                canvas.width = 1920;
                canvas.height = 1080;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const xml = new XMLSerializer().serializeToString(svgRef.current);
                    const img = new Image();
                    const svg64 = 'data:image/svg+xml;base64,' + btoa(xml);

                    await new Promise((resolve) => {
                        img.onload = () => {
                            ctx.fillStyle = '#0f172a';
                            ctx.fillRect(0, 0, 1920, 1080);
                            ctx.drawImage(img, 0, 0);
                            resolve(true);
                        };
                        img.src = svg64;
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.8);
                    if (i > 0) doc.addPage();
                    doc.addImage(imgData, 'JPEG', 0, 0, 1920, 1080);
                }
            }
        }

        doc.save(`${script.slides[0]?.title || 'presentation'}.pdf`);
        setIsExporting(false);
        setExportStatus('');
        setExportProgress(0);
        seek(0);
    };

    const searchParams = useSearchParams();
    const topicParam = searchParams.get('topic');
    const langParam = searchParams.get('language') || 'English';
    const fontParam = searchParams.get('font');
    const templateParam = searchParams.get('template') as any || 'neon';
    const slideCountParam = searchParams.get('slideCount');

    useEffect(() => {
        if (fontParam) {
            useStore.getState().setFont(fontParam as any);
        }
    }, [fontParam]);

    useEffect(() => {
        // Trigger generation if Topic is present and we are idle
        if (!script && topicParam && generationState.step === 'idle') {
            console.log("🚀 Initializing Video Generation via URL Params");
            console.log(`   Topic: ${topicParam}, Template: ${templateParam}, Slides: ${slideCountParam}`);
            const slides = slideCountParam ? parseInt(slideCountParam) : 5;
            generateVideo(topicParam, langParam, templateParam, slides);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [script, topicParam, langParam, templateParam, slideCountParam]);

    const generateVideo = async (topic: string, language: string, template: any, slideCount: number = 5) => {
        useStore.setState({ isPlaying: false }); // Stop any playback
        setGenerationState({ step: 'scripting', message: 'Dreaming up the storyboard...', progress: 0 });
        try {
            // 1. Generate Script
            const scriptRes = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, language, slideCount, suggestions })
            });

            if (!scriptRes.ok) throw new Error('Failed to generate script: ' + scriptRes.statusText);
            const data = await scriptRes.json();
            if (data.error) throw new Error(data.error);

            // Inject Template into Script
            const generatedScript = { ...data.script, template };

            setScript(generatedScript);
            // Immediately start rendering audio
            handleRender(generatedScript);

        } catch (e) {
            console.error(e);
            setGenerationState({ step: 'error', message: 'Error: ' + String(e) });
        }
    };

    const handleRender = async (currentScript?: any) => {
        const activeScript = currentScript || script;
        if (!activeScript) return;

        setGenerationState({ step: 'audio', message: 'Initializing Audio Engine...', progress: 0 });

        try {
            const slides = activeScript.slides || [];
            let completed = 0;



            // Mark all as pending
            slides.forEach((s: any) => setAudioStatus(s.slide_id, 'pending'));

            for (const slide of slides) {
                const text = slide.narration || slide.title;
                setGenerationState({
                    step: 'audio',
                    message: `Synthesizing audio for slide ${completed + 1}/${slides.length}...`,
                    progress: Math.round((completed / slides.length) * 100)
                });

                // VISUAL FEEDBACK: Jump to the slide we are processing
                // This acts as the "Mini Player" showing what's being rendered
                seek(slide.startTime || 0);

                setAudioStatus(slide.slide_id, 'generating');

                try {
                    // Start generating - UI will update to show spinner on canvas
                    // Add a small delay to let UI update and show "Generating" state visibly
                    await new Promise(r => setTimeout(r, 100));

                    const audioRes = await fetch('/api/tts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text, voice: selectedVoice, provider: ttsProvider, narrationLanguage })
                    });

                    if (audioRes.ok) {
                        const blob = await audioRes.blob();
                        const url = URL.createObjectURL(blob);
                        // Get Duration
                        const audio = new Audio(url);
                        await new Promise((resolve) => {
                            const timeoutId = setTimeout(() => {
                                console.warn("Audio metadata load timeout, using default duration");
                                setAudioUrl(slide.slide_id, url, 10);
                                setAudioStatus(slide.slide_id, 'ready');
                                resolve(true);
                            }, 2000);

                            audio.onloadedmetadata = () => {
                                clearTimeout(timeoutId);
                                setAudioUrl(slide.slide_id, url, audio.duration);
                                setAudioStatus(slide.slide_id, 'ready');
                                resolve(true);
                            };
                            audio.onerror = () => {
                                clearTimeout(timeoutId);
                                console.warn("Audio load error, using default duration/url");
                                setAudioUrl(slide.slide_id, url, 10);
                                setAudioStatus(slide.slide_id, 'error');
                                resolve(true);
                            }
                        });
                    } else {
                        throw new Error('TTS Failed');
                    }
                } catch (err) {
                    console.error("TTS Error for slide " + slide.slide_id, err);
                    setAudioStatus(slide.slide_id, 'error');
                }

                completed++;
            }

            // Audio done, move directly to export
            setGenerationState({ step: 'rendering', message: 'Audio Complete. Preparing to Render...', progress: 100 });

            // Allow state to update and UI to settle
            setTimeout(() => handleExport(), 100);

        } catch (e) {
            setGenerationState({ step: 'error', message: 'Render Error: ' + String(e) });
        }
    };

    // Initialize logic
    if (!script) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-8">
                <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6">
                    {generationState.step === 'scripting' ? (
                        <>
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 border-4 border-slate-800 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-cyan-500 rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <h2 className="text-xl font-medium text-slate-200">{generationState.message}</h2>
                        </>
                    ) : (
                        <>
                            {generationState.step === 'error' ? (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold text-red-500">Generation Failed</h2>
                                    <p className="text-slate-300">{generationState.message}</p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-full transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                                        Project Initialization
                                    </h2>
                                    <p className="text-slate-400">
                                        Waiting for topic data... if you are seeing this, please go back home and try again.
                                    </p>
                                    <Link href="/" className="inline-block bg-slate-800 hover:bg-slate-700 text-white px-6 py-2 rounded-full transition-colors">
                                        Go Home
                                    </Link>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        )
    }

    // Default View: Show Slides + Progress Overlay if exporting
    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
            {/* Minimal Header */}
            <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-950/80 backdrop-blur">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <HomeIcon className="w-5 h-5 text-neutral-400" />
                    </Link>
                    <h1 className="font-semibold text-lg text-neutral-200 truncate max-w-md">
                        {script.slides[0]?.title || 'Untitled Project'}
                    </h1>
                </div>
                <div className="flex items-center space-x-4 text-sm text-neutral-400">
                    <button
                        onClick={() => setShowAnimationPanel(!showAnimationPanel)}
                        className={`p-2 rounded-full transition-all ${showAnimationPanel ? 'bg-cyan-500/10 text-cyan-400' : 'hover:bg-neutral-800'}`}
                        title="Animation Panel"
                    >
                        <Sparkles className="w-5 h-5" />
                    </button>
                    <div className="h-6 w-px bg-neutral-800"></div>

                    {/* Size Selector */}
                    <div className="flex items-center space-x-1 text-xs text-neutral-400 bg-neutral-900 border border-neutral-700 rounded-md px-2 py-1">
                        <span className="font-mono">A</span>
                        <input
                            type="range"
                            min="0.5"
                            max="2.0"
                            step="0.1"
                            value={fontScale || 1.0}
                            onChange={(e) => setFontScale(parseFloat(e.target.value))}
                            className="w-16 accent-cyan-500 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                            title={`Font Scale: ${fontScale}x`}
                        />
                        <span className="font-mono text-lg">A</span>
                    </div>

                    {/* Font Selector */}
                    <select
                        className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-sm max-w-[10rem] truncate rounded-md px-3 py-1 outline-none focus:ring-2 focus:ring-cyan-500"
                        value={selectedFont || 'Modern'}
                        onChange={(e) => setFont(e.target.value as FontKey)}
                        title="Font Family"
                    >
                        {Object.entries(FONT_OPTIONS).map(([key, font]) => (
                            <option key={key} value={key}>
                                {font.label}
                            </option>
                        ))}
                    </select>

                    {/* Template Selector */}
                    <select
                        className="bg-neutral-900 border border-neutral-700 text-neutral-300 text-sm rounded-md px-3 py-1 outline-none focus:ring-2 focus:ring-cyan-500"
                        value={script.template || 'neon'}
                        onChange={(e) => {
                            // Assuming script is not null here as per parent check
                            setScript({ ...script, template: e.target.value as any });
                        }}
                    >
                        <option value="neon">Neon Dark</option>
                        <option value="retro">Retro</option>
                        <option value="brutalist">Brutalist</option>
                        <option value="nanobanna">Nano Banana Pro</option>
                    </select>

                    {/* Export Button */}
                    <button
                        onClick={handleExport}
                        className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-1.5 rounded-full text-sm font-medium transition-all shadow-lg shadow-cyan-500/20"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>

                    {/* Status Indicator */}
                    {generationState.step !== 'idle' && (
                        <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                            <span>{generationState.message || exportStatus}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Stage Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Slide List Sidebar */}
                <aside className="shrink-0 h-full border-r border-neutral-800 bg-neutral-900 overflow-hidden z-20">
                    <SlideList />
                </aside>

                <main id="stage-viewport" className="flex-1 flex flex-col items-center justify-center p-8 relative bg-neutral-950/50">
                    <Stage svgRef={svgRef} />

                    {/* Export/Generation Overlay */}
                    {(isExporting || generationState.step === 'audio' || generationState.step === 'rendering') && (
                        <div className="absolute inset-x-0 bottom-0 z-50 bg-black/80 backdrop-blur p-6">
                            <div className="max-w-4xl mx-auto space-y-2">
                                <div className="flex justify-between text-sm text-cyan-400 font-mono">
                                    <span>{isExporting ? exportStatus : generationState.message}</span>
                                    <span>{isExporting ? exportProgress : generationState.progress}%</span>
                                </div>
                                <div className="w-full bg-slate-800 rounded-full h-2">
                                    <div
                                        className="bg-cyan-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                        style={{ width: `${isExporting ? exportProgress : generationState.progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {showAnimationPanel && (
                    <aside className="w-80 shrink-0 h-full border-l border-neutral-800 bg-neutral-900 overflow-hidden">
                        <AnimationPanel />
                    </aside>
                )}
            </div>
        </div>
    );
}

export default function Studio() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        }>
            <StudioContent />
        </Suspense>
    );
}
