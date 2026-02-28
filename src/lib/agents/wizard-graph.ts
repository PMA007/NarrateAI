import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { RunnableConfig } from "@langchain/core/runnables";
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { HumanMessage } from '@langchain/core/messages';
import {
    FLOW_PROMPT,
    CONTENT_PROMPT,
    NARRATION_PROMPT,
    REVIEWER_PROMPT,
    IMPROVER_PROMPT
} from './prompts';

// Define the State Annotation for the Wizard
export const WizardState = Annotation.Root({
    topic: Annotation<string>(),
    genre: Annotation<string>(),
    slideCount: Annotation<number>(),
    template: Annotation<string>(),

    outline: Annotation<any[]>(), // Input from previous stage or Flow Agent

    scriptContent: Annotation<any[]>(), // The core slide content
    narration: Annotation<string[]>(), // Narration for each slide

    critique: Annotation<any>(), // Reviewer feedback
    refinedScript: Annotation<any>(), // Final output

    research_notes: Annotation<string>(), // Facts from web search
});

// Initialize LLM
// Initialize LLM with relaxed safety settings to prevent false positives on creative content
const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    apiKey: process.env.GEMINI_API_KEY,
    safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ]
});

// --- Nodes ---

async function flowNode(state: typeof WizardState.State, config?: RunnableConfig) {
    console.log("🌊 Flow Architect: Analyzing narrative structure...");
    const prompt = FLOW_PROMPT(state.topic, state.genre, state.outline);
    const response = await llm.invoke([new HumanMessage(prompt)], config);

    try {
        const json = JSON.parse(extractJson(response.content as string));
        // We update the outline with the refined version (which has visual cues)
        return { outline: json.refined_outline || state.outline };
    } catch (e) {
        console.error("Flow Gen Error", e);
        return { outline: state.outline };
    }
}

async function contentNode(state: typeof WizardState.State, config?: RunnableConfig) {
    console.log("🎨 Content Agent: Initiating slide generation...");
    // console.log(`🧠 Content Agent: Analyzing topic "${state.topic}" and genre "${state.genre}"...`);

    const prompt = CONTENT_PROMPT(state.topic, state.genre, state.outline, state.template);
    const response = await llm.invoke([new HumanMessage(prompt)], config);

    try {
        console.log("🎨 Content Agent: Parsing generated content...");
        const json = JSON.parse(extractJson(response.content as string));
        return { scriptContent: json.slides };
    } catch (e) {
        console.error("Content Gen Error", e);
        throw new Error("Failed to generate content");
    }
}

async function narrationNode(state: typeof WizardState.State, config?: RunnableConfig) {
    console.log("🎙️ Narration Agent: Reading slide content...");
    const prompt = NARRATION_PROMPT(state.topic, state.genre, state.scriptContent);

    // console.log("🎙️ Narration Agent: Writing scripts for " + state.scriptContent.length + " slides...");
    const response = await llm.invoke([new HumanMessage(prompt)], config);

    try {
        const json = JSON.parse(extractJson(response.content as string));
        console.log("🎙️ Narration Agent: Narration complete.");
        return { narration: json.narrations };
    } catch (e) {
        console.error("Narration Gen Error", e);
        // Fallback
        return { narration: state.scriptContent.map(s => `Narration for ${s.title}`) };
    }
}

async function reviewerNode(state: typeof WizardState.State, config?: RunnableConfig) {
    console.log("🧐 Reviewer Agent: Critiquing script...");

    // Combine content and narration for review
    const draftScript = state.scriptContent.map((s, i) => ({ ...s, narration: state.narration[i] }));

    try {
        const prompt = REVIEWER_PROMPT(state.topic, draftScript);
        const response = await llm.invoke([new HumanMessage(prompt)], config);

        // Check for empty content
        if (!response || !response.content) {
            console.warn("🧐 Reviewer Agent: Received empty response. Skipping review.");
            return { critique: { needs_improvement: false } };
        }

        const json = JSON.parse(extractJson(response.content as string));
        console.log("🧐 Reviewer Agent: Feedback generated.");
        return { critique: json };
    } catch (e) {
        console.error("Review Error", e);
        // Robust fallback: If review fails, we assume no changes needed and proceed
        return { critique: { needs_improvement: false } };
    }
}

