import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Brutalist Theme - Graph Slide
 * Solid colors, no gradients, sharp axis lines
 */
export const BrutalistGraphSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme,
    onElementClick,
    activeElementId,
    elementAnimations,
    elementStyles,
    previewElementId,
    previewTime
}) => {
    const { title, content, layout } = slide;
    const chartData = content.chart_data;

    // Calculate effective time for an element
    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) {
            return previewTime;
        }
        return localTime;
    };

    const titleId = 'title';
    const titleConfig = elementAnimations?.[titleId];
    const titleTime = getTime(titleId);
    const titleAnim = useDynamicAnimation(titleTime, 0, titleConfig);

    if (!chartData) {
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} fill={theme.colors.primary} />
                <text x={width / 2} y={height / 2} textAnchor="middle" fill="#0F0F0F" fontSize="40" fontFamily={theme.fonts.heading}>
                    NO DATA
                </text>
            </g>
        );
    }

    const { labels, values, label } = chartData;
    const maxVal = Math.max(...values) || 1;

    const chartLeft = 150;
    const chartRight = width - 150;
    const chartTop = 250;
    const chartBottom = height - 150;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    return (
        <g>
            {/* Background - Acid Green */}
            <rect x="0" y="0" width={width} height={height} fill={theme.colors.primary} />

            {/* Header */}
            <g transform="translate(60, 30)">
                <text
                    x="0"
                    y="20"
                    fill="#0F0F0F"
                    fontFamily={theme.fonts.body}
                    fontWeight="600"
                    fontSize="16"
                    letterSpacing="0.5px"
                >
                    NARRATE AI
                </text>
                <text
                    x={width - 120}
                    y="20"
                    fill="#0F0F0F"
                    fontFamily={theme.fonts.body}
                    fontSize="16"
                    textAnchor="end"
                >
                    {new Date().toISOString().split('T')[0]}
                </text>
            </g>

            {/* Title */}
            <g
                transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}
                style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
            >
                <foreignObject x={60} y={60} width={width - 120} height={120}>
                    <h1
                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onElementClick) onElementClick(titleId, title);
                        }}
                        style={{
                            fontFamily: elementStyles?.[titleId]?.fontFamily || theme.fonts.heading,
                            color: elementStyles?.[titleId]?.color || '#0F0F0F',
                            fontSize: elementStyles?.[titleId]?.fontSize ? `${elementStyles[titleId].fontSize}px` : '60px',
                            fontWeight: 700,
                            margin: 0,
                            textAlign: 'center',
                            textTransform: 'uppercase',
                            border: activeElementId === titleId ? '2px dashed #0F0F0F' : 'none',
                            cursor: 'pointer'
                        }}
                    >
                        {title}
                    </h1>
                </foreignObject>
            </g>

            {/* Chart Container */}
            <g>
                {/* Axes - Thick Black Lines */}
                <line
                    x1={chartLeft} y1={chartTop}
                    x2={chartLeft} y2={chartBottom}
                    stroke="#0F0F0F" strokeWidth="4"
                />
                <line
                    x1={chartLeft} y1={chartBottom}
                    x2={chartRight} y2={chartBottom}
                    stroke="#0F0F0F" strokeWidth="4"
                />

                {/* Bars */}
                {(layout === 'chart_bar' || !layout) && values.map((val, i) => {
                    const barId = `bar-${i}`;
                    const barConfig = elementAnimations?.[barId];
                    const barTime = getTime(barId);
                    // Custom scale_up animation simulation if not configured
                    const autoAnim = useDynamicAnimation(barTime, 0.5 + i * 0.2, { type: 'slide_up', duration: 0.8, delay: 0 });

                    const effectiveAnim = barConfig ? useDynamicAnimation(barTime, barConfig.delay, barConfig) : autoAnim;

                    const barWidth = (chartWidth / values.length) * 0.6;
                    const barGap = (chartWidth / values.length) * 0.4;
                    const barHeight = (val / maxVal) * chartHeight;
                    const x = chartLeft + i * (barWidth + barGap) + barGap / 2;

                    // Animate height by simple scaling from bottom or just y/height calc
                    // using slide_up logic: y goes from 100 to 0. 
                    const progress = effectiveAnim.opacity; // approximate progress

                    const currentHeight = barHeight * progress;
                    const y = chartBottom - currentHeight;

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={currentHeight}
                                fill="#0F0F0F"
                                stroke="none"
                            />
                            {/* Value Label */}
                            <text
                                x={x + barWidth / 2}
                                y={y - 15}
                                textAnchor="middle"
                                fontSize="24"
                                fill="#0F0F0F"
                                fontFamily={theme.fonts.body}
                                fontWeight="bold"
                                opacity={progress}
                            >
                                {val}
                            </text>
                            {/* X Label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartBottom + 40}
                                textAnchor="middle"
                                fontSize="20"
                                fill="#0F0F0F"
                                fontFamily={theme.fonts.body}
                                fontWeight="600"
                            >
                                {labels[i]}
                            </text>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};
