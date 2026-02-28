import { ThemeSlideRegistry } from '../types';
import { BrutalistIntroSlide } from './BrutalistIntroSlide';
import { BrutalistCommonSlide } from './BrutalistCommonSlide';
import { BrutalistTableSlide } from './BrutalistTableSlide';
import { BrutalistFlowchartSlide } from './BrutalistFlowchartSlide';
import { BrutalistGraphSlide } from './BrutalistGraphSlide';
import { BrutalistThankYouSlide } from './BrutalistThankYouSlide';

// For categories not yet implemented in Brutalist style, 
// we fallback to Common slide which is flexible, or specific placeholders.
// "Flowchart", "Graph", "ThankYou" will map to Common for now or similar.

export const BrutalistSlideRegistry: ThemeSlideRegistry = {
    intro: BrutalistIntroSlide,
    bullets: BrutalistCommonSlide,
    common: BrutalistCommonSlide,
    table: BrutalistTableSlide,
    flowchart: BrutalistFlowchartSlide,
    graph: BrutalistGraphSlide,
    coding: BrutalistCommonSlide, // Fallback
    thankyou: BrutalistThankYouSlide
};
