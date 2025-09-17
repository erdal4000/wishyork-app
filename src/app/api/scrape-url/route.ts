
import { type NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface ScrapedData {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  price: string | null;
}

const getMetaData = ($, property: string) => {
  return $(`meta[property="${property}"]`).attr('content') || $(`meta[name="${property}"]`).attr('content');
};

const getPriceFromCommonSelectors = ($: cheerio.CheerioAPI): string | null => {
  const priceSelectors = [
    '[class*="price"]',
    '[id*="price"]',
    '.a-price-whole',
    '.a-price-fraction',
    '.prc-slg',
    '.product-price',
    '.price-tag',
  ];

  for (const selector of priceSelectors) {
    let priceText = $(selector).first().text().trim();
    if (priceText) {
      // Extract numbers and currency symbols
      const match = priceText.match(/[\d.,]+[.,\d]*\s*[€$₺TL]?/);
      if (match) {
        return match[0].replace(/\s+/g, ' ').trim();
      }
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required and must be a string.' }, { status: 400 });
    }

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

    // 1. Try to get data from JSON-LD (Schema.org) - Most reliable
    const jsonLdScript = $('script[type="application/ld+json"]').html();
    if (jsonLdScript) {
        try {
            const jsonData = JSON.parse(jsonLdScript);
            const productSchema = jsonData['@graph'] ? jsonData['@graph'].find((item: any) => item['@type'] === 'Product') : (jsonData['@type'] === 'Product' ? jsonData : null);
            if (productSchema) {
                scrapedData.name = productSchema.name;
                scrapedData.description = productSchema.description;
                if (productSchema.image) {
                   scrapedData.imageUrl = Array.isArray(productSchema.image) ? productSchema.image[0] : productSchema.image;
                }
                if (productSchema.offers) {
                    const offer = Array.isArray(productSchema.offers) ? productSchema.offers[0] : productSchema.offers;
                    scrapedData.price = `${offer.priceCurrency} ${offer.price}`;
                }
            }
        } catch (e) {
            console.warn("Could not parse JSON-LD script:", e);
        }
    }

    // 2. Fallback to Open Graph (OG) meta tags
    if (!scrapedData.name) scrapedData.name = getMetaData($, 'og:title');
    if (!scrapedData.description) scrapedData.description = getMetaData($, 'og:description');
    if (!scrapedData.imageUrl) scrapedData.imageUrl = getMetaData($, 'og:image');
    if (!scrapedData.price) scrapedData.price = getMetaData($, 'og:price:amount') || getMetaData($, 'product:price:amount');
    
    // 3. Fallback to standard HTML tags if still missing
    if (!scrapedData.name) scrapedData.name = $('title').text() || $('h1').first().text();
    if (!scrapedData.description) scrapedData.description = $('meta[name="description"]').attr('content') || $('p').first().text();
    if (!scrapedData.imageUrl) {
        let largestImage: { src: string | undefined, area: number} = { src: undefined, area: 0 };
        $('img').each((_, el) => {
            const width = Number($(el).attr('width')) || Number(el.attribs.width) || 0;
            const height = Number($(el).attr('height')) || Number(el.attribs.height) || 0;
            const area = width * height;
            if(area > largestImage.area) {
                largestImage = { src: $(el).attr('src'), area };
            }
        });
        const firstImgSrc = largestImage.src || $('img').first().attr('src');
        if (firstImgSrc) {
            scrapedData.imageUrl = new URL(firstImgSrc, url).href;
        }
    }
    if (!scrapedData.price) {
        scrapedData.price = getPriceFromCommonSelectors($);
    }
    
    // Clean up results
    scrapedData.name = scrapedData.name?.trim() || null;
    scrapedData.description = scrapedData.description?.trim().substring(0, 250) || null;
    
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
