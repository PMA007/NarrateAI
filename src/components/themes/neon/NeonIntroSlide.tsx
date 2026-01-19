import React from 'react';
import { SlideComponentProps, useAnimation } from '../types';
import { AnimatedTitle } from '@/components/ui/floating-paths';

/**
 * Neon Theme - Intro/Title Slide
 * Features animated paths background with glowing title
 */
export const NeonIntroSlide: React.FC<SlideComponentProps> = ({
    slide,
    localTime,
    width,
    height,
    fontFamily,
    theme,
    onElementClick,
    elementStyles = {}
}) => {
    const { title, content, narration } = slide;
    const getStyle = (id: string) => elementStyles[id] || {};

    return (
        <g>
            <foreignObject width={width} height={height}>
                <div
                    {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any}
                    className="dark w-full h-full"
                    style={{
                        fontFamily: getStyle('title').fontFamily || fontFamily,
                        cursor: 'pointer'
                    }}
                    onClick={(e) => {
                        if (onElementClick) {
                            e.stopPropagation();
                            onElementClick('title', title);
                        }
                    }}
                >
                    <AnimatedTitle
                        title={title}
                        subtitle={narration || content.bullets?.[0]}
                        localTime={localTime}
                    />
                </div>
            </foreignObject>
        </g>
    );
};
