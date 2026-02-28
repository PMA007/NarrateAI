import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

export const NanoBannaIntroSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    theme,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, subtitle } = slide;

    const getTime = (id: string, delay = 0) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0, elementAnimations?.['title']);
    const subtitleAnim = useDynamicAnimation(getTime('subtitle'), 0.5, elementAnimations?.['subtitle']);

    return (
        <g>
            {/* Background handled by Template */}

            {/* Banana Yellow Top Accent */}
            <rect x="0" y="0" width={width} height="12" fill={theme.colors.primary} />

            {/* Main Content Centered */}
            <g transform={`translate(${width / 2}, ${height / 2})`}>

                {/* Title */}
                <g
                    transform={`translate(${titleAnim.x}, ${titleAnim.y - 40}) scale(${titleAnim.scale})`}
                    opacity={titleAnim.opacity}
                >
                    <foreignObject x={-400} y={-100} width={800} height={200}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            textAlign: 'center'
                        }}>
                            <h1 style={{
                                fontFamily: theme.fonts.heading,
                                color: theme.colors.text.primary,
                                fontSize: '80px',
                                fontWeight: 800,
                                margin: 0,
                                letterSpacing: '-2px',
                                lineHeight: 1.1,
                                textShadow: '0 4px 30px rgba(0,0,0,0.5)'
                            }}>
                                {title}
                            </h1>
                        </div>
                    </foreignObject>
                </g>

                {/* Subtitle / Tagline */}
                <g
                    transform={`translate(${subtitleAnim.x}, ${subtitleAnim.y + 60}) scale(${subtitleAnim.scale})`}
                    opacity={subtitleAnim.opacity}
                >
                    <foreignObject x={-400} y={0} width={800} height={100}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{
                                fontFamily: theme.fonts.mono,
                                color: theme.colors.primary,
                                fontSize: '24px',
                                backgroundColor: 'rgba(255, 215, 0, 0.1)',
                                padding: '8px 24px',
                                borderRadius: '4px',
                                border: `1px solid ${theme.colors.primary}`,
                                display: 'inline-block'
                            }}>
                                {subtitle || 'CODING | ALGORITHMS | MASTERY'}
                            </span>
                        </div>
                    </foreignObject>
                </g>
            </g>

            {/* Footer */}
            <g transform={`translate(40, ${height - 40})`}>
                <text
                    fill={theme.colors.text.secondary}
                    fontFamily={theme.fonts.mono}
                    fontSize="14"
                >
                    NANO BANANA PRO
                </text>
            </g>
        </g>
    );
};
