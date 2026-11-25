// Browser-only demo backend.
// It mirrors the small surface of the Firebase services so the whole app can
// be used before Firebase is connected. Data lives in localStorage and is
// never sent anywhere. Once Firebase env vars are present in `.env`,
// `isDemoMode` becomes false and this file is bypassed.

const USERS_KEY = 'recipehub.demo.users.v1'
const RECIPES_KEY = 'recipehub.demo.recipes.v1'
const SESSION_KEY = 'recipehub.demo.session.v1'

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function makeId(prefix) {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

async function hashPassword(password) {
  const text = `recipehub-demo:${password}`
  try {
    if (globalThis.crypto?.subtle) {
      const bytes = new TextEncoder().encode(text)
      const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('')
    }
  } catch {
    // Fall through to the simple fallback below.
  }
  let hash = 0
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index)
    hash |= 0
  }
  return `fallback-${Math.abs(hash)}`
}

function foodArt(bgA, bgB, sauce, garnish) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bgA}"/><stop offset="1" stop-color="${bgB}"/>
    </linearGradient>
    <radialGradient id="plate" cx="48%" cy="42%" r="58%">
      <stop offset="0" stop-color="#fffdf6"/><stop offset=".7" stop-color="#f6ecda"/><stop offset="1" stop-color="#e9dcc6"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="url(#bg)"/>
  <circle cx="606" cy="418" r="268" fill="rgba(44,30,18,.18)"/>
  <circle cx="600" cy="396" r="266" fill="url(#plate)"/>
  <circle cx="600" cy="396" r="192" fill="${sauce}"/>
  <path d="M470 350c34-72 142-110 222-64 78 45 84 158 10 210-76 53-196 6-226-76-8-22-14-47-6-70z" fill="${garnish}" opacity=".85"/>
  <circle cx="518" cy="452" r="30" fill="#fff6e6" opacity=".55"/>
  <circle cx="700" cy="318" r="20" fill="#fff6e6" opacity=".6"/>
  <circle cx="664" cy="486" r="16" fill="${bgA}" opacity=".5"/>
  <path d="M360 214c64-46 150-52 212-18" stroke="rgba(255,255,255,.5)" stroke-width="16" fill="none" stroke-linecap="round"/>
  <path d="M830 590c-48 26-112 30-160 8" stroke="rgba(255,255,255,.35)" stroke-width="12" fill="none" stroke-linecap="round"/>
</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const SEED_USERS = [
  {
    uid: 'demo-admin',
    name: 'Ava Bennett',
    email: 'admin@demo.com',
    password: 'Admin123!',
    role: 'admin',
    createdAt: daysAgo(180),
  },
  {
    uid: 'demo-creator',
    name: 'Maya Rivera',
    email: 'creator@demo.com',
    password: 'Creator123!',
    role: 'creator',
    createdAt: daysAgo(120),
  },
  {
    uid: 'demo-viewer',
    name: 'Sam Whitaker',
    email: 'viewer@demo.com',
    password: 'Viewer123!',
    role: 'viewer',
    createdAt: daysAgo(45),
  },
]

