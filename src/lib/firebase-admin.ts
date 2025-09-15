
import { initializeApp, getApps, App, ServiceAccount } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

// This is the key to the singleton pattern. We define a variable that will hold
// the initialized app, but we don't initialize it right away.
let adminApp: App | undefined;

/**
 * Gets the Firebase Admin SDK credentials from individual environment variables.
 * This is a more robust method that avoids JSON parsing and private key formatting issues.
 */
function getServiceAccount(): ServiceAccount {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // This replace call is crucial. Hosting platforms like Vercel and development
  // environments often escape newline characters in multi-line environment variables.
  // This line ensures the private key is correctly formatted with real newlines.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('CRITICAL: Firebase Admin server credentials are not fully set in environment variables.');
    throw new Error(
      'Firebase Admin server credentials are not fully set. Please ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set.'
    );
  }
  
  return {
    projectId,
    clientEmail,
    privateKey,
  } as ServiceAccount;
}

/**
 * A robust singleton function to get the initialized Firebase Admin app.
 * It ensures that initializeApp is called only once, no matter how many times
 * this function is imported or called across server-side code.
 */
export function getAdminApp(): App {
  // If the app is already initialized, return it immediately.
  if (adminApp) {
    return adminApp;
  }

  // If there are no apps initialized yet, this is the first time.
  if (!getApps().length) {
    try {
      const serviceAccount = getServiceAccount();
      
      // Initialize the app and store it in our singleton variable.
      adminApp = initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('✅ Firebase Admin SDK initialized successfully for the first time.');
      return adminApp;

    } catch (error: any) {
      console.error("CRITICAL: Failed to initialize Firebase Admin SDK.", error);
      // Re-throw the error to ensure the application fails loudly instead of continuing
      // in a broken state.
      throw new Error("Could not initialize Firebase Admin SDK. Check server logs for details.");
    }
  }
  
  // If getApps().length is not 0, but our adminApp is not set, it means
  // Firebase was likely initialized elsewhere. We get the default app.
  adminApp = getApps()[0];
  return adminApp;
}
