
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Users, Lock, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';
import { Label } from "@/components/ui/label";
import placeholderImages from '@/lib/placeholder-images.json';

const formSchema = z.object({
  wishlistName: z.string().min(1, "Wishlist name is required."),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category."),
  privacy: z.enum(["public", "friends", "private"]).default("public"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateWishlistDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wishlistName: "",
      description: "",
      category: "",
      privacy: "public",
    },
  });

  async function onSubmit(values: FormData) {
    if (!user) {
        toast({
            title: "Error",
            description: "You must be logged in to create a wishlist.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const authorUsername = userData?.username || 'anonymous';

        const wishlistSeed = values.wishlistName.replace(/\s/g, '-');

        await addDoc(collection(db, 'wishlists'), {
            authorId: user.uid,
            authorUsername: authorUsername,
            title: values.wishlistName,
            title_lowercase: values.wishlistName.toLowerCase(),
            description: values.description,
            category: values.category,
            privacy: values.privacy,
            createdAt: serverTimestamp(),
            // Default values for new wishlists
            itemCount: 0,
            imageUrl: placeholderImages.wishlist.cover.replace('{{seed}}', wishlistSeed),
            aiHint: values.category.toLowerCase(),
            progress: 0,
            unitsFulfilled: 0,
            totalUnits: 0,
            likes: 0,
            commentCount: 0,
            saves: 0,
        });

        toast({
            title: "Success!",
            description: "Your wishlist has been created.",
        });

        setTimeout(() => {
          form.reset();
          setOpen(false);
        }, 100);


    } catch (error) {
        console.error("Error creating wishlist:", error);
        toast({
            title: "Error",
            description: "Something went wrong while creating your wishlist. Please try again.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create a New Wishlist</DialogTitle>
          <DialogDescription>
            Fill in the details below to start your new wishlist.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="pr-6 -mr-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="wishlistName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wishlist Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Birthday Wishlist" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A short description of your wishlist's purpose."
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Cover Image (optional)</Label>
                <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-sm font-medium">Image upload coming soon</p>
                  </div>
                </div>
              </div>
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Charity">Charity</SelectItem>
                        <SelectItem value="Community">Community</SelectItem>
                        <SelectItem value="Travel">Travel</SelectItem>
                        <SelectItem value="Home">Home</SelectItem>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Health">Health</SelectItem>
                        <SelectItem value="Fashion">Fashion</SelectItem>
                        <SelectItem value="Education">Education</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="privacy"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Privacy</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                        disabled={isSubmitting}
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="public" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-1.5"><Globe className="h-4 w-4" /> Public</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="friends" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-1.5"><Users className="h-4 w-4" /> Friends</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="private" />
                          </FormControl>
                          <FormLabel className="font-normal flex items-center gap-1.5"><Lock className="h-4 w-4" /> Private</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className="pt-4 pr-6">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
