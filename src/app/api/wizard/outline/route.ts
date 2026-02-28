import { NextRequest, NextResponse } from 'next/server';
import { getOutline } from '@/lib/agents/step-agents';

export async function POST(req: NextRequest) {
    try {
        const { topic, genre, slideCount, currentOutline, userFeedback } = await req.json();

        if (!topic || !genre || !slideCount) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await getOutline(topic, genre, slideCount, currentOutline, userFeedback);
        return NextResponse.json(result);

    } catch (e) {
        console.error("API Outline Error", e);
        return NextResponse.json({ error: "Failed to generate outline" }, { status: 500 });
    }
}
