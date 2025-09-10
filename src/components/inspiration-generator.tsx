"use client";

import { useState } from 'react';
import {
  getProductSuggestions,
  type ProductSuggestionsOutput,
} from '@/ai/flows/ai-suggestion-engine';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

export function InspirationGenerator() {
  const [interests, setInterests] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] =
    useState<ProductSuggestionsOutput['suggestions'] | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const result = await getProductSuggestions({
        userInterests: interests,
        trendingItems: 'sustainable products, tech gadgets, handmade crafts',
        numberOfSuggestions: 6,
      });
      setSuggestions(result.suggestions);
    } catch (err) {
      console.error(err);
      setError(
        'An error occurred while generating suggestions. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Generate Suggestions</CardTitle>
            <CardDescription>
              Enter some of your interests, hobbies, or things you're looking
              for, separated by commas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid w-full gap-2">
              <Label htmlFor="interests">My Interests</Label>
              <Textarea
                id="interests"
                placeholder="e.g., minimalist home decor, travel, sustainable fashion, coffee..."
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={loading || !interests}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="mr-2 h-4 w-4" />
              )}
              Get Inspired
            </Button>
          </CardFooter>
        </form>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video w-full rounded-t-lg bg-muted"></div>
              <CardHeader>
                <div className="h-5 w-3/4 rounded bg-muted"></div>
                <div className="mt-2 h-4 w-1/2 rounded bg-muted"></div>
              </CardHeader>
              <CardContent>
                <div className="h-12 w-full rounded bg-muted"></div>
              </CardContent>
              <CardFooter>
                 <div className="h-10 w-full rounded-md bg-muted"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {suggestions && suggestions.length > 0 && (
        <div>
           <h2 className="mb-4 text-2xl font-bold tracking-tight flex items-center">
            <Sparkles className="mr-2 h-6 w-6 text-accent" />
            Here are your personalized suggestions!
           </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {suggestions.map((item, index) => (
              <Card key={index} className="flex flex-col">
                 <div className="relative aspect-video w-full overflow-hidden rounded-t-lg">
                    <Image
                        src={`https://picsum.photos/400/225?random=${index}`}
                        alt={item.name}
                        data-ai-hint={item.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                </div>
                <CardHeader>
                  <CardTitle>{item.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={item.url} target="_blank" rel="noopener noreferrer">
                      View Product
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
