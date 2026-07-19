import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Sidebar } from '@/components/Sidebar'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { AdminsPage } from '@/pages/AdminsPage'
import { PanelsPage } from '@/pages/PanelsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

function App() {
    return (
        <Router basename={import.meta.env.BASE_URL}>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<LoginPage />} />

                {/* Protected Routes */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <DashboardPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/admins"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <AdminsPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/panels"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <PanelsPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/settings"
                    element={
                        <ProtectedRoute>
                            <Layout>
                                <SettingsPage />
                            </Layout>
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Router>
    )
}

function Layout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-background max-w-full overflow-x-hidden">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r transform transition-transform duration-300 ease-in-out md:hidden ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4 border-b">
                    <span className="font-semibold text-lg">Whale Panel</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <Sidebar onItemClick={() => setSidebarOpen(false)} />
                </div>
            </aside>

            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="hidden md:flex w-64 border-r bg-muted/30 flex-col flex-shrink-0">
                <div className="flex-1 overflow-y-auto">
                    <Sidebar />
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
                {/* Mobile Header with Menu Button */}
                <header className="md:hidden flex items-center gap-3 p-4 border-b bg-background sticky top-0 z-30">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                    <span className="font-semibold">Whale Panel</span>
                </header>

                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    )
}

export default App
