
"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import debounce from 'lodash.debounce';
import Image from 'next/image';

import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, AlertCircle, Upload, XCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { getInitials } from '@/lib/utils';
import { Progress } from './ui/progress';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, "Username must be at least 3 characters.").refine(val => /^[a-zA-Z0-9_]+$/.test(val), { message: "Only letters, numbers, and underscores are allowed." }),
  bio: z.string().max(160, "Bio cannot be longer than 160 characters.").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const renderUsernameIcon = (isChecking: boolean, isAvailable: boolean | null, serverError: boolean) => {
  if (isChecking) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
  if (serverError) return <AlertCircle className="h-5 w-5 text-yellow-500" title="Could not verify username" />;
  if (isAvailable === true) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
  if (isAvailable === false) return <AlertCircle className="h-5 w-5 text-destructive" />;
  return null;
}

export function EditProfileDialog({ open, onOpenChange, onSuccess }: EditProfileDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const avatarUpload = useImageUpload();
  const coverUpload = useImageUpload();

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [originalUsername, setOriginalUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameServerError, setUsernameServerError] = useState(false);
  
  const [photoUrl, setPhotoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const usernameValue = form.watch("username");

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (!username || username.toLowerCase() === originalUsername.toLowerCase()) {
        setIsUsernameAvailable(null);
        setIsCheckingUsername(false);
        form.clearErrors("username");
        return;
      }
      if (username.length < 3) {
        setIsUsernameAvailable(null);
        return;
      }

      setIsCheckingUsername(true);
      setUsernameServerError(false);
      const formattedUsername = username.toLowerCase();
      try {
        const q = query(collection(db, "users"), where("username_lowercase", "==", formattedUsername));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setIsUsernameAvailable(true);
          form.clearErrors("username");
        } else {
          setIsUsernameAvailable(false);
          form.setError("username", { type: "manual", message: "This username is already taken." });
        }
      } catch (error) {
        console.error("Error checking username:", error);
        setUsernameServerError(true);
        form.setError("username", { type: "manual", message: "Couldn't verify username. Try again." });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500),
    [originalUsername, form]
  );

  useEffect(() => {
    if (usernameValue !== undefined) {
      checkUsername(usernameValue);
    }
  }, [usernameValue, checkUsername]);

  useEffect(() => {
    if (user && open) {
      setLoadingData(true);
      avatarUpload.reset();
      coverUpload.reset();
      const userDocRef = doc(db, 'users', user.uid);
      getDoc(userDocRef).then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          form.reset({
            name: data.name || '',
            username: data.username || '',
            bio: data.bio || '',
          });
          setOriginalUsername(data.username || '');
          setPhotoUrl(data.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`);
          setCoverUrl(data.coverURL || `https://picsum.photos/seed/${user.uid}/1200/400`);
        }
        setLoadingData(false);
      });
    }
  }, [user, open, form]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    const file = e.target.files[0];
    const path = `user-images/${user.uid}/${type}/${Date.now()}_${file.name}`;
    
    const uploader = type === 'avatar' ? avatarUpload : coverUpload;

    try {
        const newUrl = await uploader.uploadImage(file, path);
        if (type === 'avatar') {
            setPhotoUrl(newUrl);
        } else {
            setCoverUrl(newUrl);
        }
    } catch(err) {
        // Error is already toasted in the hook
    }
  };

  const handleRemoveImage = (type: 'avatar' | 'cover') => {
    if (!user) return;
    const newSeed = Date.now(); // To get a new random image
    if (type === 'avatar') {
        setPhotoUrl(`https://picsum.photos/seed/${newSeed}/200/200`);
        if (avatarInputRef.current) {
            avatarInputRef.current.value = "";
        }
        avatarUpload.reset();
        toast({ title: 'Avatar Removed', description: 'Your avatar will be reset to a default image upon saving.' });
    } else {
        setCoverUrl(`https://picsum.photos/seed/${newSeed}/1200/400`);
        if (coverInputRef.current) {
            coverInputRef.current.value = "";
        }
        coverUpload.reset();
        toast({ title: 'Cover Image Removed', description: 'Your cover image will be reset to a default image upon saving.' });
    }
  };

  const handleProfileSubmit = async (values: ProfileFormData) => {
    if (!user) return;

    if (usernameValue !== originalUsername && isUsernameAvailable === false) {
      toast({ title: "Username taken", description: "Please choose a different username.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const batch = writeBatch(db);

      const dataToUpdate: any = {
        name: values.name,
        bio: values.bio,
        photoURL: photoUrl,
        coverURL: coverUrl
      };

      if (values.username.toLowerCase() !== originalUsername.toLowerCase()) {
        dataToUpdate.username = values.username;
        dataToUpdate.username_lowercase = values.username.toLowerCase();
        
        if (originalUsername) {
          const oldUsernameRef = doc(db, 'usernames', originalUsername.toLowerCase());
          batch.delete(oldUsernameRef);
        }
        const newUsernameRef = doc(db, 'usernames', values.username.toLowerCase());
        batch.set(newUsernameRef, { uid: user.uid });
      }

      batch.update(userDocRef, dataToUpdate);
      await batch.commit();

      toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
      onSuccess();

    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: 'Update Failed', description: 'An error occurred while saving your profile.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isUploading = avatarUpload.uploading || coverUpload.uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg grid-rows-[auto_1fr_auto] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {loadingData ? (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
        <ScrollArea className='-mr-6 pr-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6 py-4">
              
              <div className="space-y-6 px-1">
                 <div className="space-y-2">
                    <FormLabel>Cover Image</FormLabel>
                    <div className="relative h-32 w-full rounded-lg bg-muted">
                        {coverUrl && <Image src={coverUrl} alt="Cover image" layout="fill" objectFit="cover" className="rounded-lg" />}
                    </div>
                     {coverUpload.uploading ? (
                         <div className="pt-2">
                            <Progress value={coverUpload.progress} className="w-full h-2" />
                            <p className="text-xs text-muted-foreground mt-1 text-center">Uploading... {Math.round(coverUpload.progress)}%</p>
                        </div>
                     ) : (
                        <div className="flex gap-2">
                            <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => coverInputRef.current?.click()}>
                              <Upload className="mr-2 h-4 w-4" /> Upload
                            </Button>
                            <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => handleRemoveImage('cover')}>
                              <XCircle className="mr-2 h-4 w-4" /> Remove
                            </Button>
                            <input
                                type="file"
                                ref={coverInputRef}
                                onChange={(e) => handleImageUpload(e, 'cover')}
                                className="hidden"
                                accept="image/png, image/jpeg"
                            />
                        </div>
                     )}
                 </div>

                 <div className="space-y-2">
                    <FormLabel>Profile Photo</FormLabel>
                    <div className="flex items-center gap-4">
                       <Avatar className="h-20 w-20">
                            <AvatarImage src={photoUrl} />
                            <AvatarFallback>{getInitials(form.getValues('name'))}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-2">
                             {avatarUpload.uploading ? (
                                <div className="pt-2">
                                    <Progress value={avatarUpload.progress} className="w-full h-2" />
                                    <p className="text-xs text-muted-foreground mt-1 text-center">Uploading... {Math.round(avatarUpload.progress)}%</p>
                                </div>
                             ) : (
                                <>
                                 <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => avatarInputRef.current?.click()}>
                                   <Upload className="mr-2 h-4 w-4" /> Upload
                                 </Button>
                                 <Button type="button" size="sm" variant="outline" className="w-full" onClick={() => handleRemoveImage('avatar')}>
                                   <XCircle className="mr-2 h-4 w-4" /> Remove
                                 </Button>
                                 <input
                                    ref={avatarInputRef}
                                    onChange={(e) => handleImageUpload(e, 'avatar')}
                                    className="hidden"
                                    accept="image/png, image/jpeg"
                                 />
                                </>
                             )}
                        </div>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting || isUploading} />
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
                            <Input {...field} disabled={isSubmitting || isUploading} />
                          </FormControl>
                          <div className="absolute inset-y-0 right-3 flex items-center">
                            {renderUsernameIcon(isCheckingUsername, isUsernameAvailable, usernameServerError)}
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Tell us a little about yourself"
                            {...field}
                            disabled={isSubmitting || isUploading}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              <DialogFooter className="pt-4 pr-6 sticky bottom-0 bg-background py-4">
                <Button variant="ghost" type="button" onClick={() => onOpenChange(false)} disabled={isSubmitting || isUploading}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting || isCheckingUsername || isUploading}>
                  {(isSubmitting || isUploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
