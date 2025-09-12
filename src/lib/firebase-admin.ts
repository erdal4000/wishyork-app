
'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable not found. Please check your Vercel settings.');
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);

    // This is the crucial fix: Vercel (or other environments) might not correctly handle
    // the newlines in the private key when it's stored as a single-line environment variable.
    // We need to replace the escaped newlines ('\\n') with actual newline characters ('\n').
    if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (
      !serviceAccount.project_id ||
      !serviceAccount.private_key ||
      !serviceAccount.client_email
    ) {
      throw new Error('Service account JSON is invalid or missing required fields.');
    }
    return serviceAccount;
  } catch (error: any) {
    console.error('Service account JSON parsing error:', error.message);
    throw new Error('The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not valid JSON.');
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
