import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { SLIDE_SPECS_PROMPT, OUTLINE_PROMPT } from './prompts';

// Initialize LLM
const llm = new ChatGoogleGenerativeAI({
    model: "gemini-2.5-flash",
    maxOutputTokens: 2000,
    apiKey: process.env.GEMINI_API_KEY
});

// Helper to clean JSON
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

export async function getSlideSpecs(topic: string, genre: string) {
    console.log(`🤖 Agent: Analyzing specs for "${topic}" (${genre})...`);

    const response = await llm.invoke([
        new SystemMessage(SLIDE_SPECS_PROMPT),
        new HumanMessage(`Topic: ${topic}\nGenre: ${genre}`)
    ]);

    try {
        const json = JSON.parse(extractJson(response.content as string));
        return json;
    } catch (e) {
        console.error("Specs Agent Parse Error", e);
        return { recommendedSlideCount: 5, reasoning: "Defaulting due to error.", contentStrategy: "General overview." };
    }
}

export async function getOutline(
    topic: string,
    genre: string,
    slideCount: number,
    currentOutline: string[] = [],
    userFeedback: string = ""
) {
    console.log(`📝 Agent: Generating outline for "${topic}"...`);

    const prompt = OUTLINE_PROMPT(topic, genre, slideCount, currentOutline, userFeedback);

    const response = await llm.invoke([
        new HumanMessage(prompt)
    ]);

    try {
        const json = JSON.parse(extractJson(response.content as string));
        return json;
    } catch (e) {
        console.error("Outline Agent Parse Error", e);
        // Fallback outline
        return { outline: Array(slideCount).fill(0).map((_, i) => `Slide ${i + 1}: ${topic}`) };
    }
}
