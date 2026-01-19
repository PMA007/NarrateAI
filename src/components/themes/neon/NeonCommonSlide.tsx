import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';

/**
 * Neon Theme - Common Slide (Columns, Grids, Comparison)
 * Handles columns_3, grid_cards, and comparison layouts
 */
export const NeonCommonSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme
}) => {
    const { title, content, layout } = slide;
    const bullets = content.bullets || [];
    const titleAnim = useAnimation(localTime, 0, 1.5);

    // Render 3-column layout
    if (layout === 'columns_3') {
        const items = bullets.slice(0, 3);
        const colWidth = (width - 400) / 3;

        return (
            <g>
                <text
                    x={width / 2}
                    y={120}
                    textAnchor="middle"
                    fontSize="72"
                    fill={theme.colors.text.primary}
                    fontFamily={theme.fonts.heading}
                    fontWeight="bold"
                    opacity={titleAnim.eased}
                >
                    {title}
                </text>

                <g transform="translate(200, 250)">
                    {items.map((item, i) => {
                        const colAnim = useAnimation(localTime, 1.5 + i * 0.4, 1.0);
                        return (
                            <g key={i} transform={`translate(${i * colWidth}, 0)`} opacity={colAnim.eased}>
                                {/* Column card */}
                                <rect
                                    width={colWidth - 40}
                                    height={500}
                                    rx="16"
                                    fill={theme.colors.card.background}
                                    stroke={theme.colors.primary}
                                    strokeWidth="2"
                                    style={{
                                        filter: `drop-shadow(0 0 15px ${theme.colors.primary}30)`
                                    }}
                                />

                                {/* Icon circle */}
                                <circle
                                    cx={(colWidth - 40) / 2}
                                    cy="60"
                                    r="40"
                                    fill="none"
                                    stroke={theme.colors.primary}
                                    strokeWidth="2"
                                />
                                <text
                                    x={(colWidth - 40) / 2}
                                    y="70"
                                    textAnchor="middle"
                                    fontSize="32"
                                    fill={theme.colors.primary}
                                    fontWeight="bold"
                                >
                                    {i + 1}
                                </text>

                                {/* Content */}
                                <foreignObject x="20" y="120" width={colWidth - 80} height="360">
                                    <div
                                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                        style={{
                                            color: theme.colors.text.primary,
                                            fontFamily: theme.fonts.body,
                                            fontSize: '24px',
                                            lineHeight: '1.5',
                                            textAlign: 'center'
                                        }}
                                    >
                                        {item}
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </g>
            </g>
        );
    }

    // Render grid cards layout (2x2)
    if (layout === 'grid_cards') {
        const items = bullets.slice(0, 4);
        const cardWidth = (width - 500) / 2;
        const cardHeight = 280;

        return (
            <g>
                <text
                    x={width / 2}
                    y={100}
                    textAnchor="middle"
                    fontSize="64"
                    fill={theme.colors.text.primary}
                    fontFamily={theme.fonts.heading}
                    fontWeight="bold"
                    opacity={titleAnim.eased}
                >
                    {title}
                </text>

                <g transform="translate(200, 180)">
                    {items.map((item, i) => {
                        const cardAnim = useAnimation(localTime, 1.5 + i * 0.3, 1.0);
                        const row = Math.floor(i / 2);
                        const col = i % 2;

                        return (
                            <g
                                key={i}
                                transform={`translate(${col * (cardWidth + 50)}, ${row * (cardHeight + 40)})`}
                                opacity={cardAnim.eased}
                            >
                                <rect
                                    width={cardWidth}
                                    height={cardHeight}
                                    rx="16"
                                    fill={theme.colors.card.background}
                                    stroke={theme.colors.primary}
                                    strokeWidth="2"
                                />

                                <foreignObject x="30" y="30" width={cardWidth - 60} height={cardHeight - 60}>
                                    <div
                                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                        style={{
                                            color: theme.colors.text.primary,
                                            fontFamily: theme.fonts.body,
                                            fontSize: '24px',
                                            lineHeight: '1.5'
                                        }}
                                    >
                                        {item}
                                    </div>
                                </foreignObject>
                            </g>
                        );
                    })}
                </g>
            </g>
        );
    }

    // Render comparison layout (2 columns side by side)
    if (layout === 'comparison') {
        const leftItems = bullets.slice(0, Math.ceil(bullets.length / 2));
        const rightItems = bullets.slice(Math.ceil(bullets.length / 2));
        const cardWidth = (width - 300) / 2;

        return (
            <g>
                <text
                    x={width / 2}
                    y={100}
                    textAnchor="middle"
                    fontSize="64"
                    fill={theme.colors.text.primary}
                    fontFamily={theme.fonts.heading}
                    fontWeight="bold"
                    opacity={titleAnim.eased}
                >
                    {title}
                </text>

                {/* Left card */}
                <g transform="translate(100, 180)" opacity={useAnimation(localTime, 1.5, 1.0).eased}>
                    <rect
                        width={cardWidth}
                        height={600}
                        rx="16"
                        fill={theme.colors.card.background}
                        stroke={theme.colors.primary}
                        strokeWidth="2"
                    />
                    <text
                        x={cardWidth / 2}
                        y="50"
                        textAnchor="middle"
                        fontSize="32"
                        fill={theme.colors.primary}
                        fontWeight="bold"
                        fontFamily={theme.fonts.heading}
                    >
                        Option A
                    </text>
                    <foreignObject x="30" y="80" width={cardWidth - 60} height="480">
                        <div {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}>
                            <ul style={{
                                color: theme.colors.text.primary,
                                fontFamily: theme.fonts.body,
                                fontSize: '24px',
                                lineHeight: '2',
                                paddingLeft: '20px'
                            }}>
                                {leftItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </foreignObject>
                </g>

                {/* Right card */}
                <g transform={`translate(${100 + cardWidth + 50}, 180)`} opacity={useAnimation(localTime, 2.0, 1.0).eased}>
                    <rect
                        width={cardWidth}
                        height={600}
                        rx="16"
                        fill={theme.colors.card.background}
                        stroke={theme.colors.secondary}
                        strokeWidth="2"
                    />
                    <text
                        x={cardWidth / 2}
                        y="50"
                        textAnchor="middle"
                        fontSize="32"
                        fill={theme.colors.secondary}
                        fontWeight="bold"
                        fontFamily={theme.fonts.heading}
                    >
                        Option B
                    </text>
                    <foreignObject x="30" y="80" width={cardWidth - 60} height="480">
                        <div {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}>
                            <ul style={{
                                color: theme.colors.text.primary,
                                fontFamily: theme.fonts.body,
                                fontSize: '24px',
                                lineHeight: '2',
                                paddingLeft: '20px'
                            }}>
                                {rightItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </foreignObject>
                </g>
            </g>
        );
    }

    // Default fallback - simple content display
    return (
        <g>
            <text
                x={width / 2}
                y={120}
                textAnchor="middle"
                fontSize="72"
                fill={theme.colors.text.primary}
                fontFamily={theme.fonts.heading}
                fontWeight="bold"
                opacity={titleAnim.eased}
            >
                {title}
            </text>

            <foreignObject x="200" y="200" width={width - 400} height={height - 300}>
                <div
                    {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                    style={{
                        color: theme.colors.text.primary,
                        fontFamily: theme.fonts.body,
                        fontSize: '32px',
                        lineHeight: '1.6'
                    }}
                >
                    {bullets.map((b, i) => <p key={i}>{b}</p>)}
                </div>
            </foreignObject>
        </g>
    );
};
