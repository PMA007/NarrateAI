import { Slide as SlideType, SlideContent, AnimationConfig } from '@/lib/store';
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
    | 'table'      // Table layout
    | 'coding'     // Code explanation
    | 'network'    // Graph network diagrams
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
    activeElementId?: string | null;
    onElementClick?: (elementId: string, value: string) => void;
    // Duplicate declaration removed in previous fix, ensure only one exists
    elementStyles?: Record<string, { fontFamily?: string; fontSize?: number; color?: string }>;
    elementAnimations?: Record<string, AnimationConfig>;
    previewElementId?: string | null;
    previewTime?: number;
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
    table: SlideComponent;
    coding: SlideComponent;
    network?: SlideComponent;
    thankyou: SlideComponent;
}

/**
 * Determine slide category from slide data
 */
export function getSlideCategory(slide: SlideType, index: number): SlideCategory {
    const { layout, title, content } = slide;

    // Check for coding slide
    if (layout === 'coding' || content.code_snippet) {
        return 'coding';
    }

    // Check for network graph slide
    if (layout === 'network' || content.network_data) {
        return 'network';
    }

    // Check for thank you slide (usually last slide with "thank" in title)
    if (title?.toLowerCase().includes('thank')) {
        return 'thankyou';
    }

    // Check for title/intro slide (first slide or explicit title layout)
    if (index === 0 || layout === 'title') {
        return 'intro';
    }

    // Check for table
    if (layout === 'table' || content.table_data) {
        return 'table';
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

export function elasticOut(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
        ? 0
        : t === 1
            ? 1
            : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

export function clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
}

export function useAnimation(localTime: number, start: number, duration: number) {
    const progress = clamp((localTime - start) / duration, 0, 1);
    const eased = easeOutCubic(progress);
    return { progress, eased, active: localTime >= start };
}

export function useDynamicAnimation(
    localTime: number,
    baseStart: number,
    config?: AnimationConfig
) {
    const type = config?.type || 'none';
    const duration = config?.duration ?? 1.0;
    const delay = config?.delay ?? 0;
    // const ease = config?.ease || 'easeOut'; // Use simplified ease for now

    // Force visibility at start for editor preview (if localTime is exactly 0)
    if (localTime === 0 && delay > 0) {
        return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };
    }

    const startTime = baseStart + delay;
    const progress = clamp((localTime - startTime) / duration, 0, 1);

    // Choose Easing
    let eased = easeOutCubic(progress);
    if (type === 'none') return { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };
    if (config?.ease === 'linear') eased = progress;

    const result = { opacity: 1, x: 0, y: 0, scale: 1, blur: 0 };

    switch (type) {
        case 'fade':
            result.opacity = eased;
            break;
        case 'slide_up':
            result.opacity = eased;
            result.y = (1 - eased) * 100;
            break;
        case 'slide_down':
            result.opacity = eased;
            result.y = -(1 - eased) * 100;
            break;
        case 'scale_in':
            result.opacity = eased;
            result.scale = eased;
            break;
        case 'typewriter': // Simplified as fade for now, or maybe steps?
            result.opacity = Math.floor(progress * 4) / 4;
            break;
        case 'blur_in':
            result.opacity = eased;
            result.blur = (1 - eased) * 10;
            break;
        default:
            result.opacity = eased;
    }

    return result;
}
