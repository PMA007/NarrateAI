import { NextRequest, NextResponse } from 'next/server';
import { wizardGraph } from '@/lib/agents/wizard-graph';

// Force dynamic to support streaming
export const dynamic = 'force-dynamic';

const KNOWN_NODES = new Set([
    'researcher', 'flow_architect', 'content_generator',
    'narration_writer', 'reviewer', 'improver', 'merger'
]);

const NODE_START_LABELS: Record<string, string> = {
    researcher: '🔍 Research Agent: Gathering facts from the web...',
    flow_architect: '🌊 Flow Architect: Analyzing narrative structure...',
    content_generator: '🎨 Content Agent: Generating slides...',
    narration_writer: '🎙️ Narration Agent: Writing scripts...',
    reviewer: '🧐 Reviewer Agent: Critiquing script...',
    improver: '🛠️ Improver Agent: Polishing content...',
    merger: '🔗 Merger Agent: Finalizing video...',
};

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { topic, genre, outline, template, language } = body;

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
                    language: language || 'English',
                    scriptContent: [],
                    narration: [],
                }, { version: "v2" });

                // Track which nodes have already emitted their completion
                // (on_node_end and on_chain_end can both fire — only handle once)
                const completedNodes = new Set<string>();

                // Shared handler: called when a known node finishes
                const handleNodeComplete = async (nodeName: string, rawOutput: any) => {
                    if (completedNodes.has(nodeName)) return;
                    completedNodes.add(nodeName);

                    const out = rawOutput ?? {};
                    console.log(`[NODE_COMPLETE] ${nodeName} | output keys: ${Object.keys(out).join(', ')}`);

                    let summary: any;
                    switch (nodeName) {
                        case 'researcher':
                            summary = {
                                type: 'research',
                                notes: typeof out.research_notes === 'string'
                                    ? out.research_notes.substring(0, 3000)
                                    : 'No research notes for this topic.'
                            };
                            await send({ type: 'log', agentId: nodeName, message: '✅ Research completed and synthesized.' });
                            break;
                        case 'flow_architect':
                            summary = { type: 'outline', slides: out.outline ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: `✅ Flow Architect designed ${(out.outline ?? []).length || 'the'} narrative arc slides.` });
                            break;
                        case 'content_generator':
                            summary = { type: 'content', slides: out.scriptContent ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: '✅ Primary slide content formulated.' });
                            break;
                        case 'narration_writer':
                            summary = { type: 'narration', narrations: out.narration ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: '✅ Voice-over narration scripts authored.' });
                            break;
                        case 'reviewer': {
                            summary = { type: 'review', critique: out.critique ?? {} };
                            const needsFix = summary.critique?.needs_improvement;
                            await send({ type: 'log', agentId: nodeName, message: needsFix ? '⚠️ Reviewer found issues; sending to Improver.' : '✅ Reviewer approved the script; no fixes needed.' });
                            break;
                        }
                        case 'improver':
                            summary = { type: 'improvement', applied: !!out.refinedScript };
                            await send({ type: 'log', agentId: nodeName, message: summary.applied ? '✅ Improver finalized structural refinements.' : '✅ Improver bypassed (script already approved).' });
                            break;
                        case 'merger':
                            summary = { type: 'merger', slideCount: out.refinedScript?.slides?.length ?? '?' };
                            await send({ type: 'log', agentId: nodeName, message: `✅ Scripts assembled into final production format (${summary.slideCount} slides).` });
                            break;
                    }

                    if (summary) {
                        try {
                            const safeOutput = JSON.parse(JSON.stringify(summary));
                            console.log(`[ROUTE] agent_complete → ${nodeName}`, safeOutput);
                            await send({ type: 'agent_complete', agentId: nodeName, output: safeOutput });
                        } catch (serErr) {
                            console.error(`[ROUTE] Serialize failed for ${nodeName}:`, serErr);
                            await send({ type: 'agent_complete', agentId: nodeName, output: { type: nodeName, error: 'Output not serializable' } });
                        }
                    }
                };

                for await (const event of events) {
                    const { event: eventType, name } = event;

                    // Debug log for known nodes & graph
                    if (KNOWN_NODES.has(name) || name === 'LangGraph') {
                        console.log(`[EVENT] ${eventType} | ${name} | data keys: ${Object.keys(event.data || {}).join(', ')}`);
                    }

                    // ── Graph start ─────────────────────────────────────────────
                    if (eventType === 'on_chain_start' && name === 'LangGraph') {
                        await send({ type: 'log', message: '🚀 Wizard: Starting generation workflow...' });

                    // ── Node / Chain START (both event types possible in LangGraph v2) ─
                    } else if ((eventType === 'on_node_start' || eventType === 'on_chain_start') && KNOWN_NODES.has(name)) {
                        await send({ type: 'agent_active', agentId: name });
                        await send({ type: 'log', agentId: name, message: NODE_START_LABELS[name] });

                    // ── Node / Chain END — capture output ──────────────────────
                    } else if ((eventType === 'on_node_end' || eventType === 'on_chain_end') && KNOWN_NODES.has(name)) {
                        // In LangGraph streamEvents v2, on_chain_end carries data.output
                        // which is the node function's return value (partial state update)
                        await handleNodeComplete(name, event.data?.output);

                    // ── Graph end — emit final result ───────────────────────────
                    } else if (eventType === 'on_chain_end' && name === 'LangGraph') {
                        if (event.data?.output?.refinedScript) {
                            await send({ type: 'result', data: event.data.output.refinedScript });
                        }

                    // ── LLM token streaming ─────────────────────────────────────
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
