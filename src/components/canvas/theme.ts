export type ThemeType = 'neon' | 'retro' | 'brutalist' | 'nanobanna';

export interface ThemeConfig {
    colors: {
        primary: string; // Used for accents, charts
        secondary: string; // Used for gradients
        background: string;
        text: {
            primary: string;
            secondary: string;
            accent?: string; // Optional accent
        };
        card: {
            background: string;
            border: string;
        };
        grid?: string; // Optional grid color
        surface?: string; // Optional surface color
    };
    fonts: {
        heading: string;
        body: string;
        mono?: string; // Optional mono font
    };
    textSizes: {
        h1: number;
        h2: number;
        h3: number;
        body: number;
        mono: number;
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
        textSizes: {
            h1: 64,
            h2: 48,
            h3: 32,
            body: 24,
            mono: 20
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
        textSizes: {
            h1: 64,
            h2: 48,
            h3: 32,
            body: 24,
            mono: 20
        },
        shapes: {
            radius: '16px',
        },
    },
    'brutalist': {
        colors: {
            primary: '#CBF400',      // Acid Green
            secondary: '#0F0F0F',    // Dark Grey
            background: '#0F0F0F',   // Dark Background
            text: {
                primary: '#CBF400',  // Acid Green (Headings)
                secondary: '#DDDDDD', // Off-white (Body)
            },
            card: {
                background: 'rgba(15, 15, 15, 0.05)',
                border: '#0F0F0F',
            },
        },
        fonts: {
            heading: '"Space Grotesk", sans-serif',
            body: '"Roboto Mono", monospace',
        },
        textSizes: {
            h1: 64,
            h2: 48,
            h3: 32,
            body: 24,
            mono: 20
        },
        shapes: {
            radius: '2px', // Sharp edges
        },
    },
    'nanobanna': {
        colors: {
            primary: '#A78BFA',      // Aurora Violet
            secondary: '#34D399',    // Aurora Emerald
            background: '#06060F',   // Deep Black
            surface: '#0F0F1E',      // Dark Surface
            grid: 'rgba(167, 139, 250, 0.06)',
            text: {
                primary: '#F1F5F9',
                secondary: '#94A3B8',
                accent: '#A78BFA'
            },
            card: {
                background: '#13132A',
                border: 'rgba(167, 139, 250, 0.2)',
            },
        },
        fonts: {
            heading: '"Inter", sans-serif',
            body: '"Inter", sans-serif',
            mono: '"Fira Code", monospace'
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
        },
    },
};

