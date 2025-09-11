
'use client'; // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-secondary/30">
      <Card className="w-full max-w-lg text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Something went wrong!</CardTitle>
          <CardDescription className="mt-2">
            An unexpected error has occurred. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            {error?.message && (
                 <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 text-left text-sm text-muted-foreground">
                    {error.message}
                 </pre>
            )}
            <Button
                size="lg"
                onClick={
                // Attempt to recover by trying to re-render the segment
                () => reset()
                }
            >
                Try Again
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
