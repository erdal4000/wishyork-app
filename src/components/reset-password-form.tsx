"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useMemo } from "react";
import Link from 'next/link';
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
import { Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, LogIn, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Form Schema ---
const formSchema = z.object({
  password: z.string(),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

// --- Password Validation ---
const passwordChecks = {
  length: (val: string) => val.length >= 8,
  uppercase: (val: string) => /[A-Z]/.test(val),
  lowercase: (val: string) => /[a-z]/.test(val),
  number: (val: string) => /[0-9]/.test(val),
};

const ValidationCheck = ({ label, isValid }: { label: string; isValid: boolean }) => (
    <div className={cn("flex items-center text-sm", isValid ? "text-green-500" : "text-muted-foreground")}>
        {isValid ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
        {label}
    </div>
);

export function ResetPasswordForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
        mode: "onChange",
    });

    const passwordValue = form.watch("password", "");
    const confirmPasswordValue = form.watch("confirmPassword", "");

    const passwordValidationState = useMemo(() => ({
        length: passwordChecks.length(passwordValue),
        uppercase: passwordChecks.uppercase(passwordValue),
        lowercase: passwordChecks.lowercase(passwordValue),
        number: passwordChecks.number(passwordValue),
    }), [passwordValue]);
      
    const arePasswordsMatching = useMemo(() => {
        if (!passwordValue || !confirmPasswordValue) return true; // Don't show error initially
        return passwordValue === confirmPasswordValue;
    }, [passwordValue, confirmPasswordValue]);


    function onSubmit(values: FormData) {
        console.log("New password set:", values.password);
        setIsSubmitted(true);
        // Handle password reset logic here (e.g., API call with token)
    }

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <KeyRound className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl">
            {isSubmitted ? "Password Reset!" : "Set a New Password"}
        </CardTitle>
        <CardDescription>
            {isSubmitted ? "Your password has been successfully updated." : "Please create a new password for your account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSubmitted ? (
            <div className="flex flex-col items-center gap-6">
                <PartyPopper className="h-20 w-20 text-green-500" />
                 <Button asChild className="w-full text-lg py-6">
                    <Link href="/login">
                        <LogIn className="mr-2 h-5 w-5" />
                        Proceed to Login
                    </Link>
                </Button>
            </div>
        ) : (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <div className="relative">
                        <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                        </FormControl>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                            {showPassword ? <EyeOff /> : <Eye />}
                        </button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                            <ValidationCheck label="8+ characters" isValid={passwordValidationState.length} />
                            <ValidationCheck label="1 uppercase" isValid={passwordValidationState.uppercase} />
                            <ValidationCheck label="1 lowercase" isValid={passwordValidationState.lowercase} />
                            <ValidationCheck label="1 number" isValid={passwordValidationState.number} />
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <div className="relative">
                                <FormControl>
                                    <Input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                                </FormControl>
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                                </button>
                            </div>
                            {!arePasswordsMatching && (
                                <p className="text-sm font-medium text-destructive flex items-center"><AlertCircle className="mr-2 h-4 w-4"/>Passwords do not match.</p>
                            )}
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full text-lg py-6">
                    <KeyRound className="mr-2 h-5 w-5" />
                    Reset Password
                </Button>
            </form>
            </Form>
        )}
      </CardContent>
       {isSubmitted && (
         <CardFooter>
         </CardFooter>
       )}
    </Card>
  );
}
