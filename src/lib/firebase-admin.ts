'use server';

import { initializeApp, getApps, App, ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

/**
 * Parses the service account key from a single environment variable.
 * This method is robust against formatting issues with private keys.
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

    // This is the crucial fix: ensure the private_key has the correct newline characters.
    // Vercel and other platforms often escape newlines, which breaks the PEM format.
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');

    return serviceAccount;
  } catch (error: any) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error.message);
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not a valid JSON string.');
  }
}

export async function getAdminApp(): Promise<App> {
  const existingApp = getApps().find(app => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existingApp) {
    return existingApp;
  }
  
  const serviceAccount = getServiceAccount();

  const newApp = initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }, FIREBASE_ADMIN_APP_NAME);

  return newApp;
}
