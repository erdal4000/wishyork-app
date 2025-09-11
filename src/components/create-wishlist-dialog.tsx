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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Users, Lock, Image as ImageIcon, Link2 } from 'lucide-react';

const formSchema = z.object({
  wishlistName: z.string().min(1, "Wishlist name is required."),
  description: z.string().optional(),
  category: z.string().min(1, "Please select a category."),
  privacy: z.enum(["public", "friends", "private"]).default("public"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateWishlistDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      wishlistName: "",
      description: "",
      category: "",
      privacy: "public",
    },
  });

  function onSubmit(values: FormData) {
    console.log(values);
    // TODO: Handle form submission to create the wishlist
    setOpen(false); // Close the dialog on successful submission
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create a New Wishlist</DialogTitle>
          <DialogDescription>
            Fill in the details below to start your new wishlist.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="wishlistName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wishlist Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., My Birthday Wishlist" {...field} />
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
                    <p className="mt-2 text-sm font-medium">No cover image</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" type="button">Upload from Device</Button>
                    <Button variant="outline" type="button">Add from URL</Button>
                </div>
              </div>
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fashion">Fashion</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="tech">Technology</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
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
            </div>
            <DialogFooter>
              <Button variant="ghost" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Re-export Label to avoid conflicts with FormLabel
import { Label } from "@/components/ui/label";
