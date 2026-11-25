import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
)

// When Firebase credentials are missing the app runs against a local,
// browser-only demo backend so the UI can be explored immediately.
export const isDemoMode = !isFirebaseConfigured

// Firebase Storage requires the Blaze plan since February 2026. By default
// this app compresses photos and stores them in Firestore instead, which works
// on the free Spark plan. Set VITE_IMAGE_MODE=storage only on a Blaze project.
export const imageMode = import.meta.env.VITE_IMAGE_MODE === 'storage' ? 'storage' : 'firestore'
export const useFirebaseStorage = isFirebaseConfigured && imageMode === 'storage'

let app = null
let auth = null
let db = null
let storage = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)

  if (useFirebaseStorage) {
    try {
      storage = getStorage(app)
    } catch (error) {
      console.warn('Firebase Storage could not be initialized; using Firestore images.', error)
    }
  }
}

export { app, auth, db, storage }
