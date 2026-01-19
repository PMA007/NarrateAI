"use client";

import React, { useMemo } from 'react';

export function LiquidSVG({ localTime }: { localTime?: number }) {
    // If localTime is provided (Renderer/Studio), use it.
    // If not (Home Page Card), animate internally.
    const [internalTime, setInternalTime] = React.useState(0);

    React.useEffect(() => {
        if (typeof localTime === 'number') return;

        let frameId: number;
        const startTime = performance.now();
        const loop = () => {
            const now = performance.now();
            setInternalTime((now - startTime) / 1000);
            frameId = requestAnimationFrame(loop);
        };
        frameId = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(frameId);
    }, [localTime]);

    const time = typeof localTime === 'number' ? localTime : internalTime;

    // Animate turbulence seed or baseFrequency to create movement
    // Since seed must be integer, we can't smoothly animate it easily.
    // Instead, we animate the 'color' or lighting, or use SVG SMIL animate (which works in our renderer!)
    // Better: We shift the 'feTurbulence' by wrapping it in a transformed group or animating baseFrequency slightly?
    // Actually, strictly animating baseFrequency causes jitter.
    // Best standard trick: Move the element *under* a large noise pattern, or use JS to update attribute.

    // For our Frame-by-Frame renderer: We can pass props that change!
    // We will animate the 'baseFrequency' very subtly to simulate shimmering.

    const shimmer = 0.01 + 0.002 * Math.sin(time);

    return (
        <div className="absolute inset-0 w-full h-full bg-slate-950 overflow-hidden">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full opacity-60"
                preserveAspectRatio="none"
            >
                <defs>
                    <filter id="liquid-metal" x="-20%" y="-20%" width="140%" height="140%">
                        <feTurbulence
                            type="turbulence"
                            baseFrequency={`0.01 ${shimmer}`}
                            numOctaves="3"
                            seed="5"
                            result="noise"
                        />
                        <feSpecularLighting
                            in="noise"
                            surfaceScale="20"
                            specularConstant="1.5"
                            specularExponent="20"
                            lightingColor="#3b82f6"
                            result="light"
                        >
                            <fePointLight x="500" y="-100" z="600" />
                        </feSpecularLighting>

                        <feColorMatrix
                            in="light"
                            type="matrix"
                            values="0 0 0 0 0
                                    0 0 0 0 0
                                    0 0 1 0 0
                                    0 0 0 1 0"
                        />
                        <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
                    </filter>

                    <linearGradient id="deep-blue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a" />
                        <stop offset="50%" stopColor="#1e3a8a" />
                        <stop offset="100%" stopColor="#172554" />
                    </linearGradient>
                </defs>

                {/* Base Gradient Layer */}
                <rect width="100%" height="100%" fill="url(#deep-blue)" />

                {/* Turbulence Layer */}
                <rect width="100%" height="100%" filter="url(#liquid-metal)" opacity="0.6" />

                {/* Floating Orbs for extra 'liquid' feel */}
                <circle cx="20%" cy="30%" r="20%" fill="#3b82f6" opacity="0.2" filter="blur(60px)">
                    {/* SVG animation for web preview (renderer uses frame updates) */}
                    <animate attributeName="cy" values="30%;40%;30%" dur="10s" repeatCount="indefinite" />
                </circle>
                <circle cx="80%" cy="70%" r="25%" fill="#60a5fa" opacity="0.2" filter="blur(80px)">
                    <animate attributeName="cy" values="70%;60%;70%" dur="15s" repeatCount="indefinite" />
                </circle>
            </svg>

            {/* Mesh Overlay */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #ffffff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />
        </div>
    );
}
