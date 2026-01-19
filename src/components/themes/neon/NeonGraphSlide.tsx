import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Neon Theme - Graph Slide (Bar and Line Charts)
 * Features animated glowing charts with axis and labels
 */
export const NeonGraphSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme
}) => {
    const { title, content, layout } = slide;
    const chartData = content.chart_data;
    const titleAnim = useAnimation(localTime, 0, 1.5);

    if (!chartData) {
        return (
            <text x={width / 2} y={height / 2} textAnchor="middle" fill={theme.colors.text.primary}>
                No chart data available
            </text>
        );
    }

    const { labels, values, label } = chartData;
    const maxVal = Math.max(...values) || 1;

    const chartLeft = 200;
    const chartRight = width - 200;
    const chartTop = 200;
    const chartBottom = height - 150;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

    // Bar chart
    if (layout === 'chart_bar' || !layout) {
        const barWidth = (chartWidth / values.length) * 0.7;
        const barGap = (chartWidth / values.length) * 0.3;

        return (
            <g>
                {/* Title */}
                <text
                    x={width / 2}
                    y={100}
                    textAnchor="middle"
                    fontSize="64"
                    fill={theme.colors.text.primary}
                    fontFamily={theme.fonts.heading}
                    fontWeight="bold"
                    opacity={titleAnim.eased}
                >
                    {title}
                </text>

                {/* Y-axis */}
                <line
                    x1={chartLeft}
                    y1={chartTop}
                    x2={chartLeft}
                    y2={chartBottom}
                    stroke={theme.colors.text.secondary}
                    strokeWidth="2"
                />

                {/* X-axis */}
                <line
                    x1={chartLeft}
                    y1={chartBottom}
                    x2={chartRight}
                    y2={chartBottom}
                    stroke={theme.colors.text.secondary}
                    strokeWidth="2"
                />

                {/* Bars */}
                {values.map((val, i) => {
                    const barAnim = useAnimation(localTime, 2 + i * 0.3, 1.0);
                    const barHeight = (val / maxVal) * chartHeight;
                    const x = chartLeft + i * (barWidth + barGap) + barGap / 2;
                    const y = chartBottom - barHeight * barAnim.eased;

                    return (
                        <g key={i}>
                            {/* Bar with glow */}
                            <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight * barAnim.eased}
                                fill={theme.colors.primary}
                                rx="4"
                                style={{
                                    filter: `drop-shadow(0 0 10px ${theme.colors.primary}60)`
                                }}
                            />

                            {/* Value label */}
                            <text
                                x={x + barWidth / 2}
                                y={y - 15}
                                textAnchor="middle"
                                fontSize="24"
                                fill={theme.colors.text.primary}
                                fontFamily={theme.fonts.body}
                                opacity={barAnim.eased}
                            >
                                {val}
                            </text>

                            {/* X-axis label */}
                            <text
                                x={x + barWidth / 2}
                                y={chartBottom + 40}
                                textAnchor="middle"
                                fontSize="20"
                                fill={theme.colors.text.secondary}
                                fontFamily={theme.fonts.body}
                            >
                                {labels[i] || `${i + 1}`}
                            </text>
                        </g>
                    );
                })}

                {/* Chart label */}
                {label && (
                    <text
                        x={width / 2}
                        y={chartBottom + 90}
                        textAnchor="middle"
                        fontSize="28"
                        fill={theme.colors.text.secondary}
                        fontFamily={theme.fonts.body}
                    >
                        {label}
                    </text>
                )}
            </g>
        );
    }

    // Line chart
    if (layout === 'chart_line') {
        const pointSpacing = chartWidth / (values.length - 1);
        const points = values.map((val, i) => ({
            x: chartLeft + i * pointSpacing,
            y: chartBottom - (val / maxVal) * chartHeight
        }));

        const pathD = points
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
            .join(' ');

        return (
            <g>
                {/* Title */}
                <text
                    x={width / 2}
                    y={100}
                    textAnchor="middle"
                    fontSize="64"
                    fill={theme.colors.text.primary}
                    fontFamily={theme.fonts.heading}
                    fontWeight="bold"
                    opacity={titleAnim.eased}
                >
                    {title}
                </text>

                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map((pct, i) => (
                    <line
                        key={i}
                        x1={chartLeft}
                        y1={chartBottom - pct * chartHeight}
                        x2={chartRight}
                        y2={chartBottom - pct * chartHeight}
                        stroke={theme.colors.text.secondary}
                        strokeWidth="1"
                        opacity="0.3"
                        strokeDasharray="4 4"
                    />
                ))}

                {/* Axes */}
                <line
                    x1={chartLeft}
                    y1={chartTop}
                    x2={chartLeft}
                    y2={chartBottom}
                    stroke={theme.colors.text.secondary}
                    strokeWidth="2"
                />
                <line
                    x1={chartLeft}
                    y1={chartBottom}
                    x2={chartRight}
                    y2={chartBottom}
                    stroke={theme.colors.text.secondary}
                    strokeWidth="2"
                />

                {/* Line path with glow */}
                <path
                    d={pathD}
                    fill="none"
                    stroke={theme.colors.primary}
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        filter: `drop-shadow(0 0 8px ${theme.colors.primary})`
                    }}
                    opacity={useAnimation(localTime, 2, 1.5).eased}
                />

                {/* Data points */}
                {points.map((p, i) => {
                    const pointAnim = useAnimation(localTime, 2.5 + i * 0.2, 0.5);
                    return (
                        <g key={i} opacity={pointAnim.eased}>
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r="8"
                                fill={theme.colors.primary}
                                stroke="white"
                                strokeWidth="2"
                            />
                            <text
                                x={p.x}
                                y={p.y - 20}
                                textAnchor="middle"
                                fontSize="20"
                                fill={theme.colors.text.primary}
                            >
                                {values[i]}
                            </text>
                            <text
                                x={p.x}
                                y={chartBottom + 30}
                                textAnchor="middle"
                                fontSize="18"
                                fill={theme.colors.text.secondary}
                            >
                                {labels[i]}
                            </text>
                        </g>
                    );
                })}
            </g>
        );
    }

    return null;
};
