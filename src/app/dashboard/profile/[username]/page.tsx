import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { notFound } from 'next/navigation';
import { ProfilePageClient } from '@/components/profile-page-client';

// Define data types for clarity and type safety
interface UserProfile {
  uid: string;
  name: string;
  username: string;
  email: string;
  photoURL?: string;
  bio?: string;
}

interface Post {
  id: string;
  content: string;
  imageUrl: string | null;
  aiHint: string | null;
  // Add other post fields as necessary
}

interface Wishlist {
  id: string;
  title: string;
  imageUrl: string;
  aiHint: string;
  category: string;
  progress: number;
  itemCount: number;
  privacy: 'public' | 'private' | 'friends';
  likes?: number;
  // Add other wishlist fields as necessary
}

// Helper function to fetch user data by username from Firestore
async function getUserByUsername(username: string): Promise<UserProfile | null> {
  const usersRef = collection(db, 'users');
  // Firestore usernames are stored in lowercase, so we query with lowercase
  const q = query(usersRef, where('username', '==', username.toLowerCase()), limit(1));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];
  return { uid: userDoc.id, ...userDoc.data() } as UserProfile;
}

// Helper function to fetch public wishlists for a given author ID
async function getPublicWishlistsByAuthorId(authorId: string): Promise<Wishlist[]> {
  const wishlistsRef = collection(db, 'wishlists');
  const q = query(
    wishlistsRef,
    where('authorId', '==', authorId),
    where('privacy', '==', 'public'),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);

  const wishlists = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Wishlist[];

  // Fetch itemCount for each wishlist
  const wishlistsWithItemCount = await Promise.all(
    wishlists.map(async (list) => {
      const itemsColRef = collection(db, 'wishlists', list.id, 'items');
      const snapshot = await getDocs(itemsColRef);
      return { ...list, itemCount: snapshot.size };
    })
  );

  return wishlistsWithItemCount;
}

// Helper function to fetch posts for a given author ID
async function getPostsByAuthorId(authorId: string): Promise<Post[]> {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, where('authorId', '==', authorId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
}


// This is the main page component, which is now a SERVER COMPONENT.
// It's an async function and does not use any client-side hooks like useEffect or useState.
export default async function ProfilePage({ params }: { params: { username: string } }) {
  const { username } = params;

  // 1. Fetch the user profile from the server.
  const profileUser = await getUserByUsername(username);

  // 2. If user doesn't exist, show a "Not Found" page.
  if (!profileUser) {
    notFound();
  }

  // 3. If user exists, fetch their public wishlists and posts concurrently.
  const [wishlists, posts] = await Promise.all([
    getPublicWishlistsByAuthorId(profileUser.uid),
    getPostsByAuthorId(profileUser.uid)
  ]);
  
  // 4. Pass the fetched server-side data to a Client Component for rendering.
  // The client component will handle all the interactive parts (tabs, buttons, etc.).
  return <ProfilePageClient profileUser={profileUser} initialWishlists={wishlists} initialPosts={posts} />;
}
