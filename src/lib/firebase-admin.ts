'use server';

import { initializeApp, getApps, App, ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

/**
 * Gets the Firebase Admin SDK credentials from individual environment variables.
 * This is a more robust method that avoids JSON parsing and private key formatting issues.
 */
function getServiceAccount(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // This replace call is the key fix. Vercel and other hosting platforms
  // often escape newline characters in multi-line environment variables.
  // This line ensures that the private key is correctly formatted with real
  // newlines before being passed to the Firebase Admin SDK.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin server credentials are not fully set. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set in your environment.'
    );
  }
  
  return {
    projectId,
    clientEmail,
    privateKey,
  } as ServiceAccount;
}

export async function getAdminApp(): Promise<App> {
  const existingApp = getApps().find(app => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existingApp) {
    return existingApp;
  }
  
  try {
    const serviceAccount = getServiceAccount();

    const newApp = initializeApp({
      credential: admin.credential.cert(serviceAccount),
    }, FIREBASE_ADMIN_APP_NAME);

    return newApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK. Check your server-side environment variables.", error);
    // Re-throw the original error to see the exact cause in the logs.
    throw error;
  }
}
