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
        shapes: {
            radius: '2px', // Sharp edges
        },
    },
    'nanobanna': {
        colors: {
            primary: '#FFD700',      // Banana Yellow
            secondary: '#FFFFFF',    // White
            background: '#0F0F11',   // Deep Black
            surface: '#1E1E23',      // Dark Grey Surface
            grid: 'rgba(255, 255, 255, 0.05)',
            text: {
                primary: '#FFFFFF',
                secondary: '#CCCCCC',
                accent: '#FFD700'
            },
            card: {
                background: '#1E1E23',
                border: '#333333',
            },
        },
        fonts: {
            heading: '"Inter", sans-serif',
            body: '"Inter", sans-serif',
            mono: '"Fira Code", monospace'
        },
        shapes: {
            radius: '10px',
        },
    },
};

