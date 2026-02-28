import React from 'react';
import { Slide as SlideType } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
// No template wrapper needed for Brutalist as backgrounds are built-in to slides, 
// but we might need font injection.

interface SequenceProps {
    slide: SlideType;
    index: number;
    localTime: number;
    width: number;
    height: number;
    fontFamily: string;
    fontUrl: string;
    fontCss: string;
    elementAnimations?: Record<string, import('@/lib/store').AnimationConfig>;
    elementStyles?: Record<string, { fontFamily?: string; fontSize?: number; color?: string }>;
}

export const BrutalistSequence: React.FC<SequenceProps> = ({
    slide,
    index,
    localTime,
    width,
    height,
    fontFamily,
    fontUrl,
    fontCss,
    elementAnimations,
    elementStyles
}) => {
    return (
        <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
            {/* Font CSS */}
            <style>{fontCss}</style>

            {/* Brutalist Slide Content */}
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
            >
                <defs>
                    <style>
                        {fontCss}
                        {`text { font-family: ${fontFamily} !important; }`}
                    </style>
                </defs>

                <SlideRenderer
                    slide={slide}
                    index={index}
                    localTime={localTime}
                    width={width}
                    height={height}
                    fontFamily={fontFamily}
                    template="brutalist"
                    elementAnimations={elementAnimations}
                    elementStyles={elementStyles}
                />
            </svg>
        </div>
    );
};
