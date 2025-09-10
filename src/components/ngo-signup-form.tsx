"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect, useMemo, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, PartyPopper, UploadCloud, File as FileIcon, X } from "lucide-react";
import Link from 'next/link';
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";

// --- Constants ---
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];

// --- Form Schema ---
const formSchema = z.object({
  ngoName: z.string().min(2, "Organization name must be at least 2 characters."),
  username: z.string().min(3, "Username must be at least 3 characters.").refine(val => /^[a-zA-Z0-9_]+$/.test(val), { message: "Only letters, numbers, and underscores are allowed."}),
  representativeName: z.string().min(2, "Representative's name is required."),
  workEmail: z.string().email("Please enter a valid work email."),
  taxId: z.string().min(5, "Please enter a valid Registration / Tax ID."),
  password: z.string(),
  confirmPassword: z.string(),
  verificationDocument: z.any()
    .refine((file) => !!file, "Verification document is required.")
    .refine((file) => file?.size <= MAX_FILE_SIZE, `Max file size is 5MB.`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file?.type),
      ".pdf, .png, .jpg, and .jpeg files are accepted."
    ),
  terms: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions." }),
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

const takenUsernames = ["admin", "test", "root", "foundation", "charity"];
const checkUsernameAvailability = (username: string): Promise<boolean> => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(!takenUsernames.includes(username.toLowerCase()));
    }, 500); 
  });
};


// --- Component ---
export function NgoSignupForm() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    const [isCheckingUsername, setIsCheckingUsername] = useState(false);
    const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            ngoName: "",
            username: "",
            representativeName: "",
            workEmail: "",
            taxId: "",
            password: "",
            confirmPassword: "",
            verificationDocument: null,
            terms: false,
        },
        mode: "onChange",
    });

    const usernameValue = form.watch("username");
    const passwordValue = form.watch("password", "");
    const confirmPasswordValue = form.watch("confirmPassword", "");
    const verificationDocument = form.watch("verificationDocument");

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


    // Debounced username check
    useEffect(() => {
        const handler = setTimeout(async () => {
        if (usernameValue.length >= 3 && /^[a-zA-Z0-9_]+$/.test(usernameValue)) {
            setIsCheckingUsername(true);
            const isAvailable = await checkUsernameAvailability(usernameValue);
            setIsUsernameAvailable(isAvailable);
            setIsCheckingUsername(false);
            if(!isAvailable) {
                form.setError("username", { type: "manual", message: "This username is already taken." });
            } else {
                form.clearErrors("username");
            }
        } else {
            setIsUsernameAvailable(null);
        }
        }, 500); // 500ms debounce delay

        return () => clearTimeout(handler);
    }, [usernameValue, form]);


    function onSubmit(values: FormData) {
        console.log("Submitting NGO form:", values);
        // Handle form submission, including file upload
    }

    const renderUsernameIcon = () => {
        if(isCheckingUsername) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
        if(isUsernameAvailable === true) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if(isUsernameAvailable === false) return <AlertCircle className="h-5 w-5 text-destructive" />;
        return null;
    }
    
    const ValidationCheck = ({ label, isValid }: { label: string; isValid: boolean }) => (
        <div className={cn("flex items-center text-sm", isValid ? "text-green-500" : "text-muted-foreground")}>
            {isValid ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <AlertCircle className="mr-2 h-4 w-4" />}
            {label}
        </div>
    );
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                
                <p className="text-sm text-center text-muted-foreground">
                  Apply for an account for your Non-Governmental Organization. All applications are manually reviewed.
                </p>

                <Separator />

                <FormField
                    control={form.control}
                    name="ngoName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>NGO Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Foundation for Good" {...field} />
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
                                <Input placeholder="foundation" {...field} />
                            </FormControl>
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                {renderUsernameIcon()}
                            </div>
                        </div>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="representativeName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Representative's Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Jane Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="workEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Work Email Address</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="contact@foundation.org" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Registration / Tax ID</FormLabel>
                        <FormControl>
                            <Input placeholder="Enter your official registration number" {...field} />
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
                        <FormLabel>Password</FormLabel>
                        <div className="relative">
                            <FormControl>
                            <Input type={showPassword ? 'text' : 'password'} {...field} />
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
                        <FormLabel>Confirm Password</FormLabel>
                        <div className="relative">
                                <FormControl>
                                    <Input type={showConfirmPassword ? 'text' : 'password'} {...field} />
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

                <FormField
                    control={form.control}
                    name="verificationDocument"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Verification Document</FormLabel>
                            <FormControl>
                                <div 
                                    className="relative w-full border-2 border-dashed border-muted-foreground/50 rounded-lg p-6 text-center hover:border-primary cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                        accept={ACCEPTED_FILE_TYPES.join(",")}
                                    />
                                    {verificationDocument ? (
                                        <div className="flex items-center justify-center text-sm text-foreground">
                                            <FileIcon className="mr-2 h-5 w-5" />
                                            <span>{verificationDocument.name}</span>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="ml-2 h-6 w-6"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    form.setValue("verificationDocument", null, { shouldValidate: true });
                                                    if (fileInputRef.current) {
                                                        fileInputRef.current.value = "";
                                                    }
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <UploadCloud className="h-10 w-10" />
                                            <span className="font-semibold text-primary">Click to upload</span>
                                            <span>PDF, PNG, or JPG (Max 5MB)</span>
                                        </div>
                                    )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormDescription>
                    After your application, you can log in, but you must wait for admin approval to create and share lists.
                </FormDescription>


                <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
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

                <Button type="submit" className="w-full text-lg py-6" disabled={isCheckingUsername || form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <PartyPopper className="mr-2 h-5 w-5" />}
                    Apply for an NGO Account
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