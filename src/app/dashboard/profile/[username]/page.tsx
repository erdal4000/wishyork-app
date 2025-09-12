
'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { getFirestore, DocumentData } from 'firebase-admin/firestore';
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

// This function now correctly uses the Admin SDK on the server.
async function getUserByUsername(username: string): Promise<UserProfile | null> {
  if (!username) return null;

  try {
    const adminApp = await getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const usersRef = adminDb.collection('users');
    const q = usersRef
      .where('username_lowercase', '==', username.toLowerCase())
      .limit(1);
      
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return null; // User not found
    }

    const userDoc = querySnapshot.docs[0];
    // Manually serialize the data to a plain object for Next.js props
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
  } catch (error) {
      console.error("Error fetching user by username on server:", error);
      // We throw the error to let Next.js catch it and show a generic error page.
      // This prevents exposing detailed errors to the client.
      throw new Error("Failed to fetch user data.");
  }
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

  // 3. If the user doesn't exist, show the standard 404 page.
  if (!profileUser) {
    notFound();
  }

  // 4. If the user exists, pass the fetched data as a prop to the Client Component.
  return <ProfilePageClient initialProfileUser={profileUser} />;
}
