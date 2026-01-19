import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

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
    theme
}) => {
    const { title, narration } = slide;
    const titleAnim = useAnimation(localTime, 0, 1.5);
    const rotation = localTime * 20; // 18s per rotation

    return (
        <g opacity={titleAnim.eased}>
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
            <text
                x={width / 2}
                y={height / 2 - 20}
                textAnchor="middle"
                fontSize="120"
                fill={theme.colors.text.primary}
                fontFamily={fontFamily || theme.fonts.heading}
                fontWeight="800"
                style={{ textShadow: '0 1px 0 rgba(255,255,255,.35)', letterSpacing: '0.5px' }}
            >
                {title}
            </text>

            {/* Subtitle */}
            {narration && (
                <text
                    x={width / 2}
                    y={height / 2 + 80}
                    textAnchor="middle"
                    fontSize="46"
                    fill={theme.colors.text.primary}
                    fontFamily={fontFamily || theme.fonts.heading}
                    opacity="0.98"
                    style={{ textShadow: '0 1px 0 rgba(255,255,255,.35)' }}
                >
                    Presented By Author
                </text>
            )}
        </g>
    );
};
