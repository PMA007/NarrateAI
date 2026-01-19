import React from 'react';

/**
 * RetroTemplate Background Component
 * Replicates the background from nslide1-5.html:
 * - Radial gradient background
 * - Simplified grain effect (CSS-based, no external resources)
 * - 3-layer vignette effect
 */
export const RetroTemplate = ({ localTime }: { localTime: number }) => {
    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            background: '#0b1220', // Page background
            overflow: 'hidden',
        }}>
            {/* Main Slide Gradient Background */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(120% 120% at 20% 18%, #f2f6ff 0%, #d5e3f6 36%, #a4bcd6 72%, #8aa3be 100%)',
                borderRadius: '16px',
            }}>
                {/* Simplified Grain Effect - CSS-only, no external resources */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.08,
                    mixBlendMode: 'multiply',
                    pointerEvents: 'none',
                    background: `
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            rgba(0,0,0,0.03) 2px,
                            rgba(0,0,0,0.03) 4px
                        ),
                        repeating-linear-gradient(
                            90deg,
                            transparent,
                            transparent 2px,
                            rgba(0,0,0,0.03) 2px,
                            rgba(0,0,0,0.03) 4px
                        )
                    `,
                }} />

                {/* Vignette Overlay (3 Layers) */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: `
                        radial-gradient(110% 110% at 50% 10%, rgba(255,255,255,.26) 0%, rgba(255,255,255,0) 42%),
                        radial-gradient(110% 110% at 80% 70%, rgba(0,0,0,.16) 0%, rgba(0,0,0,0) 55%),
                        radial-gradient(120% 120% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,.20) 100%)
                    `,
                    pointerEvents: 'none',
                }} />
            </div>
        </div>
    );
};
