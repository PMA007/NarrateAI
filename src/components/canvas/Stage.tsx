'use client';

import { useEffect, useRef, RefObject, useMemo } from 'react';
import { useStore, Slide as SlideType } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';

import { FONT_OPTIONS } from '@/lib/fonts';
import { NeonTemplate } from '@/components/templates/NeonTemplate';
import { RetroTemplate } from '@/components/templates/RetroTemplate';
import { NanoBannaTemplate } from '@/components/templates/NanoBannaTemplate';

const ASPECT_RATIO = 16 / 9;
const WIDTH = 1920;
const HEIGHT = 1080;

interface SlideTimeline {
    slide: SlideType;
    startTime: number;
    endTime: number;
}

// Interface for override props (used in Preview Modal)
interface StageProps {
    svgRef?: RefObject<SVGSVGElement | null>;
    script?: any;
    currentTime?: number;
    isPlaying?: boolean;
    width?: number;
    height?: number;
}

export function Stage({
    svgRef,
    script: propScript,
    currentTime: propCurrentTime,
    isPlaying: propIsPlaying,
    width = 1920,
    height = 1080
}: StageProps) {
    // Get store values
    const store = useStore();

    // Use props if provided, otherwise fallback to store
    // Note: We avoid calling useStore hooks if we are in "Preview Mode" (implied by propScript)
    // but hooks rules say we must call them.
    // So we just override the values.

    const isPreview = !!propScript;

    const script = propScript || store.script;
    const isPlaying = isPreview ? (propIsPlaying ?? false) : store.isPlaying;
    const currentTime = isPreview ? (propCurrentTime ?? 0) : store.currentTime;
    const selectedFont = store.selectedFont; // Use store font for both (user preference)
    const fontScale = store.fontScale; // Use store scale
    const totalDuration = isPreview ? 0 : store.totalDuration; // Not used for logic here really

    const fontConfig = FONT_OPTIONS[selectedFont] || FONT_OPTIONS['Modern'];
    const requestRef = useRef<number | null>(null);

    // Calculate our own timeline to avoid depending on potentially undefined startTime values
    const timeline = useMemo<SlideTimeline[]>(() => {
        if (!script) return [];

        const result: SlideTimeline[] = [];
        let cumulativeTime = 0;

        // Simplify slide mapping if using dummy script (which might not match strict type exactly, hence 'any' cast in Modal)
        const slides = script.slides || [];

        for (const slide of slides) {
            const duration = slide.duration || 10;
            result.push({
                slide,
                startTime: cumulativeTime,
                endTime: cumulativeTime + duration
            });
            cumulativeTime += duration;
        }

        return result;
    }, [script]);

    useEffect(() => {
        // If in Preview Mode, animation loop is handled by parent (Modal).
        // Only run internal loop if connected to Store.
        if (isPreview) return;

        let lastTimestamp: number;

        const tick = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const progress = timestamp - lastTimestamp;

            if (store.isPlaying) {
                useStore.setState({ currentTime: useStore.getState().currentTime + (progress / 1000) });
            }

            lastTimestamp = timestamp;

            const state = useStore.getState();
            if (state.isPlaying && state.currentTime < state.totalDuration) {
                requestRef.current = requestAnimationFrame(tick);
            } else if (state.currentTime >= state.totalDuration) {
                useStore.setState({ isPlaying: false });
            }
        };

        if (store.isPlaying) {
            requestRef.current = requestAnimationFrame(tick);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isPreview, store.isPlaying]); // Depend on store.isPlaying specifically

    // Find active slide using our calculated timeline
    const activeEntry = timeline.find(t =>
        currentTime >= t.startTime && currentTime < t.endTime
    );

    const activeSlide = activeEntry?.slide ?? null;
    const localTime = activeEntry ? currentTime - activeEntry.startTime : 0;

    // Simplified template selection: only neon and retro
    const Template: React.ComponentType<{ localTime: number }> =
        script?.template === 'retro' ? RetroTemplate :
            script?.template === 'nanobanna' ? NanoBannaTemplate :
                script?.template === 'brutalist' ? NeonTemplate : // Brutalist uses Neon bg for now or similar
                    NeonTemplate;

    return (
        <div className="relative w-full aspect-video bg-neutral-950 rounded-lg overflow-hidden shadow-2xl border border-neutral-800">
            {/* Font Loader - Must be at page level for foreignObject content */}
            <link href={fontConfig.url} rel="stylesheet" />
            {/* Hidden element to force font load with Telugu text */}
            <div style={{ fontFamily: fontConfig.family, position: 'absolute', opacity: 0, pointerEvents: 'none', zIndex: -1 }}>
                ఫాంట్ ప్రీలోడ్
            </div>

            {/* Template Background Layer */}
            <Template localTime={localTime} />

            {/* SVG Content Layer */}
            <svg
                ref={svgRef}
                viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
                className="absolute inset-0 w-full h-full z-10 pointer-events-none" // pointer-events-none to let clicks pass to template if needed? Slide needs clicks though?
                // Actually Slide usually has interaction. But Slide is inside SVG.
                // SVG needs pointer-events-auto if we want interaction.
                style={{ pointerEvents: 'none' }}
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <style>
                        {`@import url('${fontConfig.url}');`}
                        {`text { font-family: ${fontConfig.family} !important; }`}
                    </style>
                    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>
                {/* Remove rect background as Template handles it */}

                {activeSlide ? (
                    <g style={{ pointerEvents: 'all' }}>
                        <SlideRenderer
                            key={activeSlide.slide_id}
                            slide={activeSlide}
                            index={script?.slides.indexOf(activeSlide) ?? -1}
                            localTime={localTime}
                            width={WIDTH}
                            height={HEIGHT}
                            fontFamily={fontConfig.family}                            fontScale={fontScale}                            template={script?.template || 'neon'}
                            // START FIX: Map global keys (slide-0-title) to local keys (title)
                            elementAnimations={
                                Object.entries(store.elementAnimations)
                                    .reduce((acc, [key, anim]) => {
                                        const currentIndex = script?.slides.indexOf(activeSlide) ?? -1;
                                        const prefix = `slide-${currentIndex}-`;
                                        if (key.startsWith(prefix)) {
                                            acc[key.replace(prefix, '')] = anim;
                                        }
                                        return acc;
                                    }, {} as any)
                            }
                            elementStyles={
                                Object.entries(store.elementStyles)
                                    .reduce((acc, [key, style]) => {
                                        const currentIndex = script?.slides.indexOf(activeSlide) ?? -1;
                                        const prefix = `slide-${currentIndex}-`;
                                        if (key.startsWith(prefix)) {
                                            acc[key.replace(prefix, '')] = style;
                                        }
                                        return acc;
                                    }, {} as any)
                            }
                            // END FIX
                            onElementClick={(id) => store.setActiveElement(id)}
                            activeElementId={store.activeElementId}
                        />
                    </g>
                ) : (
                    <text x={WIDTH / 2} y={HEIGHT / 2} fill="white" fontSize="60" textAnchor="middle" opacity={0.5}>
                        {script ? "The End" : "Ready to Generate"}
                    </text>
                )}

            </svg>
        </div>
    );

}

