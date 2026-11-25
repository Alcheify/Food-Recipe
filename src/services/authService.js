import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, isDemoMode } from '../firebase'
import * as demo from './demoBackend'
import { fetchUserProfile } from './userService'

export function subscribeToAuth(callback) {
  if (isDemoMode) return demo.onDemoAuthChange(callback)

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }

    try {
      const profile = (await fetchUserProfile(firebaseUser.uid)) || {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Recipe lover',
        email: firebaseUser.email || '',
        role: 'viewer',
      }
      callback(profile)
    } catch (error) {
      console.error('Could not load the signed-in profile.', error)
      callback({
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || 'Recipe lover',
        email: firebaseUser.email || '',
        role: 'viewer',
      })
    }
  })
}

export async function registerUser({ name, email, password, role }) {
  if (isDemoMode) return demo.registerDemoUser({ name, email, password, role })

  const cleanName = name.trim()
  const chosenRole = role === 'creator' ? 'creator' : 'viewer'
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password)

  await updateFirebaseProfile(credential.user, { displayName: cleanName })

  const profile = {
    uid: credential.user.uid,
    name: cleanName,
    email: credential.user.email,
    role: chosenRole,
    createdAt: serverTimestamp(),
  }
  await setDoc(doc(db, 'users', credential.user.uid), profile)

  return {
    uid: profile.uid,
    name: profile.name,
    email: profile.email,
    role: profile.role,
  }
}

export async function loginUser({ email, password }) {
  if (isDemoMode) return demo.loginDemoUser({ email, password })

  const credential = await signInWithEmailAndPassword(auth, email.trim(), password)
  let profile = await fetchUserProfile(credential.user.uid)

  if (!profile) {
    profile = {
      uid: credential.user.uid,
      name: credential.user.displayName || 'Recipe lover',
      email: credential.user.email || '',
      role: 'viewer',
    }
    await setDoc(
      doc(db, 'users', credential.user.uid),
      { ...profile, createdAt: serverTimestamp() },
      { merge: true },
    )
  }

  return profile
}

export async function logoutUser() {
  if (isDemoMode) {
    demo.logoutDemoUser()
    return
  }
  await signOut(auth)
}
