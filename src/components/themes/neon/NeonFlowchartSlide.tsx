import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Neon Theme - Flowchart/Process Flow Slide
 * Features glowing connected nodes with animated transitions
 */
export const NeonFlowchartSlide: React.FC<SlideComponentProps> = ({
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

    const nodeWidth = 280;
    const nodeHeight = 80;
    const spacing = 100;
    const totalWidth = steps.length * nodeWidth + (steps.length - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const centerY = height / 2;

    return (
        <g>
            {/* Title */}
            <text
                x={width / 2}
                y={120}
                textAnchor="middle"
                fontSize="72"
                fill={theme.colors.text.primary}
                fontFamily={theme.fonts.heading}
                fontWeight="bold"
                opacity={titleAnim.eased}
            >
                {title}
            </text>

            {/* Flow nodes and connectors */}
            {steps.map((step, i) => {
                const nodeAnim = useAnimation(localTime, 1.5 + i * 0.5, 1.0);
                const x = startX + i * (nodeWidth + spacing);

                return (
                    <g key={i} opacity={nodeAnim.eased}>
                        {/* Connector line to next node */}
                        {i < steps.length - 1 && (
                            <g>
                                <line
                                    x1={x + nodeWidth}
                                    y1={centerY}
                                    x2={x + nodeWidth + spacing}
                                    y2={centerY}
                                    stroke={theme.colors.primary}
                                    strokeWidth="3"
                                    strokeDasharray="8 4"
                                    opacity="0.8"
                                />
                                {/* Arrow head */}
                                <polygon
                                    points={`
                                        ${x + nodeWidth + spacing - 10},${centerY - 8}
                                        ${x + nodeWidth + spacing},${centerY}
                                        ${x + nodeWidth + spacing - 10},${centerY + 8}
                                    `}
                                    fill={theme.colors.primary}
                                />
                            </g>
                        )}

                        {/* Node background with glow */}
                        <rect
                            x={x}
                            y={centerY - nodeHeight / 2}
                            width={nodeWidth}
                            height={nodeHeight}
                            rx="16"
                            fill={theme.colors.card.background}
                            stroke={theme.colors.primary}
                            strokeWidth="2"
                            style={{
                                filter: `drop-shadow(0 0 20px ${theme.colors.primary}40)`
                            }}
                        />

                        {/* Step number badge */}
                        <circle
                            cx={x + 30}
                            cy={centerY}
                            r="20"
                            fill={theme.colors.primary}
                        />
                        <text
                            x={x + 30}
                            y={centerY + 6}
                            textAnchor="middle"
                            fontSize="20"
                            fill="white"
                            fontWeight="bold"
                            fontFamily={theme.fonts.body}
                        >
                            {i + 1}
                        </text>

                        {/* Step text */}
                        <foreignObject
                            x={x + 55}
                            y={centerY - nodeHeight / 2 + 10}
                            width={nodeWidth - 70}
                            height={nodeHeight - 20}
                        >
                            <div
                                {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    height: '100%',
                                    color: theme.colors.text.primary,
                                    fontFamily: theme.fonts.body,
                                    fontSize: '18px',
                                    lineHeight: '1.3'
                                }}
                            >
                                {step}
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
        </g>
    );
};
