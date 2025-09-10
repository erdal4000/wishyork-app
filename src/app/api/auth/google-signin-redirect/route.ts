
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // Dynamically construct the redirect URI based on the request's origin.
  // This makes the flow resilient to changing ports in Cloud Workstations.
  const requestUrl = new URL(request.url);
  const redirectURI = `${requestUrl.origin}/api/auth/google-callback`;

  // Use GOOGLE_CLIENT_ID for server-side access
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('FATAL: Google OAuth client ID or secret is not set.');
    return NextResponse.json({ error: 'Server configuration error: Missing Google client credentials.' }, { status: 500 });
  }

  const oAuth2Client = new OAuth2Client(
    clientId,
    clientSecret,
    redirectURI
  );

  const state = Math.random().toString(36).substring(2, 15);
  cookies().set('google_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  const authorizeUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    prompt: 'consent', // Force the consent screen to be shown every time.
    state: state,
  });

  return NextResponse.redirect(authorizeUrl);
}
