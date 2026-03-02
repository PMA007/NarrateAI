// eslint-disable-next-line @typescript-eslint/no-var-requires
const { getAllAudioBase64 } = require('google-tts-api') as typeof import('google-tts-api');

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    TTSProvider,
    VOICES,
    AZURE_VOICES,
    GEMINI_VOICES,
    SARVAM_VOICES,
    SARVAM_LANGUAGES,
    normalizeVoice
} from './voices';

export type { TTSProvider };
export { VOICES, AZURE_VOICES, GEMINI_VOICES, SARVAM_VOICES, SARVAM_LANGUAGES };

/**
 * Generate speech using Google Translate TTS (free, fast)
 */
export async function generateSpeechGoogle(text: string, voice: string = 'en'): Promise<Buffer> {
    const lang = normalizeVoice(voice);
    try {
        console.log(`🔊 Google TTS: "${text.substring(0, 20)}..." in ${lang}`);

        const results = await getAllAudioBase64(text, {
            lang: lang,
            slow: false,
            host: 'https://translate.google.com',
            timeout: 30000,
        });

        const buffers = results.map(item => Buffer.from(item.base64, 'base64'));
        const fullBuffer = Buffer.concat(buffers);
        return fullBuffer;

    } catch (error) {
        console.error("Google TTS failed:", error);
        throw error;
    }
}

/**
 * Generate speech using Gemini 2.0 Flash TTS via SDK
 */
export async function generateSpeechGemini(
    text: string,
    style: keyof typeof GEMINI_VOICES = 'default',
    fallbackVoice: string = 'en'
): Promise<Buffer> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        console.warn('⚠️ GEMINI_API_KEY is missing from process.env');
        return generateSpeechGoogle(text, fallbackVoice);
    }

    try {
        console.log(`🎙️ Gemini TTS: "${text.substring(0, 20)}..." style: ${style}`);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-preview-tts"
        });

        const stylePrompt = GEMINI_VOICES[style] || GEMINI_VOICES.default;

        const result = await model.generateContent({
            contents: [{
                role: 'user',
                parts: [{
                    text: `${stylePrompt}\n\nRead the following text aloud:\n\n${text}`
                }]
            }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: {
                            voiceName: "Aoede"
                        }
                    }
                }
            } as any
        });

        const response = result.response;
        // The SDK might return candidates with inlineData/parts differently
        // Depending on SDK version, accessing parts might differ
        // For audio, it's often in parts[0].inlineData or similar

        const candidates = response.candidates;
        if (!candidates || candidates.length === 0) {
            throw new Error('No candidates returned');
        }

        const parts = candidates[0].content.parts;
        const audioPart = parts.find(p => p.inlineData);

        if (!audioPart || !audioPart.inlineData) {
            // Fallback: check if text was returned instead (error case)
            const textPart = parts.find(p => p.text);
            if (textPart) {
                throw new Error(`Gemini returned text instead of audio: ${textPart.text?.substring(0, 50)}...`);
            }
            throw new Error('No audio data in response');
        }

        const audioBuffer = Buffer.from(audioPart.inlineData.data, 'base64');

        const mimeType = audioPart.inlineData.mimeType;
        if (mimeType.startsWith('audio/L16') || mimeType.includes('pcm')) {
            return addWavHeader(audioBuffer, 24000, 1, 16);
        }

        return audioBuffer;

    } catch (error: any) {
        console.error('❌ Gemini TTS failed:', error.message);
        console.warn('⚠️ Falling back to Google TTS...');
        return generateSpeechGoogle(text, fallbackVoice);
    }
}

/**
 * Adds a WAV header to raw PCM data
 * Spec: http://soundfile.sapp.org/doc/WaveFormat/
 */
function addWavHeader(samples: Buffer, sampleRate: number, channels: number, bitDepth: number): Buffer {
    const byteRate = (sampleRate * channels * bitDepth) / 8;
    const blockAlign = (channels * bitDepth) / 8;
    const dataSize = samples.length;
    const totalSize = 36 + dataSize;

    const buffer = Buffer.alloc(44);

    // RIFF Chunk
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(totalSize, 4);
    buffer.write('WAVE', 8);

    // fmt Chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
    buffer.writeUInt16LE(1, 20);     // AudioFormat (1 for PCM)
    buffer.writeUInt16LE(channels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitDepth, 34);

    // data Chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    return Buffer.concat([buffer, samples]);
}

/**
 * Generate speech using Azure Speech Service
 */
