
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import debounce from 'lodash.debounce';

import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, writeBatch, query, collection, where, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  username: z.string().min(3, "Username must be at least 3 characters.").refine(val => /^[a-zA-Z0-9_]+$/.test(val), { message: "Only letters, numbers, and underscores are allowed."}),
  bio: z.string().max(160, "Bio cannot be longer than 160 characters.").optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const renderUsernameIcon = (isChecking: boolean, isAvailable: boolean | null, serverError: boolean) => {
    if(isChecking) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;
    if(serverError) return <AlertCircle className="h-5 w-5 text-yellow-500" title="Could not verify username" />;
    if(isAvailable === true) return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if(isAvailable === false) return <AlertCircle className="h-5 w-5 text-destructive" />;
    return null;
}


function ProfileSettingsSkeleton() {
    return (
        <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                This is how others will see you on the site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-8" />
                <Skeleton className="h-20 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    )
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [originalUsername, setOriginalUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameServerError, setUsernameServerError] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
  });

  const usernameValue = form.watch("username");

  const checkUsername = useCallback(
    debounce(async (username: string) => {
      if (username === originalUsername) {
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
        form.setError("username", { type: "manual", message: "Couldn't verify username. Try again."});
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
    if (user) {
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
        }
        setLoadingData(false);
      });
    }
  }, [user, form]);
  
  const handleProfileSubmit = async (values: ProfileFormData) => {
    if (!user) return;

    if(usernameValue !== originalUsername && isUsernameAvailable === false) {
        toast({ title: "Username taken", description: "Please choose a different username.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);

    try {
        const userDocRef = doc(db, 'users', user.uid);
        const batch = writeBatch(db);

        batch.update(userDocRef, {
            name: values.name,
            bio: values.bio,
            username: values.username,
            username_lowercase: values.username.toLowerCase(),
        });

        // If username was changed, update the usernames collection
        if (usernameValue !== originalUsername) {
            // Firestore usernames collection uses lowercase usernames as doc IDs
            const oldUsernameRef = doc(db, 'usernames', originalUsername.toLowerCase());
            const newUsernameRef = doc(db, 'usernames', values.username.toLowerCase());
            
            // It's possible the old username doesn't exist in the collection if it was created before the collection was in use
            const oldUsernameDoc = await getDoc(oldUsernameRef);
            if (oldUsernameDoc.exists()) {
                batch.delete(oldUsernameRef);
            }

            batch.set(newUsernameRef, { uid: user.uid });
        }

        await batch.commit();

        toast({ title: 'Profile Updated', description: 'Your changes have been saved successfully.' });
        setOriginalUsername(values.username); // update original username after successful save
        
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({ title: 'Update Failed', description: 'An error occurred while saving your profile.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  }


  const isLoading = authLoading || loadingData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          {isLoading ? (
            <ProfileSettingsSkeleton />
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleProfileSubmit)}>
                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      This is how others will see you on the site.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input id="name" {...field} disabled={isSubmitting} />
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
                              <Input id="username" {...field} disabled={isSubmitting} />
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
                              id="bio"
                              placeholder="Tell us a little about yourself"
                              {...field}
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isSubmitting || isCheckingUsername}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Changes
                    </Button>
                  </CardFooter>
                </Card>
              </form>
            </Form>
          )}
        </TabsContent>
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
              </div>
               <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
            </CardContent>
            <CardFooter>
              <Button>Update Password</Button>
            </CardFooter>
             <Separator />
             <CardHeader className="pb-4">
                <CardTitle className="text-xl text-destructive">Delete Account</CardTitle>
                <CardDescription>
                    Once you delete your account, there is no going back. Please be certain.
                </CardDescription>
            </CardHeader>
             <CardFooter>
                <Button variant="destructive">Delete Your Account</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="space-y-2">
                    <h3 className="text-lg font-medium">Email Notifications</h3>
                    <div className="space-y-4">
                         <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base" htmlFor="comments">Comments</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive an email when someone comments on your posts.
                                </p>
                            </div>
                             <Switch id="comments" defaultChecked />
                        </div>
                         <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base" htmlFor="fulfill">Wish Fulfillment</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive an email when someone fulfills one of your wishes.
                                </p>
                            </div>
                             <Switch id="fulfill" defaultChecked />
                        </div>
                         <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label className="text-base" htmlFor="follows">New Followers</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get notified when someone new follows you.
                                </p>
                            </div>
                             <Switch id="follows" />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-muted-foreground">
                  Select the theme for the dashboard. This is already handled by the toggle in the top right.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

    