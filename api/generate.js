// This code runs securely on the Vercel server, not in the user's browser.

// The Gemini API key must be stored securely as an Environment Variable
// in your Vercel project settings, named GEMINI_API_KEY.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// Define the handler function for Vercel Serverless
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).send({ error: 'Method Not Allowed' });
    }

    // The frontend sends the cuisine string in the request body
    const { cuisine } = request.body;

    if (!cuisine) {
        return response.status(400).send({ error: 'Missing cuisine parameter.' });
    }
    
    if (!GEMINI_API_KEY) {
        // This error will only show if you forget to set the environment variable
        console.error("GEMINI_API_KEY environment variable is not set.");
        return response.status(500).send({ error: 'Server configuration error.' });
    }

    const userQuery = `Give me a detailed recipe idea for **${cuisine}** that serves two people. Include the title, an ingredient list, and easy instructions.`;

    const systemPrompt = "You are a friendly and highly creative world-class chef. You specialize in generating clear, concise, and delicious recipes. Always format your output using markdown headings and bullet points for readability. Do not include any introductory or concluding chatter, only the recipe.";

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        tools: [{ "google_search": {} }],
        systemInstruction: {
            parts: [{ text: systemPrompt }]
        },
        config: {
            temperature: 0.8
        }
    };

    try {
        const geminiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        // Forward the API response back to the frontend
        const data = await geminiResponse.json();
        
        if (!geminiResponse.ok) {
            // Log the error details and send a generic failure message
            console.error("Gemini API error:", data);
            return response.status(geminiResponse.status).send({ error: 'Failed to fetch recipe from Gemini API.' });
        }

        response.status(200).json(data);

    } catch (error) {
        console.error("Proxy error:", error);
        response.status(500).send({ error: 'Internal server error during recipe generation.' });
    }
}
