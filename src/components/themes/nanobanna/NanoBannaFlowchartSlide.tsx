import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaFlowchartSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    theme,
    onElementClick,
    activeElementId,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, content } = slide;
    const steps = content.flow_steps || content.bullets || [];

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'slide_up', duration: 0.7, delay: 0 });

    const nodeWidth = 280;
    const nodeHeight = 140; // Increased from 100
    const spacing = 60;
    const totalWidth = steps.length * nodeWidth + (steps.length - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    // centerY moved down slightly to accommodate taller nodes and title
    const centerY = height / 2 + 60; 

    return (
        <g>
            {/* Background handled by Template */}

            {/* Sidebar Accent */}
            <rect x="0" y="40" width="16" height="120" fill={theme.colors.primary} />

            {/* Title */}
            <g transform={`translate(${titleAnim.x + 60}, ${titleAnim.y + 60}) scale(${titleAnim.scale})`} opacity={titleAnim.opacity}>
                <foreignObject x={0} y={0} width={width - 120} height={160}> {/* Increased height */}
                    <h2 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.text.primary,
                        fontSize: '48px',
                        fontWeight: 700,
                        margin: 0,
                        borderBottom: `2px solid ${theme.colors.surface}`,
                        paddingBottom: '20px'
                    }}>
                        {title}
                    </h2>
                </foreignObject>
            </g>

            {/* Flow Nodes */}
            <g>
                {steps.map((step, i) => {
                    const stepId = `step-${i}`;
                    const anim = useDynamicAnimation(getTime(stepId), 0.5 + i * 0.3,
                        elementAnimations?.[stepId] ?? { type: 'scale_in', duration: 0.5, delay: 0 });
                    const x = startX + i * (nodeWidth + spacing);

                    return (
                        <g key={i}>
                            {/* Connector */}
                            {i < steps.length - 1 && (
                                <line
                                    x1={x + nodeWidth} y1={centerY}
                                    x2={x + nodeWidth + spacing} y2={centerY}
                                    stroke={theme.colors.primary}
                                    strokeWidth="2"
                                    opacity={anim.opacity}
                                />
                            )}

                            {/* Node */}
                            <g transform={`translate(${anim.x}, ${anim.y}) scale(${anim.scale})`} opacity={anim.opacity}>
                                <foreignObject x={x} y={centerY - nodeHeight / 2} width={nodeWidth} height={nodeHeight}>
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        backgroundColor: theme.colors.surface,
                                        border: `1px solid ${theme.colors.primary}`,
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '16px'
                                    }}>
                                        <span style={{
                                            fontFamily: theme.fonts.body,
                                            color: theme.colors.text.primary,
                                            fontSize: '20px',
                                            textAlign: 'center',
                                            fontWeight: 600
                                        }}>
                                            {step}
                                        </span>
                                    </div>
                                </foreignObject>
                                {/* Number Badge */}
                                <circle cx={x} cy={centerY - nodeHeight / 2} r="16" fill={theme.colors.primary} />
                                <text x={x} y={centerY - nodeHeight / 2 + 6} textAnchor="middle" fill={theme.colors.background} fontWeight="bold" fontFamily={theme.fonts.mono}>
                                    {i + 1}
                                </text>
                            </g>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};
