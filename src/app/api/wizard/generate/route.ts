import { NextRequest, NextResponse } from 'next/server';
import { wizardGraph } from '@/lib/agents/wizard-graph';

// Force dynamic to support streaming
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { topic, genre, outline, template } = body;

        if (!topic || !genre || !outline) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        console.log("🚀 Wizard API: Starting Streaming Generation...");

        const stream = new TransformStream();
        const writer = stream.writable.getWriter();
        const encoder = new TextEncoder();

        const send = (payload: object) =>
            writer.write(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));

        // Start generation in background
        (async () => {
            try {
                const events = await wizardGraph.streamEvents({
                    topic,
                    genre,
                    outline,
                    template: template || 'neon',
                    scriptContent: [],
                    narration: [],
                }, { version: "v2" });

                for await (const event of events) {
                    const { event: eventType, name } = event;

                    console.log(`[EVENT] ${eventType} | ${name}`, Object.keys(event.data || {}));

                    // ── on_chain_start ──────────────────────────────────────────
                    if (eventType === 'on_chain_start') {
                        if (name === 'LangGraph') {
                            await send({ type: 'log', message: '🚀 Wizard: Starting generation workflow...' });
                        }

                        // ── on_node_start ───────────────────────────────────────────
                    } else if (eventType === 'on_node_start') {
                        const labels: Record<string, string> = {
                            researcher: '🔍 Research Agent: Gathering facts from the web...',
                            flow_architect: '🌊 Flow Architect: Analyzing narrative structure...',
                            content_generator: '🎨 Content Agent: Generating slides...',
                            narration_writer: '🎙️ Narration Agent: Writing scripts...',
                            reviewer: '🧐 Reviewer Agent: Critiquing script...',
                            improver: '🛠️ Improver Agent: Polishing content...',
                            merger: '🔗 Merger Agent: Finalizing video...',
                        };
                        if (labels[name]) {
                            await send({ type: 'log', message: labels[name] });
                            await send({ type: 'agent_active', agentId: name });
                        }

                        // ── on_node_end ─────────────────────────────────────────────
                    } else if (eventType === 'on_node_end') {
                        const knownNodes = ['researcher', 'flow_architect', 'content_generator', 'narration_writer', 'reviewer', 'improver', 'merger'];

                        if (knownNodes.includes(name)) {
                            const out = event.data?.output ?? {};
                            let summary: any;

                            switch (name) {
                                case 'researcher':
                                    summary = {
                                        type: 'research',
                                        notes: typeof out.research_notes === 'string'
                                            ? out.research_notes.substring(0, 3000)
                                            : 'No research notes for this topic.'
                                    };
                                    break;
                                case 'flow_architect':
                                    summary = { type: 'outline', slides: out.outline ?? [] };
                                    break;
                                case 'content_generator':
                                    summary = { type: 'content', slides: out.scriptContent ?? [] };
                                    break;
                                case 'narration_writer':
                                    summary = { type: 'narration', narrations: out.narration ?? [] };
                                    break;
                                case 'reviewer':
                                    summary = { type: 'review', critique: out.critique ?? {} };
                                    break;
                                case 'improver':
                                    // Returns {} when no changes needed — always emit summary
                                    summary = { type: 'improvement', applied: !!out.refinedScript };
                                    break;
                                case 'merger':
                                    summary = { type: 'merger', slideCount: out.refinedScript?.slides?.length ?? '?' };
                                    break;
                            }

                            if (summary) {
                                await send({ type: 'agent_complete', agentId: name, output: summary });
                            }
                        }

                        // Final output (when LangGraph emits it as a node_end)
                        if (name === 'LangGraph' && event.data?.output?.refinedScript) {
                            await send({ type: 'result', data: event.data.output.refinedScript });
                        }

                        // ── on_chain_end ────────────────────────────────────────────
                    } else if (eventType === 'on_chain_end') {
                        if (name === 'LangGraph' && event.data?.output?.refinedScript) {
                            await send({ type: 'result', data: event.data.output.refinedScript });
                        }

                        // ── on_chat_model_stream ────────────────────────────────────
                    } else if (eventType === 'on_chat_model_stream') {
                        if (event.data?.chunk?.content) {
                            const content = event.data.chunk.content;
                            const token = typeof content === 'string' ? content : JSON.stringify(content);
                            await send({ type: 'token', message: token });
                        }
                    }
                }

                await writer.close();

            } catch (e: any) {
                console.error("Stream Error", e);
                await send({ type: 'error', message: e.toString() });
                await writer.close();
            }
        })();

        return new Response(stream.readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (e) {
        console.error("API Generate Error", e);
        return NextResponse.json({ error: "Failed to generate script" }, { status: 500 });
    }
}
