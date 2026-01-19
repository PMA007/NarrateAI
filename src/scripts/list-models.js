
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

function getEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        const content = fs.readFileSync(envPath, 'utf8');
        const match = content.match(/GEMINI_API_KEY=(.*)/);
        return match ? match[1].trim() : null;
    } catch (e) {
        return null;
    }
}

async function listModels() {
    const apiKey = getEnv();
    if (!apiKey) {
        console.error("No API Key found in .env.local");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // There isn't a direct listModels on the SDK instance in older versions, 
    // but we can try the REST endpoint if SDK fails, or uses fetch directly.
    // Actually, asking the model to list models is not possible.
    // The SDK likely doesn't expose listModels in the main entry point easily in all versions.
    // Let's use simple fetch to the REST API which is reliable.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("=== Available Models (v1beta) ===");
            data.models.forEach(m => {
                if (m.name.includes("flash") || m.name.includes("tts") || m.name.includes("gemini")) {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        } else {
            console.log("No models found or error:", data);
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }

    // Try alpha too
    const urlAlpha = `https://generativelanguage.googleapis.com/v1alpha/models?key=${apiKey}`;
    try {
        const response = await fetch(urlAlpha);
        const data = await response.json();

        if (data.models) {
            console.log("\n=== Available Models (v1alpha) ===");
            data.models.forEach(m => {
                if (m.name.includes("flash") || m.name.includes("tts") || m.name.includes("gemini")) {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                }
            });
        }
    } catch (e) { }

}

listModels();
