import { NextRequest, NextResponse } from 'next/server';
import { getSlideSpecs } from '@/lib/agents/step-agents';

export async function POST(req: NextRequest) {
    try {
        const { topic, genre } = await req.json();

        if (!topic || !genre) {
            return NextResponse.json({ error: "Topic and Genre are required" }, { status: 400 });
        }

        const specs = await getSlideSpecs(topic, genre);
        return NextResponse.json(specs);

    } catch (e) {
        console.error("API Specs Error", e);
        return NextResponse.json({ error: "Failed to analyze specs" }, { status: 500 });
    }
}
