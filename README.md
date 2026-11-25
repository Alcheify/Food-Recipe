# RecipeHub

A full frontend for a recipe sharing platform built with **React + Vite**, styled with plain CSS, and wired for a **Firebase** backend (Authentication and Firestore). Photos work on the free Spark plan by being compressed and stored in Firestore; Firebase Storage is optional for Blaze projects.

The app runs immediately in **local preview mode** (localStorage) so you can explore every screen before connecting Firebase. Once you add your Firebase keys to `.env`, the same UI uses the real backend.

## Features

- Private recipe library: browsing requires a signed-in Viewer, Recipe Creator, or Admin account
- Browse recipes with keyword search and category filters
- Recipe detail pages with ingredients checklist and step-by-step method
- Recipe creators can publish, edit, and delete their own recipes
- Food photo upload with automatic compression, stored in Firestore (JPG, PNG, WebP up to 10 MB)
- Email/password login and registration
- Three roles with route protection:
  - **Admin** - manage all users and roles, moderate/delete any recipe
  - **Recipe Creator** - add, edit, and delete their own recipes
  - **Viewer** - browse and read recipes only
- Admin dashboard with counts, role controls, and recipe moderation
- Responsive layout for desktop, tablet, and mobile

## Quick start (preview mode)

```powershell
cd C:\Dave\Apps\clients\Paye
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). You will land on the login screen; sign in with one of the demo accounts below to see the recipe library.

No Firebase setup is needed for this first run. A dark bar at the top says **Preview mode** and all data is kept in your browser.

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@demo.com` | `Admin123!` |
| Recipe Creator | `creator@demo.com` | `Creator123!` |
| Viewer | `viewer@demo.com` | `Viewer123!` |

The login screen has one-click buttons that fill these credentials. Registering a new account also works and defaults to Viewer or Recipe Creator (your choice).

> Demo data is stored in `localStorage`. Clearing site data resets the recipes. Passwords are hashed only for the demo; this is not production security.

## Connect Firebase (the part left for you)

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com/> and create a project.
2. Add a **Web app** to the project (`</>` icon).
3. Copy the `firebaseConfig` values shown by the SDK setup wizard.

### 2. Enable the free services

In the Firebase console:

1. **Build → Authentication → Sign-in method** → enable **Email/Password**.
2. **Build → Firestore Database** → create a database (start in production mode; rules are below).

**Do not enable Storage on the Spark plan.** Firebase Storage requires the paid Blaze plan as of February 2026. The app’s default `firestore` image mode does not touch Storage, so no upgrade is needed.

### 3. Add your config

```powershell
Copy-Item .env.example .env
```

Open `.env` and fill in the values from the Firebase web app config:

```env
VITE_FIREBASE_API_KEY=your-apiKey
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Keep this on "firestore" for the free Spark plan.
VITE_IMAGE_MODE=firestore
```

Restart the dev server (`Ctrl+C`, then `npm run dev`). The preview bar disappears and the app uses Firebase. These values are not secrets; Firestore security rules protect your data. `VITE_FIREBASE_STORAGE_BUCKET` is only used when `VITE_IMAGE_MODE=storage`.

#### How photos work on the free plan

With the default `VITE_IMAGE_MODE=firestore`:

1. The browser resizes and compresses the selected photo (targeting about 250 KB).
2. The image is saved as a base64 data URL in the recipe’s `imageUrl` field in Firestore.
3. No Storage bucket, Storage rules, or billing are involved.

Firestore documents are capped at 1 MiB. The compressor automatically steps down the dimensions and quality until the image fits comfortably; an extremely detailed photo may be rejected. This is ideal for a class or demo project. For large image libraries, use a free image host such as Cloudinary or upgrade to Blaze and switch to `VITE_IMAGE_MODE=storage`.

### 4. Publish security rules

