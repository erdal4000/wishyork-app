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

// Bu fonksiyon, kullanıcıyı kullanıcı adına göre Firestore'dan getirir.
async function getUserByUsername(username: string): Promise<UserProfile | null> {
  if (!username) return null;
  const adminApp = await getAdminApp();
  const adminDb = getFirestore(adminApp);
  
  const usersRef = adminDb.collection('users');
  const q = usersRef
    .where('username_lowercase', '==', username.toLowerCase())
    .limit(1);
    
  const querySnapshot = await q.get();

  if (querySnapshot.empty) {
    return null; // Kullanıcı bulunamadı
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

// Bu, ana Sunucu Bileşenidir.
export default async function ProfilePage({
  params,
}: {
  params: { username: string };
}) {
  // 1. URL'den kullanıcı adını al.
  const { username } = params;

  // 2. Sunucuda kullanıcı verisini çek.
  const profileUser = await getUserByUsername(username);

  // 3. Eğer kullanıcı bulunamazsa, 404 sayfasını göster.
  if (!profileUser) {
    notFound();
  }

  // 4. Kullanıcı bulunduysa, veriyi İstemci Bileşenine prop olarak gönder.
  return <ProfilePageClient initialProfileUser={profileUser} />;
}
