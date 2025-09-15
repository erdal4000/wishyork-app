
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  let adminApp;
  try {
    adminApp = await getAdminApp();
  } catch (error: any) {
    console.error('CRITICAL: Failed to initialize Firebase Admin SDK in callback.', error);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', 'Failed to initialize Firebase Admin SDK.');
    return NextResponse.redirect(redirectUrl);
  }

  try {
    const adminAuth = getAuth(adminApp);
    const adminDb = getFirestore(adminApp);

    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    const storedState = cookies().get('google_oauth_state')?.value;

    if (!code || !state || state !== storedState) {
      console.error('Invalid or missing state parameter.', { state, storedState });
      return NextResponse.redirect(new URL('/login?error=Invalid%20or%20missing%20state%20parameter', request.url));
    }

    // Always use the server-side redirect URI for the token exchange
    const redirectURI = `${url.origin}/api/auth/google-callback`;

    // The token exchange MUST use the server-side (web application) client ID and secret.
    // This is the key part of the server-to-server communication with Google.
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      redirectURI
    );

    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    if (!tokens.id_token) {
        throw new Error('ID token not found in Google response');
    }
    
    // We now verify the ID token. The audience here should be the client ID that *requested* the token.
    // Since the redirect flow can be initiated by either the public (web) or the server-side client,
    // we must handle both possibilities. However, for security, the server should always verify against its own client ID.
    const ticket = await oAuth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID, // Verify the audience is our server-side client
    });
    
    const payload = ticket.getPayload();

    if (!payload) {
        throw new Error('Could not get payload from ticket');
    }

    const { sub: uid, name, email, picture } = payload;
    
    if (!uid || !email) {
      throw new Error('UID or email not found in Google token payload');
    }
    
    // Create or update the user in Firebase Auth. This is important!
    try {
      await adminAuth.getUser(uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user doesn't exist, create them in Firebase Auth
        await adminAuth.createUser({
          uid: uid,
          email: email,
          displayName: name,
          photoURL: picture,
        });
      } else {
        throw error; // Re-throw other errors
      }
    }


    const userDocRef = adminDb.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      const username = (email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') ?? '') + Math.floor(Math.random() * 999);
      const usernameDocRef = adminDb.collection('usernames').doc(username);
      const usernameLowercase = username.toLowerCase();

      const batch = adminDb.batch();

      const photoURL = picture || `https://picsum.photos/seed/${uid}/200/200`;

      batch.set(userDocRef, {
        uid: uid,
        name: name || 'New User',
        email: email,
        username: username,
        username_lowercase: usernameLowercase,
        createdAt: Timestamp.now(),
        photoURL: photoURL,
      });

      batch.set(usernameDocRef, { uid: uid });
      await batch.commit();

      // Ensure the Auth user record has the photoURL
      await adminAuth.updateUser(uid, { photoURL });
    }

    const idToken = await adminAuth.createCustomToken(uid);
    const response = NextResponse.redirect(new URL(`/login?googleSignIn=true&token=${idToken}`, request.url));
    
    cookies().delete('google_oauth_state');

    return response;

  } catch (error: any) {
    console.error('Google callback error:', error);
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('error', encodeURIComponent(error.message || 'An unexpected error occurred during Google sign-in.'));
    return NextResponse.redirect(redirectUrl);
  }
}
