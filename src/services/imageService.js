import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { isDemoMode, storage, useFirebaseStorage } from '../firebase'

const STORAGE_MAX_DIMENSION = 1600
const STORAGE_QUALITY = 0.85
const FIRESTORE_IMAGE_TARGET = 250 * 1024
const MAX_FILE_SIZE = 10 * 1024 * 1024
const SUPPORTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Firestore documents have a 1 MiB limit. These progressively smaller versions
// keep the base64 image comfortably below it for free-plan projects.
const FIRESTORE_ATTEMPTS = [
  { maxDimension: 1100, quality: 0.78 },
  { maxDimension: 1000, quality: 0.72 },
  { maxDimension: 900, quality: 0.65 },
  { maxDimension: 800, quality: 0.58 },
  { maxDimension: 700, quality: 0.5 },
]

function validateImage(file) {
  if (!SUPPORTED_TYPES.includes(file.type)) {
    throw new Error('Please choose a JPG, PNG, or WebP image.')
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('That image is too large. Please choose a file under 10 MB.')
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('That image could not be read. Please choose a JPG, PNG, or WebP file.'))
    }
    image.src = objectUrl
  })
}

function renderJpeg(image, maxDimension, quality) {
  const scale = Math.min(
    1,
    maxDimension / Math.max(image.naturalWidth, image.naturalHeight),
  )
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return Promise.resolve(null)

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(image, 0, 0, width, height)

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality)
  })
}

async function compressForLimit(file, attempts, targetSize) {
  validateImage(file)
  const image = await loadImage(file)
  let compressed = null

  for (const attempt of attempts) {
    const blob = await renderJpeg(image, attempt.maxDimension, attempt.quality)
    if (!blob) continue
    compressed = blob
    if (blob.size <= targetSize) break
  }

  if (!compressed) {
    throw new Error('That image could not be processed. Please try a different photo.')
  }

  const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '') || 'photo'
  return new File([compressed], `${baseName}.jpg`, { type: 'image/jpeg' })
}

export function compressImageForFirestore(file) {
  return compressForLimit(file, FIRESTORE_ATTEMPTS, FIRESTORE_IMAGE_TARGET)
}

export function compressImageForStorage(file) {
  return compressForLimit(
    file,
    [{ maxDimension: STORAGE_MAX_DIMENSION, quality: STORAGE_QUALITY }],
    Infinity,
  )
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('The image could not be processed.'))
    reader.readAsDataURL(file)
  })
}

/**
 * Compresses a photo and stores it.
 * - Demo mode or free Spark plan: image is stored as a data URL in Firestore.
 * - Blaze plan with VITE_IMAGE_MODE=storage: image is uploaded to Firebase Storage.
 */
export async function uploadRecipeImage(file, uid) {
  if (!file) return null

  const storeInFirestore = isDemoMode || !useFirebaseStorage

  if (storeInFirestore) {
    const compressed = await compressImageForFirestore(file)
    const imageUrl = await fileToDataUrl(compressed)
    if (imageUrl.length > 700 * 1024) {
      throw new Error(
        'This photo is too detailed to store. Please choose a smaller or simpler image.',
      )
    }
    return { imageUrl, imagePath: '' }
  }

  if (!storage) {
    throw new Error(
      'Firebase Storage is unavailable. Remove VITE_IMAGE_MODE=storage to use free Firestore images.',
    )
  }

  const compressed = await compressImageForStorage(file)
  const safeName = (compressed.name || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '-')
  const path = `recipes/${uid}/${Date.now()}-${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, compressed, { contentType: compressed.type || 'image/jpeg' })
  const imageUrl = await getDownloadURL(storageRef)
  return { imageUrl, imagePath: path }
}

export async function deleteRecipeImage(imagePath) {
  if (!imagePath || isDemoMode || !useFirebaseStorage || !storage) return
  try {
    await deleteObject(ref(storage, imagePath))
  } catch (error) {
    // An orphaned image should never block deleting or updating a recipe.
    console.warn('Could not remove the old recipe image.', error)
  }
}
