"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IndividualSignupForm } from '@/components/individual-signup-form';
import { NgoSignupForm } from '@/components/ngo-signup-form';
import { Waves } from 'lucide-react';

export function SignupForm() {
  return (
    <Card className="w-full max-w-lg rounded-2xl shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Waves className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl">Create an account</CardTitle>
        <CardDescription>Join our community to start sharing and supporting wishes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Individual</TabsTrigger>
            <TabsTrigger value="ngo">NGO</TabsTrigger>
          </TabsList>
          <TabsContent value="individual">
            <IndividualSignupForm />
          </TabsContent>
          <TabsContent value="ngo">
            <NgoSignupForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
