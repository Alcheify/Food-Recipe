import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, isDemoMode } from '../firebase'
import * as demo from './demoBackend'
import { deleteRecipeImage, uploadRecipeImage } from './imageService'

const COLLECTION = 'recipes'

function toIso(value) {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return null
}

function mapRecipe(snapshot) {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    title: data.title || '',
    description: data.description || '',
    category: data.category || 'Dinner',
    prepTime: Number(data.prepTime) || 0,
    cookTime: Number(data.cookTime) || 0,
    servings: Number(data.servings) || 1,
    difficulty: data.difficulty || 'Easy',
    ingredients: Array.isArray(data.ingredients) ? data.ingredients : [],
    steps: Array.isArray(data.steps) ? data.steps : [],
    imageUrl: data.imageUrl || '',
    imagePath: data.imagePath || '',
    authorId: data.authorId || '',
    authorName: data.authorName || 'Unknown cook',
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  }
}

export async function fetchRecipes() {
  if (isDemoMode) return demo.listDemoRecipes()

  const snapshot = await getDocs(
    query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(200)),
  )
  return snapshot.docs.map(mapRecipe)
}

export async function fetchRecipeById(id) {
  if (isDemoMode) return demo.getDemoRecipe(id)

  const snapshot = await getDoc(doc(db, COLLECTION, id))
  return snapshot.exists() ? mapRecipe(snapshot) : null
}

export async function fetchRecipesByAuthor(uid) {
  if (isDemoMode) return demo.listDemoRecipesByAuthor(uid)

  // Filtering and sorting happen client-side to avoid needing a composite index.
  const snapshot = await getDocs(query(collection(db, COLLECTION), where('authorId', '==', uid)))
  return snapshot.docs
    .map(mapRecipe)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
}

export async function createRecipe(values, imageFile, currentUser) {
  if (!currentUser) throw new Error('Please log in to publish a recipe.')

  if (isDemoMode) {
    const image = imageFile ? await uploadRecipeImage(imageFile, currentUser.uid) : null
    const recipe = await demo.createDemoRecipe(values, image?.imageUrl || '')
    return recipe.id
  }

  const image = imageFile ? await uploadRecipeImage(imageFile, currentUser.uid) : null
  const payload = {
    ...values,
    imageUrl: image?.imageUrl || '',
    imagePath: image?.imagePath || '',
    authorId: currentUser.uid,
    authorName: currentUser.name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const created = await addDoc(collection(db, COLLECTION), payload)
  return created.id
}

export async function updateRecipe(id, values, imageFile, currentUser) {
  if (!currentUser) throw new Error('Please log in to edit a recipe.')

  const existing = await fetchRecipeById(id)
  if (!existing) throw new Error('Recipe not found.')
  if (currentUser.role !== 'admin' && existing.authorId !== currentUser.uid) {
    throw new Error('You can only edit your own recipes.')
  }

  if (isDemoMode) {
    const image = imageFile ? await uploadRecipeImage(imageFile, currentUser.uid) : null
    const updated = await demo.updateDemoRecipe(id, values, image?.imageUrl || '')
    return updated.id
  }

  const image = imageFile ? await uploadRecipeImage(imageFile, currentUser.uid) : null
  const payload = { ...values, updatedAt: serverTimestamp() }
  if (image) {
    payload.imageUrl = image.imageUrl
    payload.imagePath = image.imagePath
  }

  await updateDoc(doc(db, COLLECTION, id), payload)

  if (image && existing.imagePath) {
    await deleteRecipeImage(existing.imagePath)
  }

  return id
}

export async function deleteRecipe(id, currentUser) {
  if (!currentUser) throw new Error('Please log in to delete a recipe.')

  const existing = await fetchRecipeById(id)
  if (!existing) throw new Error('Recipe not found.')
  if (currentUser.role !== 'admin' && existing.authorId !== currentUser.uid) {
    throw new Error('You can only delete your own recipes.')
  }

  if (isDemoMode) {
    await demo.deleteDemoRecipe(id)
    return
  }

  await deleteDoc(doc(db, COLLECTION, id))
  if (existing.imagePath) {
    await deleteRecipeImage(existing.imagePath)
  }
}
