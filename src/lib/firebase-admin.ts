
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
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Firebase Admin SDK environment variables are not set. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your .env file.'
    );
  }
  
  // By taking the private key directly from the env (when correctly formatted with \n in quotes),
  // we avoid parsing issues.
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
    console.error("Failed to initialize Firebase Admin SDK.", error);
    // Re-throw the original error to see the exact cause in the logs.
    throw error;
  }
}
