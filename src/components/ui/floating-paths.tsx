"use client";

import React from "react";

function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export function FloatingPaths({ position, time }: { position: number; time: number }) {
    const paths = Array.from({ length: 36 }, (_, i) => {
        const id = i;
        const duration = 20 + (id % 10);
        const progress = (time % duration) / duration;

        // Opacity animation: 0.3 -> 0.6 -> 0.3
        const opacity = 0.3 + 0.3 * Math.sin(progress * Math.PI);

        // Path Offset: 0 -> 1 -> 0
        const offset = 1 * Math.sin(progress * Math.PI);

        return {
            id,
            d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${380 - i * 5 * position
                } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${152 - i * 5 * position
                } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${684 - i * 5 * position
                } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
            color: `rgba(15,23,42,${0.1 + i * 0.03})`,
            width: 0.5 + i * 0.03,
            strokeOpacity: 0.1 + id * 0.03,
            animateOpacity: opacity,
            animateOffset: offset
        };
    });

    return (
        <div className="absolute inset-0 pointer-events-none">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full text-slate-950 dark:text-white opacity-50"
                viewBox="0 0 696 316"
                fill="none"
            >
                <title>Background Paths</title>
                {paths.map((path) => (
                    <path
                        key={path.id}
                        d={path.d}
                        stroke="currentColor"
                        strokeWidth={path.width}
                        strokeOpacity={path.strokeOpacity}
                        pathLength="1"
                        strokeDasharray="1"
                        strokeDashoffset={-path.animateOffset}
                        style={{
                            opacity: path.animateOpacity,
                            transition: 'none'
                        }}
                    />
                ))}
            </svg>
        </div>
    );
}


