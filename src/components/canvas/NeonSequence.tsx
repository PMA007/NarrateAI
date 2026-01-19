import React from 'react';
import { Slide as SlideType } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
import { NeonTemplate } from '@/components/templates/NeonTemplate';

interface SequenceProps {
    slide: SlideType;
    index: number;
    localTime: number;
    width: number;
    height: number;
    fontFamily: string;
    fontUrl: string;
    fontCss: string;
}

export const NeonSequence: React.FC<SequenceProps> = ({
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
        <div style={{ width, height, position: 'relative', overflow: 'hidden', background: '#020617' }}>
            {/* Font CSS for foreignObject HTML content */}
            <style>{fontCss}</style>

            {/* 1. Neon Background */}
            <NeonTemplate localTime={localTime} />

            {/* 2. Neon Slide Content */}
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
                    {/* Neon Gradient Defs */}
                    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#1e293b" />
                        <stop offset="100%" stopColor="#0f172a" />
                    </linearGradient>
                </defs>

                <SlideRenderer
                    slide={slide}
                    index={index}
                    localTime={localTime}
                    width={width}
                    height={height}
                    fontFamily={fontFamily}
                    template="neon" // STRICTLY NEON
                />
            </svg>
        </div>
    );
};
