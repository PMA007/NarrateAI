import React from 'react';
import { Slide as SlideType } from '@/lib/store';
import { nanobannaTheme, nanobannaSlides } from '@/components/themes/nanobanna';
import { getSlideCategory, SlideComponentProps } from '@/components/themes/types';
import { FONT_OPTIONS } from '@/lib/fonts';
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
}

export const NanoBannaSequence: React.FC<SequenceProps> = ({
    slide,
    index,
    localTime,
    width,
    height,
    fontFamily: propFontFamily, // The font selected by user in UI
    fontUrl,
    fontCss,
    elementStyles = {},
    elementAnimations = {}
}) => {
    // 1. Determine Category
    const category = getSlideCategory(slide, index);

    // 2. Select Component
    const SlideComponent = nanobannaSlides[category] || nanobannaSlides['common'];

    const theme = nanobannaTheme;

    const props: SlideComponentProps = {
        slide,
        index,
        localTime,
        width,
        height,
        fontFamily: theme.fonts.body, // Use theme font
        theme: nanobannaTheme,
        elementStyles,
        elementAnimations
    };

    return (
        <div style={{
            width: width,
            height: height,
            position: 'relative',
            overflow: 'hidden'
        }}>
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
                        {/* We need to inject the font face if we want it to render in SVG exports reliably */}
                        {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Fira+Code&display=swap');`}
                    </style>
                </defs>

                <SlideComponent {...props} />
            </svg>
        </div>
    );
};
