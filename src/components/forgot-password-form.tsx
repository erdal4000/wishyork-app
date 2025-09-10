"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from 'next/link';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

type FormData = z.infer<typeof formSchema>;

export function ForgotPasswordForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
        },
    });

    function onSubmit(values: FormData) {
        console.log(values);
        setIsSubmitted(true);
        // Handle password reset logic here
    }

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl">
            Forgot Your Password?
        </CardTitle>
        <CardDescription>
            No worries, we'll send you reset instructions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
            <Alert variant="default" className="border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                <CheckCircle2 className="h-4 w-4 !text-green-600 dark:!text-green-400" />
                <AlertDescription>
                    If an account with that email exists, we've sent instructions to reset your password. Please check your inbox (and spam folder).
                </AlertDescription>
            </Alert>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="jane.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full text-lg py-6">
                    <Mail className="mr-2 h-5 w-5" />
                    Send Reset Instructions
                </Button>
            </form>
            </Form>
        )}
      </CardContent>
      <CardFooter>
            <Button variant="link" asChild className="w-full text-muted-foreground">
                <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                </Link>
            </Button>
      </CardFooter>
    </Card>
  );
}
