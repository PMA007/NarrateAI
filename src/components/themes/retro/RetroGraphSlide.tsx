import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Retro Theme - Graph Slide (Bar and Line Charts)
 * Features vintage styling with soft shadows
 */
export const RetroGraphSlide: React.FC<SlideComponentProps> = ({
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
    const dotGridRotation = localTime * (360 / 22);

    if (!chartData || !chartData.values || !Array.isArray(chartData.values) || chartData.values.length === 0) {
        return (
            <text x={width / 2} y={height / 2} textAnchor="middle" fill={theme.colors.text.primary}>
                No chart data available
            </text>
        );
    }

    const { labels = [], values, label } = chartData;
    const maxVal = Math.max(...values) || 1;

    const chartLeft = 250;
    const chartRight = width - 200;
    const chartTop = 220;
    const chartBottom = height - 150;
    const chartWidth = chartRight - chartLeft;
    const chartHeight = chartBottom - chartTop;

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

            {/* Chart background card */}
            <rect
                x={chartLeft - 40}
                y={chartTop - 40}
                width={chartWidth + 80}
                height={chartHeight + 100}
                rx="18"
                fill={theme.colors.card.background}
                stroke={theme.colors.card.border}
                strokeWidth="2"
                strokeDasharray="8 4"
                style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,.08))' }}
            />

            {/* Y-axis */}
            <line
                x1={chartLeft}
                y1={chartTop}
                x2={chartLeft}
                y2={chartBottom}
                stroke={theme.colors.primary}
                strokeWidth="2"
            />

            {/* X-axis */}
            <line
                x1={chartLeft}
                y1={chartBottom}
                x2={chartRight}
                y2={chartBottom}
                stroke={theme.colors.primary}
                strokeWidth="2"
            />

            {/* Bars */}
            {values.length > 0 && values.map((val, i) => {
                const barAnim = useAnimation(localTime, 2 + i * 0.3, 1.0);
                const barWidth = (chartWidth / (values.length || 1)) * 0.6;
                const barGap = (chartWidth / (values.length || 1)) * 0.4;
                const barHeight = (val / maxVal) * chartHeight;
                const x = chartLeft + i * (barWidth + barGap) + barGap / 2;
                const y = chartBottom - barHeight * barAnim.eased;

                return (
                    <g key={i}>
                        {/* Bar shadow */}
                        <rect
                            x={x + 4}
                            y={y + 4}
                            width={barWidth}
                            height={barHeight * barAnim.eased}
                            fill="rgba(0,0,0,0.1)"
                            rx="6"
                        />
                        {/* Bar */}
                        <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight * barAnim.eased}
                            fill={theme.colors.primary}
                            rx="6"
                        />

                        {/* Value label */}
                        <text
                            x={x + barWidth / 2}
                            y={y - 12}
                            textAnchor="middle"
                            fontSize="22"
                            fill={theme.colors.primary}
                            fontWeight="bold"
                            fontFamily={fontFamily || theme.fonts.body}
                            opacity={barAnim.eased}
                        >
                            {val}
                        </text>

                        {/* X-axis label */}
                        <text
                            x={x + barWidth / 2}
                            y={chartBottom + 35}
                            textAnchor="middle"
                            fontSize="18"
                            fill="#333"
                            fontFamily={fontFamily || theme.fonts.body}
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
                    y={chartBottom + 80}
                    textAnchor="middle"
                    fontSize="24"
                    fill="#555"
                    fontFamily={fontFamily || theme.fonts.body}
                >
                    {label}
                </text>
            )}
        </g>
    );
};
