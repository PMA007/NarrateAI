import { Slide as SlideType, SlideContent } from '@/lib/store';
import { ThemeConfig, ThemeType } from '@/components/canvas/theme';

/**
 * Slide type categorization based on layout and content
 */
export type SlideCategory =
    | 'intro'      // Title/opening slide
    | 'flowchart'  // Process flow diagrams
    | 'bullets'    // Bullet point lists
    | 'common'     // General content slides (columns, grids, comparisons)
    | 'graph'      // Charts and graphs
    | 'thankyou';  // Closing/thank you slide

/**
 * Props passed to all slide components
 */
export interface SlideComponentProps {
    slide: SlideType;
    index: number;
    localTime: number;
    width: number;
    height: number;
    fontFamily: string;
    theme: ThemeConfig;
    onElementClick?: (elementId: string, value: string) => void;
    elementStyles?: Record<string, { fontFamily?: string; fontSize?: number; color?: string }>;
}

/**
 * Slide component type definition
 */
export type SlideComponent = React.FC<SlideComponentProps>;

/**
 * Theme slide registry - maps slide categories to components
 */
export interface ThemeSlideRegistry {
    intro: SlideComponent;
    flowchart: SlideComponent;
    bullets: SlideComponent;
    common: SlideComponent;
    graph: SlideComponent;
    thankyou: SlideComponent;
}

/**
 * Determine slide category from slide data
 */
export function getSlideCategory(slide: SlideType, index: number): SlideCategory {
    const { layout, title, content } = slide;

    // Check for thank you slide (usually last slide with "thank" in title)
    if (title?.toLowerCase().includes('thank')) {
        return 'thankyou';
    }

    // Check for title/intro slide (first slide or explicit title layout)
    if (index === 0 || layout === 'title') {
        return 'intro';
    }

    // Check for flowchart/process
    if (layout === 'process_flow' || content.flow_steps?.length) {
        return 'flowchart';
    }

    // Check for graph/chart
    if (layout === 'chart_bar' || layout === 'chart_line' || content.chart_data) {
        return 'graph';
    }

    // Check for bullet points
    if (layout === 'text_features' || (content.bullets?.length && !['columns_3', 'grid_cards', 'comparison'].includes(layout))) {
        return 'bullets';
    }

    // Default to common for other layouts (columns_3, grid_cards, comparison)
    return 'common';
}

/**
 * Animation helper functions
 */
export function easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
}

export function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

export function useAnimation(localTime: number, start: number, duration: number) {
    const progress = clamp((localTime - start) / duration, 0, 1);
    const eased = easeOutCubic(progress);
    return { progress, eased, active: localTime >= start };
}
