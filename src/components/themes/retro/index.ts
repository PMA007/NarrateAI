// Retro Theme Exports
export { RetroIntroSlide } from './RetroIntroSlide';
export { RetroFlowchartSlide } from './RetroFlowchartSlide';
export { RetroBulletsSlide } from './RetroBulletsSlide';
export { RetroCommonSlide } from './RetroCommonSlide';
export { RetroGraphSlide } from './RetroGraphSlide';
export { RetroThankYouSlide } from './RetroThankYouSlide';

import { ThemeSlideRegistry } from '../types';
import { RetroIntroSlide } from './RetroIntroSlide';
import { RetroFlowchartSlide } from './RetroFlowchartSlide';
import { RetroBulletsSlide } from './RetroBulletsSlide';
import { RetroCommonSlide } from './RetroCommonSlide';
import { RetroGraphSlide } from './RetroGraphSlide';
import { RetroThankYouSlide } from './RetroThankYouSlide';

/**
 * Retro Theme Slide Registry
 * Maps slide categories to their respective components
 */
export const RetroSlideRegistry: ThemeSlideRegistry = {
    intro: RetroIntroSlide,
    flowchart: RetroFlowchartSlide,
    bullets: RetroBulletsSlide,
    common: RetroCommonSlide,
    graph: RetroGraphSlide,
    table: RetroCommonSlide, // Fallback
    coding: RetroCommonSlide, // Fallback
    thankyou: RetroThankYouSlide,
};
