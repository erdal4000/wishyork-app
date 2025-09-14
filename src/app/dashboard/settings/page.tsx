
'use client';

import { useAuth } from '@/context/auth-context';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user } = useAuth();
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and set e-mail preferences.
        </p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
              <CardDescription>
                Manage your account settings. Profile information can be edited directly on your profile page by clicking "Edit Profile".
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
      </Tabs>
    </div>
  );
}
