import { Suspense, lazy, type ReactNode } from 'react'
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Loader2 } from 'lucide-react'
import { isTokenValid } from '@/lib/auth'

const LoginPage = lazy(() => import('@/pages/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AdminsPage = lazy(() => import('@/pages/AdminsPage').then(m => ({ default: m.AdminsPage })))
const PanelsPage = lazy(() => import('@/pages/PanelsPage').then(m => ({ default: m.PanelsPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <Routes>
                <Route path="/login" element={<LoginPageRoute />} />
                <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
                <Route path="/admins" element={<ProtectedRoute><Layout><AdminsPage /></Layout></ProtectedRoute>} />
                <Route path="/panels" element={<ProtectedRoute><Layout><PanelsPage /></Layout></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />
                <Route path="*" element={<FallbackRoute />} />
            </Routes>
        </Router>
    )
}

function FallbackRoute() {
    return isTokenValid() ? <Navigate to="/" replace /> : <Navigate to="/login" replace />
}

function LoginPageRoute() {
    return (
        <Suspense fallback={<RouteLoader />}>
            <LoginPage />
        </Suspense>
    )
}

function Layout({ children }: { children: ReactNode }) {
    return (
        <AppShell>
            <Suspense fallback={<RouteLoader />}>{children}</Suspense>
        </AppShell>
    )
}

function RouteLoader() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}

export default App
