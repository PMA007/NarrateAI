import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Brutalist Theme - Table Slide
 * Displays data in a responsive grid/table layout
 */
export const BrutalistTableSlide: React.FC<SlideComponentProps> = ({
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
    const tableData = content.table_data || {
        headers: ['Category', 'Value 1', 'Value 2'],
        rows: [
            ['Metric A', '100', '200'],
            ['Metric B', '150', '300'],
            ['Metric C', '80', '120']
        ]
    };

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

    const bgAnim = useDynamicAnimation(localTime, 0, undefined); // Just for opacity fade in

    return (
        <g>
            {/* Background - Acid Green */}
            <rect x="0" y="0" width={width} height={height} fill={theme.colors.primary} opacity={bgAnim.opacity} />

            {/* Container Margins */}
            <g transform="translate(60, 30)">

                {/* Header (Logo & Date) - Consistent across Brutalist theme */}
                <g>
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

                {/* Main Content */}
                <g transform="translate(0, 60)">
                    {/* Title */}
                    <g
                        transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
                        opacity={titleAnim.opacity}
                        style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
                    >
                        <foreignObject x={0} y={0} width={width - 120} height={150}>
                            <h1
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onElementClick) onElementClick(titleId, title);
                                }}
                                style={{
                                    fontFamily: elementStyles?.[titleId]?.fontFamily || theme.fonts.heading,
                                    color: elementStyles?.[titleId]?.color || '#0F0F0F',
                                    fontSize: elementStyles?.[titleId]?.fontSize ? `${elementStyles[titleId].fontSize}px` : '80px',
                                    fontWeight: 700,
                                    margin: 0,
                                    lineHeight: 1.0,
                                    cursor: 'pointer',
                                    border: activeElementId === titleId ? '2px dashed #0F0F0F' : 'none'
                                }}
                            >
                                {title}
                            </h1>
                        </foreignObject>
                    </g>

                    {/* Table Render */}
                    <g transform="translate(0, 160)">
                        <foreignObject x={0} y={0} width={width - 120} height={450}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`,
                                gap: '2px', // Thin gap for borders
                                backgroundColor: '#0F0F0F', // Border color
                                border: '3px solid #0F0F0F',
                                fontFamily: theme.fonts.body,
                                color: '#0F0F0F'
                            }}>
                                {/* Headers */}
                                {tableData.headers.map((header, i) => (
                                    <div key={`th-${i}`} style={{
                                        backgroundColor: '#0F0F0F',
                                        color: '#CBF400',
                                        padding: '15px',
                                        fontWeight: 700,
                                        fontSize: '20px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {header}
                                    </div>
                                ))}

                                {/* Rows */}
                                {tableData.rows.map((row, rowIndex) =>
                                    row.map((cell, cellIndex) => {
                                        const cellId = `cell-${rowIndex}-${cellIndex}`;

                                        // TODO: We could animate cells individually, but it might be heavy. 
                                        // For now, static layout is safer for complex tables.

                                        return (
                                            <div key={`td-${rowIndex}-${cellIndex}`} style={{
                                                // Actually we want dark text on acid green background theme...
                                                // Let's use light backgrounds for cells
                                                backgroundColor: rowIndex % 2 === 0 ? '#f0f0f0' : '#e0e0e0',
                                                padding: '15px',
                                                fontSize: '18px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}>
                                                {cell}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </foreignObject>
                    </g>
                </g>
            </g>
        </g>
    );
};
