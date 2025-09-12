
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, PartyPopper } from "lucide-react";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";


const passwordChecks = {
  length: (val: string) => val.length >= 8,
  uppercase: (val: string) => /[A-Z]/.test(val),
  lowercase: (val: string) => /[a-z]/.test(val),
  number: (val: string) => /[0-9]/.test(val),
};

const renderUsernameIcon = (isChecking: boolean, isAvailable: boolean | null) => {
    if(isChecking) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    if(isAvailable === true) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if(isAvailable === false) return <AlertCircle className="h-5 w-5 text-destructive" />;
    return null;
}

const ValidationCheck = ({ label, isValid }: { label: string; isValid: boolean }) => (
  <div className={cn("flex items-center text-sm", isValid ? "text-green-500" : "text-muted-foreground")}>
      {isValid ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
      {label}
  </div>
);

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, "Username must be at least 3 characters.").refine(val => /^[a-zA-Z0-9_]+$/.test(val), { message: "Only letters, numbers, and underscores are allowed."}),
  email: z.string().email({ message: "Please enter a valid email address." }),
  dob_month: z.string().optional(),
  dob_day: z.string().optional(),
  dob_year: z.string().optional(),
  birthday_visibility: z.enum(["public", "day_month", "private"]).default("public"),
  password: z.string(),
  confirm_password: z.string(),
  terms: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions." }),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match.",
  path: ["confirm_password"],
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


