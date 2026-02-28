// Direct Fetch Implementation to avoid dependency issues with @langchain/tavily-research
export const searchTool = {
    invoke: async (query: string) => {
        try {
            console.log(`🔍 Searching Tavily for: ${query}`);
            const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    api_key: process.env.TAVILY_API_KEY,
                    query: query,
                    search_depth: "basic",
                    include_answer: true,
                    max_results: 3
                })
            });

            if (!response.ok) {
                console.error("Tavily API Error:", response.statusText);
                return [];
            }

            const data = await response.json();
            return data.results || [];
        } catch (e) {
            console.error("Tavily Fetch Error:", e);
            return [];
        }
    }
};
