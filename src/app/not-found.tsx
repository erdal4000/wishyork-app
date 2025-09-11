
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex h-screen items-center justify-center bg-secondary/30">
       <Card className="w-full max-w-lg text-center shadow-2xl">
        <CardHeader>
           <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <SearchX className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">404 - Page Not Found</CardTitle>
          <CardDescription className="mt-2">
            We couldn't find the page you're looking for. Maybe it never existed or was moved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="lg">
            <Link href="/">Return to Homepage</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
