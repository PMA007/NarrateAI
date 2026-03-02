// TTS Providers
export type TTSProvider = 'google' | 'gemini' | 'azure' | 'sarvam';

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

// ── Sarvam AI (bulbul:v3) ─────────────────────────────────────────────────

/** Languages supported by Sarvam bulbul:v3 */
export const SARVAM_LANGUAGES: Record<string, string> = {
    'hi-IN': 'Hindi',
    'te-IN': 'Telugu',
    'ta-IN': 'Tamil',
    'kn-IN': 'Kannada',
    'ml-IN': 'Malayalam',
    'bn-IN': 'Bengali',
    'mr-IN': 'Marathi',
    'gu-IN': 'Gujarati',
    'or-IN': 'Odia',
    'pa-IN': 'Punjabi',
    'en-IN': 'English (India)',
};

/** Speakers available in Sarvam bulbul:v3 (39 voices, source: docs.sarvam.ai) */
export const SARVAM_VOICES: Record<string, { name: string; gender: 'Male' | 'Female' }> = {
    // ── Female (16) ──────────────────────────────────────────────────────────
    'ritu':     { name: 'Ritu',     gender: 'Female' },
    'priya':    { name: 'Priya',    gender: 'Female' },
    'neha':     { name: 'Neha',     gender: 'Female' },
    'pooja':    { name: 'Pooja',    gender: 'Female' },
    'simran':   { name: 'Simran',   gender: 'Female' },
    'kavya':    { name: 'Kavya',    gender: 'Female' },
    'ishita':   { name: 'Ishita',   gender: 'Female' },
    'shreya':   { name: 'Shreya',   gender: 'Female' },
    'roopa':    { name: 'Roopa',    gender: 'Female' },
    'amelia':   { name: 'Amelia',   gender: 'Female' },
    'sophia':   { name: 'Sophia',   gender: 'Female' },
    'tanya':    { name: 'Tanya',    gender: 'Female' },
    'shruti':   { name: 'Shruti',   gender: 'Female' },
    'suhani':   { name: 'Suhani',   gender: 'Female' },
    'kavitha':  { name: 'Kavitha',  gender: 'Female' },
    'rupali':   { name: 'Rupali',   gender: 'Female' },
    // ── Male (23) ────────────────────────────────────────────────────────────
    'shubh':    { name: 'Shubh',    gender: 'Male' },  // default
    'aditya':   { name: 'Aditya',   gender: 'Male' },
    'rahul':    { name: 'Rahul',    gender: 'Male' },
    'rohan':    { name: 'Rohan',    gender: 'Male' },
    'amit':     { name: 'Amit',     gender: 'Male' },
    'dev':      { name: 'Dev',      gender: 'Male' },
    'ratan':    { name: 'Ratan',    gender: 'Male' },
    'varun':    { name: 'Varun',    gender: 'Male' },
    'manan':    { name: 'Manan',    gender: 'Male' },
    'sumit':    { name: 'Sumit',    gender: 'Male' },
    'kabir':    { name: 'Kabir',    gender: 'Male' },
    'aayan':    { name: 'Aayan',    gender: 'Male' },
    'ashutosh': { name: 'Ashutosh', gender: 'Male' },
    'advait':   { name: 'Advait',   gender: 'Male' },
    'anand':    { name: 'Anand',    gender: 'Male' },
    'tarun':    { name: 'Tarun',    gender: 'Male' },
    'sunny':    { name: 'Sunny',    gender: 'Male' },
    'mani':     { name: 'Mani',     gender: 'Male' },
    'gokul':    { name: 'Gokul',    gender: 'Male' },
    'vijay':    { name: 'Vijay',    gender: 'Male' },
    'mohit':    { name: 'Mohit',    gender: 'Male' },
    'rehan':    { name: 'Rehan',    gender: 'Male' },
    'soham':    { name: 'Soham',    gender: 'Male' },
};

export function normalizeVoice(voice: string): string {
    if (voice.startsWith('en')) return 'en';
    if (voice.startsWith('te')) return 'te';
    if (voice.startsWith('hi')) return 'hi';
    if (voice.startsWith('ta')) return 'ta';
    if (voice.startsWith('kn')) return 'kn';
    if (voice.startsWith('ml')) return 'ml';
    if (voice.startsWith('bn')) return 'bn';
    if (voice.startsWith('mr')) return 'mr';
    if (voice.startsWith('gu')) return 'gu';
    if (voice.startsWith('or')) return 'or';
    if (voice.startsWith('pa')) return 'pa';
    return 'en';
}
