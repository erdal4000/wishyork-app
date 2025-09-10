
import { SignupForm } from '@/components/signup-form';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Suspense } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';


function SignupFormSkeleton() {
  return (
     <Card className="w-full max-w-lg rounded-2xl shadow-xl">
      <CardHeader className="text-center space-y-4">
        <Skeleton className="mx-auto h-16 w-16 rounded-full" />
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full mt-6" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-screen-xl px-4 py-8 md:py-16">
          <div className="mx-auto max-w-lg">
            <Suspense fallback={<SignupFormSkeleton />}>
                <SignupForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
