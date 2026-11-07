import { type ReactNode, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Sidebar } from '@/components/Sidebar'
import { Button } from '@/components/ui/button'

export function AppShell({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-background">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-border/80 bg-card/90 backdrop-blur-xl transition-transform duration-300 md:hidden ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between border-b border-border/80 p-4">
                    <div>
                        <p className="text-xs text-muted-foreground">Control panel</p>
                        <h2 className="text-lg font-semibold">Whale Panel</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <div className="h-[calc(100vh-73px)] overflow-y-auto">
                    <Sidebar onItemClick={() => setSidebarOpen(false)} />
                </div>
            </aside>

            <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border/80 bg-card/60 backdrop-blur-xl md:flex">
                <div className="h-full w-full overflow-y-auto">
                    <Sidebar />
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col overflow-x-hidden md:pl-72">
                <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-xl md:hidden">
                    <div className="flex items-center gap-3 p-4">
                        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                            <Menu className="h-5 w-5" />
                        </Button>
                        <div>
                            <p className="text-xs text-muted-foreground">Control panel</p>
                            <span className="font-semibold">Whale Panel</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    )
}
