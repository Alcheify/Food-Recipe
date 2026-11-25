import { Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import ScrollToTop from './components/ScrollToTop'
import { AuthProvider } from './context/AuthContext'
import { isDemoMode } from './firebase'
import AdminPage from './pages/AdminPage'
import BrowsePage from './pages/BrowsePage'
import ForbiddenPage from './pages/ForbiddenPage'
import LoginPage from './pages/LoginPage'
import MyRecipesPage from './pages/MyRecipesPage'
import NotFoundPage from './pages/NotFoundPage'
import RecipeDetailPage from './pages/RecipeDetailPage'
import RecipeFormPage from './pages/RecipeFormPage'
import RegisterPage from './pages/RegisterPage'

export default function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <div className="app-shell">
        {isDemoMode ? (
          <div className="demo-bar">
            <div className="container demo-bar-inner">
              <span className="demo-dot" aria-hidden="true" />
              <span>
                <strong>Preview mode.</strong> Accounts and recipes are stored in this browser.
              </span>
              <span className="demo-bar-hint">
                Add Firebase keys to <code>.env</code> to go live.
              </span>
            </div>
          </div>
        ) : null}

        <Navbar />

        <main className="app-main">
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth>
                  <BrowsePage />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/recipes/new"
              element={
                <RequireAuth roles={['creator', 'admin']}>
                  <RecipeFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="/recipes/:id"
              element={
                <RequireAuth>
                  <RecipeDetailPage />
                </RequireAuth>
              }
            />
            <Route
              path="/recipes/:id/edit"
              element={
                <RequireAuth roles={['creator', 'admin']}>
                  <RecipeFormPage />
                </RequireAuth>
              }
            />

            <Route
              path="/my-recipes"
              element={
                <RequireAuth roles={['creator', 'admin']}>
                  <MyRecipesPage />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth roles={['admin']}>
                  <AdminPage />
                </RequireAuth>
              }
            />

            <Route path="/forbidden" element={<ForbiddenPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  )
}
