export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface CompletionResponse {
    content: string;
    error?: string;
}

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const APP_NAME = 'NotebookLM Video Gen';

export async function chatCompletion(messages: ChatMessage[]): Promise<CompletionResponse> {
    if (!OPENROUTER_API_KEY) {
        console.error('OPENROUTER_API_KEY is not set');
        return { content: '', error: 'API Key missing' };
    }

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': APP_NAME,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'mistralai/devstral-2512:free',
                messages: messages,
                temperature: 0.7,
                response_format: { type: 'json_object' },
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        return {
            content: data.choices[0].message.content,
        };

    } catch (error: any) {
        console.error('LLM Call Failed:', error);
        return { content: '', error: error.message };
    }
}
