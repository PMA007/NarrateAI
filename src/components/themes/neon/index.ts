// Neon Theme Exports
export { NeonIntroSlide } from './NeonIntroSlide';
export { NeonFlowchartSlide } from './NeonFlowchartSlide';
export { NeonBulletsSlide } from './NeonBulletsSlide';
export { NeonCommonSlide } from './NeonCommonSlide';
export { NeonGraphSlide } from './NeonGraphSlide';
export { NeonThankYouSlide } from './NeonThankYouSlide';

import { ThemeSlideRegistry } from '../types';
import { NeonIntroSlide } from './NeonIntroSlide';
import { NeonFlowchartSlide } from './NeonFlowchartSlide';
import { NeonBulletsSlide } from './NeonBulletsSlide';
import { NeonCommonSlide } from './NeonCommonSlide';
import { NeonGraphSlide } from './NeonGraphSlide';
import { NeonThankYouSlide } from './NeonThankYouSlide';

/**
 * Neon Theme Slide Registry
 * Maps slide categories to their respective components
 */
export const NeonSlideRegistry: ThemeSlideRegistry = {
    intro: NeonIntroSlide,
    flowchart: NeonFlowchartSlide,
    bullets: NeonBulletsSlide,
    common: NeonCommonSlide,
    graph: NeonGraphSlide,
    table: NeonCommonSlide, // Fallback for table layout
    coding: NeonCommonSlide, // Fallback for coding
    thankyou: NeonThankYouSlide,
};
