/**
 * Main Agent Pipeline Graph
 * v3.0 — New Architecture
 *
 * Pipeline:
 *   research_decision → (conditional) → question_agent → research_agent → flow_agent
 *                                    ↘ (skip) ──────────────────────────→ flow_agent
 *   flow_agent → content_agent → slide_designer → slide_agent → narration_agent → assembler → END
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';

import {
    RESEARCH_DECISION_PROMPT,
    QUESTION_AGENT_PROMPT,
    FLOW_AGENT_PROMPT,
    CONTENT_AGENT_PROMPT,
    SLIDE_DESIGNER_PROMPT,
    SLIDE_AGENT_PROMPT,
    NARRATION_AGENT_PROMPT,
} from './prompts';

// ═══════════════════════════════════════════════════════════════
// STATE DEFINITION
// ═══════════════════════════════════════════════════════════════

const PipelineState = Annotation.Root({
    // ─── User Inputs ───
    topic: Annotation<string>(),
    genre: Annotation<string>(),
    slideCount: Annotation<number>(),
    template: Annotation<string>(),
    language: Annotation<string>(),

    // ─── Research Phase ───
    needsResearch: Annotation<boolean>(),
    searchQueries: Annotation<string[]>(),
    researchData: Annotation<string>(),

    // ─── Flow Phase ───
    flowPlan: Annotation<any[]>(),

    // ─── Content Phase ───
    slideContents: Annotation<any[]>(),

    // ─── Design Phase ───
    slideDesigns: Annotation<any[]>(),

    // ─── Slide JSON Phase ───
    slides: Annotation<any[]>(),

    // ─── Final Output ───
    finalScript: Annotation<any>(),
});

// ═══════════════════════════════════════════════════════════════
// LLM INITIALIZATION
// ═══════════════════════════════════════════════════════════════

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    maxOutputTokens: 16000,
    apiKey: process.env.GEMINI_API_KEY,
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function extractJson(text: string): string {
    let jsonString = text.trim();
    const match = text.match(/```json([\s\S]*?)```/);
    if (match) jsonString = match[1].trim();
    const firstOpen = jsonString.indexOf('{');
    const lastClose = jsonString.lastIndexOf('}');
    if (firstOpen !== -1 && lastClose !== -1) {
        return jsonString.substring(firstOpen, lastClose + 1);
    }
    return jsonString;
}

async function tavilySearch(query: string): Promise<any[]> {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) {
        console.warn("TAVILY_API_KEY not set — skipping search");
        return [];
    }
    try {
        const res = await fetch("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: apiKey.trim(),
                query,
                search_depth: "basic",
                include_answer: true,
                max_results: 3,
            }),
        });
        if (!res.ok) {
            console.error(`Tavily error: ${res.status}`);
            return [];
        }
        const data = await res.json();
        return data.results || [];
    } catch (e) {
        console.error("Tavily fetch error:", e);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 1: RESEARCH DECISION
// ═══════════════════════════════════════════════════════════════

async function researchDecisionNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("🔍 Research Decision Agent: Evaluating topic...");

    try {
        const prompt = RESEARCH_DECISION_PROMPT(state.topic, state.genre);
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));

        const needs = !!json.needs_research;
        console.log(`🔍 Decision: ${needs ? "YES — research needed" : "NO — skip research"} (${json.reason})`);
        return { needsResearch: needs };
    } catch (e) {
        console.error("Research Decision Error:", e);
        return { needsResearch: false };
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 2: QUESTION AGENT
// ═══════════════════════════════════════════════════════════════

async function questionAgentNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("❓ Question Agent: Generating search queries...");

    try {
        const prompt = QUESTION_AGENT_PROMPT(state.topic, state.genre);
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));

        const queries = json.queries || [`${state.topic} detailed facts`];
        console.log(`❓ Question Agent: Generated ${queries.length} queries`);
        return { searchQueries: queries };
    } catch (e) {
        console.error("Question Agent Error:", e);
        return { searchQueries: [`${state.topic} detailed overview`] };
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 3: RESEARCH AGENT
// Executes Tavily searches for all queries from Question Agent.
// ═══════════════════════════════════════════════════════════════

async function researchAgentNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("🌐 Research Agent: Searching the web...");

    const queries = state.searchQueries || [`${state.topic}`];
    const allResults: any[] = [];

    for (const query of queries) {
        console.log(`🌐 Searching: "${query}"`);
        const results = await tavilySearch(query);
        allResults.push(...results);
    }

    if (allResults.length === 0) {
        console.warn("🌐 Research Agent: No results found.");
        return { researchData: "No research results found." };
    }

    // Compile research into a readable summary
    const summary = allResults
        .map((r, i) => `[${i + 1}] ${r.title || ''}\n${r.content || r.snippet || ''}`)
        .join('\n\n');

    console.log(`🌐 Research Agent: Compiled ${allResults.length} results.`);
    return { researchData: summary };
}

// ═══════════════════════════════════════════════════════════════
// NODE 4: FLOW AGENT
// Plans what content goes on each slide.
// ═══════════════════════════════════════════════════════════════

async function flowAgentNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("🌊 Flow Agent: Planning content distribution...");

    const research = state.researchData || "No research needed.";
    const prompt = FLOW_AGENT_PROMPT(
        state.topic,
        state.genre,
        state.slideCount,
        research
    );

    try {
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));
        console.log(`🌊 Flow Agent: Planned ${(json.flow || []).length} slides.`);
        return { flowPlan: json.flow || [] };
    } catch (e) {
        console.error("Flow Agent Error:", e);
        // Fallback: create a basic plan
        const fallbackPlan = Array.from({ length: state.slideCount }, (_, i) => ({
            slide_number: i + 1,
            title: i === 0 ? state.topic : `Point ${i}`,
            focus: i === 0 ? "Introduction" : "Key point",
            key_points: [`Aspect ${i} of ${state.topic}`],
            data_to_include: "",
            suggested_visual: i === 0 ? "title" : "bullet points",
        }));
        return { flowPlan: fallbackPlan };
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 5: CONTENT AGENT
// Generates raw content per slide.
// ═══════════════════════════════════════════════════════════════

async function contentAgentNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("📝 Content Agent: Generating slide content...");

    const research = state.researchData || "No research needed.";
    const prompt = CONTENT_AGENT_PROMPT(
        state.topic,
        state.genre,
        state.flowPlan,
        research,
        state.language || 'English'
    );

    try {
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));
        console.log(`📝 Content Agent: Generated content for ${(json.slides || []).length} slides.`);
        return { slideContents: json.slides || [] };
    } catch (e) {
        console.error("Content Agent Error:", e);
        throw new Error("Failed to generate slide content");
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 6: SLIDE DESIGNER
// Picks the best layout for each slide.
// ═══════════════════════════════════════════════════════════════

async function slideDesignerNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("🎨 Slide Designer: Choosing visual layouts...");

    const prompt = SLIDE_DESIGNER_PROMPT(
        state.slideContents,
        state.template || 'neon'
    );

    try {
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));
        console.log(`🎨 Slide Designer: Designed ${(json.designs || []).length} layouts.`);
        return { slideDesigns: json.designs || [] };
    } catch (e) {
        console.error("Slide Designer Error:", e);
        // Fallback: default everything to text_features
        const fallback = state.slideContents.map((s: any, i: number) => ({
            slide_number: i + 1,
            layout: i === 0 ? 'title' : 'text_features',
            reasoning: 'Fallback due to error',
        }));
        return { slideDesigns: fallback };
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 7: SLIDE AGENT
// Generates the final JSON output per slide.
// ═══════════════════════════════════════════════════════════════

async function slideAgentNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("🔧 Slide Agent: Generating final slide JSON...");

    const prompt = SLIDE_AGENT_PROMPT(
        state.slideContents,
        state.slideDesigns,
        state.template || 'neon',
        state.language || 'English'
    );

    try {
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));
        console.log(`🔧 Slide Agent: Produced ${(json.slides || []).length} slides.`);
        return { slides: json.slides || [] };
    } catch (e) {
        console.error("Slide Agent Error:", e);
        throw new Error("Failed to generate slide JSON");
    }
}

// ═══════════════════════════════════════════════════════════════
// NODE 8: NARRATION AGENT
// Generates per-element narration for each slide.
// ═══════════════════════════════════════════════════════════════

async function narrationAgentNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("🎙️ Narration Agent: Writing voiceover scripts...");

    const prompt = NARRATION_AGENT_PROMPT(
        state.topic,
        state.genre,
        state.slides,
        state.language || 'English'
    );

    try {
        const response = await llm.invoke([new HumanMessage(prompt)]);
        const json = JSON.parse(extractJson(response.content as string));
        const narrations = json.slide_narrations || [];

        // Merge narration segments into slides
        const slidesWithNarration = state.slides.map((slide: any, i: number) => {
            const narrationEntry = narrations[i];
            let narrationText = '';

            if (narrationEntry) {
                if (narrationEntry.segments && Array.isArray(narrationEntry.segments)) {
                    narrationText = narrationEntry.segments.join(' ');
                } else if (typeof narrationEntry.narration === 'string') {
                    narrationText = narrationEntry.narration;
                } else if (typeof narrationEntry === 'string') {
                    narrationText = narrationEntry;
                }
            }

            return { ...slide, narration: narrationText || `Narration for ${slide.title}` };
        });

        console.log("🎙️ Narration Agent: Voiceover scripts complete.");
        return { slides: slidesWithNarration };
    } catch (e) {
        console.error("Narration Agent Error:", e);
        // Fallback narration
        const slidesWithFallback = state.slides.map((slide: any) => ({
            ...slide,
            narration: slide.narration || `Let's talk about ${slide.title}.`,
        }));
        return { slides: slidesWithFallback };
    }
}

// ═══════════════════════════════════════════════════════════════
// ASSEMBLER NODE
// Packages everything into the final script output.
// ═══════════════════════════════════════════════════════════════

async function assemblerNode(
    state: typeof PipelineState.State
): Promise<Partial<typeof PipelineState.State>> {
    console.log("📦 Assembler: Packaging final script...");

    const finalScript = {
        topic: state.topic,
        template: state.template || 'neon',
        slides: state.slides.map((slide: any, index: number) => ({
            slide_id: slide.slide_id || index + 1,
            title: slide.title || `Slide ${index + 1}`,
            subtitle: slide.subtitle,
            layout: slide.layout || 'text_features',
            content: slide.content || {},
            narration: slide.narration || '',
        })),
    };

    console.log(`📦 Assembler: Final script with ${finalScript.slides.length} slides ready.`);
    return { finalScript };
}

// ═══════════════════════════════════════════════════════════════
// GRAPH DEFINITION
// ═══════════════════════════════════════════════════════════════

// @ts-ignore — LangGraph typing quirk
const workflow = new StateGraph(PipelineState)
    .addNode("research_decision", researchDecisionNode)
    .addNode("question_agent", questionAgentNode)
    .addNode("research_agent", researchAgentNode)
    .addNode("flow_agent", flowAgentNode)
    .addNode("content_agent", contentAgentNode)
    .addNode("slide_designer", slideDesignerNode)
    .addNode("slide_agent", slideAgentNode)
    .addNode("narration_agent", narrationAgentNode)
    .addNode("assembler", assemblerNode)

    // Research path
    .addEdge("question_agent", "research_agent")
    .addEdge("research_agent", "flow_agent")

    // Main pipeline
    .addEdge("flow_agent", "content_agent")
    .addEdge("content_agent", "slide_designer")
    .addEdge("slide_designer", "slide_agent")
    .addEdge("slide_agent", "narration_agent")
    .addEdge("narration_agent", "assembler")
    .addEdge("assembler", END);

// Entry point
workflow.setEntryPoint("research_decision");

// Conditional routing after research decision
workflow.addConditionalEdges(
    "research_decision",
    (state) => state.needsResearch ? "question_agent" : "flow_agent"
);

// Compile the graph
export const appGraph = workflow.compile();
