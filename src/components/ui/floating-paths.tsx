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

export function AnimatedTitle({ title, subtitle, localTime = 0 }: { title: string, subtitle?: string, localTime?: number }) {
    const words = title ? title.split(" ") : [];
    const wordBaseDelay = 0;

    return (
        <div className="relative z-10 container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold mb-8 tracking-tighter leading-normal py-4">
                    {words.map((word, wordIndex) => {
                        const start = wordBaseDelay + wordIndex * 0.1;
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
                    })}
                </h1>

                {subtitle && (() => {
                    const start = 1.0;
                    const p = Math.min(1, Math.max(0, (localTime - start) / 1.0));
                    const eased = easeOutCubic(p);
                    const y = 20 * (1 - eased);
                    const opacity = eased;

                    return (
                        <div
                            style={{
                                opacity: opacity,
                                transform: `translateY(${y}px)`
                            }}
                            className="inline-block group relative bg-gradient-to-b from-black/10 to-white/10 
                                dark:from-white/10 dark:to-black/10 p-px rounded-2xl backdrop-blur-lg 
                                overflow-hidden shadow-lg"
                        >
                            <div className="rounded-[1.15rem] px-8 py-6 text-2xl font-semibold backdrop-blur-md 
                                bg-white/95 dark:bg-black/95 text-black dark:text-white">
                                {subtitle}
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
