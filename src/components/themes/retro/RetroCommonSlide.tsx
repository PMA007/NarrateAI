import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Retro Theme - Common Slide (Cards Layout from nslide4.html)
 * Features vintage cards with yellow tabs and dashed borders
 */
export const RetroCommonSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme
}) => {
    const { title, content, layout } = slide;
    const bullets = content.bullets || [];
    const titleAnim = useAnimation(localTime, 0, 1.5);
    const dotGridRotation = localTime * (360 / 22);
    const tabColor = '#f4da91';

    // Sparkle definition
    const renderSparkle = () => (
        <defs>
            <path
                id="retroSparkle"
                d="M50 6 C56 26 62 32 94 50 C62 58 56 64 50 94 C44 64 38 58 6 50 C38 32 44 26 50 6 Z"
                fill={theme.colors.primary}
            />
        </defs>
    );

    return (
        <g>
            {renderSparkle()}

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

            {/* Title Pill with Sparkle */}
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

                {/* Sparkle decoration */}
                <g transform={`translate(${Math.min(title.length * 20, 350) - 20}, -30) rotate(${localTime * 90})`}>
                    <use href="#retroSparkle" x={-25} y={-25} width={48} height={48} />
                </g>
            </g>

            {/* Cards Grid (2 columns) */}
            <g transform={`translate(${(width - 900) / 2}, 200)`}>
                {bullets.slice(0, 4).map((bullet, i) => {
                    const cardAnim = useAnimation(localTime, 1.5 + i * 0.3, 1.0);
                    const cardWidth = 420;
                    const cardHeight = 320;
                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    const xPos = col * (cardWidth + 60);
                    const yPos = row * (cardHeight + 50);

                    return (
                        <g key={i} transform={`translate(${xPos}, ${yPos})`} opacity={cardAnim.eased}>
                            {/* Shadow offset */}
                            <rect
                                x={10}
                                y={12}
                                width={cardWidth}
                                height={cardHeight}
                                rx="18"
                                fill="rgba(0,0,0,0.15)"
                            />

                            {/* Card Body */}
                            <rect
                                width={cardWidth}
                                height={cardHeight}
                                rx="18"
                                fill={theme.colors.card.background}
                                stroke={theme.colors.card.border}
                                strokeWidth="2"
                                strokeDasharray="8 4"
                            />

                            {/* Yellow Tab */}
                            <g transform="translate(32, -22)">
                                <rect
                                    width={160}
                                    height={44}
                                    rx="12"
                                    fill={tabColor}
                                    style={{ filter: 'drop-shadow(0 8px 18px rgba(0,0,0,.10))' }}
                                />
                                <text
                                    x={80}
                                    y={30}
                                    textAnchor="middle"
                                    fontSize="22"
                                    fontWeight="700"
                                    fill="#111"
                                    fontFamily={theme.fonts.body}
                                >
                                    Point {i + 1}
                                </text>
                            </g>

                            {/* Card Content */}
                            <foreignObject x="30" y="50" width={cardWidth - 60} height={cardHeight - 80}>
                                <div
                                    {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                    style={{
                                        color: '#2b1b12',
                                        fontFamily: fontFamily || theme.fonts.body,
                                        fontSize: '22px',
                                        lineHeight: '1.5',
                                        letterSpacing: '0.2px',
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