async function improverNode(state: typeof WizardState.State, config?: RunnableConfig) {
    // Check if improvements are needed
    if (!state.critique?.needs_improvement && !state.critique?.suggestions?.length) {
        console.log("✨ Improver Agent: No major changes needed. Skipping.");
        return {};
    }

    console.log("🛠️ Improver Agent: Applying fixes based on feedback...");

    const draftScript = {
        slides: state.scriptContent.map((s, i) => ({ ...s, narration: state.narration[i] }))
    };

    const prompt = IMPROVER_PROMPT(draftScript, state.critique);
    const response = await llm.invoke([new HumanMessage(prompt)], config);

    try {
        const json = JSON.parse(extractJson(response.content as string));
        console.log("🛠️ Improver Agent: Polishing complete.");
        // Return the refined script directly
        return { refinedScript: json.refinedScript };
    } catch (e) {
        console.error("Improver Error", e);
        // Fallback to original if improves fails
        return {};
    }
}

async function mergerNode(state: typeof WizardState.State) {
    console.log("🔗 Merger Agent: Finalizing video package...");

    // If refinedScript exists (from Improver), use it. otherwise combine manually.
    if (state.refinedScript) {
        return { refinedScript: { ...state.refinedScript, topic: state.topic, template: state.template } };
    }

    // Combine content and narration into the final Script format
    const finalSlides = state.scriptContent.map((slide, index) => ({
        slide_id: index + 1,
        ...slide,
        narration: state.narration[index] || ""
    }));

    return {
        refinedScript: {
            topic: state.topic,
            template: state.template,
            slides: finalSlides
        }
    };
}

// Helper
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

// --- New Nodes ---

// --- New Nodes ---

// --- New Nodes ---

async function researchNode(state: typeof WizardState.State, config?: RunnableConfig) {
    console.log("🔍 Research Agent: Deciding if research is needed...");

    // 1. Ask LLM if we need research
    try {
        // Import prompt here or ensure it's imported at top
        const { RESEARCH_DECISION_PROMPT } = await import('./prompts');
        const prompt = RESEARCH_DECISION_PROMPT(state.topic, state.genre);
        const response = await llm.invoke([new HumanMessage(prompt)], config);

        const decisionJson = JSON.parse(extractJson(response.content as string));
        console.log(`🔍 Research Decision: ${decisionJson.needs_research ? "YES" : "NO"} (${decisionJson.reason})`);

        if (!decisionJson.needs_research) {
            return { research_notes: "Research skipped (not needed)." };
        }

        // 2. If YES, perform search with the generated query
        console.log(`🔍 Research Agent: Searching for "${decisionJson.search_query}"...`);
        const { searchTool } = await import('./tools');
        const results = await searchTool.invoke(decisionJson.search_query || state.topic);
        console.log("🔍 Research Agent: Found " + results.length + " results.");
        return { research_notes: JSON.stringify(results) };
    } catch (e) {
        console.error("Research Error", e);
        // Fallback: If decision fails, we skip to be safe, or could default to search.
        // Let's default to skipping if the LLM part fails, to avoid "always on" behavior.
        return { research_notes: "Research skipped (error)." };
    }
}

// --- Graph ---

const workflow = new StateGraph(WizardState)
    .addNode("researcher", researchNode)
    .addNode("flow_architect", flowNode)
    .addNode("content_generator", contentNode)
    .addNode("narration_writer", narrationNode)
    .addNode("reviewer", reviewerNode)
    .addNode("improver", improverNode)
    .addNode("merger", mergerNode)

    // Flow: Research -> Architect -> Content -> Narration -> Review -> Improve -> Merge
    .addEdge("researcher", "flow_architect")
    .addEdge("flow_architect", "content_generator")
    .addEdge("content_generator", "narration_writer")
    .addEdge("narration_writer", "reviewer")
    .addEdge("reviewer", "improver")
    .addEdge("improver", "merger")
    .addEdge("merger", END);

workflow.setEntryPoint("researcher");

export const wizardGraph = workflow.compile();
