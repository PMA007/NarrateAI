import React from 'react';
import { Slide as SlideType } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
import { NanoBannaTemplate } from '@/components/templates/NanoBannaTemplate'; // Import Template

interface SequenceProps {
    slide: SlideType;
    index: number;
    localTime: number;
    width: number;
    height: number;
    fontFamily: string;
    fontUrl?: string; // Optional, can use internal map
    fontCss?: string; // Pre-fetched CSS text
    elementStyles?: Record<string, any>;
    elementAnimations?: Record<string, any>;
    fontScale?: number;
}

export const NanoBannaSequence: React.FC<SequenceProps> = ({
    slide,
    index,
    localTime,
    width,
    height,
    fontFamily,
    fontUrl,
    fontCss,
    elementStyles = {},
    elementAnimations = {},
    fontScale = 1.0
}) => {
    return (
        <div style={{
            width: width,
            height: height,
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Font CSS */}
            <style>{fontCss}</style>

            {/* Template Background Layer */}
            <NanoBannaTemplate />

            {/* SVG Layer */}
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', inset: 0 }}
            >
                <defs>
                    <style>
                        {fontCss}
                        {/* We need to inject the font face if we want it to render in SVG exports reliably */}
                        {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Fira+Code&display=swap');`}
                    </style>
                </defs>

                <SlideRenderer
                    slide={slide}
                    index={index}
                    localTime={localTime}
                    width={width}
                    height={height}
                    fontFamily={fontFamily}
                    fontScale={fontScale}
                    template="nanobanna"
                    elementAnimations={elementAnimations}
                    elementStyles={elementStyles}
                />
            </svg>
        </div>
    );
};
