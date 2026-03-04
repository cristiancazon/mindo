const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
    try {
        const prompt = `You are a pedagogical expert.`;
        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: prompt,
        });
        console.log(geminiResponse.text());
    } catch (error) {
        console.error("GENAI ERROR MESSAGE:", error.message);
    }
}
run();
