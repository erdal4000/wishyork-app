
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';

// Set session expiration to 5 days, a standard practice.
const expiresIn = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      console.log('Session API: ID token is required, but not provided.');
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const adminApp = await getAdminApp();
    const adminAuth = getAuth(adminApp);
    
    // Create the session cookie. This will throw an error if the token is invalid.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    // Set the cookie on the browser.
    cookies().set('session', sessionCookie, {
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    console.log(`✅ Session cookie SUCCESSFULLY created: ${sessionCookie.substring(0, 20)}...`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating session cookie:', error);
    return NextResponse.json({ error: 'Failed to create session.' }, { status: 401 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear the session cookie.
    cookies().set('session', '', {
        maxAge: 0,
        path: '/',
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session.' }, { status: 500 });
  }
}
