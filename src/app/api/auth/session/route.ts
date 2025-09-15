
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
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const adminApp = getAdminApp();
    const adminAuth = getAuth(adminApp);
    
    // Create the session cookie. This will throw an error if the token is invalid.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieOptions = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000, // maxAge is in seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };

    // Set the cookie on the browser.
    cookies().set(cookieOptions);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ [SESSION API] Error creating session cookie:', error);
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
    console.error('❌ [SESSION API] Error deleting session cookie:', error);
    return NextResponse.json({ error: 'Failed to clear session.' }, { status: 500 });
  }
}
