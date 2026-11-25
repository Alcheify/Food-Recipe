import { collection, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db, isDemoMode } from '../firebase'
import * as demo from './demoBackend'

function toIso(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return null
}

function mapUser(uid, data) {
  return {
    uid,
    name: data.name || data.displayName || 'Recipe lover',
    email: data.email || '',
    role: data.role || 'viewer',
    createdAt: toIso(data.createdAt),
  }
}

export async function fetchUserProfile(uid) {
  if (isDemoMode) return demo.getDemoUserById(uid)

  let snapshot = await getDoc(doc(db, 'users', uid))
  if (!snapshot.exists()) {
    // A freshly registered user's profile document can land a moment after
    // the Firebase Auth event fires, so retry once before giving up.
    await new Promise((resolve) => setTimeout(resolve, 500))
    snapshot = await getDoc(doc(db, 'users', uid))
  }
  if (!snapshot.exists()) return null
  return mapUser(uid, snapshot.data())
}

export async function fetchAllUsers() {
  if (isDemoMode) return demo.listDemoUsers()

  const snapshot = await getDocs(collection(db, 'users'))
  return snapshot.docs
    .map((item) => mapUser(item.id, item.data()))
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

export async function changeUserRole(uid, role) {
  if (!['admin', 'creator', 'viewer'].includes(role)) {
    throw new Error('That is not a valid role.')
  }
  if (isDemoMode) return demo.updateDemoUserRole(uid, role)

  await updateDoc(doc(db, 'users', uid), { role })
  return { uid, role }
}
