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
    const rawTable = (content.table_data ?? {}) as { headers?: unknown; rows?: unknown };
    const tableData = {
        headers: Array.isArray(rawTable.headers) ? (rawTable.headers as string[]) : [] as string[],
        rows: Array.isArray(rawTable.rows)
            ? (rawTable.rows as unknown[]).map((r) => Array.isArray(r) ? (r as string[]) : [] as string[])
            : [] as string[][],
    };

    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h2 || 44, title || '', 28, 18);
    const allCellLens = [
        ...tableData.headers.map((h: string) => (h ?? '').length),
        ...tableData.rows.flatMap((r: string[]) => r.map((c: string) => (c ?? '').length)),
    ];
    const cellFontSize = dynSize(theme.textSizes?.body || 22, 'x'.repeat(Math.max(...allCellLens, 0)), 20, 11);

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'slide_up', duration: 0.7, delay: 0 });

    return (
        <g>
            <defs>
                <linearGradient id={`th-grad-${slide.slide_id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(124,58,237,0.6)" />
                    <stop offset="100%" stopColor="rgba(52,211,153,0.3)" />
                </linearGradient>
            </defs>

            {/* Title */}
            <g transform={`translate(${titleAnim.x + 60}, ${titleAnim.y + 44}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}>
                <text x={0} y={0} fill="#A78BFA" fontFamily={theme.fonts.mono} fontSize="13"
                    letterSpacing="0.1em" opacity="0.8">◆ DATA</text>
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

            {/* Table */}
            <g transform="translate(60, 180)">
                <foreignObject width={width - 120} height={height - 220}>
                    <div style={{
                        borderRadius: '14px',
                        overflow: 'hidden',
                        border: '1px solid rgba(167,139,250,0.2)',
                        boxShadow: '0 0 40px rgba(124,58,237,0.1)',
                    }}>
                        {/* Header row */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`,
                            background: 'linear-gradient(90deg, rgba(124,58,237,0.55) 0%, rgba(52,211,153,0.25) 100%)',
                            borderBottom: '1px solid rgba(167,139,250,0.3)',
                        }}>
                            {tableData.headers.map((header, i) => (
                                <div key={`h-${i}`} style={{
                                    color: '#F1F5F9',
                                    padding: '12px 16px',
                                    fontFamily: theme.fonts.heading,
                                    fontWeight: 700,
                                    fontSize: cellFontSize + 'px',
                                    letterSpacing: '-0.2px',
                                }}>
                                    {header ?? ''}
                                </div>
                            ))}
                        </div>
                        {/* Data rows */}
                        {tableData.rows.map((row, rIdx) => (
                            <div key={`r-${rIdx}`} style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${tableData.headers.length}, 1fr)`,
                                background: rIdx % 2 === 0
                                    ? 'rgba(167,139,250,0.05)'
                                    : 'rgba(0,0,0,0)',
                                borderBottom: '1px solid rgba(167,139,250,0.08)',
                            }}>
                                {row.map((cell, cIdx) => (
                                    <div key={`c-${rIdx}-${cIdx}`} style={{
                                        color: cIdx === 0 ? '#A78BFA' : theme.colors.text.primary,
                                        padding: '10px 16px',
                                        fontFamily: cIdx === 0 ? theme.fonts.mono : theme.fonts.body,
                                        fontSize: cellFontSize + 'px',
                                        fontWeight: cIdx === 0 ? 600 : 400,
                                    }}>
                                        {cell ?? ''}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
