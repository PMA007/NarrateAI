
import { StateGraph, END, Annotation } from '@langchain/langgraph';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { ROUTER_PROMPT, GENERATOR_PROMPT } from './prompts';

// Define the State Annotation
const AgentState = Annotation.Root({
    topic: Annotation<string>(),
    language: Annotation<string>(),
    slideCount: Annotation<number>(),
    userSuggestions: Annotation<string>(), // New: User input

    genre: Annotation<string>(),       // New: e.g., 'history', 'math'
    classification: Annotation<string>(), // 'simple' | 'complex'

    researchData: Annotation<string>(),
    finalScript: Annotation<any>(),
});

// Initialize LLM (Gemini 2.5 Flash)
const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    maxOutputTokens: 8192,
    apiKey: process.env.GEMINI_API_KEY
});

// Initialize Tools
// Custom Tavily Search Helper
async function tavilySearch(query: string) {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) throw new Error("TAVILY_API_KEY not set");

    console.log("Searching Tavily:", query);
    const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            api_key: apiKey.trim(),
            query,
            search_depth: "basic",
            max_results: 5
        })
    });

    if (!res.ok) {
        const errorBody = await res.text();
        throw new Error(`Tavily API error: ${res.status} - ${errorBody}`);
    }

    const data = await res.json();
    return JSON.stringify(data.results || data);
}

// --- Nodes ---

// 1. Classifier Node
async function classifierNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    console.log("🤖 Agent: Classifying topic & genre...");
    const response = await llm.invoke([
        new SystemMessage(ROUTER_PROMPT),
        new HumanMessage(`Topic: ${state.topic} `)
    ]);

    try {
        const json = JSON.parse(extractJson(response.content as string));
        console.log(`TYPE: ${json.genre} (${json.complexity})`);
        return {
            genre: json.genre || 'general',
            classification: json.complexity || 'simple'
        };
    } catch (e) {
        console.warn("Classifier failed to parse JSON, defaulting to general/simple");
        return { genre: 'general', classification: 'simple' };
    }
}

// 2. Researcher Node
async function researcherNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    console.log("🕵️ Agent: Researching topic...");
    try {
        const query = `${state.topic} ${state.genre !== 'general' ? state.genre : ''} detailed facts`;
        const searchResult = await tavilySearch(query);
        return { researchData: searchResult };
    } catch (error) {
        console.warn("Research failed:", error);
        return { researchData: "Research unavailable." };
    }
}

// 3. Unified Generator Node
async function generatorNode(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    console.log(`🎨 Agent: Generating script(${state.genre})...`);

    const context = state.researchData || "No external research required.";
    const genre = (state.genre as any) || 'general';

    const prompt = GENERATOR_PROMPT(
        state.topic,
        genre,
        state.slideCount,
        context,
        state.userSuggestions
    );

    const response = await llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage(`Language: ${state.language} `)
    ]);

    try {
        const text = response.content as string;
        const jsonString = extractJson(text);
        const json = JSON.parse(jsonString);
        return { finalScript: json };
    } catch (e) {
        console.error("Generator JSON Parse Error", e);
        throw new Error("Failed to parse LLM output");
    }
}

// Helper: Clean JSON markdown
function extractJson(text: string): string {
    const match = text.match(/```json([\s\S]*?)```/);
    if (match) return match[1];
    return text;
}

// --- Graph Definition ---

// @ts-ignore
const workflow = new StateGraph(AgentState)
    .addNode("classifier", classifierNode)
    .addNode("researcher", researcherNode)
    .addNode("generator", generatorNode)

    .addEdge("researcher", "generator")
    .addEdge("generator", END);

// Conditional Routing
workflow.setEntryPoint("classifier");
workflow.addConditionalEdges(
    "classifier",
    (state) => state.classification === 'complex' ? "researcher" : "generator"
);

// Compile the graph
export const appGraph = workflow.compile();

