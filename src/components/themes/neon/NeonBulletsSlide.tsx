import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

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
    theme
}) => {
    const { title, content } = slide;
    const bullets = content.bullets || [];
    const titleAnim = useAnimation(localTime, 0, 1.5);

    return (
        <g>
            {/* Title */}
            <text
                x={width / 2}
                y={120}
                textAnchor="middle"
                fontSize="72"
                fill={theme.colors.text.primary}
                fontFamily={theme.fonts.heading}
                fontWeight="bold"
                opacity={titleAnim.eased}
            >
                {title}
            </text>

            {/* Bullets */}
            <g transform="translate(200, 220)">
                {bullets.map((bullet, i) => {
                    const bulletAnim = useAnimation(localTime, 1.5 + i * 0.5, 1.0);
                    const yOffset = i * 120;

                    return (
                        <g key={i} opacity={bulletAnim.eased} transform={`translate(0, ${yOffset})`}>
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
                                        lineHeight: '1.4'
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
