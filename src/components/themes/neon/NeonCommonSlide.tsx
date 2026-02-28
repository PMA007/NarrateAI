import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';

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
    theme,
    onElementClick,
    activeElementId,
    elementAnimations = {}
}) => {
    const { title, content, layout, slide_id } = slide;
    const bullets = content.bullets || [];

    // Title Animation
    const titleId = `slide-${slide_id}-title`;
    const titleConfig = elementAnimations[titleId] || { type: 'fade', duration: 1.5, delay: 0 };
    const titleAnim = useDynamicAnimation(localTime, 0, titleConfig);
    const isTitleActive = activeElementId === titleId;

    const renderTitle = () => (
        <g
            onClick={(e) => { e.stopPropagation(); onElementClick?.(titleId, title); }}
            style={{ cursor: 'pointer' }}
            opacity={titleAnim.opacity}
            transform={`translate(${titleAnim.x}, ${titleAnim.y}) scale(${titleAnim.scale})`}
        >
            {isTitleActive && (
                <rect x={width / 2 - 400} y={40} width={800} height={100} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,5" rx="8" />
            )}
            <text
                x={width / 2}
                y={120}
                textAnchor="middle"
                fontSize="72"
                fill={theme.colors.text.primary}
                fontFamily={theme.fonts.heading}
                fontWeight="bold"
                style={{ filter: titleAnim.blur ? `blur(${titleAnim.blur}px)` : 'none' }}
            >
                {title}
            </text>
        </g>
    );

    // Render 3-column layout
    if (layout === 'columns_3') {
        const items = bullets.slice(0, 3);
        const colWidth = (width - 400) / 3;

        return (
            <g>
                {renderTitle()}

                <g transform="translate(200, 250)">
                    {items.map((item, i) => {
                        const colId = `slide-${slide_id}-col-${i}`;
                        const colConfig = elementAnimations[colId] || { type: 'fade', duration: 1.0, delay: 1.5 + i * 0.4 };
                        const colAnim = useDynamicAnimation(localTime, 0, colConfig);
                        const isActive = activeElementId === colId;

                        return (
                            <g
                                key={i}
                                transform={`translate(${i * colWidth + colAnim.x}, ${colAnim.y}) scale(${colAnim.scale})`}
                                opacity={colAnim.opacity}
                                onClick={(e) => { e.stopPropagation(); onElementClick?.(colId, item); }}
                                style={{ cursor: 'pointer' }}
                            >
                                {isActive && (
                                    <rect x="-10" y="-10" width={colWidth - 20} height={520} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,5" rx="16" />
                                )}
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
                                <foreignObject x="20" y="120" width={colWidth - 80} height={360}>
                                    <div
                                        {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                                        style={{
                                            color: theme.colors.text.primary,
                                            fontFamily: theme.fonts.body,
                                            fontSize: '24px',
                                            lineHeight: '1.5',
                                            textAlign: 'center',
                                            filter: colAnim.blur ? `blur(${colAnim.blur}px)` : 'none'
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
                {renderTitle()}

                <g transform="translate(200, 180)">
                    {items.map((item, i) => {
                        const cardId = `slide-${slide_id}-card-${i}`;
                        const cardConfig = elementAnimations[cardId] || { type: 'fade', duration: 1.0, delay: 1.5 + i * 0.3 };
                        const cardAnim = useDynamicAnimation(localTime, 0, cardConfig);
                        const row = Math.floor(i / 2);
                        const col = i % 2;
                        const isActive = activeElementId === cardId;

                        return (
                            <g
                                key={i}
                                transform={`translate(${col * (cardWidth + 50) + cardAnim.x}, ${row * (cardHeight + 40) + cardAnim.y}) scale(${cardAnim.scale})`}
                                opacity={cardAnim.opacity}
                                onClick={(e) => { e.stopPropagation(); onElementClick?.(cardId, item); }}
                                style={{ cursor: 'pointer' }}
                            >
                                {isActive && (
                                    <rect x="-10" y="-10" width={cardWidth + 20} height={cardHeight + 20} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,5" rx="16" />
                                )}
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
                                            lineHeight: '1.5',
                                            filter: cardAnim.blur ? `blur(${cardAnim.blur}px)` : 'none'
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

        const leftId = `slide-${slide_id}-comp-left`;
        const rightId = `slide-${slide_id}-comp-right`;

        const leftConfig = elementAnimations[leftId] || { type: 'fade', duration: 1.0, delay: 1.5 };
        const rightConfig = elementAnimations[rightId] || { type: 'fade', duration: 1.0, delay: 2.0 };

        const leftAnim = useDynamicAnimation(localTime, 0, leftConfig);
        const rightAnim = useDynamicAnimation(localTime, 0, rightConfig);

        return (
            <g>
                {renderTitle()}

                {/* Left card */}
                <g
                    transform={`translate(${100 + leftAnim.x}, ${180 + leftAnim.y}) scale(${leftAnim.scale})`}
                    opacity={leftAnim.opacity}
                    onClick={(e) => { e.stopPropagation(); onElementClick?.(leftId, 'Option A'); }}
                    style={{ cursor: 'pointer' }}
                >
                    {activeElementId === leftId && (
                        <rect x="-10" y="-10" width={cardWidth + 20} height={620} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,5" rx="16" />
                    )}
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
                                paddingLeft: '20px',
                                filter: leftAnim.blur ? `blur(${leftAnim.blur}px)` : 'none'
                            }}>
                                {leftItems.map((item, i) => (
                                    <li key={i}>{item}</li>
                                ))}
                            </ul>
                        </div>
                    </foreignObject>
                </g>

                {/* Right card */}
                <g
                    transform={`translate(${100 + cardWidth + 50 + rightAnim.x}, ${180 + rightAnim.y}) scale(${rightAnim.scale})`}
                    opacity={rightAnim.opacity}
                    onClick={(e) => { e.stopPropagation(); onElementClick?.(rightId, 'Option B'); }}
                    style={{ cursor: 'pointer' }}
                >
                    {activeElementId === rightId && (
                        <rect x="-10" y="-10" width={cardWidth + 20} height={620} fill="none" stroke="#22d3ee" strokeWidth="2" strokeDasharray="5,5" rx="16" />
                    )}
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
                                paddingLeft: '20px',
                                filter: rightAnim.blur ? `blur(${rightAnim.blur}px)` : 'none'
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
            {renderTitle()}

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
