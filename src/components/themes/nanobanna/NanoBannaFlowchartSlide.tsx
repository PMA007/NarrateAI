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

    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h2 || 44, title || '', 28, 18);
    const maxStepLen = Math.max(...steps.map((s: string) => s.length), 0);
    const stepFontSize = dynSize(theme.textSizes?.body || 22, 'x'.repeat(maxStepLen), 28, 11);

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
            <defs>
                <linearGradient id={`flow-conn-${slide.slide_id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
                <marker id={`flow-arrow-${slide.slide_id}`} markerWidth="10" markerHeight="7"
                    refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="#34D399" opacity="0.8" />
                </marker>
            </defs>

            {/* Title */}
            <g transform={`translate(${titleAnim.x + 60}, ${titleAnim.y + 44}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}>
                <text x={0} y={0} fill="#A78BFA" fontFamily={theme.fonts.mono} fontSize="13"
                    letterSpacing="0.1em" opacity="0.8">◆ FLOW</text>
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

            {/* Flow Nodes */}
            <g>
                {steps.map((step, i) => {
                    const stepId = `step-${i}`;
                    const anim = useDynamicAnimation(getTime(stepId), 0.4 + i * 0.22,
                        elementAnimations?.[stepId] ?? { type: 'scale_in', duration: 0.5, delay: 0 });
                    const x = startX + i * (nodeWidth + spacing);

                    return (
                        <g key={i}>
                            {/* Connector line */}
                            {i < steps.length - 1 && (
                                <line
                                    x1={x + nodeWidth} y1={centerY}
                                    x2={x + nodeWidth + spacing} y2={centerY}
                                    stroke={`url(#flow-conn-${slide.slide_id})`}
                                    strokeWidth="2"
                                    opacity={anim.opacity * 0.7}
                                    markerEnd={`url(#flow-arrow-${slide.slide_id})`}
                                />
                            )}

                            {/* Step number above */}
                            <circle cx={x + nodeWidth / 2} cy={centerY - nodeHeight / 2 - 20}
                                r="16"
                                fill="rgba(167,139,250,0.15)"
                                stroke="rgba(167,139,250,0.5)" strokeWidth="1.5"
                                opacity={anim.opacity}
                            />
                            <text x={x + nodeWidth / 2} y={centerY - nodeHeight / 2 - 14}
                                textAnchor="middle"
                                fill="#A78BFA"
                                fontFamily={theme.fonts.mono}
                                fontSize="13" fontWeight="700"
                                opacity={anim.opacity}>
                                {String(i + 1).padStart(2, '0')}
                            </text>

                            {/* Node card */}
                            <g transform={`translate(${anim.x}, ${anim.y}) scale(${anim.scale})`} opacity={anim.opacity}>
                                {/* Glow */}
                                <rect x={x - 4} y={centerY - nodeHeight / 2 - 4}
                                    width={nodeWidth + 8} height={nodeHeight + 8}
                                    rx="14" fill="rgba(167,139,250,0.08)" />
                                <foreignObject x={x} y={centerY - nodeHeight / 2} width={nodeWidth} height={nodeHeight}>
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        background: 'rgba(19,19,42,0.95)',
                                        border: '1.5px solid rgba(167,139,250,0.35)',
                                        borderRadius: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '16px',
                                        boxSizing: 'border-box' as const,
                                    }}>
                                        <span style={{
                                            fontFamily: theme.fonts.body,
                                            color: theme.colors.text.primary,
                                            fontSize: stepFontSize + 'px',
                                            textAlign: 'center' as const,
                                            fontWeight: 600,
                                            lineHeight: 1.3,
                                        }}>
                                            {step}
                                        </span>
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
