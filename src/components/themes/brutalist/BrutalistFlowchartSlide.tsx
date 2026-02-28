import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Brutalist Theme - Flowchart Slide
 * Sharp edges, Acid Green connectors, high contrast nodes
 */
export const BrutalistFlowchartSlide: React.FC<SlideComponentProps> = ({
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
    const { title, content } = slide;
    const steps = content.flow_steps || content.bullets || [];

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

    const nodeWidth = 300;
    const nodeHeight = 100;
    const spacing = 80;
    const totalWidth = steps.length * nodeWidth + (steps.length - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const centerY = height / 2 + 30;

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
                <foreignObject x={60} y={80} width={width - 120} height={150}>
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
                            cursor: 'pointer',
                            border: activeElementId === titleId ? '2px dashed #0F0F0F' : 'none'
                        }}
                    >
                        {title}
                    </h1>
                </foreignObject>
            </g>

            {/* Flow Nodes */}
            <g>
                {steps.map((step, i) => {
                    const stepId = `step-${i}`;
                    const stepConfig = elementAnimations?.[stepId];
                    const stepTime = getTime(stepId);
                    const stepAnim = useDynamicAnimation(stepTime, 0.5 + i * 0.3, stepConfig);

                    const x = startX + i * (nodeWidth + spacing);

                    return (
                        <g key={i}>
                            {/* Connector (Line) */}
                            {i < steps.length - 1 && (
                                <line
                                    x1={x + nodeWidth}
                                    y1={centerY}
                                    x2={x + nodeWidth + spacing}
                                    y2={centerY}
                                    stroke="#0F0F0F"
                                    strokeWidth="4"
                                    opacity={stepAnim.opacity}
                                />
                            )}
                            {/* Connector (Arrow) */}
                            {i < steps.length - 1 && (
                                <polygon
                                    points={`
                                        ${x + nodeWidth + spacing - 15},${centerY - 10}
                                        ${x + nodeWidth + spacing},${centerY}
                                        ${x + nodeWidth + spacing - 15},${centerY + 10}
                                    `}
                                    fill="#0F0F0F"
                                    opacity={stepAnim.opacity}
                                />
                            )}

                            {/* Node Group */}
                            <g
                                transform={`translate(${stepAnim.x}, ${stepAnim.y}) scale(${stepAnim.scale})`}
                                opacity={stepAnim.opacity}
                                style={{ filter: stepAnim.blur ? `blur(${stepAnim.blur}px)` : 'none' }}
                            >
                                {/* Shadow/offset block */}
                                <rect
                                    x={x + 10}
                                    y={centerY - nodeHeight / 2 + 10}
                                    width={nodeWidth}
                                    height={nodeHeight}
                                    fill="rgba(15,15,15,0.2)"
                                />

                                <foreignObject x={x} y={centerY - nodeHeight / 2} width={nodeWidth} height={nodeHeight}>
                                    <div
                                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onElementClick) onElementClick(stepId, step);
                                        }}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            backgroundColor: '#0F0F0F',
                                            color: '#CBF400',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '20px',
                                            boxSizing: 'border-box',
                                            border: activeElementId === stepId ? '2px dashed #CBF400' : 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            fontFamily: theme.fonts.body,
                                            fontSize: '18px',
                                            fontWeight: 600,
                                            textAlign: 'center',
                                            textTransform: 'uppercase'
                                        }}>
                                            {step}
                                        </div>
                                    </div>
                                </foreignObject>

                                {/* Step Number Badge */}
                                <rect
                                    x={x - 15}
                                    y={centerY - nodeHeight / 2 - 15}
                                    width={40}
                                    height={40}
                                    fill="#CBF400"
                                    stroke="#0F0F0F"
                                    strokeWidth="3"
                                />
                                <text
                                    x={x + 5}
                                    y={centerY - nodeHeight / 2 + 12}
                                    textAnchor="middle"
                                    fill="#0F0F0F"
                                    fontFamily={theme.fonts.heading}
                                    fontWeight="bold"
                                    fontSize="20"
                                >
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
