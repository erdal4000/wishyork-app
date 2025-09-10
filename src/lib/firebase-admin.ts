// /src/lib/firebase-admin.ts
'use server';

// Firebase'den gelen fonksiyonları, kendi fonksiyonlarımızla karışmaması için yeniden adlandırıyoruz.
import { initializeApp, getApps, App } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

// Uygulamamıza özel, tekrar kullanılabilir bir isim veriyoruz.
const FIREBASE_ADMIN_APP_NAME = 'firebase-admin-app-singleton';

// Servis anahtarını ortam değişkeninden güvenli bir şekilde alan fonksiyon
function getServiceAccount() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY ortam değişkeni bulunamadı. Lütfen Vercel ayarlarınızı kontrol edin.');
  }
  try {
    const serviceAccount = JSON.parse(serviceAccountJson);
    // Anahtarın geçerli olup olmadığını kontrol et
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


// 1. Fonksiyonu "async" olarak işaretledik. Bu, build hatasını çözer.
export async function getAdminApp(): Promise<App> {
  // 2. Mevcut bir uygulamanın olup olmadığını isimle kontrol ediyoruz.
  // Bu, her seferinde yeni bir uygulama başlatılmasını engeller, performansı artırır.
  const existingApp = getApps().find(app => app.name === FIREBASE_ADMIN_APP_NAME);
  if (existingApp) {
    return existingApp;
  }
  
  const serviceAccount = getServiceAccount();

  // 3. Uygulamayı başlatırken ona özel ismimizi veriyoruz.
  const newApp = initializeApp({
    credential: admin.credential.cert(serviceAccount),
  }, FIREBASE_ADMIN_APP_NAME);

  return newApp;
}