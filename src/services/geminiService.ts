import { Record } from '../types';

const API_BASE_URL = 'http://localhost:8080/api';

export const getSchemaSummary = async (records: Record[], setName: string): Promise<string> => {
    if (records.length === 0) {
        return Promise.resolve("This set appears to be empty. No schema could be generated.");
    }
    
    // The backend will also take a sample, but we send a reasonable amount
    const sample = records.slice(0, 10);

    try {
        const response = await fetch(`${API_BASE_URL}/schema-summary`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ records: sample, setName }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get summary from backend');
        }

        const data = await response.json();
        return data.summary;
    } catch (error: any) {
        console.error("Error fetching schema summary:", error);
        return `An error occurred while generating the AI-powered schema summary: ${error.message}`;
    }
};