**Firestore → Rules:**

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }

    function userRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isSignedIn() && userRole() == 'admin';
    }

    function canPublish() {
      return isSignedIn() && userRole() in ['creator', 'admin'];
    }

    match /users/{userId} {
      allow read: if isSignedIn();

      allow create: if isSignedIn()
        && request.auth.uid == userId
        && request.resource.data.uid == userId
        && request.resource.data.role in ['creator', 'viewer'];

      allow update: if isAdmin()
        || (isSignedIn()
          && request.auth.uid == userId
          && request.resource.data.role == resource.data.role);

      allow delete: if isAdmin();
    }

    match /recipes/{recipeId} {
      allow read: if isSignedIn();

      allow create: if canPublish()
        && request.resource.data.authorId == request.auth.uid;

      allow update, delete: if isAdmin()
        || (isSignedIn() && resource.data.authorId == request.auth.uid);
    }
  }
}
```

**Optional: Storage rules (Blaze plan only).** Skip this section entirely on the free Spark plan and leave `VITE_IMAGE_MODE=firestore`. Only publish these rules if you upgraded to Blaze and set `VITE_IMAGE_MODE=storage`:

```js
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }

    function userRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }

    function isAdmin() {
      return isSignedIn() && userRole() == 'admin';
    }

    function canPublish() {
      return isSignedIn() && userRole() in ['creator', 'admin'];
    }

    match /recipes/{userId}/{fileName} {
      allow read: if true;

      allow create, update: if isSignedIn()
        && request.auth.uid == userId
        && canPublish()
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');

      allow delete: if isSignedIn()
        && (request.auth.uid == userId || isAdmin());
    }
  }
}
```

These rules keep the recipe library private to signed-in users, prevent self-registration as Admin, stop Viewers from publishing, and let Admins manage everyone. If you use a named Firestore database instead of `(default)`, update the optional Storage rule path as well.

### 5. Create your first Admin

Registration intentionally only allows **Viewer** or **Recipe Creator**. To bootstrap an Admin:

1. Register a normal account in the app.
2. In Firebase console → **Firestore Database → Data → users**, open the document whose ID equals your Auth UID.
3. Change the `role` field from `creator`/`viewer` to `admin`.
4. Sign out and sign back in (or refresh the page).

From then on, that Admin can promote other accounts from the in-app Admin dashboard.

### 6. Test each role

- **Viewer**: no “Share a recipe” or “My recipes” links; visiting `/recipes/new`, `/my-recipes`, or `/admin` shows the access-denied page.
- **Recipe Creator**: can publish, edit, and delete only their own recipes.
- **Admin**: everything above plus `/admin` role management and moderation of any recipe.

## Data model

`users/{uid}`

```js
{
  uid: 'firebase-auth-uid',
  name: 'Maya Rivera',
  email: 'maya@example.com',
  role: 'viewer', // 'admin' | 'creator' | 'viewer'
  createdAt: '<Firestore Timestamp>'
}
```

`recipes/{recipeId}`

```js
{
  title: 'Creamy Tuscan Salmon',
  description: 'A one-pan salmon dinner…',
  category: 'Dinner',
  prepTime: 10,        // minutes
  cookTime: 25,        // minutes
  servings: 4,
  difficulty: 'Medium',
  ingredients: ['4 salmon fillets', '2 tbsp olive oil', '…'],
  steps: ['Pat the salmon dry…', 'Sear the salmon…', '…'],
  imageUrl: 'data:image/jpeg;base64,…', // compressed photo on the free plan
  imagePath: '',                         // Storage path only in storage mode
  authorId: 'firebase-auth-uid',
  authorName: 'Maya Rivera',
  createdAt: '<Firestore Timestamp>',
  updatedAt: '<Firestore Timestamp>'
}
```

By default, photos are compressed in the browser (max 1100 px, progressively reduced toward 250 KB) and stored in `imageUrl` as a base64 data URL; `imagePath` stays empty. With Blaze and `VITE_IMAGE_MODE=storage`, photos are compressed to max 1600 px / JPEG quality 0.85, uploaded to `recipes/{uid}/{timestamp}-{filename}`, and `imageUrl` contains the download URL.

## Project structure

```text
Paye/
├─ index.html
├─ .env.example
├─ vite.config.js
├─ package.json
└─ src/
   ├─ main.jsx / App.jsx / index.css
   ├─ firebase.js              # Firebase init + demo mode detection
   ├─ constants.js
   ├─ context/
   │  └─ AuthContext.jsx       # session + role helpers
   ├─ services/
   │  ├─ authService.js        # register/login/logout/auth listener
   │  ├─ userService.js        # profiles + admin role updates
   │  ├─ recipeService.js      # CRUD + image orchestration
   │  ├─ imageService.js       # compression + Firestore/Storage images
   │  └─ demoBackend.js        # localStorage preview backend
   ├─ components/              # Navbar, guards, cards, form pieces…
   └─ pages/                   # Browse, Detail, Form, My Recipes, Admin, Auth…
