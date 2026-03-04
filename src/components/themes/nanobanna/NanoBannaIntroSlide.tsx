import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

// Aurora Dark – Intro Slide
export const NanoBannaIntroSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    theme,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, subtitle } = slide;

    // Scales font size down smoothly when text exceeds idealChars
    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h1 || 64, title || '', 22, 26);

    const getTime = (id: string, delay = 0) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'slide_up', duration: 0.7, delay: 0 });
    const subtitleAnim = useDynamicAnimation(getTime('subtitle'), 0.5,
        elementAnimations?.['subtitle'] ?? { type: 'fade', duration: 0.6, delay: 0 });

    return (
        <g>
            {/* Decorative radial glow – top right */}
            <defs>
                <radialGradient id={`intro-glow-${slide.slide_id}`} cx="85%" cy="15%" r="55%">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#A78BFA" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`intro-glow2-${slide.slide_id}`} cx="15%" cy="90%" r="45%">
                    <stop offset="0%" stopColor="#34D399" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                </radialGradient>
                <linearGradient id={`title-grad-${slide.slide_id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#F1F5F9" />
                    <stop offset="60%" stopColor="#F1F5F9" />
                    <stop offset="100%" stopColor="#A78BFA" />
                </linearGradient>
            </defs>

            {/* Background glow layers */}
            <rect x="0" y="0" width={width} height={height} fill={`url(#intro-glow-${slide.slide_id})`} />
            <rect x="0" y="0" width={width} height={height} fill={`url(#intro-glow2-${slide.slide_id})`} />

            {/* Top accent bar – gradient */}
            <defs>
                <linearGradient id={`top-bar-${slide.slide_id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="50%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width={width} height="5" fill={`url(#top-bar-${slide.slide_id})`} />

            {/* Decorative grid dots – right half */}
            <g opacity="0.35">
                {Array.from({ length: 12 }, (_, row) =>
                    Array.from({ length: 8 }, (_, col) => (
                        <circle
                            key={`d-${row}-${col}`}
                            cx={width * 0.55 + col * 62}
                            cy={80 + row * 62}
                            r="2"
                            fill="#A78BFA"
                            opacity={0.3 + (col + row) * 0.02}
                        />
                    ))
                )}
            </g>

            {/* Decorative orb ring – top right */}
            <circle cx={width - 140} cy={140} r="90" fill="none" stroke="rgba(167,139,250,0.12)" strokeWidth="1.5" />
            <circle cx={width - 140} cy={140} r="60" fill="none" stroke="rgba(167,139,250,0.18)" strokeWidth="1" />
            <circle cx={width - 140} cy={140} r="30" fill="rgba(167,139,250,0.08)" />

            {/* Left side content */}
            <g transform="translate(80, 0)">
                {/* Category badge */}
                <g
                    transform={`translate(${subtitleAnim.x}, ${subtitleAnim.y + height * 0.28})`}
                    opacity={subtitleAnim.opacity}
                >
                    <foreignObject x={0} y={0} width={500} height={60}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'rgba(167,139,250,0.12)',
                            border: '1px solid rgba(167,139,250,0.35)',
                            borderRadius: '999px',
                            padding: '6px 20px',
                            fontFamily: theme.fonts.mono,
                            fontSize: '14px',
                            color: '#A78BFA',
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase' as const
                        }}>
                            <span style={{ fontSize: '10px' }}>◆</span>
                            {subtitle || 'AI · ALGORITHMS · MASTERY'}
                        </div>
                    </foreignObject>
                </g>

                {/* Main Title */}
                <g
                    transform={`translate(${titleAnim.x}, ${titleAnim.y + height * 0.36})`}
                    opacity={titleAnim.opacity}
                >
                    <foreignObject x={0} y={0} width={width * 0.7} height={Math.max(240, titleFontSize * 4)}>
                        <h1 style={{
                            fontFamily: theme.fonts.heading,
                            color: theme.colors.text.primary,
                            fontSize: titleFontSize + 'px',
                            fontWeight: 800,
                            margin: 0,
                            lineHeight: 1.1,
                            letterSpacing: '-1.5px',
                        }}>
                            {title}
                        </h1>
                    </foreignObject>
                </g>

                {/* Violet underline accent */}
                <rect
                    x={titleAnim.x}
                    y={height * 0.7}
                    width={220 * titleAnim.scale}
                    height="4"
                    rx="2"
                    fill="#A78BFA"
                    opacity={titleAnim.opacity * 0.9}
                />
                <rect
                    x={titleAnim.x + 230}
                    y={height * 0.7 + 1}
                    width={60 * titleAnim.scale}
                    height="2"
                    rx="1"
                    fill="#34D399"
                    opacity={titleAnim.opacity * 0.7}
                />
            </g>

            {/* Footer */}
            <g opacity="0.5">
                <line x1="80" y1={height - 50} x2={width - 80} y2={height - 50} stroke="rgba(167,139,250,0.2)" strokeWidth="1" />
                <text
                    x="80"
                    y={height - 24}
                    fill={theme.colors.text.secondary}
                    fontFamily={theme.fonts.mono}
                    fontSize="13"
                    letterSpacing="0.1em"
                >
                    NARRATE AI  ·  AURORA DARK
                </text>
                <text
                    x={width - 80}
                    y={height - 24}
                    fill="#A78BFA"
                    fontFamily={theme.fonts.mono}
                    fontSize="13"
                    textAnchor="end"
                    opacity="0.7"
                >
                    01 / INTRO
                </text>
            </g>
        </g>
    );
};
