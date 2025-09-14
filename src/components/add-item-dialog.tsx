
"use client";

import { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from 'next/image';

import { useImageUpload } from '@/hooks/useImageUpload';
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
import { Textarea } from '@/components/ui/textarea';
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
import { Calendar as CalendarIcon, Image as ImageIcon, Link2, Loader2, Sparkles, Upload, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, serverTimestamp, Timestamp, writeBatch, increment, runTransaction, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from './ui/progress';
import { Label } from './ui/label';
import { fetchProductDetails } from '@/ai/flows/fetch-product-details-flow';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const formSchema = z.object({
  fetchUrl: z.string().url("Please enter a valid URL.").optional().or(z.literal('')),
  itemName: z.string().min(1, "Item name is required."),
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
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const itemImageUpload = useImageUpload();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

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

  const resetDialog = () => {
    form.reset();
    itemImageUpload.reset();
    setImageUrl(null);
    setIsFetchingUrl(false);
    setFetchError(null);
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetDialog();
    }
  }

  const handleFetchUrl = async () => {
    const url = form.getValues('fetchUrl');
    if (!url) {
      form.setError('fetchUrl', { type: 'manual', message: 'Please enter a URL to fetch.' });
      return;
    }
    
    // Clear previous errors/data
    form.clearErrors('fetchUrl');
    setFetchError(null);
    setIsFetchingUrl(true);

    try {
      const result = await fetchProductDetails({ productUrl: url });
      
      // Populate form fields with the fetched data
      if (result.name) form.setValue('itemName', result.name, { shouldValidate: true });
      if (result.description) form.setValue('notes', result.description, { shouldValidate: true });
      if (result.price) form.setValue('price', result.price, { shouldValidate: true });
      if (result.imageUrl) setImageUrl(result.imageUrl);
      
      // Also set the purchase URL to the fetched URL
      form.setValue('purchaseUrl', url, { shouldValidate: true });

      toast({ title: 'Success', description: 'Product details have been fetched!' });

    } catch (error) {
      console.error("Error fetching product details:", error);
      const errorMessage = "Could not fetch details from this URL. The page might be protected or not a standard product page. Please enter details manually.";
      setFetchError(errorMessage);
      toast({ title: 'Fetch Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsFetchingUrl(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user || !wishlistId) return;
    const file = e.target.files[0];
    const path = `item-images/${wishlistId}/${Date.now()}_${file.name}`;
    
    try {
        const newUrl = await itemImageUpload.uploadImage(file, path);
        setImageUrl(newUrl);
    } catch(err) {
        // Error is toasted in the hook
    }
  };

  const handleRemoveImage = () => {
    setImageUrl(null);
    itemImageUpload.reset();
    const fileInput = document.getElementById('item-image-upload') as HTMLInputElement;
    if (fileInput) {
        fileInput.value = "";
    }
    toast({ title: 'Image Removed', description: 'A default placeholder image will be used.' });
  };


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
        const newItemRef = doc(itemsCollectionRef);

        await runTransaction(db, async (transaction) => {
            const wishlistDoc = await transaction.get(wishlistRef);
            if (!wishlistDoc.exists()) {
                throw "Wishlist does not exist!";
            }

            const dataToSave: any = {
                id: newItemRef.id,
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
                imageUrl: imageUrl || `https://picsum.photos/seed/${values.itemName.replace(/\s/g, '-')}/200/200`,
                aiHint: values.itemName.split(' ').slice(0,2).join(' '),
            };
    
            if (values.neededBy) {
                dataToSave.neededBy = Timestamp.fromDate(values.neededBy);
            }

            transaction.set(newItemRef, dataToSave);
            
            const currentData = wishlistDoc.data();
            const newTotalUnits = (currentData.totalUnits || 0) + values.quantity;
            const newProgress = newTotalUnits > 0 ? Math.round(((currentData.unitsFulfilled || 0) / newTotalUnits) * 100) : 0;

            transaction.update(wishlistRef, {
                itemCount: increment(1),
                totalUnits: newTotalUnits,
                progress: newProgress,
            });
        });

        toast({ title: "Success!", description: "New item has been added to your wishlist." });

        setTimeout(() => {
          handleOpenChange(false);
        }, 100);

    } catch (error) {
        console.error("Error adding item:", error);
        toast({ title: "Error", description: "Something went wrong while adding the item. Check the console for details.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }
  
  const isUploading = itemImageUpload.uploading;
  const isBusy = isSubmitting || isUploading || isFetchingUrl;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="Paste product link here..." {...field} disabled={isBusy} className="pr-12"/>
                      </FormControl>
                      <Button type="button" size="icon" onClick={handleFetchUrl} disabled={isBusy || !form.getValues('fetchUrl')}>
                        {isFetchingUrl ? <Loader2 className='h-5 w-5 animate-spin' /> : <Sparkles className='h-5 w-5' />}
                        <span className="sr-only">Fetch Details</span>
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {fetchError && (
                 <Alert variant="destructive">
                    <AlertTitle>Fetch Error</AlertTitle>
                    <AlertDescription>{fetchError}</AlertDescription>
                </Alert>
              )}

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
                      <Input placeholder="e.g., Wireless Headphones" {...field} disabled={isBusy}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Item Image (optional)</Label>
                <div className="relative h-40 w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                    {imageUrl ? (
                        <>
                           <Image src={imageUrl} alt="Item image preview" layout="fill" objectFit="contain" className="rounded-lg p-2" />
                           <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={handleRemoveImage} disabled={isBusy}>
                                <XCircle className="h-4 w-4" />
                           </Button>
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground">
                            <ImageIcon className="mx-auto h-10 w-10" />
                            <p className="mt-2 text-sm font-medium">No image provided</p>
                            <p className="text-xs">Upload one or fetch from URL</p>
                        </div>
                    )}
                     {isUploading && (
                        <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center rounded-lg">
                           <Loader2 className="h-8 w-8 animate-spin text-primary" />
                           <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
                           <Progress value={itemImageUpload.progress} className="w-3/4 h-2 mt-2" />
                        </div>
                     )}
                </div>
                 <div className="flex gap-2 mt-2">
                    <Label htmlFor="item-image-upload" className="flex-1">
                       <Button type="button" variant="outline" className="w-full" asChild disabled={isBusy}>
                          <span><Upload className="mr-2 h-4 w-4" /> Upload Image</span>
                       </Button>
                        <input id="item-image-upload" type="file" onChange={handleImageUpload} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" />
                    </Label>
                    {imageUrl && (
                         <Button type="button" variant="destructive" className="flex-1" onClick={handleRemoveImage} disabled={isBusy}>
                            <XCircle className="mr-2 h-4 w-4" /> Remove Image
                         </Button>
                    )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isBusy}>
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
                       <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isBusy}>
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
                        <Input type="number" {...field} disabled={isBusy} />
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
                        <Input placeholder="e.g., ~$50 or 1.500 TL" {...field} disabled={isBusy} />
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
                         <Input placeholder="https://example.com/product/..." {...field} className="pl-9" disabled={isBusy}/>
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
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isBusy}
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
                          onSelect={(date) => {
                            field.onChange(date);
                            setDatePickerOpen(false);
                          }}
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
                        disabled={isBusy}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <DialogFooter className="pt-4 pr-6 sticky bottom-0 bg-background py-4">
              <Button variant="ghost" type="button" onClick={() => handleOpenChange(false)} disabled={isBusy}>Cancel</Button>
              <Button type="submit" disabled={isBusy}>
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

    