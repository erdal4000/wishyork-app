
'use server';

import { getAdminApp } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';
import { cookies } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required.' }, { status: 400 });
    }

    const adminApp = await getAdminApp();
    const adminAuth = getAuth(adminApp);

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    
    const options = {
      name: 'session',
      value: sessionCookie,
      maxAge: expiresIn / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax' as const,
    };
    
    // Set cookie using the Next.js cookies() helper
    cookies().set(options);

    console.log(`✅ [SESSION API] Session cookie created and set with options:`, { ...options, value: '...' });

    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('❌ [SESSION API] Error creating session cookie:', error.message);
    return NextResponse.json({ error: 'Failed to create session.', message: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    cookies().delete('session');
    return NextResponse.json({ status: 'success' });
  } catch (error: any) {
    console.error('❌ [SESSION API] Error deleting session cookie:', error);
    return NextResponse.json({ error: 'Failed to delete session.' }, { status: 500 });
  }
}
