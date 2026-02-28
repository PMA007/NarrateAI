import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

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
    theme,
    onElementClick,
    activeElementId,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    console.log('[RetroCommonSlide] RENDERING. Slide Title:', slide.title);
    const { title, content } = slide;
    const bullets = content.bullets || [];
    const dotGridRotation = localTime * (360 / 22);
    const tabColor = '#f4da91';

    // Calculate effective time for an element
    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) {
            return previewTime;
        }
        return localTime;
    };

    // Title Animation
    const titleId = 'title';
    const titleConfig = elementAnimations?.[titleId];
    const titleTime = getTime(titleId);
    const titleAnim = useDynamicAnimation(titleTime, 0, titleConfig);

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

                    {/* Sparkle decoration (only if not selected to avoid clutter?) - Keeping it */}
                    <g transform={`translate(${Math.min(title.length * 20, 350) - 20}, -30) rotate(${localTime * 90})`}>
                        <use href="#retroSparkle" x={-25} y={-25} width={48} height={48} />
                    </g>
                </g>
            </g>

            {/* Cards Grid (2 columns) */}
            <g transform={`translate(${(width - 900) / 2}, 200)`}>
                {bullets.slice(0, 4).map((bullet, i) => {
                    const bulletId = `bullet-${i}`;
                    const bulletConfig = elementAnimations?.[bulletId];
                    const bulletTime = getTime(bulletId);
                    const cardAnim = useDynamicAnimation(bulletTime, 1.5 + i * 0.3, bulletConfig);

                    const cardWidth = 420;
                    const cardHeight = 320;
                    const row = Math.floor(i / 2);
                    const col = i % 2;
                    const xPos = col * (cardWidth + 60);
                    const yPos = row * (cardHeight + 50);
                    const isSelected = activeElementId === bulletId;

                    return (
                        <g
                            key={i}
                            transform={`translate(${xPos}, ${yPos})`}
                            opacity={cardAnim.opacity}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onElementClick) onElementClick(bulletId, bullet);
                            }}
                            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
                        >
                            <g transform={`translate(${cardAnim.x}, ${cardAnim.y}) scale(${cardAnim.scale})`}>
                                {/* Selection Border */}
                                {isSelected && (
                                    <rect
                                        x="-5"
                                        y="-5"
                                        width={cardWidth + 10}
                                        height={cardHeight + 10}
                                        rx="22"
                                        fill="none"
                                        stroke="#22d3ee"
                                        strokeWidth="3"
                                        strokeDasharray="6 6"
                                    />
                                )}

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
                                            color: theme.colors.text.secondary,
                                            fontFamily: fontFamily || theme.fonts.body,
                                            fontSize: '22px',
                                            lineHeight: '1.5',
                                            letterSpacing: '0.2px',
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
