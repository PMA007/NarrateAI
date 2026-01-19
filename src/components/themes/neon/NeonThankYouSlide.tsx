import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Neon Theme - Thank You Slide
 * Features pulsing glow effect with centered thank you message
 */
export const NeonThankYouSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme
}) => {
    const { title } = slide;
    const titleAnim = useAnimation(localTime, 0, 1.5);

    // Pulsing effect
    const pulse = 0.8 + Math.sin(localTime * 2) * 0.2;

    return (
        <g opacity={titleAnim.eased}>
            {/* Decorative rings */}
            <circle
                cx={width / 2}
                cy={height / 2}
                r={300}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="2"
                opacity={0.3 * pulse}
            />
            <circle
                cx={width / 2}
                cy={height / 2}
                r={350}
                fill="none"
                stroke={theme.colors.secondary}
                strokeWidth="1"
                opacity={0.2 * pulse}
            />
            <circle
                cx={width / 2}
                cy={height / 2}
                r={400}
                fill="none"
                stroke={theme.colors.primary}
                strokeWidth="1"
                opacity={0.1 * pulse}
            />

            {/* Main title with glow */}
            <text
                x={width / 2}
                y={height / 2 - 20}
                textAnchor="middle"
                fontSize="140"
                fill={theme.colors.text.primary}
                fontFamily={theme.fonts.heading}
                fontWeight="bold"
                style={{
                    filter: `drop-shadow(0 0 30px ${theme.colors.primary}50)`
                }}
            >
                {title || 'THANK YOU'}
            </text>

            {/* Subtitle */}
            <text
                x={width / 2}
                y={height / 2 + 80}
                textAnchor="middle"
                fontSize="36"
                fill={theme.colors.text.secondary}
                fontFamily={theme.fonts.body}
                opacity={0.8}
            >
                Questions?
            </text>

            {/* Bottom accent line */}
            <rect
                x={width / 2 - 100}
                y={height / 2 + 120}
                width={200}
                height={4}
                rx="2"
                fill={theme.colors.primary}
                style={{
                    filter: `drop-shadow(0 0 10px ${theme.colors.primary})`
                }}
            />
        </g>
    );
};
