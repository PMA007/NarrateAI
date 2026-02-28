import React from 'react';
import { SlideComponentProps, useDynamicAnimation } from '../types';
import { CodingCanvas } from '../../canvas/CodingCanvas';

export const NanoBannaCodingSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    theme,
    elementAnimations,
    previewElementId,
    previewTime
}) => {
    const { title, content } = slide;
    const { code_snippet, highlight_lines } = content;

    const getTime = (id: string) => {
        if (previewElementId === id && previewTime !== undefined) return previewTime;
        return localTime;
    };

    const titleAnim = useDynamicAnimation(getTime('title'), 0, elementAnimations?.['title']);
    const codeAnim = useDynamicAnimation(getTime('code'), 0.3, elementAnimations?.['code']);

    return (
        <g>
            {/* Background handled by Template */}

            {/* Title Top Left */}
            <g
                transform={`translate(40, 60)`}
                opacity={titleAnim.opacity}
            >
                <foreignObject x={0} y={0} width={width - 80} height={60}>
                    <h2 style={{
                        fontFamily: theme.fonts.heading,
                        color: theme.colors.primary,
                        fontSize: '32px',
                        fontWeight: 700,
                        margin: 0
                    }}>
                        {title}
                    </h2>
                </foreignObject>
            </g>

            {/* Code Canvas Container */}
            <g
                transform={`translate(${codeAnim.x + 40}, ${codeAnim.y + 120}) scale(${codeAnim.scale})`}
                opacity={codeAnim.opacity}
            >
                <foreignObject x={0} y={0} width={width - 80} height={height - 180}>
                    {/* Render the VS Code Canvas */}
                    <div style={{ width: '100%', height: '100%' }}>
                        <CodingCanvas
                            code={code_snippet || '// No code provided'}
                            highlightLines={highlight_lines || []}
                            theme="dark"
                            fontSize={18}
                        />
                    </div>
                </foreignObject>
            </g>
        </g>
    );
};
