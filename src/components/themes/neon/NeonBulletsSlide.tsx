import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Neon Theme - Bullet Points Slide
 * Features animated glowing bullet points with staggered entrance
 */
export const NeonBulletsSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme,
    onElementClick,
    activeElementId,
    elementAnimations = {}
}) => {
    const { title, content, slide_id } = slide;
    const bullets = content.bullets || [];

    // IDs
    const titleId = `slide-${slide_id}-title`;

    // Animation Configs
    const titleAnimConfig = elementAnimations[titleId] || { type: 'fade', duration: 1.5, delay: 0 };
    const titleAnim = useDynamicAnimation(localTime, 0, titleAnimConfig);

    const isTitleActive = activeElementId === titleId;

    return (
        <g>
            {/* Title */}
            <g
                onClick={(e) => { e.stopPropagation(); onElementClick?.(titleId, title); }}
                style={{ cursor: 'pointer' }}
                opacity={titleAnim.opacity}
                transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
            >
                {/* Selection Box */}
                {isTitleActive && (
                    <rect
                        x={width / 2 - 400}
                        y={50}
                        width={800}
                        height={100}
                        fill="none"
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        rx="8"
                    />
                )}

                <text
                    x={width / 2}
                    y={120}
                    textAnchor="middle"
                    fontSize="72"
                    fill={theme.colors.text.primary}
                    fontFamily={theme.fonts.heading}
                    fontWeight="bold"
                    style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
                >
                    {title}
                </text>
            </g>

            {/* Bullets */}
            <g transform="translate(200, 220)">
                {bullets.map((bullet, i) => {
                    const bulletId = `slide-${slide_id}-bullet-${i}`;
                    const bulletConfig = elementAnimations[bulletId] || { type: 'fade', duration: 1.0, delay: 1.5 + i * 0.5 };

                    const bulletAnim = useDynamicAnimation(localTime, 0, bulletConfig); // Base start is 0, delay handles offset
                    const yOffset = i * 120;
                    const isActive = activeElementId === bulletId;

                    return (
                        <g
                            key={i}
                            onClick={(e) => { e.stopPropagation(); onElementClick?.(bulletId, bullet); }}
                            style={{ cursor: 'pointer' }}
                            opacity={bulletAnim.opacity}
                            transform={`translate(${bulletAnim.x}, ${yOffset + bulletAnim.y}) scale(${bulletAnim.scale})`}
                        >
                            {/* Selection Box */}
                            {isActive && (
                                <rect
                                    x="-20"
                                    y="-10"
                                    width={width - 360}
                                    height={110}
                                    fill="none"
                                    stroke="#22d3ee"
                                    strokeWidth="2"
                                    strokeDasharray="5,5"
                                    rx="8"
                                />
                            )}

                            {/* Glowing bullet point */}
                            <circle
                                cx="20"
                                cy="30"
                                r="12"
                                fill={theme.colors.primary}
                                style={{
                                    filter: `drop-shadow(0 0 8px ${theme.colors.primary})`
                                }}
                            />

                            {/* Bullet text */}
                            <foreignObject x="50" y="0" width={width - 300} height="100">
                                <div
                                    {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                    style={{
                                        color: theme.colors.text.primary,
                                        fontFamily: theme.fonts.body,
                                        fontSize: '36px',
                                        lineHeight: '1.4',
                                        filter: bulletAnim.blur ? `blur(${bulletAnim.blur}px)` : 'none'
                                    }}
                                >
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
