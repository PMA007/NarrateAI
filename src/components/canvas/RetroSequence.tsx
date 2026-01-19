import React from 'react';
import { Slide as SlideType } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
import { RetroTemplate } from '@/components/templates/RetroTemplate';

interface SequenceProps {
    slide: SlideType;
    index: number;
    localTime: number;
    width: number;
    height: number;
    fontFamily: string;
    fontUrl: string;
    fontCss: string; // Recieve raw CSS
}

export const RetroSequence: React.FC<SequenceProps> = ({
    slide,
    index,
    localTime,
    width,
    height,
    fontFamily,
    fontUrl,
    fontCss
}) => {
    return (
        <div style={{ width, height, position: 'relative', overflow: 'hidden' }}>
            {/* Font CSS for foreignObject HTML content */}
            <style>{fontCss}</style>

            {/* 1. Retro Background - Forced */}
            <RetroTemplate localTime={localTime} />

            {/* 2. Retro Slide Content - Forced strict isolation */}
            <svg
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                xmlns="http://www.w3.org/2000/svg"
                style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }}
            >
                <defs>
                    {/* Inject raw Font CSS to ensure accurate capture by html-to-image */}
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
                    template="retro" // STRICTLY RETRO
                />
            </svg>
        </div>
    );
};
