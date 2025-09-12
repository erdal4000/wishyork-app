
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  let adminApp;
  try {
    // Lazily initialize the admin app only when this route is hit.
    adminApp = await getAdminApp();
  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK.', error);
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const adminAuth = getAuth(adminApp);
  const adminDb = getFirestore(adminApp);

  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const { uid, name, email, picture } = decodedToken;

    if (!uid || !email) {
      return NextResponse.json({ error: 'UID or email not found in Google token payload' }, { status: 400 });
    }

    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      const username = (email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') ?? '') + Math.floor(Math.random() * 999);
      const usernameDocRef = adminDb.collection('usernames').doc(username);
      const usernameLowercase = username.toLowerCase();
      
      const batch = adminDb.batch();

      batch.set(userDocRef, {
        uid: uid,
        name: name || 'New User',
        email: email,
        username: username,
        username_lowercase: usernameLowercase,
        createdAt: Timestamp.now(),
        photoURL: picture || null,
      });

      batch.set(usernameDocRef, { uid: uid });
      await batch.commit();
    }

    const customToken = await adminAuth.createCustomToken(uid);

    return NextResponse.json({ customToken });
  } catch (error: any) {
    console.error('Error during server-side Google Sign-In:', error);
    if (error.code === 'auth/id-token-expired' || error.code === 'auth/argument-error') {
      return NextResponse.json({ error: 'Invalid or expired ID token. Please try again.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'An unknown error occurred during server-side authentication.' }, { status: 500 });
  }
}
