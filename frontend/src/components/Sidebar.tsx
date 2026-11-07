import { BarChart3, Github, LogOut, Moon, Server, Settings, Sun, Users } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getUserRole, logout } from '@/lib/auth'
import { useTheme } from '@/hooks/useTheme'

interface SidebarProps {
    onItemClick?: () => void
}

const navigationItems = [
    {
        label: 'Dashboard',
        href: '/',
        icon: BarChart3,
        roles: ['admin', 'superadmin'],
    },
    {
        label: 'Admins',
        href: '/admins',
        icon: Users,
        roles: ['superadmin'],
    },
    {
        label: 'Panels',
        href: '/panels',
        icon: Server,
        roles: ['superadmin'],
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        roles: ['superadmin'],
    },
]

export function Sidebar({ onItemClick }: SidebarProps) {
    const navigate = useNavigate()
    const location = useLocation()
    const userRole = getUserRole()
    const filteredItems = navigationItems.filter(item =>
        item.roles.includes(userRole ?? '')
    )

    return (
        <div className="flex h-full flex-col">
            <div className="border-b border-border/80 p-5">
                <h1 className="mt-2 text-xl font-semibold tracking-tight">Whale Panel</h1>
            </div>

            <nav className="flex-1 space-y-2 p-4">
                {filteredItems.map(item => {
                    const Icon = item.icon
                    const isActive = location.pathname === item.href

                    return (
                        <Button
                            key={item.href}
                            variant={isActive ? 'default' : 'ghost'}
                            className={cn(
                                'w-full justify-start gap-3 rounded-xl px-3 text-sm font-medium',
                                isActive && 'bg-primary text-primary-foreground shadow-sm'
                            )}
                            onClick={() => {
                                navigate(item.href)
                                onItemClick?.()
                            }}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                        </Button>
                    )
                })}
            </nav>

            <div className="space-y-2 border-t border-border/80 p-4">
                <ThemeModeToggle />

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl"
                    onClick={() =>
                        window.open(
                            'https://github.com/primeZdev/whale-panel',
                            '_blank',
                            'noopener,noreferrer'
                        )
                    }
                >
                    <Github className="h-4 w-4" />
                    <span>GitHub</span>
                </Button>

                <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 rounded-xl text-destructive hover:text-destructive"
                    onClick={logout}
                >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                </Button>
            </div>
        </div>
    )
}

function ThemeModeToggle() {
    const { theme, toggleTheme } = useTheme()

    return (
        <Button
            variant="ghost"
            className="w-full justify-start gap-3 rounded-xl"
            onClick={toggleTheme}
        >
            {theme === 'light' ? (
                <Moon className="h-4 w-4" />
            ) : (
                <Sun className="h-4 w-4" />
            )}
            <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </Button>
    )
}
