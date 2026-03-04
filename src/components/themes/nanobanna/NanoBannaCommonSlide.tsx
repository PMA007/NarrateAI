import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaCommonSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    theme,
    onElementClick,
    activeElementId,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, content } = slide;
    const bullets = content.bullets || [];

    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h2 || 44, title || '', 16, 18);
    const maxBulletLen = Math.max(...bullets.map((b: string) => b.length), 0);

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'slide_up', duration: 0.7, delay: 0 });

    // Layout: left panel (title) + right panel (bullets)
    const leftW = Math.round(width * 0.36);
    const rightX = leftW + 48;
    const rightW = width - rightX - 48;
    const bulletSpacing = Math.min(110, (height - 200) / Math.max(bullets.length, 1));
    // Font size that fits within each bullet row (2 lines max) and scales with text length
    const bulletFontBySpace = Math.floor((bulletSpacing - 8) / (2 * 1.4));
    const bulletFontByLen = dynSize(theme.textSizes?.body || 22, 'x'.repeat(maxBulletLen), 52, 12);
    const bulletFontSize = Math.min(bulletFontBySpace, bulletFontByLen, theme.textSizes?.body || 22);

    return (
        <g>
            <defs>
                <linearGradient id={`sidebar-grad-${slide.slide_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.4" />
                </linearGradient>
            </defs>

            {/* Left panel tint */}
            <rect x="0" y="0" width={leftW} height={height} fill="rgba(167,139,250,0.04)" />

            {/* Vertical accent bar */}
            <rect x={leftW + 20} y="60" width="3" height={height - 120} rx="1.5"
                fill={`url(#sidebar-grad-${slide.slide_id})`} opacity="0.6" />

            {/* Top accent */}
            <rect x="0" y="0" width={leftW} height="4" fill="#A78BFA" opacity="0.7" />

            {/* Left: Title block */}
            <g transform={`translate(${titleAnim.x + 44}, ${titleAnim.y + 60}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}>
                {/* Slide label */}
                <foreignObject x={0} y={0} width={leftW - 88} height={40}>
                    <div style={{
                        fontFamily: theme.fonts.mono,
                        fontSize: '12px',
                        color: '#A78BFA',
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase' as const,
                        opacity: 0.8,
                    }}>◆ OVERVIEW</div>
                </foreignObject>
                <foreignObject x={0} y={50} width={leftW - 88} height={height - 180}>
                    <h2 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.text.primary,
                        fontSize: titleFontSize + 'px',
                        fontWeight: 800,
                        margin: 0,
                        lineHeight: 1.1,
                        letterSpacing: '-0.5px',
                    }}>
                        {title}
                    </h2>
                </foreignObject>
                {/* Emerald dot accent */}
                <circle cx={0} cy={height - 120} r="5" fill="#34D399" opacity="0.7" />
                <circle cx={16} cy={height - 120} r="3" fill="#A78BFA" opacity="0.5" />
            </g>

            {/* Right: Bullets */}
            <g transform={`translate(${rightX}, 0)`}>
                {bullets.map((bullet, i) => {
                    const bulletId = `bullet-${i}`;
                    const anim = useDynamicAnimation(getTime(bulletId), 0.25 + i * 0.14,
                        elementAnimations?.[bulletId] ?? { type: 'slide_up', duration: 0.5, delay: 0 });
                    const yPos = anim.y + 60 + i * bulletSpacing;

                    return (
                        <g key={i} transform={`translate(${anim.x}, ${yPos})`} opacity={anim.opacity}>
                            {/* Number badge */}
                            <circle cx="18" cy="28" r="18" fill="rgba(167,139,250,0.15)" />
                            <circle cx="18" cy="28" r="18" fill="none" stroke="rgba(167,139,250,0.4)" strokeWidth="1.5" />
                            <text x="18" y="34" textAnchor="middle" fill="#A78BFA"
                                fontFamily={theme.fonts.mono} fontSize="13" fontWeight="700">
                                {String(i + 1).padStart(2, '0')}
                            </text>
                            {/* Bullet card */}
                            <foreignObject x={48} y={0} width={rightW - 48} height={bulletSpacing - 8}>
                                <div style={{
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontFamily: theme.fonts.body,
                                    fontSize: bulletFontSize + 'px',
                                    color: theme.colors.text.primary,
                                    background: 'rgba(167,139,250,0.06)',
                                    borderRadius: '10px',
                                    borderLeft: '3px solid rgba(167,139,250,0.5)',
                                    paddingLeft: '20px',
                                    paddingRight: '16px',
                                    lineHeight: 1.4,
                                }}>
                                    {bullet}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};
