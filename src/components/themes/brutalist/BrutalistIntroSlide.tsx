import React from 'react';
import { useStore } from '@/lib/store';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Brutalist Theme - Intro Slide
 * Implementation of slide1.html (Acid Green/Dark Grey)
 */
export const BrutalistIntroSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme,
    onElementClick,
    activeElementId,
    elementAnimations,
    elementStyles, // Added missing prop
    previewElementId,
    previewTime
}) => {
    const { preloadedAssets } = useStore();
    // bgImage removed

    const { title, subtitle } = slide;

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

    // Subtitle Animation
    const subtitleId = 'subtitle';
    const subtitleConfig = elementAnimations?.[subtitleId];
    const subtitleTime = getTime(subtitleId);
    const subtitleAnim = useDynamicAnimation(subtitleTime, 0.4, subtitleConfig);

    // Presenter Box Animation
    const presenterId = 'presenter';
    const presenterConfig = elementAnimations?.[presenterId];
    const presenterTime = getTime(presenterId);
    const presenterAnim = useDynamicAnimation(presenterTime, 0.8, presenterConfig);

    return (
        <g>
            {/* Background Image Overlay Removed */}

            {/* Dark Overlay */}
            <rect x="0" y="0" width={width} height={height} fill="rgba(15, 15, 15, 0.7)" />

            {/* Header: Logo & Date */}
            <g transform="translate(60, 50)">
                <text
                    x="0"
                    y="0"
                    fill={theme.colors.primary}
                    fontFamily={theme.fonts.body}
                    fontWeight="600"
                    fontSize="16"
                    letterSpacing="0.5px"
                >
                    NARRATE AI
                </text>

                <text
                    x={width - 120}
                    y="0"
                    fill={theme.colors.primary}
                    fontFamily={theme.fonts.body}
                    fontSize="16"
                    textAnchor="end"
                >
                    {new Date().toISOString().split('T')[0]}
                </text>
            </g>

            {/* Main Content */}
            <g transform={`translate(${width / 2}, ${height / 2})`}>
                {/* Title */}
                <g
                    transform={`translate(${titleAnim.x}, ${titleAnim.y - 60}) scale(${titleAnim.scale})`}
                    opacity={titleAnim.opacity}
                    style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
                >
                    <foreignObject x={-450} y={-150} width={900} height={300}>
                        <div
                            {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: '100%',
                            }}
                        >
                            <h1
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onElementClick) onElementClick(titleId, title);
                                }}
                                style={{
                                    fontFamily: elementStyles?.[titleId]?.fontFamily || theme.fonts.heading, // Neue Machina
                                    color: elementStyles?.[titleId]?.color || theme.colors.text.primary, // #CBF400
                                    fontSize: elementStyles?.[titleId]?.fontSize ? `${elementStyles[titleId].fontSize}px` : '72px',
                                    fontWeight: 700,
                                    lineHeight: 1.1,
                                    margin: 0,
                                    textAlign: 'center',
                                    textShadow: '0 0 15px rgba(0, 0, 0, 0.9)',
                                    letterSpacing: '-1px',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    border: activeElementId === titleId ? '2px dashed #CBF400' : 'none',
                                    padding: '10px'
                                }}
                            >
                                {title}
                            </h1>
                        </div>
                    </foreignObject>
                </g>

                {/* Subtitle */}
                <g
                    transform={`translate(${subtitleAnim.x}, ${subtitleAnim.y + 60}) scale(${subtitleAnim.scale})`}
                    opacity={subtitleAnim.opacity}
                    style={{ filter: subtitleAnim.blur ? `blur(${subtitleAnim.blur}px)` : 'none' }}
                >
                    <foreignObject x={-400} y={0} width={800} height={100}>
                        <div
                            {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <p
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onElementClick) onElementClick(subtitleId, subtitle || '');
                                }}
                                style={{
                                    fontFamily: elementStyles?.[subtitleId]?.fontFamily || theme.fonts.body,
                                    color: elementStyles?.[subtitleId]?.color || theme.colors.text.secondary, // #DDDDDD
                                    fontSize: elementStyles?.[subtitleId]?.fontSize ? `${elementStyles[subtitleId].fontSize}px` : '20px',
                                    margin: 0,
                                    textAlign: 'center',
                                    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
                                    lineHeight: 1.5,
                                    cursor: 'pointer',
                                    border: activeElementId === subtitleId ? '2px dashed #CBF400' : 'none',
                                    padding: '5px'
                                }}
                            >
                                {subtitle || 'Deep Dive Explanation'}
                            </p>
                        </div>
                    </foreignObject>
                </g>

                {/* Presenter Box */}
                <g
                    transform={`translate(${presenterAnim.x}, ${presenterAnim.y + 160}) scale(${presenterAnim.scale})`}
                    opacity={presenterAnim.opacity}
                    style={{ filter: presenterAnim.blur ? `blur(${presenterAnim.blur}px)` : 'none' }}
                >
                    <foreignObject x={-150} y={0} width={300} height={60}>
                        <div
                            {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                            }}
                        >
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onElementClick) onElementClick(presenterId, 'PRESENTATION');
                                }}
                                style={{
                                    backgroundColor: theme.colors.primary, // #CBF400
                                    color: '#0F0F0F',
                                    padding: '10px 40px',
                                    fontSize: '18px',
                                    fontWeight: 600,
                                    boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    cursor: 'pointer',
                                    border: activeElementId === presenterId ? '2px dashed #000' : 'none',
                                    fontFamily: theme.fonts.body
                                }}
                            >
                                PRESENTATION
                            </div>
                        </div>
                    </foreignObject>
                </g>
            </g>

            {/* Footer */}
            <g transform={`translate(0, ${height - 40})`}>
                <text
                    x="60"
                    y="0"
                    fill={theme.colors.primary}
                    fontFamily={theme.fonts.body}
                    fontSize="16"
                    style={{ textShadow: "0 0 10px rgba(0, 0, 0, 0.8)" }}
                >
                    NarrateAI
                </text>
                <text
                    x={width - 60}
                    y="0"
                    fill={theme.colors.primary}
                    fontFamily={theme.fonts.body}
                    fontSize="16"
                    textAnchor="end"
                    style={{ textShadow: "0 0 10px rgba(0, 0, 0, 0.8)" }}
                >
                    Generated Video
                </text>
            </g>
        </g>
    );
};
