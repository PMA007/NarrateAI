import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaCommonSlide: React.FC<SlideComponentProps> = ({
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
    const bullets = content.bullets || [];

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
            <rect x="0" y="0" width="16" height={height} fill={theme.colors.surface} />
            <rect x="0" y="40" width="16" height="120" fill={theme.colors.primary} />

            {/* Content Container */}
            <g transform="translate(60, 60)">
                {/* Title */}
                <g
                    transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
                    opacity={titleAnim.opacity}
                >
                    <foreignObject x={0} y={0} width={width - 120} height={160}>
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

                {/* Bullets */}
                <g transform="translate(0, 180)">
                    {bullets.map((bullet, i) => {
                        const bulletId = `bullet-${i}`;
                        const anim = useDynamicAnimation(getTime(bulletId), 0.3 + (i * 0.15),
                            elementAnimations?.[bulletId] ?? { type: 'slide_up', duration: 0.5, delay: 0 });
                        
                        // Dynamic spacing logic based on index
                        const yPos = anim.y + (i * 110); 

                        return (
                            <g key={i} transform={`translate(${anim.x}, ${yPos}) scale(${anim.scale})`} opacity={anim.opacity}>
                                <foreignObject x={0} y={0} width={width - 120} height={100}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontFamily: theme.fonts.body,
                                        fontSize: '24px',
                                        color: theme.colors.text.primary,
                                        backgroundColor: theme.colors.surface,
                                        padding: '15px 20px',
                                        borderRadius: '8px',
                                        borderLeft: `4px solid ${theme.colors.primary}`,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}>
                                        {/* Number/Icon */}
                                        <span style={{
                                            color: theme.colors.primary,
                                            fontWeight: 'bold',
                                            marginRight: '15px',
                                            fontFamily: theme.fonts.mono
                                        }}>
                                            {`0${i + 1}`}
                                        </span>
                                        {bullet}
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </g>
            </g>
        </g>
    );
};
