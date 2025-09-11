
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from './ui/textarea';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  itemName: z.string().min(1, "Item name is required."),
  source: z.string().optional(),
  url: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  price: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AddItemDialog({ children, wishlistId }: { children: React.ReactNode, wishlistId: string }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemName: "",
      source: "",
      url: "",
      price: "",
      description: "",
    },
  });

  async function onSubmit(values: FormData) {
    if (!user) {
        toast({
            title: "Error",
            description: "You must be logged in to add an item.",
            variant: "destructive",
        });
        return;
    }
    if (!wishlistId) {
        toast({
            title: "Error",
            description: "Wishlist ID is missing.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
        const wishlistRef = doc(db, 'wishlists', wishlistId);
        const itemsCollectionRef = collection(wishlistRef, 'items');
        
        await addDoc(itemsCollectionRef, {
            ...values,
            status: 'available', // default status
            addedAt: serverTimestamp(),
            addedBy: user.uid,
            imageUrl: `https://picsum.photos/seed/${values.itemName.replace(/\s/g, '-')}/100/100`, // Placeholder image
            aiHint: values.itemName.split(' ').slice(0,2).join(' '),
        });

        toast({
            title: "Success!",
            description: "New item has been added to your wishlist.",
        });

        setTimeout(() => {
          form.reset();
          setOpen(false);
        }, 100);


    } catch (error) {
        console.error("Error adding item:", error);
        toast({
            title: "Error",
            description: "Something went wrong while adding the item. Please try again.",
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add a New Item</DialogTitle>
          <DialogDescription>
            Fill in the details for the new item you want to add to this wishlist.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., A good book" {...field} disabled={isSubmitting}/>
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
                        placeholder="Any details about the item, like color, size, or why you want it."
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Source (optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Amazon, Etsy" {...field} disabled={isSubmitting}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Price (optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., $49.99" {...field} disabled={isSubmitting}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/product/..." {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