export async function generateSpeechAzure(
    text: string,
    voiceName: string = 'te-IN-MohanNeural'
): Promise<Buffer> {
    const apiKey = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || 'centralindia';

    if (!apiKey) {
        console.warn('⚠️ AZURE_SPEECH_KEY is missing from process.env');
        // Fallback to Google TTS
        return generateSpeechGoogle(text, normalizeVoice(voiceName));
    }

    try {
        // Get voice config
        const voiceConfig = AZURE_VOICES[voiceName as keyof typeof AZURE_VOICES];
        const locale = voiceConfig?.locale || 'en-US';

        console.log(`🔊 Azure TTS: "${text.substring(0, 30)}..." with voice: ${voiceName}`);

        // Build SSML
        const ssml = `
            <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${locale}">
                <voice name="${voiceName}">
                    ${escapeXml(text)}
                </voice>
            </speak>
        `.trim();

        // Azure Speech REST API endpoint
        const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': apiKey,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
                'User-Agent': 'VideoGenerator'
            },
            body: ssml
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Azure TTS API error: ${response.status} - ${errorText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = Buffer.from(arrayBuffer);
        return audioBuffer;

    } catch (error: any) {
        console.error('❌ Azure TTS failed:', error.message);
        console.warn('⚠️ Falling back to Google TTS...');
        return generateSpeechGoogle(text, normalizeVoice(voiceName));
    }
}

// Helper to escape XML special characters
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Generate speech using Sarvam AI (bulbul:v3)
 *
 * @param text          - Text to speak
 * @param languageCode  - BCP-47 code e.g. 'te-IN', 'hi-IN'
 * @param speaker       - Speaker name e.g. 'shubh', 'priya' (bulbul:v3 default: 'shubh')
 */
const VALID_SARVAM_SPEAKERS = new Set(['aditya','ritu','ashutosh','priya','neha','rahul','pooja','rohan','simran','kavya','amit','dev','ishita','shreya','ratan','varun','manan','sumit','roopa','kabir','aayan','shubh','advait','amelia','sophia','anand','tanya','tarun','sunny','mani','gokul','vijay','shruti','suhani','mohit','kavitha','rehan','soham','rupali']);

export async function generateSpeechSarvam(
    text: string,
    languageCode: string = 'te-IN',
    speaker: string = 'shubh'
): Promise<Buffer> {
    const apiKey = process.env.SARVAM_API_KEY;
    // Guard against stale/legacy speaker names (e.g. from persisted store)
    if (!VALID_SARVAM_SPEAKERS.has(speaker)) {
        console.warn(`⚠️ Sarvam: speaker '${speaker}' is not valid for bulbul:v3 — falling back to 'shubh'`);
        speaker = 'shubh';
    }

    if (!apiKey) {
        console.warn('⚠️ SARVAM_API_KEY is missing — falling back to Google TTS');
        return generateSpeechGoogle(text, normalizeVoice(languageCode));
    }

    try {
        console.log(`🎙️ Sarvam TTS: "${text.substring(0, 30)}..." lang: ${languageCode}, speaker: ${speaker}`);

        const response = await fetch('https://api.sarvam.ai/text-to-speech', {
            method: 'POST',
            headers: {
                'api-subscription-key': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text,
                target_language_code: languageCode,
                speaker,
                pace: 1.0,
                speech_sample_rate: 22050,
                model: 'bulbul:v3',
            }),
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => response.status.toString());
            throw new Error(`Sarvam TTS API error: ${response.status} - ${errText}`);
        }

        const result = await response.json();
        // API returns { audios: [base64_wav_string], ... }
        if (!result.audios || result.audios.length === 0) {
            throw new Error('Sarvam TTS: no audio in response');
        }

        const audioBuffer = Buffer.from(result.audios[0], 'base64');
        return audioBuffer;

    } catch (error: any) {
        console.error('❌ Sarvam TTS failed:', error.message);
        console.warn('⚠️ Falling back to Google TTS...');
        return generateSpeechGoogle(text, normalizeVoice(languageCode));
    }
}

/**
 * Unified speech generation function
 */
export async function generateSpeech(
    text: string,
    voice: string = 'en',
    provider: TTSProvider = 'google',
    geminiStyle: keyof typeof GEMINI_VOICES = 'default',
    narrationLanguage: string = 'te-IN'
): Promise<Buffer> {
    if (provider === 'azure') {
        return generateSpeechAzure(text, voice);
    }
    if (provider === 'gemini') {
        return generateSpeechGemini(text, geminiStyle, voice);
    }
    if (provider === 'sarvam') {
        // voice = speaker name (e.g. 'shubh', 'priya'), narrationLanguage = BCP-47 code
        return generateSpeechSarvam(text, narrationLanguage, voice);
    }
    return generateSpeechGoogle(text, voice);
}
