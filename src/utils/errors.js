const FRIENDLY_MESSAGES = {
  'auth/email-already-in-use': 'That email is already registered. Try logging in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/weak-password': 'Your password needs at least 6 characters.',
  'auth/user-not-found': 'Incorrect email or password.',
  'auth/wrong-password': 'Incorrect email or password.',
  'auth/invalid-credential': 'Incorrect email or password.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase yet.',
  'auth/user-disabled': 'This account has been disabled.',
  'permission-denied': 'You do not have permission to do that.',
  'firestore/permission-denied': 'You do not have permission to do that.',
  'storage/unauthorized': 'You are not allowed to upload that image.',
  'storage/canceled': 'The image upload was canceled.',
  'storage/retry-limit-exceeded': 'The upload took too long. Please try again.',
  'storage/quota-exceeded': 'The storage quota has been reached. Please try again later.',
  'unavailable': 'The service is temporarily unavailable. Please try again.',
}

export function friendlyError(error, fallback = 'Something went wrong. Please try again.') {
  const code = error?.code || ''
  if (FRIENDLY_MESSAGES[code]) return FRIENDLY_MESSAGES[code]
  if (error?.message) return error.message
  return fallback
}
