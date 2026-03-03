import { NextRequest, NextResponse } from 'next/server';
import { appGraph } from '@/lib/agents/graph';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { topic, language, slideCount, genre, template } = body;

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        console.log(`🚀 Starting Agentic Workflow for topic: "${topic}"`);

        // Invoke the LangGraph Agent
        const finalState = await appGraph.invoke({
            topic,
            genre: genre || 'general',
            slideCount: slideCount || 8,
            template: template || 'neon',
            language: language || 'English',
        });

        if (!finalState.finalScript) {
            console.error("Agent failed to produce script", finalState);
            return NextResponse.json({ error: "Agent failed to generate script" }, { status: 500 });
        }

        console.log("✅ Agentic Workflow Complete");

        return NextResponse.json({ script: finalState.finalScript });

    } catch (error: any) {
        console.error("Agent Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
