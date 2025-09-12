'use server';

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  DocumentData,
} from 'firebase-admin/firestore';
import { getAdminApp } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import { ProfilePageClient } from '@/components/profile-page-client';

interface UserProfile extends DocumentData {
  uid: string;
  name: string;
  username: string;
  photoURL?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
}

// This function runs on the server to fetch the user's data.
async function getUserByUsername(username: string): Promise<UserProfile | null> {
  if (!username) return null;
  const adminApp = await getAdminApp();
  const adminDb = adminApp.firestore();
  
  const usersRef = adminDb.collection('users');
  const q = query(
    usersRef,
    where('username_lowercase', '==', username.toLowerCase()),
    limit(1)
  );
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null; // User not found
  }

  const userDoc = querySnapshot.docs[0];
  // We need to manually serialize the data to a plain object for Next.js
  const data = userDoc.data();
  const profileData: UserProfile = {
    uid: userDoc.id,
    name: data.name,
    username: data.username,
    photoURL: data.photoURL,
    bio: data.bio,
    followersCount: data.followersCount || 0,
    followingCount: data.followingCount || 0,
  };
  return profileData;
}

// This is the main Server Component for the profile page.
export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // 1. Get the username from the URL.
  const { username } = params;

  // 2. Fetch the user data on the server.
  const profileUser = await getUserByUsername(username);

  // 3. If the user is not found, render the 404 page.
  if (!profileUser) {
    notFound();
  }

  // 4. If the user is found, pass the data as a prop to the Client Component.
  return <ProfilePageClient initialProfileUser={profileUser} />;
}
