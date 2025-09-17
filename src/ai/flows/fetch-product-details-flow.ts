
'use server';
/**
 * @fileOverview Fetches and parses product information from a given URL using an AI model.
 *
 * - fetchProductDetails - A function that takes a URL and returns structured product data.
 * - FetchProductDetailsInput - The input type for the fetchProductDetails function.
 * - FetchProductDetailsOutput - The return type for the fetchProductDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleSearch } from '@genkit-ai/googleai';


const FetchProductDetailsInputSchema = z.object({
  productUrl: z.string().url().describe('The URL of the product page.'),
});
export type FetchProductDetailsInput = z.infer<
  typeof FetchProductDetailsInputSchema
>;

const FetchProductDetailsOutputSchema = z.object({
  name: z.string().describe('The name of the product.'),
  description: z
    .string()
    .describe('A short, compelling description of the product.'),
  price: z.string().optional().describe('The price of the product as a formatted string (e.g., "$19.99", "1.200 TL").'),
  imageUrl: z.string().url().optional().describe('A direct, absolute URL to the main product image. This must be a full URL pointing to a file (e.g., .jpg, .png, .webp) and not a base64 data URI.'),
});
export type FetchProductDetailsOutput = z.infer<
  typeof FetchProductDetailsOutputSchema
>;

export async function fetchProductDetails(
  input: FetchProductDetailsInput
): Promise<FetchProductDetailsOutput> {
  return fetchProductDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productDetailFetcherPrompt',
  input: {schema: FetchProductDetailsInputSchema},
  output: {schema: FetchProductDetailsOutputSchema},
  tools: [googleSearch],
  prompt: `You are an expert web scraper and data extractor specializing in e-commerce product pages.
Your task is to analyze the content of the provided URL using your tools and extract key product information.

Product URL: {{{productUrl}}}

Use the googleSearch tool to fetch the content of the URL. Then, from that content, please extract the following details and return them in the specified JSON format:
- Product Name
- A concise and appealing product description (max 2-3 sentences)
- The price, including the currency symbol if available.
- A direct, absolute URL to the main, high-quality product image.

Ensure the imageUrl is a direct link to an image file (e.g., .jpg, .png, .webp) and not a link to another webpage or a base64 data URI.`,
});

const fetchProductDetailsFlow = ai.defineFlow(
  {
    name: 'fetchProductDetailsFlow',
    inputSchema: FetchProductDetailsInputSchema,
    outputSchema: FetchProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output || !output.name) {
      throw new Error("AI model could not extract product name. The URL may not be a valid product page or may be inaccessible.");
    }
    return output;
  }
);