export function AnimatedTitle({
    title,
    subtitle,
    localTime = 0,
    activeElementId,
    onElementClick,
    elementAnimations = {},
    slideId
}: {
    title: string;
    subtitle?: string;
    localTime?: number;
    activeElementId?: string | null;
    onElementClick?: (id: string, val: string) => void;
    elementAnimations?: Record<string, any>;
    slideId?: number;
}) {
    const words = title ? title.split(" ") : [];

    // Title Interaction
    const titleId = slideId ? `slide-${slideId}-title` : 'intro-title';
    const isTitleActive = activeElementId === titleId;

    // Determine Animation for Title
    // If elementAnimations exists for title, use it. Otherwise fall back to internal staggered word animation.
    const customTitleAnim = elementAnimations[titleId];

    // Subtitle Interaction
    const subId = slideId ? `slide-${slideId}-subtitle` : 'intro-subtitle';
    const isSubActive = activeElementId === subId;
    const customSubAnim = elementAnimations[subId];

    // Helper to render title words
    const renderTitle = () => {
        if (customTitleAnim) {
            // Use new dynamic system for WHOLE title if custom anim is set
            // We can't easily perform "staggered word" animation with the single config from store yet without more complex logic.
            // So if user selects an animation, we apply it to the whole block for now.
            // OR we could map the "fade" to "staggered" logic internally? 
            // Let's stick to simple block animation if customized to avoid complexity.
            // If type is 'typewriter', we can mimic staggering.

            // Actually, let's keep it simple: separate selection container, but still render words.
            // If custom anim provided, we override the word-by-word opacity/y.

            // Calculate Single Animation state
            const type = customTitleAnim.type || 'fade';
            const duration = customTitleAnim.duration || 1.0;
            const delay = customTitleAnim.delay || 0;
            const start = delay;
            const p = Math.min(1, Math.max(0, (localTime - start) / duration));
            const eased = easeOutCubic(p);

            let containerStyle: React.CSSProperties = {};
            if (type === 'fade') containerStyle = { opacity: eased };
            if (type === 'slide_up') containerStyle = { opacity: eased, transform: `translateY(${100 * (1 - eased)}px)` };
            if (type === 'slide_down') containerStyle = { opacity: eased, transform: `translateY(${-100 * (1 - eased)}px)` };
            if (type === 'scale_in') containerStyle = { opacity: eased, transform: `scale(${eased})` };
            if (type === 'blur_in') containerStyle = { opacity: eased, filter: `blur(${10 * (1 - eased)}px)` };
            if (type === 'none') containerStyle = { opacity: 1 };

            return (
                <div style={containerStyle}>
                    {words.join(" ")}
                </div>
            );
        } else {
            // Original Staggered Animation
            return words.map((word, wordIndex) => {
                const start = 0 + wordIndex * 0.1;
                const p = Math.min(1, Math.max(0, (localTime - start) / 0.8));
                const eased = easeOutCubic(p);
                const y = 20 * (1 - eased);
                const opacity = eased;

                return (
                    <span
                        key={wordIndex}
                        style={{
                            display: 'inline-block',
                            marginRight: '1rem',
                            transform: `translateY(${y}px)`,
                            opacity: opacity
                        }}
                        className="last:mr-0 text-transparent bg-clip-text 
                            bg-gradient-to-r from-neutral-900 to-neutral-700/80 
                            dark:from-white dark:to-white/80 py-2"
                    >
                        {word}
                    </span>
                );
            });
        }
    }

    return (
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-4xl mx-auto">
                <div
                    onClick={(e) => { e.stopPropagation(); onElementClick?.(titleId, title); }}
                    className={`relative rounded-xl p-2 transition-all ${isTitleActive ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-black' : 'hover:bg-white/5'}`}
                >
                    <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter leading-normal py-4">
                        {renderTitle()}
                    </h1>
                </div>

                {subtitle && (() => {
                    let style: React.CSSProperties = {};
                    if (customSubAnim) {
                        const type = customSubAnim.type || 'fade';
                        const duration = customSubAnim.duration || 1.0;
                        const delay = customSubAnim.delay || 0;
                        const start = delay;
                        const p = Math.min(1, Math.max(0, (localTime - start) / duration));
                        const eased = easeOutCubic(p);

                        if (type === 'fade') style = { opacity: eased };
                        if (type === 'slide_up') style = { opacity: eased, transform: `translateY(${50 * (1 - eased)}px)` };
                        if (type === 'slide_down') style = { opacity: eased, transform: `translateY(${-50 * (1 - eased)}px)` };
                        if (type === 'scale_in') style = { opacity: eased, transform: `scale(${eased})` };
                        if (type === 'blur_in') style = { opacity: eased, filter: `blur(${10 * (1 - eased)}px)` };
                        if (type === 'none') style = { opacity: 1 };
                    } else {
                        // Original
                        const start = 1.0;
                        const p = Math.min(1, Math.max(0, (localTime - start) / 1.0));
                        const eased = easeOutCubic(p);
                        const y = 20 * (1 - eased);
                        style = { opacity: eased, transform: `translateY(${y}px)` };
                    }

                    return (
                        <div
                            onClick={(e) => { e.stopPropagation(); onElementClick?.(subId, subtitle); }}
                            className={`inline-block transition-all ${isSubActive ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-black rounded-3xl' : ''}`}
                        >
                            <div
                                style={style}
                                className="group relative bg-gradient-to-b from-black/10 to-white/10 
                                    dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                                    overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform duration-500"
                            >
                                <div className="rounded-[1.15rem] px-8 py-6 text-2xl font-semibold backdrop-blur-md 
                                    bg-white/95 dark:bg-black/95 text-black dark:text-white">
                                    {subtitle}
                                </div>
                            </div>
                        </div>
                    )
                })()}
            </div>
        </div>
    );
}

export function BackgroundPaths({
    title = "Background Paths",
    subtitle = "",
    localTime = 0
}: {
    title?: string;
    subtitle?: string;
    localTime?: number;
}) {
    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-white dark:bg-neutral-950">
            <div className="absolute inset-0">
                <FloatingPaths position={1} time={localTime} />
                <FloatingPaths position={-1} time={localTime} />
            </div>
            <AnimatedTitle title={title} subtitle={subtitle} localTime={localTime} />
        </div>
    );
}
