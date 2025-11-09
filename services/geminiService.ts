
import { GoogleGenAI } from "@google/genai";
import { Record } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this example, we assume it's set in the environment.
  console.warn("Gemini API key not found in process.env.API_KEY");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const getSchemaSummary = async (records: Record[], setName: string): Promise<string> => {
    if (!API_KEY) {
        return Promise.resolve("API key not configured. Cannot generate AI summary.");
    }

    if (records.length === 0) {
        return Promise.resolve("This set appears to be empty. No schema could be generated.");
    }
    
    // Take a small sample for efficiency
    const sample = records.slice(0, 5).map(r => r.bins);

    const prompt = `
        Analyze the following sample of JSON objects, which represent records from an Aerospike database set named "${setName}".
        Based on this sample, provide a brief, user-friendly summary of the data schema in Markdown format.
        Describe the likely purpose of the most important bins (fields) and mention their data types.
        Do not just list the fields; explain what the data represents as a whole.

        Sample Records:
        ${JSON.stringify(sample, null, 2)}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "An error occurred while generating the AI-powered schema summary. Please check the console for details.";
    }
};
