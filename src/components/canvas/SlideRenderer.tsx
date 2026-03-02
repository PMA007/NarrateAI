import React from 'react';
import { Slide as SlideType } from '@/lib/store';
import { THEMES, ThemeType } from './theme';
import { getSlideCategory, SlideComponentProps } from '@/components/themes/types';
import { NeonSlideRegistry } from '@/components/themes/neon';
import { RetroSlideRegistry } from '@/components/themes/retro';
import { BrutalistSlideRegistry } from '@/components/themes/brutalist';
import { nanobannaSlides } from '@/components/themes/nanobanna';

interface SlideRendererProps {
    slide: SlideType;
    index: number;
    localTime: number;
    width: number;
    height: number;
    fontFamily: string;
    template?: ThemeType;
    activeElementId?: string | null;
    onElementClick?: (elementId: string, value: string) => void;
    elementStyles?: Record<string, { fontFamily?: string; fontSize?: number; color?: string }>;
    elementAnimations?: Record<string, import('@/lib/store').AnimationConfig>;
    previewElementId?: string | null;
    previewTime?: number;
}

/**
 * SlideRenderer - Central component that selects and renders the appropriate slide
 * based on the theme and slide content type
 */
export function SlideRenderer({
    slide,
    index,
    localTime,
    width,
    height,
    fontFamily,
    template = 'neon',
    onElementClick,
    elementStyles = {},
    activeElementId,
    elementAnimations = {},
    previewElementId,
    previewTime
}: SlideRendererProps) {
    // Get the theme configuration
    const baseTheme = THEMES[template] || THEMES['neon'];
    
    // Override fonts if fontFamily prop is provided
    // This allows the Studio font selector to control all slides
    const theme = React.useMemo(() => {
        if (!fontFamily) return baseTheme;
        return {
            ...baseTheme,
            fonts: {
                ...baseTheme.fonts,
                heading: fontFamily,
                body: fontFamily,
                // Do not override mono unless requested? Usually mono should stay mono for code.
            }
        };
    }, [baseTheme, fontFamily]);

    // Determine which slide category to use
    const category = getSlideCategory(slide, index);

    // Select the appropriate registry based on theme
    const registry =
        template === 'retro' ? RetroSlideRegistry :
            template === 'brutalist' ? BrutalistSlideRegistry :
                template === 'nanobanna' ? nanobannaSlides :
                    NeonSlideRegistry;

    // Get the slide component for this category
    const SlideComponent = registry[category];

    if (!SlideComponent) {
        console.warn(`No slide component found for category: ${category}`);
        return null;
    }

    // Prepare props for the slide component
    const props: SlideComponentProps = {
        slide,
        index,
        localTime,
        width,
        height,
        fontFamily,
        theme,
        activeElementId,
        onElementClick,
        elementStyles,
        elementAnimations,
        previewElementId,
        previewTime
    };

    return <SlideComponent {...props} />;
}
