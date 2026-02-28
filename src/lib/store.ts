import { create } from 'zustand';
import { FontKey } from './fonts';

// Type definitions matching the JSON Schema
export interface SlideContent {
    bullets?: string[];
    chart_data?: { labels: string[]; values: number[]; label?: string };
    flow_steps?: string[];
    table_data?: { headers: string[]; rows: string[][] };
    code_snippet?: string; // New: For coding explanations
    highlight_lines?: number[]; // New: For highlighting specific lines
}

export interface Slide {
    slide_id: number;
    title: string;
    subtitle?: string; // Tagline for intro slides
    layout: 'title' | 'text_features' | 'chart_bar' | 'chart_line' | 'process_flow' | 'columns_3' | 'grid_cards' | 'comparison' | 'table' | 'coding';
    content: SlideContent;
    narration: string;
    duration?: number; // Calculated after TTS
    startTime?: number; // Calculated timeline position
}

export interface AnimationConfig {
    type: 'none' | 'fade' | 'slide_up' | 'slide_down' | 'scale_in' | 'typewriter' | 'blur_in';
    duration: number; // in seconds
    delay: number; // in seconds, relative to slide start or previous element
    ease?: 'linear' | 'easeOut' | 'easeInOut' | 'steps';
}

export interface Script {
    slides: Slide[];
    template?: 'neon' | 'retro' | 'brutalist' | 'nanobanna';
}

interface AppState {
    script: Script | null;
    audioUrls: Record<number, string>; // slide_id -> url

    // Playback State
    isPlaying: boolean;
    currentTime: number;
    totalDuration: number;

    // Generation State
    generationState: {
        step: 'idle' | 'scripting' | 'audio' | 'rendering' | 'complete' | 'error';
        progress: number;
        message: string;
    };
    audioStatus: Record<number, 'pending' | 'generating' | 'ready' | 'error'>;

    setGenerationState: (state: Partial<AppState['generationState']>) => void;
    setAudioStatus: (slideId: number, status: 'pending' | 'generating' | 'ready' | 'error') => void;

    // Font State
    selectedFont: FontKey;
    setFont: (font: FontKey) => void;

    // Render Settings
    renderMode: 'default' | 'high-quality';
    setRenderMode: (mode: 'default' | 'high-quality') => void;

    // TTS Settings
    ttsProvider: 'google' | 'gemini' | 'azure';
    setTTSProvider: (provider: 'google' | 'gemini' | 'azure') => void;
    selectedVoice: string;
    setVoice: (voice: string) => void;

    // Preloaded Assets (Blob URLs)
    preloadedAssets: Record<string, string>;
    setPreloadedAssets: (assets: Record<string, string>) => void;

    // Agentic AI User Suggestions
    suggestions: string;
    setSuggestions: (suggestions: string) => void;

    // Editing
    activeElementId: string | null;
    setActiveElement: (id: string | null) => void;
    elementStyles: Record<string, { fontFamily?: string; fontSize?: number, color?: string }>;
    setElementStyle: (id: string, style: { fontFamily?: string; fontSize?: number, color?: string }) => void;
    elementAnimations: Record<string, AnimationConfig>;
    setElementAnimation: (id: string, animation: AnimationConfig) => void;
    updateSlide: (slideId: number, updates: Partial<Slide>) => void;

    // Actions
    setScript: (script: Script) => void;
    setAudioUrl: (slideId: number, url: string, duration: number) => void;
    togglePlay: () => void;
    seek: (time: number) => void;
    setCurrentTime: (time: number) => void;
    reset: () => void;

    // Animation Preview
    previewTrigger: number;
    triggerPreview: () => void;
}

export const useStore = create<AppState>((set) => ({
    script: null,
    audioUrls: {},
    isPlaying: false,
    currentTime: 0,
    totalDuration: 0,
    selectedFont: 'Modern', // Default
    activeElementId: null,
    elementStyles: {},
    elementAnimations: {},

    generationState: { step: 'idle', progress: 0, message: '' },
    audioStatus: {},



    setGenerationState: (newState) => set((state) => ({
        generationState: { ...state.generationState, ...newState }
    })),

    setAudioStatus: (slideId, status) => set((state) => ({
        audioStatus: { ...state.audioStatus, [slideId]: status }
    })),

    setFont: (font) => set({ selectedFont: font }),

    renderMode: 'default',
    setRenderMode: (mode) => set({ renderMode: mode }),

    ttsProvider: 'azure', // Default to azure
    setTTSProvider: (provider) => set({ ttsProvider: provider }),

    selectedVoice: 'te-IN-MohanNeural', // Default Telugu male voice
    setVoice: (voice) => set({ selectedVoice: voice }),

    suggestions: '',
    setSuggestions: (suggestions) => set({ suggestions }),

    setScript: (script) => set({ script }),

    updateSlide: (slideId, updates) => set((state) => {
        if (!state.script) return {};
        const newSlides = state.script.slides.map(s =>
            s.slide_id === slideId ? { ...s, ...updates } : s
        );
        return { script: { ...state.script, slides: newSlides } };
    }),

    setActiveElement: (id) => set({ activeElementId: id }),

    setElementStyle: (id, style) => set((state) => ({
        elementStyles: {
            ...state.elementStyles,
            [id]: { ...(state.elementStyles[id] || {}), ...style }
        }
    })),

    setElementAnimation: (id, animation) => set((state) => ({
        elementAnimations: {
            ...state.elementAnimations,
            [id]: animation
        }
    })),

    setAudioUrl: (slideId, url, duration) => set((state) => {
        // Also update the slide duration in the script!
        // This is a bit tricky with nested state updates, but necessary for the timeline.
        const newScript = state.script ? { ...state.script } : null;
        if (newScript) {
            const slide = newScript.slides.find(s => s.slide_id === slideId);
            if (slide) {
                slide.duration = duration;
                // Recalculate start times
                let currentStart = 0;
                newScript.slides.forEach(s => {
                    s.startTime = currentStart;
                    currentStart += (s.duration || 0);
                });
                // Update total duration
                return {
                    audioUrls: { ...state.audioUrls, [slideId]: url },
                    script: newScript,
                    totalDuration: currentStart
                };
            }
        }
        return { audioUrls: { ...state.audioUrls, [slideId]: url } };
    }),

    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    seek: (time) => set({ currentTime: time }),
    setCurrentTime: (time) => set({ currentTime: time }),
    reset: () => set({
        script: null,
        audioUrls: {},
        currentTime: 0,
        isPlaying: false,
        totalDuration: 0,
        selectedFont: 'Modern',
        activeElementId: null,
        elementStyles: {}
    }),
    triggerPreview: () => set({ previewTrigger: Date.now() }),
    previewTrigger: 0,
    preloadedAssets: {},
    setPreloadedAssets: (assets) => set({ preloadedAssets: assets }),
}));
