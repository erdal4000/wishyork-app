
"use client";

import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// İstemci tarafı Firebase yapılandırma anahtarlarınız
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Bu fonksiyon, uygulamanın sadece bir kez başlatılmasını garanti eder.
const getClientFirebaseApp = (): FirebaseApp => {
  if (getApps().length === 0) {
    // Henüz bir uygulama başlatılmamışsa, yenisini başlat.
    return initializeApp(firebaseConfig);
  } else {
    // Zaten bir uygulama varsa, mevcut olanı geri döndür.
    return getApp();
  }
};

// Fonksiyonu çağırarak app örneğini alalım
const app = getClientFirebaseApp();

// İhtiyacımız olan Firebase servislerini export edelim
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
