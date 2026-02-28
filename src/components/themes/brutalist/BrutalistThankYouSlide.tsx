import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Brutalist Theme - Thank You Slide
 */
export const BrutalistThankYouSlide: React.FC<SlideComponentProps> = ({
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
    const { title } = slide;

    // Calculate effective time for an element
    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) {
            return previewTime;
        }
        return localTime;
    };

    const titleId = 'title';
    const titleConfig = elementAnimations?.[titleId];
    const titleTime = getTime(titleId);
    const titleAnim = useDynamicAnimation(titleTime, 0, titleConfig);

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

            {/* Main Title "THANK YOU" */}
            <g
                transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
                opacity={titleAnim.opacity}
                style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
            >
                <foreignObject x={0} y={height / 2 - 150} width={width} height={300}>
                    <h1
                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onElementClick) onElementClick(titleId, title);
                        }}
                        style={{
                            fontFamily: elementStyles?.[titleId]?.fontFamily || theme.fonts.heading,
                            color: elementStyles?.[titleId]?.color || '#0F0F0F',
                            fontSize: elementStyles?.[titleId]?.fontSize ? `${elementStyles[titleId].fontSize}px` : '180px',
                            fontWeight: 900,
                            margin: 0,
                            textAlign: 'center',
                            lineHeight: 1.0,
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            border: activeElementId === titleId ? '2px dashed #0F0F0F' : 'none'
                        }}
                    >
                        {title || 'THE END'}
                    </h1>
                </foreignObject>
            </g>

            {/* Quote / Subtitle area */}
            <g transform={`translate(0, ${height / 2 + 100})`}>
                <foreignObject x={width / 2 - 400} y={0} width={800} height={100}>
                    <div
                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                        style={{
                            fontFamily: theme.fonts.body,
                            fontSize: '24px',
                            textAlign: 'center',
                            color: '#0F0F0F',
                            fontWeight: 500
                        }}
                    >
                        "Knowledge is power. Information is liberation."
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
