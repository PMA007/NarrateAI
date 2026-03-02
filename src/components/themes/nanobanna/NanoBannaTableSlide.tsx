import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaTableSlide: React.FC<SlideComponentProps> = ({
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
    const tableData = content.table_data || { headers: [], rows: [] };

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'slide_up', duration: 0.7, delay: 0 });

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

            {/* Table Content */}
            <g transform="translate(60, 260)"> {/* Moved down */}
                <foreignObject width={width - 120} height={height - 300}> {/* Reduced height */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`,
                        gap: '1px',
                        background: theme.colors.surface,
                        border: `1px solid ${theme.colors.surface}`,
                        borderRadius: '8px',
                        overflow: 'hidden'
                    }}>
                        {/* Headers */}
                        {tableData.headers.map((header, i) => (
                            <div key={`h-${i}`} style={{
                                background: theme.colors.surface,
                                color: theme.colors.primary,
                                padding: '16px',
                                fontFamily: theme.fonts.mono,
                                fontWeight: 'bold',
                                fontSize: '18px',
                                borderBottom: `2px solid ${theme.colors.primary}`
                            }}>
                                {header}
                            </div>
                        ))}

                        {/* Rows */}
                        {tableData.rows.map((row, rIdx) => (
                            row.map((cell, cIdx) => (
                                <div key={`c-${rIdx}-${cIdx}`} style={{
                                    background: rIdx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    color: theme.colors.text.primary,
                                    padding: '16px',
                                    fontFamily: theme.fonts.body,
                                    fontSize: '18px',
                                    borderTop: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {cell}
                                </div>
                            ))
                        ))}
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
