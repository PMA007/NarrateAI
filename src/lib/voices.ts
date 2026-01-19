// TTS Providers
export type TTSProvider = 'google' | 'gemini' | 'azure';

// Common voices (Languages only for Google TTS)
export const VOICES = {
    'en-US': 'en',
    'te-IN': 'te',
    'te-IN-F': 'te',
    'hi-IN': 'hi'
};

// Azure Neural Voices
export const AZURE_VOICES = {
    // Telugu
    'te-IN-MohanNeural': { name: 'Mohan', language: 'Telugu', locale: 'te-IN', gender: 'Male' },
    'te-IN-ShrutiNeural': { name: 'Shruti', language: 'Telugu', locale: 'te-IN', gender: 'Female' },
    // Hindi
    'hi-IN-AaravNeural': { name: 'Aarav', language: 'Hindi', locale: 'hi-IN', gender: 'Male' },
    'hi-IN-AnanyaNeural': { name: 'Ananya', language: 'Hindi', locale: 'hi-IN', gender: 'Female' },
    'hi-IN-KavyaNeural': { name: 'Kavya', language: 'Hindi', locale: 'hi-IN', gender: 'Female' },
    'hi-IN-KunalNeural': { name: 'Kunal', language: 'Hindi', locale: 'hi-IN', gender: 'Male' },
    // English India
    'en-IN-PrabhatNeural': { name: 'Prabhat', language: 'English (IN)', locale: 'en-IN', gender: 'Male' },
    'en-IN-NeerjaNeural': { name: 'Neerja', language: 'English (IN)', locale: 'en-IN', gender: 'Female' },
    'en-IN-Arjun:DragonHDLatestNeural': { name: 'Arjun HD', language: 'English (IN)', locale: 'en-IN', gender: 'Male' },
    'en-IN-Meera:DragonHDLatestNeural': { name: 'Meera HD', language: 'English (IN)', locale: 'en-IN', gender: 'Female' },
    // English US
    'en-US-JennyNeural': { name: 'Jenny', language: 'English (US)', locale: 'en-US', gender: 'Female' },
    'en-US-GuyNeural': { name: 'Guy', language: 'English (US)', locale: 'en-US', gender: 'Male' },
    'en-US-AriaNeural': { name: 'Aria', language: 'English (US)', locale: 'en-US', gender: 'Female' },
    'en-US-DavisNeural': { name: 'Davis', language: 'English (US)', locale: 'en-US', gender: 'Male' },
    'en-US-JasonNeural': { name: 'Jason', language: 'English (US)', locale: 'en-US', gender: 'Male' },
};

// Gemini TTS Voice Styles
export const GEMINI_VOICES = {
    'default': 'Speak in a clear, professional voice.',
    'calm': 'Speak in a calm, soothing voice with a moderate pace.',
    'energetic': 'Speak with energy and enthusiasm, in an upbeat tone.',
    'professional': 'Speak in a professional, corporate presentation style.',
    'storyteller': 'Speak like a storyteller, with expressive pacing and emotion.'
};

export function normalizeVoice(voice: string): string {
    if (voice.startsWith('en')) return 'en';
    if (voice.startsWith('te')) return 'te';
    if (voice.startsWith('hi')) return 'hi';
    return 'en';
}
