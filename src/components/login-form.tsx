
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect } from "react";
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
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Waves, LogIn, Loader2, AlertCircle } from "lucide-react";
import Link from 'next/link';
import { signInWithEmailAndPassword, signInWithCustomToken } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { query, collection, where, getDocs } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/context/auth-context";

const formSchema = z.object({
  login: z.string().min(1, { message: "Email or username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

type FormData = z.infer<typeof formSchema>;

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        <path fill="none" d="M1 1h22v22H1z" />
    </svg>
);

const isEmail = (str: string): boolean => {
  if (!str) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHandlingRedirect, setIsHandlingRedirect] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) {
        setError(decodeURIComponent(authError));
    }
    
    // This effect will handle the result of the Google sign-in redirect
    const handleRedirect = async () => {
        const customToken = searchParams.get('token');
        if (customToken) {
            try {
                await signInWithCustomToken(auth, customToken);
                // The onAuthStateChanged listener in AuthProvider will handle the redirect and cookie creation.
                toast({ title: "Welcome!", description: "You have successfully signed in." });
            } catch (error: any) {
                console.error("Google sign-in with custom token error:", error);
                setError(error.message || "Failed to sign in with Google.");
            } finally {
                setIsHandlingRedirect(false);
                // Clean up URL params
                const newUrl = window.location.pathname;
                window.history.replaceState({}, document.title, newUrl);
            }
        } else {
            setIsHandlingRedirect(false);
        }
    };
    
    if(searchParams.get('googleSignIn') === 'true') {
        handleRedirect();
    } else {
        setIsHandlingRedirect(false);
    }
  }, [searchParams, toast, router]);

  useEffect(() => {
    if (!loading && user) {
        router.push('/dashboard');
    }
  }, [user, loading, router]);


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { login: "", password: "" },
  });
  
  const handleGoogleSignIn = () => {
    setError(null);
    setIsSubmitting(true); // Show loading state
    window.location.href = '/api/auth/google-signin-redirect';
  };


  const handleEmailLogin = async (values: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    
    let emailToLogin: string | null = null;

    try {
      if (isEmail(values.login)) {
        emailToLogin = values.login;
      } else {
        const q = query(collection(db, "users"), where("username_lowercase", "==", values.login.toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          emailToLogin = querySnapshot.docs[0].data().email;
        }
      }

      if (!emailToLogin) {
        throw new Error("Invalid username or password.");
      }
      
      await signInWithEmailAndPassword(auth, emailToLogin, values.password);
      
      toast({ title: "Login Successful!", description: "Redirecting you..." });
      // The useEffect for user state will handle the redirect
    } catch (error: any) {
        setError("Invalid username or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || isHandlingRedirect) {
      return (
        <Card className="w-full max-w-md rounded-2xl shadow-xl">
             <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Waves className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="font-headline text-3xl">Welcome back</CardTitle>
                <CardDescription>Finalizing your sign in...</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center items-center p-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
      )
  }

  return (
    <Card className="w-full max-w-md rounded-2xl shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Waves className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="font-headline text-3xl">Welcome back</CardTitle>
        <CardDescription>Enter your credentials to access your account.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
            <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        <div className="space-y-4">
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
                <GoogleIcon />
                Continue with Google
            </Button>

            <div className="flex items-center space-x-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
              <Separator className="flex-1" />
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailLogin)} className="space-y-6">
                <FormField
                control={form.control}
                name="login"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email or Username</FormLabel>
                    <FormControl>
                        <Input placeholder="jane.doe@example.com or janedoe" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Button asChild variant="link" className="h-auto p-0 text-xs" type="button">
                            <Link href="/forgot-password">Forgot your password?</Link>
                        </Button>
                    </div>
                    <div className="relative">
                        <FormControl>
                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} disabled={isSubmitting}/>
                        </FormControl>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
                    Login
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/signup" className="font-medium text-primary hover:underline">
                        Sign up
                    </Link>
                </p>
              </form>
            </Form>
        </div>
      </CardContent>
    </Card>
  );
}