const SEED_RECIPES = [
  {
    id: 'demo-recipe-tuscan-salmon',
    title: 'Creamy Tuscan Salmon',
    description:
      'Golden salmon fillets simmered in a garlicky cream sauce with sun-dried tomatoes and wilted spinach. Ready in one pan and special enough for guests.',
    category: 'Dinner',
    prepTime: 10,
    cookTime: 25,
    servings: 4,
    difficulty: 'Medium',
    ingredients: [
      '4 salmon fillets (about 6 oz each)',
      '2 tbsp olive oil',
      '3 cloves garlic, minced',
      '1/2 cup sun-dried tomatoes, sliced',
      '1 cup heavy cream',
      '1/3 cup grated parmesan',
      '3 cups baby spinach',
      '1 tsp Italian seasoning',
      'Salt and black pepper, to taste',
      'Fresh basil, to serve',
    ],
    steps: [
      'Pat the salmon dry and season both sides generously with salt and pepper.',
      'Heat the olive oil in a large skillet over medium-high heat. Sear the salmon for 4 to 5 minutes per side, then transfer to a plate.',
      'Lower the heat, add the garlic and sun-dried tomatoes, and cook for 1 minute until fragrant.',
      'Pour in the cream and parmesan, then simmer for 3 minutes until the sauce starts to thicken.',
      'Stir in the spinach and Italian seasoning. Return the salmon to the pan, spoon the sauce over the top, and simmer for 2 minutes.',
      'Scatter with fresh basil and serve straight from the skillet.',
    ],
    imageUrl: foodArt('#e7b28c', '#b96b46', '#f3e0c4', '#7f9a6b'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 2,
  },
  {
    id: 'demo-recipe-harvest-salad',
    title: 'Garden Harvest Salad',
    description:
      'A crisp, colorful salad with cherry tomatoes, cucumber, olives, and a bright lemon-Dijon dressing. The perfect make-ahead lunch.',
    category: 'Lunch',
    prepTime: 15,
    cookTime: 0,
    servings: 2,
    difficulty: 'Easy',
    ingredients: [
      '5 oz mixed greens',
      '1 cup cherry tomatoes, halved',
      '1 cucumber, thinly sliced',
      '1/2 red onion, thinly sliced',
      '1/3 cup kalamata olives',
      '2 tbsp toasted sunflower seeds',
      '3 tbsp olive oil',
      '1 tbsp lemon juice',
      '1 tsp Dijon mustard',
      'Salt and black pepper, to taste',
    ],
    steps: [
      'Whisk the olive oil, lemon juice, mustard, salt, and pepper in a small bowl until glossy.',
      'Add the greens, tomatoes, cucumber, onion, and olives to a large bowl.',
      'Drizzle with the dressing and toss gently to coat.',
      'Finish with toasted sunflower seeds and serve immediately.',
    ],
    imageUrl: foodArt('#b9c9a3', '#6f8d5e', '#e6eed6', '#4c7a4f'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 5,
  },
  {
    id: 'demo-recipe-lemon-chicken',
    title: 'One-Pan Lemon Herb Chicken',
    description:
      'Juicy chicken thighs roasted with baby potatoes, green beans, and plenty of lemon and herbs. Minimal washing up, maximum flavor.',
    category: 'Dinner',
    prepTime: 15,
    cookTime: 35,
    servings: 4,
    difficulty: 'Easy',
    ingredients: [
      '8 bone-in, skin-on chicken thighs',
      '1 1/2 lb baby potatoes, halved',
      '2 cups green beans, trimmed',
      '1 lemon, sliced',
      '3 tbsp olive oil',
      '4 cloves garlic, smashed',
      '1 tbsp fresh rosemary, chopped',
      '1 tsp fresh thyme leaves',
      '1 tsp salt',
      '1/2 tsp black pepper',
    ],
    steps: [
      'Preheat the oven to 425°F (220°C).',
      'Toss the potatoes with 1 tbsp olive oil, salt, and pepper on a large sheet pan. Roast for 10 minutes.',
      'Rub the chicken with the remaining olive oil, garlic, rosemary, thyme, salt, and pepper.',
      'Nestle the chicken and lemon slices among the potatoes and roast for 20 minutes.',
      'Add the green beans, toss gently with the pan juices, and roast for 10 to 12 minutes more until the chicken is cooked through.',
      'Rest for 5 minutes before serving with the roasted lemon.',
    ],
    imageUrl: foodArt('#ecd29a', '#c69145', '#f6e8c8', '#7d8f5b'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 8,
  },
  {
    id: 'demo-recipe-pancakes',
    title: 'Fluffy Buttermilk Pancakes',
    description:
      'Tall, tender pancakes with a hint of vanilla. Stack them high with butter and maple syrup for a slow weekend morning.',
    category: 'Breakfast',
    prepTime: 10,
    cookTime: 20,
    servings: 4,
    difficulty: 'Easy',
    ingredients: [
      '1 1/2 cups all-purpose flour',
      '2 tbsp sugar',
      '2 tsp baking powder',
      '1/2 tsp baking soda',
      '1/2 tsp salt',
      '1 1/4 cups buttermilk',
      '2 large eggs',
      '3 tbsp melted butter, plus more for the pan',
      '1 tsp vanilla extract',
      'Maple syrup, to serve',
    ],
    steps: [
      'Whisk the flour, sugar, baking powder, baking soda, and salt in a large bowl.',
      'In a jug, whisk the buttermilk, eggs, melted butter, and vanilla.',
      'Pour the wet ingredients into the dry ingredients and fold gently until just combined. A few lumps are perfect.',
      'Heat a lightly buttered non-stick pan over medium heat. Pour in 1/4 cup of batter per pancake.',
      'Cook until bubbles appear on the surface, about 2 to 3 minutes, then flip and cook for 1 to 2 minutes more.',
      'Keep warm while you cook the remaining batter, then serve with maple syrup.',
    ],
    imageUrl: foodArt('#f0d9b5', '#c9a06b', '#f8ead2', '#b9793f'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 12,
  },
  {
    id: 'demo-recipe-miso-ramen',
    title: 'Spicy Miso Ramen',
    description:
      'A deeply savory bowl of ramen with white miso, chili paste, soft-boiled eggs, and sweet corn. A restaurant-style dinner at home.',
    category: 'Dinner',
    prepTime: 15,
    cookTime: 25,
    servings: 2,
    difficulty: 'Medium',
    ingredients: [
      '2 portions fresh ramen noodles',
      '3 tbsp white miso paste',
      '1 tbsp chili paste (such as gochujang)',
      '4 cups chicken stock',
      '1 tbsp soy sauce',
      '1 tsp sesame oil',
      '3 cloves garlic, minced',
      '1 tbsp fresh ginger, grated',
      '2 soft-boiled eggs',
      '2 scallions, sliced',
      '1/2 cup sweet corn',
      '2 sheets nori',
    ],
    steps: [
      'Bring a small pot of water to a boil and cook the eggs for 6 1/2 minutes. Cool in ice water, peel, and halve.',
      'Warm the sesame oil in a large pot and cook the garlic and ginger for 30 seconds.',
      'Stir in the miso and chili paste, then pour in the stock and soy sauce. Simmer gently for 15 minutes.',
      'Cook the ramen noodles according to the package directions and divide between two deep bowls.',
      'Ladle the broth over the noodles and top with the eggs, corn, scallions, and nori.',
      'Serve immediately while everything is hot.',
    ],
    imageUrl: foodArt('#d9a48a', '#9b4a3d', '#e9c9a8', '#7b3f2c'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 16,
  },
  {
    id: 'demo-recipe-olive-oil-cake',
    title: 'Dark Chocolate Olive Oil Cake',
    description:
      'A rich, fudgy chocolate cake with a crackly top and a subtle fruity note from olive oil. One bowl, no mixer required.',
    category: 'Dessert',
    prepTime: 15,
    cookTime: 40,
    servings: 8,
    difficulty: 'Medium',
    ingredients: [
      '1 1/4 cups all-purpose flour',
      '2/3 cup cocoa powder',
      '1 cup sugar',
      '1 tsp baking soda',
      '1/2 tsp salt',
      '3/4 cup extra-virgin olive oil',
      '1 cup milk',
      '2 large eggs',
      '1 tsp vanilla extract',
      '1/2 cup strong brewed coffee, cooled',
      'Powdered sugar, for dusting',
    ],
    steps: [
      'Preheat the oven to 350°F (175°C). Grease a 9-inch round cake pan and line the base with parchment.',
      'Whisk the flour, cocoa, sugar, baking soda, and salt in a large bowl.',
      'Add the olive oil, milk, eggs, vanilla, and coffee. Whisk until smooth, being careful not to overmix.',
      'Pour the batter into the prepared pan and bake for 35 to 40 minutes, until a skewer comes out with a few moist crumbs.',
      'Cool in the pan for 15 minutes, then turn out onto a rack to cool completely.',
      'Dust with powdered sugar and serve with a spoonful of whipped cream if you like.',
    ],
    imageUrl: foodArt('#b99a82', '#6d4a38', '#5c4033', '#d8b58f'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 21,
  },
  {
    id: 'demo-recipe-shrimp-pasta',
    title: 'Garlic Butter Shrimp Pasta',
    description:
      'Plump shrimp tossed with linguine in a glossy garlic butter sauce. On the table in 30 minutes with a short shopping list.',
    category: 'Quick & Easy',
    prepTime: 10,
    cookTime: 15,
    servings: 2,
    difficulty: 'Easy',
    ingredients: [
      '8 oz linguine',
      '1 lb large shrimp, peeled and deveined',
      '4 tbsp butter',
      '4 cloves garlic, minced',
      '1/4 tsp red pepper flakes',
      '1/4 cup dry white wine or chicken stock',
      '1 lemon, zested and juiced',
      '1/4 cup fresh parsley, chopped',
      'Salt and black pepper, to taste',
    ],
    steps: [
      'Cook the linguine in salted boiling water until al dente. Reserve 1/2 cup pasta water before draining.',
      'Melt the butter in a large skillet over medium heat. Add the garlic and red pepper flakes and cook for 1 minute.',
      'Add the shrimp in a single layer and cook for 2 minutes per side, until pink and just cooked through.',
      'Pour in the wine or stock and lemon juice, then add the drained pasta and a splash of pasta water.',
      'Toss until the sauce coats the noodles, then stir in the lemon zest and parsley.',
      'Season to taste and serve with extra lemon wedges.',
    ],
    imageUrl: foodArt('#e8c49a', '#b8774f', '#f2dcb8', '#c45a3d'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 26,
  },
  {
    id: 'demo-recipe-lentil-soup',
    title: 'Golden Coconut Lentil Soup',
    description:
      'A cozy, golden soup made with red lentils, coconut milk, and warming spices. Blended until silky and finished with lime.',
    category: 'Vegan',
    prepTime: 10,
    cookTime: 30,
    servings: 4,
    difficulty: 'Easy',
    ingredients: [
      '1 cup red lentils, rinsed',
      '1 tbsp olive oil',
      '1 yellow onion, diced',
      '3 cloves garlic, minced',
      '1 tbsp fresh ginger, grated',
      '1 tsp curry powder',
      '1/2 tsp ground turmeric',
      '4 cups vegetable stock',
      '1 can (14 oz) coconut milk',
      '2 cups baby spinach',
      '1 lime, juiced',
      'Salt and black pepper, to taste',
    ],
    steps: [
      'Heat the olive oil in a large pot and cook the onion for 5 minutes until soft.',
      'Add the garlic, ginger, curry powder, and turmeric and cook for 1 minute.',
      'Stir in the lentils, vegetable stock, and coconut milk. Bring to a boil, then lower the heat and simmer for 20 minutes.',
      'Blend the soup until smooth with an immersion blender, or in batches in a countertop blender.',
      'Stir in the spinach and lime juice, then season with salt and pepper.',
      'Serve warm with extra coconut milk and a grind of black pepper.',
    ],
    imageUrl: foodArt('#e0c895', '#a67c45', '#f5e6c3', '#8b9a54'),
    imagePath: '',
    authorId: 'demo-creator',
    authorName: 'Maya Rivera',
    days: 30,
  },
]

let seedPromise = null

async function seedDemoData() {
  const existingUsers = readJson(USERS_KEY, null)
  if (!existingUsers) {
    const seedUsers = []
    for (const account of SEED_USERS) {
      const { password, ...rest } = account
      seedUsers.push({ ...rest, passwordHash: await hashPassword(password) })
    }
    writeJson(USERS_KEY, seedUsers)
  }

  const existingRecipes = readJson(RECIPES_KEY, null)
  if (!existingRecipes) {
    const seedRecipes = SEED_RECIPES.map(({ days, ...recipe }) => ({
      ...recipe,
      createdAt: daysAgo(days),
      updatedAt: daysAgo(days),
    }))
    writeJson(RECIPES_KEY, seedRecipes)
  }
}

function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedDemoData().catch((error) => {
      seedPromise = null
      throw error
    })
  }
  return seedPromise
}

function toPublicUser(user) {
  if (!user) return null
  return {
    uid: user.uid,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function findUserById(uid) {
  const users = readJson(USERS_KEY, [])
  return users.find((user) => user.uid === uid) || null
}

export async function registerDemoUser({ name, email, password, role }) {
  await ensureSeeded()
  const users = readJson(USERS_KEY, [])
  const normalizedEmail = String(email || '').trim().toLowerCase()

  if (!String(name || '').trim()) throw new Error('Please tell us your name.')
  if (!normalizedEmail) throw new Error('Please enter a valid email address.')
  if (!password || password.length < 6) {
    throw new Error('Your password needs at least 6 characters.')
  }
  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error('An account with that email already exists.')
  }

  const user = {
    uid: makeId('demo-user'),
    name: String(name).trim(),
    email: normalizedEmail,
    role: role === 'creator' ? 'creator' : 'viewer',
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  }

  users.push(user)
  writeJson(USERS_KEY, users)
  localStorage.setItem(SESSION_KEY, user.uid)
  return toPublicUser(user)
}

export async function loginDemoUser({ email, password }) {
  await ensureSeeded()
  const normalizedEmail = String(email || '').trim().toLowerCase()
  const user = readJson(USERS_KEY, []).find((entry) => entry.email === normalizedEmail)
  const passwordHash = await hashPassword(password || '')
  if (!user || user.passwordHash !== passwordHash) {
    throw new Error('Incorrect email or password.')
  }
  localStorage.setItem(SESSION_KEY, user.uid)
  return toPublicUser(user)
}

export function logoutDemoUser() {
  localStorage.removeItem(SESSION_KEY)
}

export function getDemoUserById(uid) {
  return Promise.resolve(toPublicUser(findUserById(uid)))
}

export function getDemoSessionUser() {
  const uid = localStorage.getItem(SESSION_KEY)
  return uid ? toPublicUser(findUserById(uid)) : null
}

export function onDemoAuthChange(callback) {
  let active = true

  const notify = () => {
    if (!active) return
    callback(getDemoSessionUser())
  }

  ensureSeeded()
    .then(notify)
    .catch((error) => {
      console.error(error)
      if (active) callback(null)
    })

  const handleStorage = (event) => {
    if (!event.key || [SESSION_KEY, USERS_KEY].includes(event.key)) notify()
  }

  window.addEventListener('storage', handleStorage)
  return () => {
    active = false
    window.removeEventListener('storage', handleStorage)
  }
}

export async function listDemoUsers() {
  await ensureSeeded()
  return readJson(USERS_KEY, [])
    .map(toPublicUser)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function updateDemoUserRole(uid, role) {
  await ensureSeeded()
  const session = getDemoSessionUser()
  if (!session || session.role !== 'admin') {
    throw new Error('Only admins can change user roles.')
  }
  if (!['admin', 'creator', 'viewer'].includes(role)) {
    throw new Error('That is not a valid role.')
  }
  if (session.uid === uid && role !== 'admin') {
    throw new Error('You cannot remove your own admin access.')
  }

  const users = readJson(USERS_KEY, [])
  const target = users.find((user) => user.uid === uid)
  if (!target) throw new Error('That user could not be found.')
  target.role = role
  writeJson(USERS_KEY, users)
  return toPublicUser(target)
}

export async function listDemoRecipes() {
  await ensureSeeded()
  return readJson(RECIPES_KEY, [])
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function listDemoRecipesByAuthor(uid) {
  await ensureSeeded()
  return (await listDemoRecipes()).filter((recipe) => recipe.authorId === uid)
}

export async function getDemoRecipe(id) {
  await ensureSeeded()
  return readJson(RECIPES_KEY, []).find((recipe) => recipe.id === id) || null
}

function sanitizeRecipe(values) {
  return {
    title: String(values.title || '').trim(),
    description: String(values.description || '').trim(),
    category: values.category || 'Dinner',
    prepTime: Math.max(0, Number(values.prepTime) || 0),
    cookTime: Math.max(0, Number(values.cookTime) || 0),
    servings: Math.max(1, Number(values.servings) || 1),
    difficulty: values.difficulty || 'Easy',
    ingredients: (values.ingredients || []).map((item) => String(item).trim()).filter(Boolean),
    steps: (values.steps || []).map((step) => String(step).trim()).filter(Boolean),
  }
}

export async function createDemoRecipe(values, imageUrl) {
  await ensureSeeded()
  const session = getDemoSessionUser()
  if (!session) throw new Error('Please log in to add a recipe.')
  if (session.role !== 'creator' && session.role !== 'admin') {
    throw new Error('Only recipe creators can publish recipes.')
  }

  const now = new Date().toISOString()
  const recipe = {
    id: makeId('demo-recipe'),
    ...sanitizeRecipe(values),
    imageUrl: imageUrl || '',
    imagePath: '',
    authorId: session.uid,
    authorName: session.name,
    createdAt: now,
    updatedAt: now,
  }

  const recipes = readJson(RECIPES_KEY, [])
  recipes.unshift(recipe)
  writeJson(RECIPES_KEY, recipes)
  return recipe
}

export async function updateDemoRecipe(id, values, imageUrl) {
  await ensureSeeded()
  const session = getDemoSessionUser()
  if (!session) throw new Error('Please log in to edit a recipe.')

  const recipes = readJson(RECIPES_KEY, [])
  const index = recipes.findIndex((recipe) => recipe.id === id)
  if (index === -1) throw new Error('Recipe not found.')

  const existing = recipes[index]
  if (session.role !== 'admin' && existing.authorId !== session.uid) {
    throw new Error('You can only edit your own recipes.')
  }

  const updated = {
    ...existing,
    ...sanitizeRecipe(values),
    updatedAt: new Date().toISOString(),
  }
  if (imageUrl) updated.imageUrl = imageUrl

  recipes[index] = updated
  writeJson(RECIPES_KEY, recipes)
  return updated
}

export async function deleteDemoRecipe(id) {
  await ensureSeeded()
  const session = getDemoSessionUser()
  if (!session) throw new Error('Please log in to delete a recipe.')

  const recipes = readJson(RECIPES_KEY, [])
  const existing = recipes.find((recipe) => recipe.id === id)
  if (!existing) throw new Error('Recipe not found.')
  if (session.role !== 'admin' && existing.authorId !== session.uid) {
    throw new Error('You can only delete your own recipes.')
  }

  writeJson(
    RECIPES_KEY,
    recipes.filter((recipe) => recipe.id !== id),
  )
}
