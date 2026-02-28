import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Brutalist Theme - Common Slide
 * Implementation of slide2.html (Acid Green Header / content area)
 */
export const BrutalistCommonSlide: React.FC<SlideComponentProps> = ({
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
    const bullets = content.bullets || [];

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

    // BG Animation - slide in the acid green background from top? 
    // Actually the design has full Acid Green background. slide2.html says background-color: #CBF400;

    return (
        <g>
            {/* Background - Acid Green */}
            <rect x="0" y="0" width={width} height={height} fill={theme.colors.primary} />

            {/* Container Margins handled by translation */}
            <g transform="translate(60, 30)">

                {/* Header (Logo & Date) */}
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

                {/* Main Content Start */}
                <g transform="translate(0, 60)">
                    {/* Title */}
                    <g
                        transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
                        opacity={titleAnim.opacity}
                        style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
                    >
                        <foreignObject x={0} y={0} width={width - 120} height={200}>
                            <h1
                                {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onElementClick) onElementClick(titleId, title);
                                }}
                                style={{
                                    fontFamily: elementStyles?.[titleId]?.fontFamily || theme.fonts.heading,
                                    color: elementStyles?.[titleId]?.color || '#0F0F0F',
                                    fontSize: elementStyles?.[titleId]?.fontSize ? `${elementStyles[titleId].fontSize}px` : '100px', // Slightly smaller than 120px to fit diverse titles
                                    fontWeight: 700,
                                    margin: 0,
                                    lineHeight: 0.9,
                                    cursor: 'pointer',
                                    border: activeElementId === titleId ? '2px dashed #0F0F0F' : 'none'
                                }}
                            >
                                {title}
                            </h1>
                        </foreignObject>
                    </g>

                    {/* Content Area - Bullets or Text */}
                    <g transform="translate(0, 200)">
                        {bullets.map((bullet, i) => {
                            const bulletId = `bullet-${i}`;
                            const bulletConfig = elementAnimations?.[bulletId];
                            const bulletTime = getTime(bulletId);
                            const bulletAnim = useDynamicAnimation(bulletTime, 0.4 + (i * 0.2), bulletConfig);

                            return (
                                <g
                                    key={i}
                                    transform={`translate(0, ${i * 80})`}
                                >
                                    <g
                                        transform={`translate(${bulletAnim.x}, ${bulletAnim.y}) scale(${bulletAnim.scale})`}
                                        opacity={bulletAnim.opacity}
                                        style={{ filter: bulletAnim.blur ? `blur(${bulletAnim.blur}px)` : 'none' }}
                                    >
                                        {/* info-item style from slide2.html */}
                                        <foreignObject x={0} y={0} width={width - 120} height={70}>
                                            <div
                                                {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onElementClick) onElementClick(bulletId, bullet);
                                                }}
                                                style={{
                                                    backgroundColor: 'rgba(15, 15, 15, 0.05)',
                                                    padding: '15px',
                                                    fontFamily: elementStyles?.[bulletId]?.fontFamily || theme.fonts.body,
                                                    color: elementStyles?.[bulletId]?.color || '#0F0F0F',
                                                    fontSize: elementStyles?.[bulletId]?.fontSize ? `${elementStyles[bulletId].fontSize}px` : '24px',
                                                    fontWeight: 500,
                                                    cursor: 'pointer',
                                                    border: activeElementId === bulletId ? '2px dashed #000' : 'none',
                                                    borderLeft: activeElementId === bulletId ? '3px solid #0F0F0F' : '3px solid #0F0F0F'
                                                }}
                                            >
                                                {bullet}
                                            </div>
                                        </foreignObject>
                                    </g>
                                </g>
                            );
                        })}
                    </g>
                </g>
            </g>

            {/* Footer Box - Static for now or animated */}
            <g transform={`translate(60, ${height - 100})`}>
                <foreignObject x={0} y={0} width={width - 120} height={70}>
                    <div
                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                        style={{
                            backgroundColor: '#DDDDDD',
                            padding: '20px 40px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: '#0F0F0F',
                            borderRadius: '2px',
                            fontFamily: theme.fonts.body
                        }}>
                        <div style={{ fontWeight: 700, fontSize: '18px', fontFamily: theme.fonts.heading, display: 'flex', alignItems: 'center' }}>
                            INFO BOX
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '14px', maxWidth: '600px' }}>
                            Generated by NarrateAI • {slide.layout}
                        </div>
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
