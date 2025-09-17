
import { type NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Define a type for the scraped data for clarity and type safety
interface ScrapedData {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
}

// Function to fetch and parse metadata from HTML
const getMetaData = ($, property: string) => {
  return $(`meta[property="${property}"]`).attr('content') || $(`meta[name="${property}"]`).attr('content');
};

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string.' }, { status: 400 });
    }

    // Use a realistic user-agent to avoid being blocked by some sites
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
    };

    const { data: html } = await axios.get(url, { headers });
    const $ = cheerio.load(html);

    const scrapedData: ScrapedData = {
      name: null,
      description: null,
      imageUrl: null,
      price: null,
    };

    // 1. Try to get data from Open Graph (OG) meta tags (most reliable)
    scrapedData.name = getMetaData($, 'og:title');
    scrapedData.description = getMetaData($, 'og:description');
    scrapedData.imageUrl = getMetaData($, 'og:image');
    scrapedData.price = getMetaData($, 'og:price:amount') || getMetaData($, 'product:price:amount');

    // 2. If OG tags fail, fall back to standard HTML tags
    if (!scrapedData.name) {
      scrapedData.name = $('title').text() || $('h1').first().text();
    }
    if (!scrapedData.description) {
      scrapedData.description = $('meta[name="description"]').attr('content') || $('p').first().text();
    }
    if (!scrapedData.imageUrl) {
      // Look for the most prominent image
      const firstImgSrc = $('img').first().attr('src');
      if (firstImgSrc) {
        // Ensure the URL is absolute
        scrapedData.imageUrl = new URL(firstImgSrc, url).href;
      }
    }
    
    // Clean up results
    scrapedData.name = scrapedData.name?.trim() || null;
    scrapedData.description = scrapedData.description?.trim().substring(0, 250) || null; // Limit description length
    
    if (!scrapedData.name) {
      return NextResponse.json({ error: 'Could not automatically determine the product name from the URL.' }, { status: 422 });
    }
    
    return NextResponse.json(scrapedData);

  } catch (error: any) {
    console.error('[SCRAPE API ERROR]', error.message);
    
    let errorMessage = 'An unexpected error occurred while fetching the URL.';
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        errorMessage = 'The provided URL could not be found (404 Not Found).';
      } else if (error.response.status >= 500) {
        errorMessage = 'The target website is currently unavailable or blocking requests.';
      } else {
        errorMessage = `The website responded with status ${error.response.status}. It may be protected or not a public page.`
      }
    } else if (error.code === 'ENOTFOUND') {
        errorMessage = 'The website address could not be resolved. Please check the URL for typos.'
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
