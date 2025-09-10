'use server';

/**
 * @fileOverview Provides AI-powered product suggestions based on user interests and trending items.
 *
 * - getProductSuggestions - A function that retrieves product suggestions.
 * - ProductSuggestionsInput - The input type for the getProductSuggestions function.
 * - ProductSuggestionsOutput - The return type for the getProductSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSuggestionsInputSchema = z.object({
  userInterests: z
    .string()
    .describe('A comma-separated list of the user\u2019s interests.'),
  trendingItems: z
    .string()
    .describe('A comma-separated list of trending items.'),
  numberOfSuggestions: z
    .number()
    .default(5)
    .describe('The number of product suggestions to return.'),
});
export type ProductSuggestionsInput = z.infer<typeof ProductSuggestionsInputSchema>;

const ProductSuggestionsOutputSchema = z.object({
  suggestions: z.array(
    z.object({
      name: z.string().describe('The name of the product.'),
      description: z.string().describe('A short description of the product.'),
      url: z.string().url().describe('A URL where the product can be purchased.'),
    })
  ).describe('A list of product suggestions.'),
});
export type ProductSuggestionsOutput = z.infer<typeof ProductSuggestionsOutputSchema>;

export async function getProductSuggestions(input: ProductSuggestionsInput): Promise<ProductSuggestionsOutput> {
  return productSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'productSuggestionsPrompt',
  input: {schema: ProductSuggestionsInputSchema},
  output: {schema: ProductSuggestionsOutputSchema},
  prompt: `You are a personal shopping assistant. You will generate a list of product suggestions based on the user's interests and trending items.

User Interests: {{{userInterests}}}
Trending Items: {{{trendingItems}}}

Please provide {{numberOfSuggestions}} product suggestions.

Each product suggestion should include the name of the product, a short description, and a URL where the product can be purchased.

Format the output as a JSON array of product suggestions.`,
});

const productSuggestionsFlow = ai.defineFlow(
  {
    name: 'productSuggestionsFlow',
    inputSchema: ProductSuggestionsInputSchema,
    outputSchema: ProductSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
