
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
  coverURL?: string;
  bio?: string;
  followersCount: number;
  followingCount: number;
}

// This function now correctly uses the Admin SDK on the server.
async function getUserByUsername(username: string): Promise<UserProfile | null> {
  if (!username) return null;

  try {
    const adminApp = getAdminApp();
    const adminDb = getFirestore(adminApp);
    
    const usersRef = adminDb.collection('users');
    // The query now correctly uses the method chaining syntax of the Admin SDK
    const q = usersRef
      .where('username_lowercase', '==', username.toLowerCase())
      .limit(1);
      
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`User not found for username: ${username}`);
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    const data = userDoc.data();
    
    const profileData: UserProfile = {
      uid: userDoc.id,
      name: data.name,
      username: data.username,
      photoURL: data.photoURL,
      coverURL: data.coverURL,
      bio: data.bio,
      followersCount: data.followersCount || 0,
      followingCount: data.followingCount || 0,
    };
    return profileData;

  } catch (error) {
      console.error("CRITICAL: getUserByUsername fonksiyonunda bir hata oluştu:", error);
      // We return null to prevent the page from hanging, and the `notFound()`
      // function will be called below, which is a safe fallback.
      return null;
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
  // This separates the server-side data fetching from the client-side interactivity.
  return <ProfilePageClient initialProfileUser={profileUser} />;
}
