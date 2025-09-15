
'use server';

// THIS FILE IS NO LONGER USED IN THE NEW AUTHENTICATION FLOW
// It is kept for reference but will not be called.
// The new flow verifies the idToken directly in the page's server component.

import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 410 });
}

export async function DELETE(request: NextRequest) {
    return NextResponse.json({ success: false, error: 'This endpoint is deprecated.' }, { status: 410 });
}
