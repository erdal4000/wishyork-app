
'use server';

import { initializeApp, getApps, App, ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

/**
 * Parses the service account key from a single environment variable.
 * This method is robust against formatting issues with private keys,
 * as long as the \n characters have been escaped to \\n.
 */
function getServiceAccount(): ServiceAccount {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountJson) {
    throw new Error(
      'Firebase Admin SDK credentials are not set. Please ensure FIREBASE_SERVICE_ACCOUNT_KEY is set in your environment variables as a JSON string.'
    );
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    // *** CRITICAL FIX ***
    // The private key in the environment variable has its newlines escaped as "\\n".
    // The `cert` function expects actual newline characters "\n".
    // We must replace them before passing the object to the SDK.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    return serviceAccount;
  } catch (error: any) {
    console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY. Ensure it is a valid, single-line JSON string in your .env file.', error.message);
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not a valid JSON string.');
  }
}

export async function getAdminApp(): Promise<App> {
  // This is a singleton pattern to avoid re-initializing the app on every server-side render.
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
    // Re-throw the error to be caught by Next.js error boundaries.
    console.error("Failed to initialize Firebase Admin SDK.", error);
    throw error;
  }
}
