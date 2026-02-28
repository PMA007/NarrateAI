import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

/**
 * Retro Theme - Intro/Title Slide
 * Features rotating rings with star decorations (from nslide1.html)
 */
export const RetroIntroSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme,
    onElementClick,
    activeElementId,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, narration } = slide;
    const rotation = localTime * 20; // 18s per rotation

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
    const subtitleAnim = useDynamicAnimation(subtitleTime, 0.5, subtitleConfig);

    // RetroIntroSlide - Title Color Logic


    return (
        <g>
            {/* Definition for Curved Sparkle */}
            <defs>
                <path
                    id="retroStar"
                    d="M30 2.4 C34.8 16.8 39.6 20.4 57.6 30 C39.6 34.8 34.8 39.6 30 57.6 C25.2 39.6 20.4 34.8 2.4 30 C20.4 20.4 25.2 16.8 30 2.4 Z"
                    fill={theme.colors.primary}
                />
            </defs>

            {/* Centered Rings Group */}
            <g transform={`translate(${width / 2}, ${height / 2})`}>
                {/* Outer Ring & Stars (Clockwise) */}
                <g transform={`rotate(${rotation})`}>
                    <ellipse
                        rx={width * 0.38}
                        ry={height * 0.38}
                        fill="none"
                        stroke={theme.colors.primary}
                        strokeWidth="3"
                        style={{ filter: 'drop-shadow(0 14px 30px rgba(0,0,0,.08))' }}
                    />

                    {/* Stars positioned on the ring's orbit */}
                    {/* Top Cluster */}
                    <g transform={`translate(0, ${-height * 0.38})`}>
                        <use href="#retroStar" x="-30" y="-30" width="60" height="60" />
                        <use href="#retroStar" x="20" y="-10" transform="scale(0.5)" />
                    </g>

                    {/* Bottom Cluster */}
                    <g transform={`translate(0, ${height * 0.38})`}>
                        <use href="#retroStar" x="-30" y="-30" width="60" height="60" />
                        <use href="#retroStar" x="-40" y="-10" transform="scale(0.6)" />
                    </g>

                    {/* Left */}
                    <g transform={`translate(${-width * 0.38}, 0)`}>
                        <use href="#retroStar" x="-30" y="-30" width="60" height="60" />
                    </g>

                    {/* Right */}
                    <g transform={`translate(${width * 0.38}, 0)`}>
                        <use href="#retroStar" x="-30" y="-30" width="60" height="60" />
                        <use href="#retroStar" x="-30" y="20" transform="scale(0.5)" />
                    </g>
                </g>

                {/* Inner Ring (Counter-Clockwise) */}
                <g transform={`rotate(${-rotation})`}>
                    <ellipse
                        rx={width * 0.35}
                        ry={height * 0.35}
                        fill="none"
                        stroke={theme.colors.primary}
                        strokeWidth="2"
                        opacity="0.95"
                        style={{ filter: 'drop-shadow(0 1px 0 rgba(255,255,255,.35))' }}
                    />
                </g>
            </g>

            {/* Main Title */}
            {/* Main Content Area - Title & Caption */}
            <foreignObject x={width * 0.1} y={height * 0.3} width={width * 0.8} height={height * 0.4}>
                <div
                    {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        textAlign: 'center',
                        color: theme.colors.text.primary,
                        fontFamily: fontFamily || theme.fonts.heading,
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Title Wrapper for Animation & Selection */}
                    <div
                        style={{
                            opacity: titleAnim.opacity,
                            transform: `translate(${titleAnim.x}px, ${titleAnim.y}px) scale(${titleAnim.scale})`,
                            filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none',
                            border: activeElementId === titleId ? '2px dashed #22d3ee' : '2px solid transparent',
                            borderRadius: '8px',
                            padding: '10px',
                            display: 'inline-block'
                        }}
                    >
                        <h1
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onElementClick) onElementClick(titleId, title);
                            }}
                            style={{
                                fontSize: '90px',
                                fontWeight: '800',
                                margin: '0',
                                lineHeight: '1.0',
                                letterSpacing: '-2px',
                                color: theme.colors.text.primary, // Direct color usage
                                cursor: 'pointer',
                                pointerEvents: 'auto'
                            }}
                        >
                            {title}
                        </h1>
                    </div>

                    {/* Caption/Subtitle Wrapper */}
                    <div
                        style={{
                            marginTop: '24px',
                            opacity: subtitleAnim.opacity,
                            transform: `translate(${subtitleAnim.x}px, ${subtitleAnim.y}px) scale(${subtitleAnim.scale})`,
                            filter: subtitleAnim.blur ? `blur(${subtitleAnim.blur}px)` : 'none',
                            border: activeElementId === subtitleId ? '2px dashed #22d3ee' : '2px solid transparent',
                            borderRadius: '8px',
                            padding: '5px',
                            display: 'inline-block'
                        }}
                    >
                        <p
                            onClick={(e) => {
                                e.stopPropagation();
                                if (onElementClick) onElementClick(subtitleId, slide.subtitle || '');
                            }}
                            style={{
                                fontSize: '36px',
                                fontWeight: '500',
                                fontStyle: 'italic',
                                color: theme.colors.text.secondary, // Vintage Brown
                                maxWidth: '100%',
                                margin: 0,
                                lineHeight: '1.3',
                                letterSpacing: '0.5px',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                fontFamily: theme.fonts.heading
                            }}>
                            {slide.subtitle || 'Click to add a tagline...'}
                        </p>
                    </div>
                </div>
            </foreignObject >
        </g >
    );
};
