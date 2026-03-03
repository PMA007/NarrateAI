import { NextRequest, NextResponse } from 'next/server';
import { wizardGraph } from '@/lib/agents/wizard-graph';

// Force dynamic to support streaming
export const dynamic = 'force-dynamic';

const KNOWN_NODES = new Set([
    'research_decision', 'question_agent', 'research_agent',
    'flow_agent', 'content_agent', 'slide_designer',
    'slide_agent', 'narration_agent', 'assembler'
]);

const NODE_START_LABELS: Record<string, string> = {
    research_decision: '🔍 Research Decision: Evaluating if web research is needed...',
    question_agent: '❓ Question Agent: Generating targeted search queries...',
    research_agent: '🌐 Research Agent: Searching the web for facts...',
    flow_agent: '🌊 Flow Agent: Planning content distribution across slides...',
    content_agent: '📝 Content Agent: Generating rich slide content...',
    slide_designer: '🎨 Slide Designer: Choosing optimal visual layouts...',
    slide_agent: '🔧 Slide Agent: Structuring final slide JSON...',
    narration_agent: '🎙️ Narration Agent: Writing voiceover scripts...',
    assembler: '📦 Assembler: Packaging final production script...',
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
                    slideCount: outline?.length || 8,
                    template: template || 'neon',
                    language: language || 'English',
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
                        case 'research_decision':
                            summary = {
                                type: 'research_decision',
                                needsResearch: !!out.needsResearch,
                            };
                            await send({ type: 'log', agentId: nodeName, message: out.needsResearch ? '✅ Research needed — proceeding to search.' : '✅ Research skipped — using existing knowledge.' });
                            break;
                        case 'question_agent':
                            summary = {
                                type: 'queries',
                                queries: out.searchQueries ?? [],
                            };
                            await send({ type: 'log', agentId: nodeName, message: `✅ Generated ${(out.searchQueries ?? []).length} search queries.` });
                            break;
                        case 'research_agent':
                            summary = {
                                type: 'research',
                                notes: typeof out.researchData === 'string'
                                    ? out.researchData.substring(0, 3000)
                                    : 'No research notes for this topic.'
                            };
                            await send({ type: 'log', agentId: nodeName, message: '✅ Research completed and synthesized.' });
                            break;
                        case 'flow_agent':
                            summary = { type: 'flow', slides: out.flowPlan ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: `✅ Flow Agent planned ${(out.flowPlan ?? []).length} slides.` });
                            break;
                        case 'content_agent':
                            summary = { type: 'content', slides: out.slideContents ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: '✅ Rich content generated for all slides.' });
                            break;
                        case 'slide_designer':
                            summary = { type: 'designs', designs: out.slideDesigns ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: `✅ Visual layouts chosen for ${(out.slideDesigns ?? []).length} slides.` });
                            break;
                        case 'slide_agent':
                            summary = { type: 'slides', slides: out.slides ?? [] };
                            await send({ type: 'log', agentId: nodeName, message: `✅ Final slide JSON structured (${(out.slides ?? []).length} slides).` });
                            break;
                        case 'narration_agent':
                            summary = { type: 'narration', slideCount: (out.slides ?? []).length };
                            await send({ type: 'log', agentId: nodeName, message: '✅ Per-element voiceover narration authored.' });
                            break;
                        case 'assembler':
                            summary = { type: 'assembler', slideCount: out.finalScript?.slides?.length ?? '?' };
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
                        if (event.data?.output?.finalScript) {
                            await send({ type: 'result', data: event.data.output.finalScript });
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
