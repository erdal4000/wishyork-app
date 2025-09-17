
'use server';
/**
 * @fileOverview This file is now DEPRECATED and will be removed.
 * Product information is now fetched via a server-side scraping API endpoint.
 * See src/app/api/scrape-url/route.ts
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  // This function is deprecated and now throws an error.
  throw new Error("The AI-based fetchProductDetails flow is deprecated. Use the /api/scrape-url endpoint instead.");
}
