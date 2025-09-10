import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if the API key is present. If not, log an error but don't crash.
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set. Genkit AI features will be disabled.");
}

export const ai = genkit({
  plugins: [
    // Only initialize the plugin if the API key exists.
    process.env.GEMINI_API_KEY ? googleAI({
      apiKey: process.env.GEMINI_API_KEY,
    }) : undefined,
  ].filter(p => p !== undefined) as any, // Filter out undefined plugins
  model: 'googleai/gemini-2.5-flash',
});
