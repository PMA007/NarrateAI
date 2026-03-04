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

    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h2 || 44, title || '', 28, 18);

    if (!chartData) return null;

    const { labels, values } = chartData;
    const maxVal = Math.max(...values) || 1;
    const chartLeft = 150;
    const chartRight = width - 100;
    const chartTop = 260; // Pushed down from 200
    const chartBottom = height - 150;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    const gridLines = 4;

    return (
        <g>
            <defs>
                <linearGradient id={`bar-grad-${slide.slide_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#34D399" stopOpacity="0.7" />
                </linearGradient>
                <linearGradient id={`bar-grad-accent-${slide.slide_id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#7C3AED" />
                    <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
                </linearGradient>
            </defs>

            {/* Title */}
            <g transform={`translate(${titleAnim.x + 60}, ${titleAnim.y + 44}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}>
                <text x={0} y={0} fill="#A78BFA" fontFamily={theme.fonts.mono} fontSize="13"
                    letterSpacing="0.1em" opacity="0.8">◆ ANALYTICS</text>
                <foreignObject x={0} y={14} width={width - 120} height={Math.max(80, titleFontSize * 2.8)}>
                    <h2 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.text.primary,
                        fontSize: titleFontSize + 'px',
                        fontWeight: 800,
                        margin: 0,
                        lineHeight: 1.15,
                        letterSpacing: '-0.5px',
                    }}>{title}</h2>
                </foreignObject>
            </g>

            {/* Chart Area */}
            <g>
                {/* Horizontal grid lines */}
                {Array.from({ length: gridLines + 1 }, (_, i) => {
                    const y = chartTop + (i * chartHeight) / gridLines;
                    const val = Math.round(maxVal * (1 - i / gridLines));
                    return (
                        <g key={`grid-${i}`}>
                            <line x1={chartLeft} y1={y} x2={chartRight} y2={y}
                                stroke="rgba(167,139,250,0.12)" strokeWidth="1" strokeDasharray="4 4" />
                            <text x={chartLeft - 10} y={y + 5} textAnchor="end"
                                fill={theme.colors.text.secondary}
                                fontFamily={theme.fonts.mono} fontSize="13">
                                {val}
                            </text>
                        </g>
                    );
                })}

                {/* Axis lines */}
                <line x1={chartLeft} y1={chartTop - 10} x2={chartLeft} y2={chartBottom}
                    stroke="rgba(167,139,250,0.3)" strokeWidth="1.5" />
                <line x1={chartLeft} y1={chartBottom} x2={chartRight} y2={chartBottom}
                    stroke="rgba(167,139,250,0.3)" strokeWidth="1.5" />

                {/* Bars */}
                {values.map((val, i) => {
                    const barId = `bar-${i}`;
                    const barConfig = elementAnimations?.[barId];
                    const anim = useDynamicAnimation(getTime(barId), 0.4 + i * 0.12,
                        barConfig || { type: 'slide_up', duration: 0.7, delay: 0 });

                    const slotW = chartWidth / values.length;
                    const barWidth = slotW * 0.55;
                    const x = chartLeft + i * slotW + (slotW - barWidth) / 2;
                    const barHeight = (val / maxVal) * chartHeight * anim.opacity;
                    const y = chartBottom - barHeight;

                    return (
                        <g key={i}>
                            {/* Bar glow */}
                            <rect x={x - 2} y={y - 2} width={barWidth + 4} height={barHeight + 4}
                                rx="7" fill="#A78BFA" opacity={0.12 * anim.opacity} />
                            {/* Main bar */}
                            <rect x={x} y={y} width={barWidth} height={barHeight}
                                rx="6"
                                fill={i % 2 === 0
                                    ? `url(#bar-grad-${slide.slide_id})`
                                    : `url(#bar-grad-accent-${slide.slide_id})`}
                                opacity={anim.opacity}
                            />
                            {/* Top cap highlight */}
                            <rect x={x + 4} y={y + 2} width={barWidth - 8} height={4}
                                rx="2" fill="rgba(255,255,255,0.25)" opacity={anim.opacity} />
                            {/* Value label */}
                            <text x={x + barWidth / 2} y={y - 12}
                                textAnchor="middle"
                                fill={theme.colors.text.primary}
                                fontFamily={theme.fonts.mono}
                                fontSize="14"
                                fontWeight="700"
                                opacity={anim.opacity}>
                                {val}
                            </text>
                            {/* Label */}
                            <text x={x + barWidth / 2} y={chartBottom + 26}
                                textAnchor="middle"
                                fill={theme.colors.text.secondary}
                                fontFamily={theme.fonts.body}
                                fontSize="15">
                                {labels[i]}
                            </text>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};
