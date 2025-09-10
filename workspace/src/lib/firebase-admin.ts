// /src/lib/firebase-admin.ts
'use server';

import { initializeApp, getApps, App, credential } from 'firebase-admin/app';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. Please check your Vercel deployment settings.');
  }
  try {
    // The environment variable is a stringified JSON. We need to parse it.
    return JSON.parse(serviceAccountJson);
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:', error);
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not a valid JSON string.');
  }
}

export async function getAdminApp(): Promise<App> {
  const existingApp = getApps().find(app => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existingApp) {
    return existingApp;
  }
  
  const serviceAccount = getServiceAccount();

  return initializeApp({
    credential: credential.cert(serviceAccount),
  }, FIREBASE_ADMIN_APP_NAME);
}
