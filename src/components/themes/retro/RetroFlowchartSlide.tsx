import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Retro Theme - Flowchart/Process Flow Slide
 * Features connected cards with vintage styling
 */
export const RetroFlowchartSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme
}) => {
    const { title, content } = slide;
    const steps = content.flow_steps || content.bullets || [];
    const titleAnim = useAnimation(localTime, 0, 1.5);
    const dotGridRotation = localTime * (360 / 22);

    const nodeWidth = 260;
    const nodeHeight = 100;
    const spacing = 80;
    const totalWidth = steps.length * nodeWidth + (steps.length - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const centerY = height / 2 + 50;

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

            {/* Flow nodes and connectors */}
            {steps.map((step, i) => {
                const nodeAnim = useAnimation(localTime, 1.5 + i * 0.4, 1.0);
                const x = startX + i * (nodeWidth + spacing);

                return (
                    <g key={i} opacity={nodeAnim.eased}>
                        {/* Connector to next node */}
                        {i < steps.length - 1 && (
                            <g>
                                <line
                                    x1={x + nodeWidth}
                                    y1={centerY}
                                    x2={x + nodeWidth + spacing}
                                    y2={centerY}
                                    stroke={theme.colors.primary}
                                    strokeWidth="2"
                                    strokeDasharray="6 3"
                                />
                                {/* Arrow */}
                                <polygon
                                    points={`
                                        ${x + nodeWidth + spacing - 8},${centerY - 6}
                                        ${x + nodeWidth + spacing},${centerY}
                                        ${x + nodeWidth + spacing - 8},${centerY + 6}
                                    `}
                                    fill={theme.colors.primary}
                                />
                            </g>
                        )}

                        {/* Node card with shadow */}
                        <rect
                            x={x + 6}
                            y={centerY - nodeHeight / 2 + 6}
                            width={nodeWidth}
                            height={nodeHeight}
                            rx="14"
                            fill="rgba(0,0,0,0.15)"
                        />
                        <rect
                            x={x}
                            y={centerY - nodeHeight / 2}
                            width={nodeWidth}
                            height={nodeHeight}
                            rx="14"
                            fill={theme.colors.card.background}
                            stroke={theme.colors.card.border}
                            strokeWidth="2"
                            strokeDasharray="6 3"
                        />

                        {/* Step number badge */}
                        <circle
                            cx={x + 35}
                            cy={centerY}
                            r="22"
                            fill="#f4da91"
                            style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,.1))' }}
                        />
                        <text
                            x={x + 35}
                            y={centerY + 7}
                            textAnchor="middle"
                            fontSize="22"
                            fill="#111"
                            fontWeight="bold"
                            fontFamily={fontFamily || theme.fonts.body}
                        >
                            {i + 1}
                        </text>

                        {/* Step text */}
                        <foreignObject
                            x={x + 65}
                            y={centerY - nodeHeight / 2 + 15}
                            width={nodeWidth - 80}
                            height={nodeHeight - 30}
                        >
                            <div
                                {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                    color: '#111',
                                    fontFamily: fontFamily || theme.fonts.body,
                                    fontSize: '18px',
                                    lineHeight: '1.3'
                                }}
                            >
                                <style>{`
                                    * {
                                        color: #111 !important;
                                        font-family: ${fontFamily || theme.fonts.body} !important;
                                    }
                                `}</style>
                                {step}
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
        </g>
    );
};
