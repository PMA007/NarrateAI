import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech, VOICES, GEMINI_VOICES, AZURE_VOICES, SARVAM_VOICES, SARVAM_LANGUAGES, TTSProvider } from '@/lib/tts';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            text,
            voice,
            provider = 'azure',
            geminiStyle = 'default',
            narrationLanguage = 'te-IN',
        } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // Determine default voice per provider
        let selectedVoice = voice;
        if (!selectedVoice) {
            if (provider === 'azure') selectedVoice = 'te-IN-MohanNeural';
            else if (provider === 'sarvam') selectedVoice = 'shubh';
            else selectedVoice = VOICES['en-US'];
        }

        const ttsProvider: TTSProvider = provider as TTSProvider;

        const audioBuffer = await generateSpeech(
            text,
            selectedVoice,
            ttsProvider,
            geminiStyle as keyof typeof GEMINI_VOICES,
            narrationLanguage
        );

        // Sarvam returns WAV; others return MP3. Set content-type accordingly.
        const contentType = ttsProvider === 'sarvam' ? 'audio/wav' : 'audio/mpeg';

        return new NextResponse(audioBuffer as any, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': audioBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('TTS Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

