import React, { useMemo } from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaNetworkSlide: React.FC<SlideComponentProps> = ({
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
    const networkData = content.network_data || { nodes: [], edges: [] };

    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h2 || 44, title || '', 28, 18);

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'slide_up', duration: 0.7, delay: 0 });

    // ── Layout Logic ─────────────────────────────────────────────────────────
    const layout = useMemo(() => {
        const nodes = networkData.nodes;
        const edges = networkData.edges;

        // Group by layer if present
        const layers: Record<number, typeof nodes> = {};
        let maxLayer = 0;
        let hasLayers = false;

        nodes.forEach(node => {
            if (typeof node.layer === 'number') {
                hasLayers = true;
                if (!layers[node.layer]) layers[node.layer] = [];
                layers[node.layer].push(node);
                maxLayer = Math.max(maxLayer, node.layer);
            }
        });

        // Calculate positions
        const nodePositions: Record<string, { x: number, y: number }> = {};
        const widthPadding = 100;
        const heightPadding = 200; // Title space
        const availableWidth = width - widthPadding * 2;
        const availableHeight = height - heightPadding - 50;

        if (hasLayers) {
            // Layered Layout (e.g. Neural Network)
            const layerCount = maxLayer + 1;
            const layerWidth = availableWidth / (layerCount > 1 ? layerCount - 1 : 1);

            Object.entries(layers).forEach(([layerIndexStr, layerNodes]) => {
                const layerIndex = parseInt(layerIndexStr);
                const x = widthPadding + layerIndex * layerWidth;
                
                const nodeSpacing = availableHeight / (layerNodes.length + 1);
                layerNodes.forEach((node, i) => {
                    const y = heightPadding + (i + 1) * nodeSpacing;
                    nodePositions[node.id] = {
                        x: node.x ?? x,
                        y: node.y ?? y
                    };
                });
            });
        } else {
            // Circular / Random Layout fallback
            const centerX = width / 2;
            const centerY = heightPadding + availableHeight / 2;
            const radius = Math.min(availableWidth, availableHeight) / 2.5;
            
            nodes.forEach((node, i) => {
                const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
                nodePositions[node.id] = {
                    x: node.x ?? centerX + Math.cos(angle) * radius,
                    y: node.y ?? centerY + Math.sin(angle) * radius
                };
            });
        }

        // Handle edges with curves
        const edgeLayouts = edges.map(edge => {
            const startNode = nodePositions[edge.source];
            const endNode = nodePositions[edge.target];
            if (!startNode || !endNode) return null;

            const nodeRadius = 30; // Radius + padding for gap
            let path = '';
            let midX = (startNode.x + endNode.x) / 2;
            let midY = (startNode.y + endNode.y) / 2;
            let labelPos = { x: midX, y: midY };

            if (edge.source === edge.target) {
                // Self Loop
                const loopSize = 50;
                // Start/End at top of node
                const sx = startNode.x;
                const sy = startNode.y - nodeRadius;
                path = `M ${sx - 10} ${sy} C ${sx - loopSize} ${sy - loopSize}, ${sx + loopSize} ${sy - loopSize}, ${sx + 10} ${sy}`;
                labelPos = { x: sx, y: sy - loopSize - 10 };
            } else {
                let startX = startNode.x;
                let startY = startNode.y;
                let endX = endNode.x;
                let endY = endNode.y;

                if (edge.curve) {
                    // Curved Edge
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    const nx = -dy / dist;
                    const ny = dx / dist;
                    const curveHeight = edge.curve * 50;
                    
                    const cpX = midX + nx * curveHeight;
                    const cpY = midY + ny * curveHeight;
                    labelPos = { x: cpX, y: cpY };

                    // Offset start/end points towards control point
                    const ds = Math.sqrt(Math.pow(cpX - startX, 2) + Math.pow(cpY - startY, 2)) || 1;
                    const de = Math.sqrt(Math.pow(endX - cpX, 2) + Math.pow(endY - cpY, 2)) || 1;
                    
                    startX += ((cpX - startX) / ds) * nodeRadius;
                    startY += ((cpY - startY) / ds) * nodeRadius;
                    endX -= ((endX - cpX) / de) * nodeRadius;
                    endY -= ((endY - cpY) / de) * nodeRadius;
                    
                    path = `M ${startX} ${startY} Q ${cpX} ${cpY} ${endX} ${endY}`;
                } else {
                    // Straight Edge
                    const dx = endX - startX;
                    const dy = endY - startY;
                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                    
                    startX += (dx / dist) * nodeRadius;
                    startY += (dy / dist) * nodeRadius;
                    endX -= (dx / dist) * nodeRadius;
                    endY -= (dy / dist) * nodeRadius;
                    
                    path = `M ${startX} ${startY} L ${endX} ${endY}`;
                }
            }

            return { ...edge, path, labelPos };
        }).filter(Boolean);

        return { nodePositions, edgeLayouts };
    }, [networkData, width, height]);

    return (
        <g>
            {/* Title */}
            <g transform={`translate(${titleAnim.x + 60}, ${titleAnim.y + 44}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}>
                <text x={0} y={0} fill="#A78BFA" fontFamily={theme.fonts.mono} fontSize="13"
                    letterSpacing="0.1em" opacity="0.8">◆ NETWORK</text>
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

            {/* Network Visualization */}
            <g>
                <defs>
                    <filter id={`node-glow-${slide.slide_id}`}>
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <marker id={`arrowhead-${slide.slide_id}`} markerWidth="10" markerHeight="7" refX="4" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="rgba(167,139,250,0.8)" />
                    </marker>
                    <marker id={`arrowhead-start-${slide.slide_id}`} markerWidth="10" markerHeight="7" refX="6" refY="3.5" orient="auto">
                        <polygon points="10 0, 0 3.5, 10 7" fill="rgba(167,139,250,0.8)" />
                    </marker>
                </defs>

                {/* Edges */}
                {layout.edgeLayouts.map((edge, i) => {
                    if (!edge) return null;
                    const edgeId = `edge-${i}`;
                    const anim = useDynamicAnimation(getTime(edgeId), 0.5 + i * 0.1, { type: 'fade', duration: 0.5, delay: 0 });
                    
                    const isDirected = edge.type === 'directed';
                    const isBidirectional = edge.type === 'bidirectional';

                    return (
                        <g key={`edge-${i}`} opacity={anim.opacity}>
                            {/* Edge glow */}
                            <path d={edge.path} stroke="rgba(167,139,250,0.15)" strokeWidth="6" fill="none" />
                            <path
                                d={edge.path}
                                stroke="rgba(167,139,250,0.55)"
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray={edge.type === 'undirected' ? '0' : '6 3'}
                                markerEnd={isDirected || isBidirectional ? `url(#arrowhead-${slide.slide_id})` : undefined}
                                markerStart={isBidirectional ? `url(#arrowhead-start-${slide.slide_id})` : undefined}
                            />
                            {edge.label && (
                                <g transform={`translate(${edge.labelPos.x}, ${edge.labelPos.y})`}>
                                    <rect x="-18" y="-11" width="36" height="22" fill="#13132A" rx="5"
                                        stroke="rgba(167,139,250,0.3)" strokeWidth="1" />
                                    <text textAnchor="middle" dy="5" fill="#A78BFA"
                                        fontSize={theme.textSizes?.mono || 13}
                                        fontFamily={theme.fonts.mono} fontWeight="700">
                                        {edge.label}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Nodes */}
                {networkData.nodes.map((node, i) => {
                    const nodePos = layout.nodePositions[node.id];
                    if (!nodePos) return null;
                    
                    const nodeId = `node-${node.id}`;
                    // Stagger animation based on layer if available, else index
                    const delay = typeof node.layer === 'number' ? 0.3 + node.layer * 0.2 : 0.3 + i * 0.1;
                    const anim = useDynamicAnimation(getTime(nodeId), delay, { type: 'scale_in', duration: 0.4, delay: 0 });
                    
                    const radius = Math.max(34, Math.ceil((node.label?.length || 4) * 4.5));
                    const isInput = node.type === 'input';
                    const isOutput = node.type === 'output';
                    const fillColor = isInput ? 'rgba(167,139,250,0.2)' : isOutput ? 'rgba(52,211,153,0.2)' : '#13132A';
                    const strokeColor = isInput ? '#A78BFA' : isOutput ? '#34D399' : 'rgba(167,139,250,0.45)';
                    const labelColor = isInput ? '#A78BFA' : isOutput ? '#34D399' : theme.colors.text.primary;

                    return (
                        <g
                            key={`node-${node.id}`}
                            transform={`translate(${nodePos.x}, ${nodePos.y}) scale(${anim.scale})`}
                            opacity={anim.opacity}
                        >
                            {/* Glow ring */}
                            <circle r={radius + 6} fill={isInput ? 'rgba(167,139,250,0.08)' : isOutput ? 'rgba(52,211,153,0.08)' : 'transparent'} />
                            <circle r={radius} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                            {/* Label inside the circle */}
                            <foreignObject
                                x={-radius + 4}
                                y={-radius + 4}
                                width={(radius - 4) * 2}
                                height={(radius - 4) * 2}
                            >
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center' as const,
                                    fontFamily: theme.fonts.body,
                                    fontSize: Math.max(9, Math.min(14, Math.floor(radius / (node.label?.length > 6 ? 2.2 : 1.6)))) + 'px',
                                    fontWeight: 600,
                                    color: labelColor,
                                    lineHeight: 1.2,
                                    wordBreak: 'break-word' as const,
                                    overflow: 'hidden',
                                }}>
                                    {node.label}
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}
            </g>
        </g>
    );
};
