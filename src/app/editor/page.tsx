'use client';

import { useStore } from '@/lib/store';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Video, Type, Mic } from 'lucide-react';
import Link from 'next/link';
import { FONT_OPTIONS } from '@/lib/fonts';
import { AZURE_VOICES } from '@/lib/voices';

// Components
import { SlideRenderer } from '@/components/canvas/SlideRenderer';
import { AnimationPanel } from '@/components/studio/AnimationPanel';
import { Sparkles } from 'lucide-react';

function EditorContent() {
    const router = useRouter();
    const {
        script,
        activeElementId,
        setActiveElement,
        updateSlide,
        elementStyles,
        setElementStyle,
        selectedFont,
        renderMode,
        elementAnimations
    } = useStore();

    // Editor State
    const [editValue, setEditValue] = useState('');
    const [showFontPanel, setShowFontPanel] = useState(false);
    const [showAnimationPanel, setShowAnimationPanel] = useState(true);

    // Animation Preview State
    const [previewState, setPreviewState] = useState<{ active: boolean; time: number; elementId: string | null }>({
        active: false,
        time: 0,
        elementId: null
    });

    const previewTrigger = useStore(state => state.previewTrigger);
    // activeElementId is already destructured above

    useEffect(() => {
        if (previewTrigger === 0) return;

        // Start preview loop
        const startTime = performance.now();
        let animationFrame: number;
        const targetId = activeElementId; // Capture current ID

        setPreviewState({ active: true, time: 0, elementId: targetId });

        const animate = () => {
            const now = performance.now();
            const elapsed = (now - startTime) / 1000; // seconds

            if (elapsed < 3.0) { // Play for 3 seconds
                setPreviewState({ active: true, time: elapsed, elementId: targetId });
                animationFrame = requestAnimationFrame(animate);
            } else {
                setPreviewState({ active: false, time: 0, elementId: null }); // Reset
            }
        };

        animationFrame = requestAnimationFrame(animate);

        return () => cancelAnimationFrame(animationFrame);
    }, [previewTrigger]); // Dependency on activeElementId is implicit via store capture

    const [generation, setGeneration] = useState<{ step: 'idle' | 'loading' | 'error' | 'complete', message: string }>({ step: 'idle', message: '' });

    const searchParams = useSearchParams();
    const topicParam = searchParams.get('topic');
    const langParam = searchParams.get('language') || 'English';
    const slideCountParam = searchParams.get('slideCount');
    console.log("Editor Page Params:", { topicParam, langParam, scriptState: !!script, slideCountParam });

    // Redirect ONLY if no script AND no topic (meaning we can't generate)
    useEffect(() => {
        if (!script && !topicParam) {
            console.warn("Redirecting home - missing script and topic");
            router.push('/');
        }
    }, [script, topicParam, router]);

    // Initial Generation Logic
    useEffect(() => {
        if (!script && topicParam && generation.step === 'idle') {
            console.log("Triggering generation for:", topicParam);
            const slides = slideCountParam ? parseInt(slideCountParam) : 5;
            generateScript(topicParam, langParam, slides);
        }
    }, [script, topicParam, slideCountParam]);

    // Set font from URL params on page load
    useEffect(() => {
        const fontParam = searchParams.get('font');
        if (fontParam && FONT_OPTIONS[fontParam as keyof typeof FONT_OPTIONS]) {
            console.log('Setting font from URL:', fontParam);
            useStore.getState().setFont(fontParam as any);
        }
    }, [searchParams]);

    // Generation Log State
    const [generationLogs, setGenerationLogs] = useState<{ type: 'log' | 'token' | 'error' | 'result', message?: string, data?: any }[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        const logContainer = document.getElementById('log-container');
        if (logContainer) {
            logContainer.scrollTop = logContainer.scrollHeight;
        }
    }, [generationLogs]);

    const generateScript = async (topic: string, language: string, slideCount: number = 5) => {
        setGeneration({ step: 'loading', message: 'Initializing Wizard...' });
        setIsStreaming(true);
        setGenerationLogs([]);

        try {
            const response = await fetch('/api/wizard/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic,
                    genre: 'general', // You might want to detect this or pass it
                    language,
                    slideCount,
                    template: (new URLSearchParams(window.location.search).get('template') || 'neon')
                })
            });

            if (!response.ok) throw new Error('Wizard API Failed');
            if (!response.body) throw new Error('No response body');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            console.log("Stream Event:", data); // Debug

                            if (data.type === 'log' || data.type === 'token') {
                                setGenerationLogs(prev => {
                                    // Optimization: Append token to last message if it's a token
                                    if (data.type === 'token' && prev.length > 0 && prev[prev.length - 1].type === 'token') {
                                        const last = prev[prev.length - 1];
                                        return [...prev.slice(0, -1), { ...last, message: (last.message || '') + data.message }];
                                    }
                                    return [...prev, data];
                                });
                            } else if (data.type === 'result') {
                                // Success!
                                useStore.getState().setScript(data.data);
                                setGeneration({ step: 'complete', message: 'Generation Complete!' });
                                setIsStreaming(false);
                                return; // Exit loop
                            } else if (data.type === 'error') {
                                throw new Error(data.message);
                            }
                        } catch (e) {
                            console.error("Parse Error", e);
                        }
                    }
                }
            }

        } catch (e: any) {
            console.error(e);
            setGeneration({ step: 'error', message: e.message || 'Failed to generate script.' });
            setIsStreaming(false);
        }
    };

    if (generation.step === 'loading' || generation.step === 'complete' || isStreaming) {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center flex-col gap-6 p-10 relative overflow-hidden">
                {/* Background Ambience */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b,transparent)] opacity-40 z-0" />

                <div className="z-10 flex flex-col items-center gap-6 w-full max-w-4xl h-full">
                    <div className="flex items-center gap-4">
                        {generation.step === 'loading' || isStreaming ? (
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-white">
                            {generation.step === 'complete' ? 'Video Blueprint Ready!' : 'Generating Your Video...'}
                        </h2>
                    </div>

                    {/* Log Viewer */}
                    <div
                        id="log-container"
                        className="w-full flex-1 bg-neutral-900/80 border border-neutral-800 rounded-xl p-6 overflow-y-auto font-mono text-sm space-y-2 relative shadow-2xl backdrop-blur-sm"
                        style={{ maxHeight: '60vh' }}
                    >
                        {/* Glass Overlay mainly for loading state aesthetics */}
                        {isStreaming && <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-neutral-900/10" />}

                        {generationLogs.map((log, i) => (
                            <div key={i} className={`
                                ${log.type === 'token' ? 'text-neutral-400 inline' : 'block mb-2'}
                                ${log.type === 'log' ? 'text-cyan-400 font-bold mt-4 border-t border-neutral-800 pt-2 text-base' : ''}
                                ${log.type === 'error' ? 'text-red-500 font-bold' : ''}
                            `}>
                                {log.message}
                            </div>
                        ))}

                        {/* Blinking Cursor */}
                        {isStreaming && <span className="inline-block w-2 h-4 bg-cyan-500 ml-1 animate-pulse" />}
                    </div>

                    {/* Done Button */}
                    {generation.step === 'complete' && (
                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            onClick={() => setGeneration({ step: 'idle', message: '' })}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 px-12 rounded-full shadow-lg shadow-cyan-500/20 flex items-center gap-2 transform transition-all hover:scale-105"
                        >
                            <Video className="w-5 h-5" />
                            Start Editing
                        </motion.button>
                    )}
                </div>
            </div>
        );
    }

    if (generation.step === 'error') {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center flex-col gap-4 text-white">
                <p className="text-red-500 text-xl font-bold">{generation.message}</p>
                <div className="w-full max-w-2xl h-64 bg-neutral-900 border border-neutral-800 rounded-xl p-4 overflow-auto text-xs text-neutral-500 font-mono">
                    {/* Show logs even on error for debugging */}
                    {generationLogs.map((log, i) => (
                        <div key={i}>{log.message}</div>
                    ))}
                </div>
                <Link href="/" className="px-6 py-3 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors font-medium">Try Again</Link>
            </div>
        );
    }

    // Still loading or redirecting...
    if (!script) return null;

    // Detect language for font mapping
    const detectLanguage = (text: string) => {
        if (/[\u0C00-\u0C7F]/.test(text)) return 'Telugu';
        return 'English';
    };

    const currentLang = detectLanguage(script.slides[0]?.title || '');

    // Filter fonts
    const visibleFonts = Object.entries(FONT_OPTIONS).filter(([key, config]) => {
        if (currentLang === 'Telugu') return config.label.includes('Telugu');
        return !config.label.includes('Telugu');
    });

    const handleElementClick = (e: React.MouseEvent | null, slideId: number, localId: string, currentValue: string) => {
        if (e) e.stopPropagation();
        // Construct unique ID: slide-0-title, slide-1-bullet-0
        const uniqueId = `slide-${slideId}-${localId}`;
        setActiveElement(uniqueId);
        setEditValue(currentValue);
    };

    const handleTextChange = (newValue: string) => {
        setEditValue(newValue);
        if (!activeElementId) return;

        const [_, slideIdStr, type, indexStr] = activeElementId.split('-');
        const slideId = parseInt(slideIdStr);
        const slide = script.slides[slideId];

        if (!slide) return;

        const updates: any = {};

        if (type === 'title') {
            updates.title = newValue;
        } else if (type === 'subtitle') {
            updates.subtitle = newValue;
        } else if (type === 'bullet') {
            const idx = parseInt(indexStr);
            const newBullets = [...(slide.content.bullets || [])];
            newBullets[idx] = newValue;
            updates.content = { ...slide.content, bullets: newBullets };
        }

        updateSlide(slide.slide_id, updates);
    };

    const updateStyle = (key: 'fontFamily' | 'fontSize', value: any) => {
        if (!activeElementId) return;
        setElementStyle(activeElementId, { [key]: value });
    };

    const fontConfig = FONT_OPTIONS[selectedFont as keyof typeof FONT_OPTIONS] || FONT_OPTIONS['Modern'];

    return (
        <div className="min-h-screen bg-neutral-950 text-white flex flex-col">
            {/* Font Loader */}
            <link href={fontConfig.url} rel="stylesheet" />
            <div style={{ fontFamily: fontConfig.family, position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
                ఫాంట్ ప్రీలోడ్
            </div>

            {/* Header */}
            <header
                className="fixed top-0 left-0 right-0 h-16 border-b border-neutral-800 flex items-center justify-between px-6 z-[9999] bg-black isolation-auto"
                style={{ backgroundColor: '#000000' }}
            >
                <div className="flex items-center space-x-4">
                    <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <h1 className="font-semibold text-lg" style={{ color: '#ffffff' }}>
                        Detailed Editor (V3 Fixed)
                    </h1>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-sm text-neutral-400 mr-4 hidden md:block" style={{ color: '#a3a3a3' }}>
                        Scroll to review • Click text to edit
                    </div>

                    <button
                        onClick={() => setShowAnimationPanel(!showAnimationPanel)}
                        className={`p-2 rounded-full transition-all mr-2 ${showAnimationPanel ? 'bg-cyan-500/20 text-cyan-400' : 'hover:bg-neutral-800 text-neutral-200'}`}
                        title="Animation Panel"
                        style={{ color: showAnimationPanel ? '#22d3ee' : '#e5e5e5' }}
                    >
                        <Sparkles className="w-5 h-5" />
                    </button>

                    {/* Use inline !important styles via class hack or mostly inline */}
                    <select
                        value={selectedFont}
                        onChange={(e) => useStore.getState().setFont(e.target.value as any)}
                        className="bg-black text-white px-3 py-2 rounded-lg text-sm border border-neutral-700 outline-none focus:ring-1 focus:ring-cyan-500"
                        style={{ backgroundColor: '#000000', color: '#ffffff', opacity: 1, zIndex: 10000 }}
                    >
                        {Object.entries(FONT_OPTIONS).map(([key, config]) => (
                            <option key={key} value={key} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                                {config.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={useStore.getState().selectedVoice}
                        onChange={(e) => useStore.getState().setVoice(e.target.value)}
                        className="bg-black text-white px-3 py-2 rounded-lg text-sm border border-neutral-700 outline-none focus:ring-1 focus:ring-cyan-500"
                        style={{ backgroundColor: '#000000', color: '#ffffff', opacity: 1, zIndex: 10000 }}
                    >
                        {Object.entries(AZURE_VOICES).map(([voiceId, config]) => (
                            <option key={voiceId} value={voiceId} style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                                {config.name} ({config.language}, {config.gender})
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => router.push('/render')}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-5 py-2 rounded-full font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
                    >
                        <Video className="w-4 h-4" />
                        Render Video
                    </button>
                </div>
            </header>

            {/* Main Scroll Area - Added pt-16 to account for fixed header */}
            <div className="flex-1 flex overflow-hidden pt-16">
                <main className="flex-1 overflow-y-auto p-8 space-y-12 pb-40">
                    {
                        script.slides.map((slide, index) => (
                            <div
                                key={slide.slide_id}
                                className="max-w-[1280px] mx-auto bg-neutral-900 rounded-xl overflow-hidden shadow-2xl border border-neutral-800 relative group"
                                style={{ aspectRatio: '16/9' }}
                            >
                                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur px-3 py-1 rounded-full text-xs text-neutral-400 z-20">
                                    Slide {index + 1}
                                </div>

                                {/* Template Background Layer */}
                                <div className="absolute inset-0 z-0">
                                    {script.template === 'retro' && (
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'radial-gradient(120% 120% at 20% 18%, #f2f6ff 0%, #d5e3f6 36%, #a4bcd6 72%, #8aa3be 100%)',
                                        }}>
                                            {/* Vignette */}
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
                                    {(!script.template || script.template === 'neon') && (
                                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }} />
                                    )}
                                </div>

                                <div className="w-full h-full transform origin-top-left relative z-10" style={{ transform: 'scale(1)' }}>
                                    <svg
                                        width="100%"
                                        height="100%"
                                        viewBox="0 0 1280 720"
                                        preserveAspectRatio="xMidYMid meet"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <SlideRenderer
                                            slide={slide}
                                            index={index}
                                            localTime={100} // Force static end state
                                            previewTime={previewState.active ? previewState.time : undefined}
                                            width={1280}
                                            height={720}
                                            fontFamily={FONT_OPTIONS[selectedFont as keyof typeof FONT_OPTIONS]?.family || 'Inter'}
                                            template={script.template || 'neon'}

                                            // 1. Localize Active Element ID
                                            activeElementId={
                                                activeElementId && activeElementId.startsWith(`slide-${index}-`)
                                                    ? activeElementId.replace(`slide-${index}-`, '')
                                                    : null
                                            }

                                            // 2. Localize Preview Element ID
                                            previewElementId={
                                                previewState.elementId && previewState.elementId.startsWith(`slide-${index}-`)
                                                    ? previewState.elementId.replace(`slide-${index}-`, '')
                                                    : null
                                            }

                                            // 3. Localize Animations Map
                                            elementAnimations={
                                                Object.entries(elementAnimations)
                                                    .reduce((acc, [key, anim]) => {
                                                        if (key.startsWith(`slide-${index}-`)) {
                                                            const localKey = key.replace(`slide-${index}-`, '');
                                                            acc[localKey] = anim;
                                                        }
                                                        return acc;
                                                    }, {} as any)
                                            }

                                            onElementClick={(localId, val) => handleElementClick(null as any, index, localId, val)}

                                            // 4. Localize Styles Map
                                            elementStyles={
                                                Object.entries(elementStyles)
                                                    .reduce((acc, [key, style]) => {
                                                        if (key.startsWith(`slide-${index}-`)) {
                                                            const localKey = key.replace(`slide-${index}-`, '');
                                                            acc[localKey] = style;
                                                        }
                                                        return acc;
                                                    }, {} as any)
                                            }
                                        />
                                    </svg>
                                </div>
                            </div>
                        ))
                    }
                </main >

                {showAnimationPanel && (
                    <aside className="w-80 shrink-0 h-full border-l border-neutral-800 bg-neutral-900 overflow-hidden">
                        <AnimationPanel />
                    </aside>
                )}
            </div>

            {/* Editing Toolbar */}
            <AnimatePresence>
                {
                    activeElementId && (
                        <motion.div
                            initial={{ y: 100 }}
                            animate={{ y: 0 }}
                            exit={{ y: 100 }}
                            className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-6 z-50 flex justify-center shadow-2xl"
                        >
                            <div className="max-w-3xl w-full flex items-center gap-6">
                                <input
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    className="flex-1 bg-neutral-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 text-lg"
                                    placeholder="Edit text..."
                                    autoFocus
                                />

                                <div className="h-10 w-px bg-neutral-700" />

                                {/* Font Picker */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowFontPanel(!showFontPanel)}
                                        className="p-3 hover:bg-neutral-800 rounded-xl text-neutral-300 flex flex-col items-center gap-1 min-w-[60px]"
                                    >
                                        <Type className="w-5 h-5" />
                                        <span className="text-[10px] uppercase font-bold tracking-wider">Font</span>
                                    </button>
                                    {showFontPanel && (
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 bg-neutral-800 border border-neutral-700 rounded-xl p-2 shadow-xl w-56 max-h-80 overflow-y-auto grid gap-1">
                                            {visibleFonts.map(([key, config]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => {
                                                        updateStyle('fontFamily', config.family);
                                                        setShowFontPanel(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-neutral-700 rounded-lg text-sm truncate transition-colors"
                                                    style={{ fontFamily: config.family }}
                                                >
                                                    {config.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Size Slider */}
                                <div className="flex flex-col items-center gap-2 min-w-[100px]">
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500">Size</span>
                                    <input
                                        type="range"
                                        min="20"
                                        max="200"
                                        defaultValue={elementStyles[activeElementId]?.fontSize || 60}
                                        className="w-24 accent-cyan-500 h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                                        onChange={(e) => updateStyle('fontSize', parseInt(e.target.value))}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}

export default function EditorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        }>
            <EditorContent />
        </Suspense>
    );
}
