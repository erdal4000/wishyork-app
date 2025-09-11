
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar as CalendarIcon, Image as ImageIcon, Link2, Loader2, Sparkles, Upload, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { addDoc, collection, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

const formSchema = z.object({
  fetchUrl: z.string().url().optional().or(z.literal('')),
  itemName: z.string().min(1, "Item name is required."),
  // wishlist: z.string().min(1, "Please select a wishlist."), // We'll get this from props
  priority: z.string().default("Medium"),
  recurrence: z.string().default("One-time"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1").default(1),
  price: z.string().optional(),
  purchaseUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  neededBy: z.date().optional(),
  notes: z.string().optional(),
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
      fetchUrl: "",
      itemName: "",
      priority: "Medium",
      recurrence: "One-time",
      quantity: 1,
      price: "",
      purchaseUrl: "",
      neededBy: undefined,
      notes: "",
    },
  });

  async function onSubmit(values: FormData) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to add an item.", variant: "destructive" });
        return;
    }
    if (!wishlistId) {
        toast({ title: "Error", description: "Wishlist ID is missing.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
        const wishlistRef = doc(db, 'wishlists', wishlistId);
        const itemsCollectionRef = collection(wishlistRef, 'items');

        const dataToSave: any = {
            name: values.itemName,
            description: values.notes,
            quantity: values.quantity,
            price: values.price,
            priority: values.priority,
            recurrence: values.recurrence,
            purchaseUrl: values.purchaseUrl,
            status: 'available',
            addedAt: serverTimestamp(),
            addedBy: user.uid,
            imageUrl: `https://picsum.photos/seed/${values.itemName.replace(/\s/g, '-')}/100/100`, // Placeholder image
            aiHint: values.itemName.split(' ').slice(0,2).join(' '),
        };

        if (values.neededBy) {
            dataToSave.neededBy = Timestamp.fromDate(values.neededBy);
        }
        
        await addDoc(itemsCollectionRef, dataToSave);

        toast({ title: "Success!", description: "New item has been added to your wishlist." });

        setTimeout(() => {
          form.reset();
          setOpen(false);
        }, 100);

    } catch (error) {
        console.error("Error adding item:", error);
        toast({ title: "Error", description: "Something went wrong while adding the item. Check the console for details.", variant: "destructive" });
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
          <DialogTitle>Add a New Item</DialogTitle>
          <DialogDescription>
            Add an item by filling out the form, or fetch details from a product URL.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className='-mr-6 pr-6'>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <FormField
                control={form.control}
                name="fetchUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fetch from URL (optional)</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input placeholder="Paste product link here..." {...field} disabled={isSubmitting} className="pr-12"/>
                      </FormControl>
                      <Button type="button" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-10">
                        <Sparkles className='h-5 w-5' />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center space-x-2">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">OR ENTER MANUALLY</span>
                  <Separator className="flex-1" />
              </div>

              <FormField
                control={form.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Wireless Headphones" {...field} disabled={isSubmitting}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Item Image (optional)</Label>
                <div className="flex h-40 w-full items-center justify-center rounded-lg border-2 border-dashed">
                  <div className="text-center text-muted-foreground">
                    <ImageIcon className="mx-auto h-10 w-10" />
                    <p className="mt-2 text-sm font-medium">No image provided</p>
                  </div>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" disabled><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                    <Button type="button" variant="outline" disabled><LinkIcon className="mr-2 h-4 w-4" /> Paste URL</Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High">High</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="recurrence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select recurrence" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="One-time">One-time</SelectItem>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} disabled={isSubmitting} />
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
                        <Input placeholder="e.g., ~$50" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="purchaseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase URL (optional)</FormLabel>
                    <div className="relative">
                       <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                       <FormControl>
                         <Input placeholder="https://example.com/product/..." {...field} className="pl-9" disabled={isSubmitting}/>
                       </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="neededBy"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Needed By (optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isSubmitting}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date() || date < new Date("1900-01-01") }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description / Notes (optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any specific details, like color, model, or where to buy it."
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className="pt-4 pr-6 sticky bottom-0 bg-background py-4">
              <Button variant="ghost" type="button" onClick={() => setOpen(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Re-export Label to avoid conflicts with FormLabel
import { Label } from "@/components/ui/label";

