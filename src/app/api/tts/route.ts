import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech, VOICES, GEMINI_VOICES, AZURE_VOICES, TTSProvider } from '@/lib/tts';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { text, voice, provider = 'azure', geminiStyle = 'default' } = body;

        if (!text) {
            return NextResponse.json({ error: 'Text is required' }, { status: 400 });
        }

        // For azure, use the full voice name; for others, use language code
        const selectedVoice = voice || (provider === 'azure' ? 'te-IN-MohanNeural' : VOICES['en-US']);
        const ttsProvider: TTSProvider = provider as TTSProvider;

        const audioBuffer = await generateSpeech(
            text,
            selectedVoice,
            ttsProvider,
            geminiStyle as keyof typeof GEMINI_VOICES
        );

        return new NextResponse(audioBuffer as any, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Content-Length': audioBuffer.length.toString(),
            },
        });

    } catch (error: any) {
        console.error('TTS Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
