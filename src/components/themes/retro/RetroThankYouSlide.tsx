import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Retro Theme - Thank You Slide (from nslide5.html)
 * Features tilted ring with scattered sparkles
 */
export const RetroThankYouSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme
}) => {
    const { title } = slide;
    const titleAnim = useAnimation(localTime, 0, 1.5);
    const ringRotation = -14 + (localTime * 13); // 28s rotation, starts at -14deg

    // Sparkle positions (percentage-based)
    const sparkles = [
        { x: 0.18, y: 0.32, size: 64, speed: 6.2 },
        { x: 0.242, y: 0.295, size: 26, speed: 3.4 },
        { x: 0.862, y: 0.262, size: 34, speed: 4.4 },
        { x: 0.906, y: 0.235, size: 26, speed: 3.4 },
        { x: 0.57, y: 0.602, size: 64, speed: 6.2 },
        { x: 0.616, y: 0.568, size: 34, speed: 4.4 },
    ];

    return (
        <g opacity={titleAnim.eased}>
            {/* Curved Sparkle Path Definition */}
            <defs>
                <path
                    id="retroThankSparkle"
                    d="M50 4 C58 28 66 34 96 50 C66 58 58 66 50 96 C42 66 34 58 4 50 C34 34 42 28 50 4 Z"
                    fill={theme.colors.primary}
                />
            </defs>

            {/* Tilted Ring */}
            <g transform={`translate(${width / 2}, ${height / 2})`}>
                <g transform={`rotate(${ringRotation})`}>
                    <ellipse
                        rx={width * 0.43}
                        ry={height * 0.35}
                        fill="none"
                        stroke={theme.colors.primary}
                        strokeWidth="3"
                        strokeLinecap="round"
                        opacity="0.95"
                        style={{ filter: 'drop-shadow(0 14px 30px rgba(0,0,0,.08))' }}
                    />
                </g>
            </g>

            {/* Scattered Sparkles */}
            {sparkles.map((s, i) => {
                const sparkleRotation = localTime * (360 / s.speed);
                return (
                    <g key={i} transform={`translate(${s.x * width}, ${s.y * height}) rotate(${sparkleRotation})`}>
                        <use
                            href="#retroThankSparkle"
                            x={-50}
                            y={-50}
                            width={s.size}
                            height={s.size}
                            style={{ filter: 'drop-shadow(0 12px 20px rgba(0,0,0,.10))' }}
                        />
                    </g>
                );
            })}

            {/* Brown "THANK YOU" Text */}
            <text
                x={width / 2}
                y={height / 2 - 40}
                textAnchor="middle"
                fontSize="140"
                fontWeight="800"
                fill={theme.colors.text.secondary}
                fontFamily={fontFamily || theme.fonts.heading}
                style={{ textShadow: '0 1px 0 rgba(255,255,255,.45)', letterSpacing: '1px' }}
            >
                THANK
            </text>
            <text
                x={width / 2}
                y={height / 2 + 100}
                textAnchor="middle"
                fontSize="140"
                fontWeight="800"
                fill={theme.colors.text.secondary}
                fontFamily={fontFamily || theme.fonts.heading}
                style={{ textShadow: '0 1px 0 rgba(255,255,255,.45)', letterSpacing: '1px' }}
            >
                YOU
            </text>
        </g>
    );
};
