
'use client'; // Hata bileşenleri 'use client' olmalıdır.

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
    // Hataları bir raporlama servisine gönderebilirsiniz
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen items-center justify-center bg-secondary/30">
      <Card className="w-full max-w-lg text-center shadow-2xl">
        <CardHeader>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold">Bir şeyler ters gitti!</CardTitle>
          <CardDescription className="mt-2">
            Beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
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
                // Sayfayı yeniden yükleyerek segmenti yeniden oluşturmayı dene
                () => reset()
                }
            >
                Tekrar Dene
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
