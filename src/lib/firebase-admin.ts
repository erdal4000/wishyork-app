'use server';

import { initializeApp, getApps, App, ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

/**
 * Constructs a service account object from individual environment variables.
 * This is a more robust method than parsing a single JSON string, as it avoids
 * issues with escaped characters in private keys when stored in environment variables.
 */
function getServiceAccount(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Missing Firebase Admin SDK credentials. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in your environment variables.'
    );
  }

  // Vercel and other platforms might not handle newlines in the private key correctly.
  // This replaces the escaped newlines ('\\n') with actual newline characters ('\n').
  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  return {
    projectId,
    clientEmail,
    privateKey: formattedPrivateKey,
  };
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
