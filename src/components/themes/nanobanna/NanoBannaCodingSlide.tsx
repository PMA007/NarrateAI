import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';
import { CodingCanvas } from '../../canvas/CodingCanvas';

export const NanoBannaCodingSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    theme,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, content } = slide;
    const { code_snippet, highlight_lines } = content;

    const dynSize = (base: number, text: string, ideal: number, min: number) =>
        !text || text.length <= ideal ? base : Math.max(min, Math.round(base * Math.sqrt(ideal / text.length)));
    const titleFontSize = dynSize(theme.textSizes?.h3 || 30, title || '', 38, 14);

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0,
        elementAnimations?.['title'] ?? { type: 'fade', duration: 0.5, delay: 0 });
    const codeAnim = useDynamicAnimation(getTime('code'), 0.3,
        elementAnimations?.['code'] ?? { type: 'fade', duration: 0.7, delay: 0 });

    return (
        <g>
            {/* Aurora accent bar top */}
            <defs>
                <linearGradient id={`code-top-bar-${slide.slide_id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A78BFA" />
                    <stop offset="100%" stopColor="#34D399" />
                </linearGradient>
            </defs>
            <rect x="0" y="0" width={width} height="4" fill={`url(#code-top-bar-${slide.slide_id})`} />

            {/* Title */}
            <g transform={`translate(60, 28)`} opacity={titleAnim.opacity}>
                <text x={0} y={0} fill="#A78BFA" fontFamily={theme.fonts.mono} fontSize="12"
                    letterSpacing="0.1em" opacity="0.8">◆ CODE</text>
                <foreignObject x={0} y={10} width={width - 120} height={Math.max(60, titleFontSize * 2.8)}>
                    <h2 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.text.primary,
                        fontSize: titleFontSize + 'px',
                        fontWeight: 800,
                        margin: 0,
                        letterSpacing: '-0.3px',
                        lineHeight: 1.2,
                    }}>
                        {title}
                    </h2>
                </foreignObject>
            </g>

            {/* Code block wrapper */}
            <g transform={`translate(${codeAnim.x + 40}, ${codeAnim.y + Math.max(100, titleFontSize * 2.8) + 30}) scale(${codeAnim.scale})`}
                opacity={codeAnim.opacity}>
                {/* Card border glow */}
                <rect x="-4" y="-4" width={width - 72} height={height - Math.max(100, titleFontSize * 2.8) - 60} rx="14"
                    fill="rgba(167,139,250,0.06)" stroke="rgba(167,139,250,0.2)" strokeWidth="1.5" />
                <foreignObject x={0} y={0} width={width - 80} height={height - Math.max(100, titleFontSize * 2.8) - 52}>
                    <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
                        <CodingCanvas
                            code={code_snippet || '// No code provided'}
                            highlightLines={highlight_lines || []}
                            theme="dark"
                            fontSize={theme.textSizes?.mono || 18}
                        />
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
