export type ThemeType = 'neon' | 'retro';

export interface ThemeConfig {
    colors: {
        primary: string; // Used for accents, charts
        secondary: string; // Used for gradients
        background: string;
        text: {
            primary: string;
            secondary: string;
        };
        card: {
            background: string;
            border: string;
        };
    };
    fonts: {
        heading: string;
        body: string;
    };
    shapes: {
        radius: string;
    };
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
    'neon': {
        colors: {
            primary: '#06b6d4', // Cyan 500
            secondary: '#3b82f6', // Blue 500
            background: '#020617', // Slate 950
            text: {
                primary: '#f8fafc',
                secondary: '#94a3b8',
            },
            card: {
                background: '#1e293b',
                border: '#0f172a',
            },
        },
        fonts: {
            heading: 'Outfit, sans-serif',
            body: 'Inter, sans-serif',
        },
        shapes: {
            radius: '16px',
        },
    },
    'retro': {
        colors: {
            primary: '#243a8a',      // --ink (rings, stars, lines)
            secondary: '#d6dbe9',    // --border
            background: '#0b1220',   // page background
            text: {
                primary: '#1f3584',  // --ink2 (main title text)
                secondary: '#2b1b12', // --brown (Thank You text)
            },
            card: {
                background: '#f6f7fb', // --cardBg
                border: '#24418a',     // --cardBorder (dashed)
            },
        },
        fonts: {
            heading: 'Georgia, serif',
            body: '"Trebuchet MS", sans-serif',
        },
        shapes: {
            radius: '16px',
        },
    },
};

