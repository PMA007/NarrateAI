import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

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
    theme,
    activeElementId,
    onElementClick,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, content } = slide;
    const bullets = content.bullets || [];
    const dotGridRotation = localTime * (360 / 22);

    // Calculate effective time for an element
    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) {
            return previewTime;
        }
        return localTime;
    };

    // Title Animation
    const titleId = 'title'; // Stable ID for slide title
    const titleConfig = elementAnimations?.[titleId];
    const titleTime = getTime(titleId);
    const titleAnim = useDynamicAnimation(titleTime, 0, titleConfig);

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
            <g
                transform={`translate(${width / 2}, 80)`}
                opacity={titleAnim.opacity}
                onClick={(e) => {
                    e.stopPropagation();
                    if (onElementClick) onElementClick('title', title);
                }}
                style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            >
                <g transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}>
                    <rect
                        x={-Math.min(title.length * 20, 350)}
                        y={-35}
                        width={Math.min(title.length * 40, 700)}
                        height={70}
                        rx="35"
                        fill="#f9fbff"
                        stroke={activeElementId === 'title' ? '#22d3ee' : theme.colors.primary}
                        strokeWidth={activeElementId === 'title' ? 3 : 2}
                        strokeDasharray={activeElementId === 'title' ? '8 4' : undefined}
                        style={{
                            filter: activeElementId === 'title'
                                ? 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.4))'
                                : 'drop-shadow(0 10px 25px rgba(0,0,0,.06))'
                        }}
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
                    const bulletId = `bullet-${i}`;
                    const bulletConfig = elementAnimations?.[bulletId];
                    const bulletTime = getTime(bulletId);
                    const bulletAnim = useDynamicAnimation(bulletTime, 1.5 + i * 0.4, bulletConfig);
                    const yOffset = 60 + i * 100;
                    const isSelected = activeElementId === bulletId;

                    return (
                        <g
                            key={i}
                            opacity={bulletAnim.opacity}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onElementClick) onElementClick(bulletId, bullet);
                            }}
                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        >
                            <g transform={`translate(${bulletAnim.x}, ${bulletAnim.y}) scale(${bulletAnim.scale})`}>
                                {/* Selection Highlight */}
                                {isSelected && (
                                    <rect
                                        x="37"
                                        y={yOffset - 33}
                                        width={width - 494}
                                        height={66}
                                        rx="4"
                                        fill="none"
                                        stroke="#22d3ee"
                                        strokeWidth="2"
                                        strokeDasharray="4 4"
                                    />
                                )}

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
                                            color: theme.colors.text.secondary,
                                            fontFamily: fontFamily || theme.fonts.body,
                                            fontSize: '28px',
                                            lineHeight: '1.4',
                                            fontWeight: 500
                                        }}
                                    >
                                        {bullet}
                                    </div>
                                </foreignObject>
                            </g>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};
