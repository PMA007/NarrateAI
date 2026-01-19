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
// Components
import { SlideRenderer } from '@/components/canvas/SlideRenderer';

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
        renderMode
    } = useStore();

    // Editor State
    const [editValue, setEditValue] = useState('');
    const [showFontPanel, setShowFontPanel] = useState(false);

    const [generation, setGeneration] = useState<{ step: 'idle' | 'loading' | 'error', message: string }>({ step: 'idle', message: '' });

    const searchParams = useSearchParams();
    const topicParam = searchParams.get('topic');
    const langParam = searchParams.get('language') || 'English';
    console.log("Editor Page Params:", { topicParam, langParam, scriptState: !!script });

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
            generateScript(topicParam, langParam);
        }
    }, [script, topicParam]);

    // Set font from URL params on page load
    useEffect(() => {
        const fontParam = searchParams.get('font');
        if (fontParam && FONT_OPTIONS[fontParam as keyof typeof FONT_OPTIONS]) {
            console.log('Setting font from URL:', fontParam);
            useStore.getState().setFont(fontParam as any);
        }
    }, [searchParams]);

    const generateScript = async (topic: string, language: string) => {
        setGeneration({ step: 'loading', message: 'Generating script...' });
        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, language, slideCount: 5 })
            });

            if (!res.ok) throw new Error('API Failed');
            const data = await res.json();

            if (data.script) {
                // Initialize Script in Store
                useStore.getState().setScript({ ...data.script, template: (new URLSearchParams(window.location.search).get('template') || 'neon') as any });
                setGeneration({ step: 'idle', message: '' });
            } else {
                throw new Error(data.error || 'No script returned');
            }
        } catch (e) {
            console.error(e);
            setGeneration({ step: 'error', message: 'Failed to generate script. Please try again.' });
        }
    };

    if (generation.step === 'loading') {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center flex-col gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
                <p className="text-cyan-400 animate-pulse">{generation.message}</p>
            </div>
        );
    }

    if (generation.step === 'error') {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center flex-col gap-4 text-white">
                <p className="text-red-500">{generation.message}</p>
                <Link href="/" className="px-4 py-2 bg-neutral-800 rounded hover:bg-neutral-700">Go Home</Link>
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
            <header className="h-16 border-b border-neutral-800 flex items-center justify-between px-6 bg-neutral-900/80 backdrop-blur sticky top-0 z-50">
                <div className="flex items-center space-x-4">
                    <Link href="/" className="p-2 hover:bg-neutral-800 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5 text-neutral-400" />
                    </Link>
                    <h1 className="font-semibold text-lg text-neutral-200">
                        Detailed Editor
                    </h1>
                </div>

                <div className="flex items-center space-x-4">
                    <div className="text-sm text-neutral-500 mr-4 hidden md:block">
                        Scroll to review • Click text to edit
                    </div>

                    {/* TEMPORARY: Font Picker for Testing */}
                    <select
                        value={selectedFont}
                        onChange={(e) => useStore.getState().setFont(e.target.value as any)}
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm border border-neutral-700"
                    >
                        {Object.entries(FONT_OPTIONS).map(([key, config]) => (
                            <option key={key} value={key}>{config.label}</option>
                        ))}
                    </select>

                    {/* Voice Selector */}
                    <select
                        value={useStore.getState().selectedVoice}
                        onChange={(e) => useStore.getState().setVoice(e.target.value)}
                        className="bg-neutral-800 text-white px-3 py-2 rounded-lg text-sm border border-neutral-700"
                    >
                        {Object.entries(AZURE_VOICES).map(([voiceId, config]) => (
                            <option key={voiceId} value={voiceId}>
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

            {/* Main Scroll Area */}
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
                                        localTime={100} // Force show end state (animations complete)
                                        width={1280}
                                        height={720}
                                        fontFamily={FONT_OPTIONS[selectedFont as keyof typeof FONT_OPTIONS]?.family || 'Inter'}
                                        template={script.template || 'neon'}
                                        onElementClick={(localId, val) => handleElementClick(null as any, index, localId, val)}
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