```

`src/firebase.js` checks whether the Vite env vars exist. If they do, real Firebase services are initialized. If not, `isDemoMode` is `true` and the service files call `demoBackend.js` instead. **You should not need to change any UI code when connecting Firebase** — only `.env` and your project settings.

## What to do next

1. Run the preview and click through all three demo roles.
2. Connect Firebase using the steps above and deploy the Firestore rules. Skip Storage on the free plan.
3. Create the first Admin and promote one Creator.
4. Add 2–3 real recipes, including photo uploads, to verify Firestore images work.
5. Optional hardening:
   - Move search and pagination to Firestore queries if you expect many recipes (the current build fetches up to 200 and filters in the browser).
   - Add Firestore composite indexes if you add `where` + `orderBy` server queries.
   - Add recipe likes/comments or saved favorites (new collections + rules).
   - Add profile editing and account deletion through a Cloud Function (client SDKs cannot delete another user's Auth account).
   - If photo volume outgrows Firestore, use Cloudinary or upgrade to Blaze and switch to `VITE_IMAGE_MODE=storage`.
6. Optional deploy to Firebase Hosting:

```powershell
npm run build
npm install -g firebase-tools
firebase login
firebase init hosting   # public directory: dist, configure as single-page app: yes
firebase deploy
```

## Notes & current limits

- Recipes are sorted newest-first in the browser; the recipe query is limited to 200 documents.
- A recipe photo is optional; a styled fallback is shown when absent.
- Admins can change roles and remove Firestore profiles, but deleting a Firebase **Auth** user requires the Firebase console or a Cloud Function.
- The app works on Firebase’s free Spark plan: Auth and Firestore only, with compressed photos embedded in recipe documents.
- Firestore’s free tier includes 1 GiB storage, 50k reads/day, and 10 GiB/month egress. Embedded photos are compressed toward 250 KB; for many large photos, an external image host is a better fit.
- Replacing a Firestore photo overwrites `imageUrl` in the same document. In Storage mode, the previous file is deleted on a best-effort basis and a failed cleanup never blocks saving the recipe.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Preview bar still shows after adding `.env` | Restart `npm run dev`; env vars are read at startup. |
| `auth/operation-not-allowed` | Enable Email/Password in Authentication. |
| `Missing or insufficient permissions` | Publish the Firestore rules above and make sure a `users/{uid}` document exists. |
| Recipe save fails on the image | On Spark, keep `VITE_IMAGE_MODE=firestore` and make sure Firestore is enabled. Try a smaller or simpler photo if it is rejected. |
| Storage upload fails with 402/403 | Firebase Storage requires Blaze. Remove `VITE_IMAGE_MODE=storage` to use free Firestore images. |
| Registration succeeded but is Viewer instead of Creator | Your `users` document write may be blocked; verify rules and retry. |
| Admin nav does not appear | The `role` in your `users/{uid}` Firestore document must be exactly `admin`, then refresh/re-login. |
