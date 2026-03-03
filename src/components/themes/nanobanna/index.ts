import { ThemeConfig } from '@/components/canvas/theme';
import { ThemeSlideRegistry } from '@/components/themes/types';
import { NanoBannaIntroSlide } from '@/components/themes/nanobanna/NanoBannaIntroSlide';
import { NanoBannaCommonSlide } from '@/components/themes/nanobanna/NanoBannaCommonSlide';
import { NanoBannaCodingSlide } from '@/components/themes/nanobanna/NanoBannaCodingSlide';
import { NanoBannaGraphSlide } from '@/components/themes/nanobanna/NanoBannaGraphSlide';
import { NanoBannaFlowchartSlide } from '@/components/themes/nanobanna/NanoBannaFlowchartSlide';
import { NanoBannaTableSlide } from '@/components/themes/nanobanna/NanoBannaTableSlide';
import { NanoBannaNetworkSlide } from '@/components/themes/nanobanna/NanoBannaNetworkSlide';

export const nanobannaTheme: ThemeConfig = {
    colors: {
        background: '#0F0F11', // Deep Black
        surface: '#1E1E23', // Dark Grey
        primary: '#FFD700', // Banana Yellow
        secondary: '#FFFFFF', // White
        text: {
            primary: '#FFFFFF',
            secondary: '#CCCCCC',
            accent: '#FFD700'
        },
        grid: 'rgba(255, 255, 255, 0.05)',
        card: {
            background: '#1E1E23',
            border: '#333333',
        },
    },
    fonts: {
        heading: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
        mono: "'Fira Code', monospace"
    },
    textSizes: {
        h1: 64,
        h2: 48,
        h3: 32,
        body: 24,
        mono: 20
    },
    shapes: {
        radius: '10px',
    }
};

export const nanobannaSlides: ThemeSlideRegistry = {
    intro: NanoBannaIntroSlide,
    bullets: NanoBannaCommonSlide,
    common: NanoBannaCommonSlide,
    coding: NanoBannaCodingSlide,
    graph: NanoBannaGraphSlide,
    flowchart: NanoBannaFlowchartSlide,
    table: NanoBannaTableSlide,
    network: NanoBannaNetworkSlide,
    thankyou: NanoBannaIntroSlide // Reuse Intro for Thank You
};
