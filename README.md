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
