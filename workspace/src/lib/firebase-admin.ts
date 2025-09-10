'use server';

import { initializeApp, getApps, App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY ortam değişkeni bulunamadı. Lütfen Vercel ayarlarınızı kontrol edin.');
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    if (
      !serviceAccount.project_id ||
      !serviceAccount.private_key ||
      !serviceAccount.client_email
    ) {
      throw new Error('Servis anahtarı JSON formatı geçersiz veya eksik alanlar içeriyor.');
    }
    return serviceAccount;
  } catch (error) {
    console.error('Servis anahtarı JSON parse hatası:', error);
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY ortam değişkeni geçerli bir JSON değil.');
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