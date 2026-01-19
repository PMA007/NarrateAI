import * as googleTTS from 'google-tts-api';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
    TTSProvider,
    VOICES,
    AZURE_VOICES,
    GEMINI_VOICES,
    normalizeVoice
} from './voices';

export type { TTSProvider };
export { VOICES, AZURE_VOICES, GEMINI_VOICES };

/**
 * Generate speech using Google Translate TTS (free, fast)
 */
export async function generateSpeechGoogle(text: string, voice: string = 'en'): Promise<Buffer> {
    const lang = normalizeVoice(voice);
    try {
        console.log(`🔊 Google TTS: "${text.substring(0, 20)}..." in ${lang}`);

        const results = await googleTTS.getAllAudioBase64(text, {
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
                responseMimeType: "audio/mp3",
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
        console.log(`✅ Gemini TTS generated ${audioBuffer.length} bytes`);

        // Debug: Log MIME and Magic Header
        const mimeType = audioPart.inlineData.mimeType;
        const header = audioBuffer.subarray(0, 4).toString('hex');
        console.log(`ℹ️ Gemini Audio MIME: ${mimeType}`);
        console.log(`🔍 Magic Bytes: ${header}`); // fff3/fff2=MP3, 52494646=WAV

        return audioBuffer;

    } catch (error: any) {
        console.error("❌ Gemini TTS failed:", error.message);
        // Fallback to Google TTS
        console.log("⚠️ Falling back to Google TTS...");
        return generateSpeechGoogle(text, fallbackVoice);
    }
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

        console.log(`✅ Azure TTS generated ${audioBuffer.length} bytes`);
        return audioBuffer;

    } catch (error: any) {
        console.error("❌ Azure TTS failed:", error.message);
        // Fallback to Google TTS
        console.log("⚠️ Falling back to Google TTS...");
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
 * Unified speech generation function
 */
export async function generateSpeech(
    text: string,
    voice: string = 'en',
    provider: TTSProvider = 'google',
    geminiStyle: keyof typeof GEMINI_VOICES = 'default'
): Promise<Buffer> {
    if (provider === 'azure') {
        return generateSpeechAzure(text, voice);
    }
    if (provider === 'gemini') {
        return generateSpeechGemini(text, geminiStyle, voice);
    }
    return generateSpeechGoogle(text, voice);
}
