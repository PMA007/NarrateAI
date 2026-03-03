import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaGraphSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
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

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleId = 'title';
    const titleConfig = elementAnimations?.[titleId] ?? { type: 'slide_up', duration: 0.7, delay: 0 };
    const titleAnim = useDynamicAnimation(getTime(titleId), 0, titleConfig);

    if (!chartData) return null;

    const { labels, values } = chartData;
    const maxVal = Math.max(...values) || 1;
    const chartLeft = 150;
    const chartRight = width - 100;
    const chartTop = 260; // Pushed down from 200
    const chartBottom = height - 150;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    return (
        <g>
            {/* Background removed, handled by Template */}

            {/* Sidebar Accent */}
            <rect x="0" y="40" width="16" height="120" fill={theme.colors.primary} />

            {/* Title */}
            <g
                transform={`translate(${titleAnim.x + 60}, ${titleAnim.y + 60}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}
            >
                <foreignObject x={0} y={0} width={width - 120} height={160}> {/* Increased height */}
                    <h2 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.text.primary,
                        fontSize: (theme.textSizes?.h2 || 48) + 'px',
                        fontWeight: 700,
                        margin: 0,
                        borderBottom: `2px solid ${theme.colors.surface}`,
                        paddingBottom: '20px'
                    }}>
                        {title}
                    </h2>
                </foreignObject>
            </g>

            {/* Chart Area */}
            <g>
                {/* Axes */}
                <line x1={chartLeft} y1={chartTop} x2={chartLeft} y2={chartBottom} stroke={theme.colors.text.secondary} strokeWidth="2" />
                <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom} stroke={theme.colors.text.secondary} strokeWidth="2" />

                {/* Bars */}
                {values.map((val, i) => {
                    const barId = `bar-${i}`;
                    const barConfig = elementAnimations?.[barId];
                    const barTime = getTime(barId);
                    const anim = useDynamicAnimation(barTime, 0.5 + i * 0.15, barConfig || { type: 'slide_up', duration: 0.8, delay: 0 });

                    const barWidth = (chartWidth / values.length) * 0.6;
                    const barGap = (chartWidth / values.length) * 0.4;
                    const barHeight = (val / maxVal) * chartHeight;
                    const x = chartLeft + i * (barWidth + barGap) + barGap / 2;
                    const currentHeight = barHeight * anim.opacity; // Simple fade/grow interaction
                    const y = chartBottom - currentHeight;

                    return (
                        <g key={i}>
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={currentHeight}
                                fill={theme.colors.primary}
                                rx="4"
                            />
                            {/* Value */}
                            <text
                                x={x + barWidth / 2}
                                y={y - 10}
                                textAnchor="middle"
                                fill={theme.colors.text.primary}
                                fontFamily={theme.fonts.body}
                                fontSize={theme.textSizes?.body || 20}
                                fontWeight="bold"
                                opacity={anim.opacity}
                            >
                                {val}
                            </text>
                            {/* Label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartBottom + 30}
                                textAnchor="middle"
                                fill={theme.colors.text.secondary}
                                fontFamily={theme.fonts.body}
                                fontSize={theme.textSizes?.body || 16}
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