export function IndividualSignupForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && user) {
        router.push('/dashboard');
    }
  }, [user, loading, router]);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirm_password: "",
      dob_month: "",
      dob_day: "",
      dob_year: "",
      birthday_visibility: "public",
      terms: false,
    },
    mode: "onChange",
  });

  const usernameValue = form.watch("username");
  const passwordValue = form.watch("password", "");
  const confirmPasswordValue = form.watch("confirm_password", "");

  const passwordValidationState = useMemo(() => ({
    length: passwordChecks.length(passwordValue),
    uppercase: passwordChecks.uppercase(passwordValue),
    lowercase: passwordChecks.lowercase(passwordValue),
    number: passwordChecks.number(passwordValue),
  }), [passwordValue]);
  
  const arePasswordsMatching = useMemo(() => {
      if (!passwordValue || !confirmPasswordValue) return true;
      return passwordValue === confirmPasswordValue;
  }, [passwordValue, confirmPasswordValue]);


  useEffect(() => {
    const checkUsername = async () => {
      if (usernameValue.length < 3) {
        setIsUsernameAvailable(null);
        return;
      }
      setIsCheckingUsername(true);
      const formattedUsername = usernameValue.toLowerCase();
      try {
        const docRef = doc(db, 'usernames', formattedUsername);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setIsUsernameAvailable(false);
          form.setError("username", { type: "manual", message: "This username is already taken." });
        } else {
          setIsUsernameAvailable(true);
          form.clearErrors("username");
        }
      } catch (error) {
        console.error("Error checking username:", error);
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const handler = setTimeout(() => {
        if(/^[a-zA-Z0-9_]+$/.test(usernameValue)) {
            checkUsername();
        } else if (usernameValue.length > 0) {
            form.setError("username", { type: "manual", message: "Only letters, numbers, and underscores are allowed." });
            setIsUsernameAvailable(null);
        }
    }, 500); 

    return () => {
      clearTimeout(handler);
    };
  }, [usernameValue, form]);

  const handleGoogleSignIn = () => {
    window.location.href = '/api/auth/google-signin-redirect';
  };


  const handleFormSubmit = async (values: FormData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    if (isUsernameAvailable === false) {
        toast({
            title: "Signup Failed",
            description: "The chosen username is not available. Please choose another one.",
            variant: "destructive",
        });
        setIsSubmitting(false);
        return;
    }

    const { email, password, name, username } = values;
    const formattedUsername = username.toLowerCase();

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const photoURL = `https://picsum.photos/seed/${user.uid}/200/200`;
      
      await updateProfile(user, { 
          displayName: name,
          photoURL: photoURL
      });

      const batch = writeBatch(db);
      
      const userDocRef = doc(db, 'users', user.uid);
      batch.set(userDocRef, {
          uid: user.uid,
          name: name,
          email: email,
          username: formattedUsername,
          username_lowercase: formattedUsername,
          createdAt: serverTimestamp(),
          photoURL: photoURL,
          followers: [],
          following: [],
          followersCount: 0,
          followingCount: 0,
      });

      const usernameDocRef = doc(db, 'usernames', formattedUsername);
      batch.set(usernameDocRef, { uid: user.uid });
      
      await batch.commit();
      
      toast({ title: "Welcome!", description: "Your account has been created successfully." });

    } catch (error: any) {
        const errorCode = error.code;
        let errorMessage = "An unknown error occurred.";
        if (errorCode === 'auth/email-already-in-use') {
            errorMessage = "This email address is already in use by another account.";
        } else if (errorCode === 'auth/weak-password') {
            errorMessage = "The password is too weak. Please choose a stronger password.";
        }
        toast({
            title: "Signup Failed",
            description: errorMessage,
            variant: "destructive",
        });
        setIsSubmitting(false);
    } 
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 pt-4">
        
        <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
             <GoogleIcon />
             Continue with Google
        </Button>


        <div className="flex items-center space-x-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR CONTINUE WITH EMAIL</span>
            <Separator className="flex-1" />
        </div>


        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <div className="relative">
                    <FormControl>
                        <Input placeholder="janedoe" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        {renderUsernameIcon(isCheckingUsername, isUsernameAvailable)}
                    </div>
                   </div>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane.doe@example.com" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div>
            <FormLabel>Date of birth (Optional)</FormLabel>
            <div className="mt-2 grid grid-cols-3 gap-2">
                 <FormField
                    control={form.control}
                    name="dob_month"
                    render={({ field }) => (
                        <FormItem>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {[...Array(12)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>{new Date(Date.UTC(2000, i)).toLocaleString('en-US', { month: 'long' })}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                 />
                 <FormField
                    control={form.control}
                    name="dob_day"
                    render={({ field }) => (
                        <FormItem>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                     {[...Array(31)].map((_, i) => <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                 />
                <FormField
                    control={form.control}
                    name="dob_year"
                    render={({ field }) => (
                        <FormItem>
                             <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {[...Array(100)].map((_, i) => <SelectItem key={i} value={(new Date().getFullYear() - i).toString()}>{new Date().getFullYear() - i}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormItem>
                    )}
                 />
            </div>
            <FormDescription className="mt-2">
                Add your birthday so friends don't miss it!
            </FormDescription>
        </div>


        <FormField
            control={form.control}
            name="birthday_visibility"
            render={({ field }) => (
                <FormItem className="rounded-lg border p-4">
                     <FormLabel className="text-base">Birthday Visibility</FormLabel>
                     <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="mt-2 space-y-2" disabled={isSubmitting}>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="public" />
                                </FormControl>
                                <FormLabel className="font-normal">Public (Show full birthday)</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="day_month" />
                                </FormControl>
                                <FormLabel className="font-normal">Show day & month only (Hide year)</FormLabel>
                            </FormItem>
                             <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                    <RadioGroupItem value="private" />
                                </FormControl>
                                <FormLabel className="font-normal">Private (Hide from profile)</FormLabel>
                            </FormItem>
                        </RadioGroup>
                     </FormControl>
                </FormItem>
            )}
        />


        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input type={showPassword ? 'text' : 'password'} {...field} disabled={isSubmitting} />
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
          name="confirm_password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm Password</FormLabel>
               <div className="relative">
                    <FormControl>
                        <Input type={showConfirmPassword ? 'text' : 'password'} {...field} disabled={isSubmitting} />
                    </FormControl>
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                </div>
                {!arePasswordsMatching && (
                     <p className="flex items-center text-sm font-medium text-destructive"><AlertCircle className="mr-2 h-4 w-4"/>Passwords do not match.</p>
                )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="terms"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isSubmitting} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                   I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                </FormLabel>
                <FormMessage/>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full py-6 text-lg" disabled={isSubmitting || isCheckingUsername || isUsernameAvailable === false}>
            {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PartyPopper className="mr-2 h-5 w-5" />}
            Create Account
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
                Log in
            </Link>
        </p>
      </form>
    </Form>
  );
}

    

    