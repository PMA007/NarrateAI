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
        background: '#06060F',   // Aurora Black
        surface: '#0F0F1E',      // Deep Surface
        primary: '#A78BFA',      // Violet-400
        secondary: '#34D399',    // Emerald-400
        text: {
            primary: '#F1F5F9',
            secondary: '#94A3B8',
            accent: '#A78BFA'
        },
        grid: 'rgba(167, 139, 250, 0.06)',
        card: {
            background: '#13132A',
            border: 'rgba(167, 139, 250, 0.2)',
        },
    },
    fonts: {
        heading: "'Inter', sans-serif",
        body: "'Inter', sans-serif",
        mono: "'Fira Code', monospace"
    },
    textSizes: {
        h1: 78,
        h2: 56,
        h3: 40,
        body: 28,
        mono: 22
    },
    shapes: {
        radius: '12px',
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
