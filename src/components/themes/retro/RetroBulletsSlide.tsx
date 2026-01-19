import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Retro Theme - Bullet Points Slide
 * Features vintage card style with diamond markers
 */
export const RetroBulletsSlide: React.FC<SlideComponentProps> = ({
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
    const dotGridRotation = localTime * (360 / 22);

    console.log('📝 RetroBulletsSlide fontFamily:', fontFamily);

    return (
        <g>
            {/* Rotating Dot Grid (Top Right) */}
            <g transform={`translate(${width - 100}, -20) rotate(${dotGridRotation})`} opacity="0.95">
                {[0, 1, 2, 3, 4].map(row =>
                    [0, 1, 2, 3, 4].map(col => (
                        <circle
                            key={`${row}-${col}`}
                            cx={col * 28}
                            cy={row * 28}
                            r="12"
                            fill={theme.colors.primary}
                        />
                    ))
                )}
            </g>

            {/* Title Pill */}
            <g transform={`translate(${width / 2}, 80)`} opacity={titleAnim.eased}>
                <rect
                    x={-Math.min(title.length * 20, 350)}
                    y={-35}
                    width={Math.min(title.length * 40, 700)}
                    height={70}
                    rx="35"
                    fill="#f9fbff"
                    stroke={theme.colors.primary}
                    strokeWidth="2"
                    style={{ filter: 'drop-shadow(0 10px 25px rgba(0,0,0,.06))' }}
                />
                <text
                    textAnchor="middle"
                    y="12"
                    fontSize="42"
                    fontWeight="800"
                    fill="#111"
                    fontFamily={fontFamily || theme.fonts.heading}
                >
                    {title}
                </text>
            </g>

            {/* Bullet list card */}
            <g transform="translate(200, 200)">
                {/* Card shadow */}
                <rect
                    x="10"
                    y="10"
                    width={width - 400}
                    height={height - 350}
                    rx="18"
                    fill="rgba(0,0,0,0.12)"
                />
                {/* Card */}
                <rect
                    width={width - 400}
                    height={height - 350}
                    rx="18"
                    fill={theme.colors.card.background}
                    stroke={theme.colors.card.border}
                    strokeWidth="2"
                    strokeDasharray="8 4"
                />

                {/* Bullets */}
                {bullets.map((bullet, i) => {
                    const bulletAnim = useAnimation(localTime, 1.5 + i * 0.4, 1.0);
                    const yOffset = 60 + i * 100;

                    return (
                        <g key={i} opacity={bulletAnim.eased}>
                            {/* Diamond marker */}
                            <rect
                                x="40"
                                y={yOffset - 8}
                                width="16"
                                height="16"
                                fill={theme.colors.primary}
                                transform={`rotate(45, 48, ${yOffset})`}
                                rx="2"
                            />

                            {/* Bullet text */}
                            <foreignObject x="80" y={yOffset - 20} width={width - 520} height="80">
                                <div
                                    {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                    style={{
                                        color: '#2b1b12',
                                        fontFamily: fontFamily || theme.fonts.body,
                                        fontSize: '28px',
                                        lineHeight: '1.4',
                                        fontWeight: 500
                                    }}
                                >
                                    <style>{`
                                        * {
                                            color: #2b1b12 !important;
                                            font-family: ${fontFamily || theme.fonts.body} !important;
                                        }
                                    `}</style>
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
