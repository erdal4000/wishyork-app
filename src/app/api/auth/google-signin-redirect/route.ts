
'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  // This redirect URI must be authorized for BOTH the server-side and client-side Client IDs in Google Cloud Console.
  const redirectURI = `${new URL(request.url).origin}/api/auth/google-callback`;

  // Determine which client ID to use.
  // Use the public client ID for requests from the browser (especially local dev).
  // Use the server-side client ID for other contexts if needed, but public is safer for browser-initiated flows.
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('FATAL: Google OAuth client credentials are not set.');
    return NextResponse.json({ error: 'Server configuration error: Missing Google client credentials.' }, { status: 500 });
  }

  const oAuth2Client = new OAuth2Client(
    clientId, // Use the determined client ID
    clientSecret, // The secret is still needed, tied to the server-side config.
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
    prompt: 'consent',
    state: state,
  });

  return NextResponse.redirect(authorizeUrl);
}
