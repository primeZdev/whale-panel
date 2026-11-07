import { useEffect, useMemo, useState } from 'react'
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Copy,
    Edit2,
    ExternalLink,
    HardDrive,
    Plus,
    Power,
    QrCode,
    RotateCcw,
    Search,
    Server,
    Trash2,
    UserX,
    Users,
    Wifi,
    Zap,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { UserFormDialog } from './components/UserFormDialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { StatCard } from '@/components/ui/stat-card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { dashboardAPI, userAPI } from '@/lib/api'
import { getUserRole } from '@/lib/auth'
import { bytesToGB, formatTraffic } from '@/lib/traffic-converter'
import { cn, formatDate, formatExpiryWithDays } from '@/lib/utils'
import type { ClientsOutput, DashboardData } from '@/types'

function buildSubUrl(subUrl?: string, subId?: string) {
    if (!subUrl || !subId) return ''
    if (subId.startsWith('http://') || subId.startsWith('https://')) return subId
    return `${subUrl.replace(/\/+$/, '')}/${subId.replace(/^\/+/, '')}`
}

interface ExpandedRow {[key: string]: boolean}

export function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedRows, setExpandedRows] = useState<ExpandedRow>({})
    const [selectedUser, setSelectedUser] = useState<ClientsOutput | null>(null)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [showQrDialog, setShowQrDialog] = useState(false)
    const [qrUser, setQrUser] = useState<ClientsOutput | null>(null)
    const [showUserDialog, setShowUserDialog] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'online'>('all')
    const [usersPerPage, setUsersPerPage] = useState(() => Number(localStorage.getItem('usersPerPage') ?? '5'))
    const userRole = getUserRole()

    useEffect(() => {
        localStorage.setItem('usersPerPage', usersPerPage.toString())
    }, [usersPerPage])

    useEffect(() => {
        void fetchDashboardData()
    }, [])

    useEffect(() => {
        if (userRole !== 'superadmin') return

        const interval = setInterval(async () => {
            try {
                const systemInfo = await dashboardAPI.getSystemInfo()
                setDashboardData(prev => (prev ? { ...prev, system: systemInfo } : null))
            } catch (err) {
                console.warn('Failed to refresh system info:', err)
            }
        }, 5000)

        return () => clearInterval(interval)
    }, [userRole])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const data = await dashboardAPI.getDashboardData()

            if (userRole === 'superadmin') {
                try {
                    data.system = await dashboardAPI.getSystemInfo()
                } catch (err) {
                    console.warn('Failed to fetch system info:', err)
                }
            }

            setDashboardData(data)
            setError(null)
        } catch (err: any) {
            console.error('Failed to fetch dashboard data:', err)
            setError(err?.message || 'Failed to fetch dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteUser = async () => {
        if (!userToDelete) return

        try {
            const [uuid, username, id] = userToDelete.split('|')
            await userAPI.deleteUser(uuid, username, id)
            setUserToDelete(null)
            await fetchDashboardData()
        } catch (err: any) {
            console.error('Failed to delete user:', err)
            alert(err?.message || 'Failed to delete user')
        }
    }

    const handleResetUsage = async (email: string) => {
        try {
            await userAPI.resetUserUsage(email)
            await fetchDashboardData()
        } catch (err: any) {
            console.error('Failed to reset usage:', err)
            alert(err?.message || 'Failed to reset usage')
        }
    }

    const handleToggleStatus = async (user: ClientsOutput) => {
        try {
            await userAPI.updateUser(
                user.uuid || '0',
                user.username,
                user.data_limit / 1024 ** 3,
                user.expiry_date_unix ? new Date(user.expiry_date_unix).toISOString().slice(0, 10) : null,
                user.sub_id || '',
                !user.status,
                user.flow || '',
                user.id?.toString(),
            )
            await fetchDashboardData()
        } catch (err: any) {
            console.error('Failed to toggle status:', err)
            alert(err?.message || 'Failed to toggle user status')
        }
    }

    const filteredUsers = useMemo(() => {
        if (!dashboardData?.users) return []

        return dashboardData.users.filter(user => {
            const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (user.uuid && user.uuid.toLowerCase().includes(searchQuery.toLowerCase()))

            if (!matchesSearch) return false

            if (statusFilter === 'all') return true
            if (statusFilter === 'online') return user.is_online
            if (statusFilter === 'active') return user.status && !user.is_online
            if (statusFilter === 'inactive') return !user.status

            return true
        })
    }, [dashboardData?.users, searchQuery, statusFilter])

    const reversedUsers = useMemo(() => [...filteredUsers].reverse(), [filteredUsers])
    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / usersPerPage))
    const paginatedUsers = reversedUsers.slice((currentPage - 1) * usersPerPage, currentPage * usersPerPage)

    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, statusFilter, usersPerPage])

    if (loading) {
        return <LoadingState />
    }

    return (
        <div className="space-y-6 p-4 md:p-6">
            <PageHeader title="Dashboard" description="Welcome back!" />

            {error && (
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            )}

            {userRole === 'superadmin' && dashboardData && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {dashboardData.panels && (
                        <StatCard
                            title="Total Panels"
                            value={dashboardData.panels.length}
                            description="Configured panels"
                            icon={<Server className="h-4 w-4 text-violet-500" />}
                            className="panel-surface"
                        />
                    )}
                    {dashboardData.admins && (
                        <StatCard
                            title="Total Active Admins"
                            value={dashboardData.admins.filter(a => a.is_active).length}
                            description="Active administrators"
                            icon={<Users className="h-4 w-4 text-emerald-500" />}
                            className="panel-surface"
                        />
                    )}
                    {dashboardData.admins && (
                        <StatCard
                            title="Total Inactive Admins"
                            value={dashboardData.admins.filter(a => !a.is_active).length}
                            description="Inactive administrators"
                            icon={<UserX className="h-4 w-4 text-red-500" />}
                            className="panel-surface"
                        />
                    )}
                </div>
            )}

            {dashboardData?.system && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <StatCard
                        title="Memory Usage"
                        value={`${(dashboardData.system.used_memory / 1024 / 1024 / 1024).toFixed(2)} GB`}
                        description={`Total: ${(dashboardData.system.total_memory / 1024 / 1024 / 1024).toFixed(2)} GB`}
                        icon={<HardDrive className="h-4 w-4 text-indigo-500" />}
                        className="panel-surface"
                    />
                    <StatCard
                        title="Disk Usage"
                        value={`${(dashboardData.system.disk_used / 1024 / 1024 / 1024).toFixed(2)} GB`}
                        description={`Total: ${(dashboardData.system.disk_total / 1024 / 1024 / 1024).toFixed(2)} GB`}
                        icon={<HardDrive className="h-4 w-4 text-pink-500" />}
                        className="panel-surface"
                    />
                    <StatCard
                        title="CPU Usage"
                        value={`${dashboardData.system.cpu_percent.toFixed(1)}%`}
                        description="Current usage"
                        icon={<Zap className="h-4 w-4 text-orange-500" />}
                        className="panel-surface"
                    />
                </div>
            )}

            {userRole === 'admin' && dashboardData && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <StatCard
                        title="Remaining Traffic"
                        value={dashboardData.remaining_traffic !== undefined ? `${bytesToGB(dashboardData.remaining_traffic).toFixed(2)}${dashboardData.initial_traffic !== undefined ? ` / ${bytesToGB(dashboardData.initial_traffic).toFixed(2)} GB` : ' GB'}` : 'N/A'}
                        description={dashboardData.remaining_traffic !== undefined ? (dashboardData.initial_traffic !== undefined ? 'Remaining / Initial traffic' : formatTraffic(dashboardData.remaining_traffic)) : 'No data'}
                        icon={<Zap className="h-4 w-4 text-yellow-500" />}
                        className="panel-surface"
                    />
                    <StatCard
                        title="Expiry Date"
                        value={dashboardData.expiry_time ? formatDate(dashboardData.expiry_time) : 'No expiry'}
                        description="Account expiration"
                        icon={<Clock className="h-4 w-4 text-blue-500" />}
                        className="panel-surface"
                    />
                    <StatCard
                        title="Total Users"
                        value={dashboardData.users?.length || 0}
                        description="Registered users"
                        icon={<Users className="h-4 w-4 text-green-500" />}
                        className="panel-surface"
                    />
                    <StatCard
                        title="Online Users"
                        value={dashboardData.users?.filter(u => u.is_online).length || 0}
                        description="Currently connected"
                        icon={<Wifi className="h-4 w-4 text-emerald-500" />}
                        className="panel-surface"
                    />
                </div>
            )}

            {dashboardData?.ads && dashboardData.ads.text && (
                <Card className="panel-surface border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 dark:border-yellow-800 dark:from-yellow-950/30 dark:to-orange-950/10">
                    <CardContent className="p-4 pt-8">
                        <a href={dashboardData.ads.link || '#'} target="_blank" rel="noreferrer" className="block group">
                            <div className="flex flex-col gap-2" dir="rtl">
                                <div className="min-w-0 flex-1" dir="rtl">
                                    {dashboardData.ads.title && (
                                        <h3 className="mb-1 text-sm font-bold text-yellow-900 transition-colors group-hover:text-yellow-700 dark:text-yellow-100 dark:group-hover:text-yellow-200">
                                            {dashboardData.ads.title}
                                        </h3>
                                    )}
                                    <p className="text-sm leading-relaxed text-gray-700 transition-colors group-hover:text-gray-900 dark:text-gray-300 dark:group-hover:text-gray-100">
                                        {dashboardData.ads.text}
                                    </p>
                                    {dashboardData.ads.button && (
                                        <div className="mt-3 flex justify-start">
                                            <span className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:from-yellow-600 hover:to-orange-600 hover:shadow-lg">
                                                <ExternalLink className="h-4 w-4" />
                                                {dashboardData.ads.button}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </a>
                    </CardContent>
                </Card>
            )}

            {dashboardData?.users && (
                <Card>
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                            <CardTitle>Your Users</CardTitle>
                            <Button size="sm" onClick={() => {
                                setSelectedUser(null)
                                setShowUserDialog(true)
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add User
                            </Button>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <select
                                value={statusFilter}
                                onChange={e => {
                                    setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'online')
                                    setCurrentPage(1)
                                }}
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                            >
                                <option value="all">All</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="online">Online</option>
                            </select>

                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={e => {
                                        setSearchQuery(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    placeholder="Search users by email or username..."
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {filteredUsers.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                {searchQuery || statusFilter !== 'all' ? 'No users found matching your filters' : 'No users yet'}
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 md:hidden">
                                    {paginatedUsers.map(user => (
                                        <UserCardMobile
                                            key={user.uuid || user.id}
                                            user={user}
                                            isExpanded={Boolean(expandedRows[`${user.uuid || user.id}-${user.username}`])}
                                            subUrl={dashboardData.sub_url}
                                            onToggle={() => setExpandedRows(prev => ({
                                                ...prev,
                                                [`${user.uuid || user.id}-${user.username}`]: !prev[`${user.uuid || user.id}-${user.username}`],
                                            }))}
                                            onEdit={() => {
                                                setSelectedUser(user)
                                                setShowUserDialog(true)
                                            }}
                                            onDelete={() => setUserToDelete(`${user.uuid || '0'}|${user.username}|${user.id}`)}
                                            onResetUsage={() => void handleResetUsage(user.username)}
                                            onShowQr={(user: ClientsOutput) => {
                                                        setQrUser(user)
                                                        setShowQrDialog(true)
                                                    }}
                                            onToggleStatus={() => void handleToggleStatus(user)}
                                        />
                                    ))}
                                </div>

                                <div className="hidden overflow-x-auto md:block">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12" />
                                                <TableHead>Email</TableHead>
                                                <TableHead>Traffic</TableHead>
                                                <TableHead>Expiry</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {paginatedUsers.map(user => (
                                                <UserRowDesktop
                                                    key={user.uuid || user.id}
                                                    user={user}
                                                    isExpanded={Boolean(expandedRows[`${user.uuid || user.id}-${user.username}`])}
                                                    subUrl={dashboardData.sub_url}
                                                    onToggle={() => setExpandedRows(prev => ({
                                                        ...prev,
                                                        [`${user.uuid || user.id}-${user.username}`]: !prev[`${user.uuid || user.id}-${user.username}`],
                                                    }))}
                                                    onEdit={() => {
                                                        setSelectedUser(user)
                                                        setShowUserDialog(true)
                                                    }}
                                                    onDelete={() => setUserToDelete(`${user.uuid || '0'}|${user.username}|${user.id}`)}
                                                    onResetUsage={() => void handleResetUsage(user.username)}
                                                    onShowQr={(user: ClientsOutput) => {
                                                        setQrUser(user)
                                                        setShowQrDialog(true)
                                                    }}
                                                    onToggleStatus={() => void handleToggleStatus(user)}
                                                />
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
                                    <div className="flex flex-col items-center gap-3 sm:flex-row">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
                                            {searchQuery ? ` (filtered from ${dashboardData.users.length} total)` : ''}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">Show:</span>
                                            <select
                                                value={usersPerPage}
                                                onChange={e => {
                                                    setUsersPerPage(Number(e.target.value))
                                                    setCurrentPage(1)
                                                }}
                                                className="h-8 rounded-md border border-input bg-background px-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
                                            >
                                                <option value={5}>5</option>
                                                <option value={10}>10</option>
                                                <option value={20}>20</option>
                                            </select>
                                        </div>
                                    </div>

                                    {filteredUsers.length > usersPerPage && (
                                        <div className="flex items-center gap-1 sm:gap-2">
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                                <ChevronLeft className="h-4 w-4" />
                                                <span className="hidden sm:inline">Previous</span>
                                            </Button>
                                            <span className="text-sm text-muted-foreground">
                                                {currentPage} / {totalPages}
                                            </span>
                                            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                                                <span className="hidden sm:inline">Next</span>
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
            )}

            <UserFormDialog
                isOpen={showUserDialog}
                onClose={() => {
                    setShowUserDialog(false)
                    setSelectedUser(null)
                }}
                onSuccess={() => {
                    void fetchDashboardData()
                    setShowUserDialog(false)
                    setSelectedUser(null)
                }}
                user={selectedUser}
            />

            <AlertDialog open={!!userToDelete} onOpenChange={() => userToDelete && setUserToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete User</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
                            Delete
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Subscription QR Code</DialogTitle>
                        <DialogDescription>Scan this QR code.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4">
                        {qrUser && dashboardData?.sub_url && (
                            <>
                                <div className="rounded-lg border bg-white p-4">
                                    <QRCodeSVG value={buildSubUrl(dashboardData.sub_url, qrUser.sub_id)} size={200} level="M" />
                                </div>
                                <div className="w-full space-y-2">
                                    <div className="text-center text-sm text-muted-foreground">
                                        <p><strong>User:</strong> {qrUser.username}</p>
                                    </div>
                                    <div className="rounded-md bg-muted p-3 text-xs break-all font-mono">
                                        {buildSubUrl(dashboardData.sub_url, qrUser.sub_id)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function LoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
        </div>
    )
}

function UserRowDesktop({ user, isExpanded, subUrl, onToggle, onEdit, onDelete, onResetUsage, onShowQr, onToggleStatus }: any) {
    const trafficUsed = user.used_data
    const trafficPercent = (trafficUsed / user.data_limit) * 100
    const expiryInfo = formatExpiryWithDays(user.expiry_date_unix ?? 0)

    return (
        <>
            <TableRow>
                <TableCell>
                    <button type="button" onClick={onToggle} className="rounded p-1 hover:bg-muted">
                        <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
                    </button>
                </TableCell>
                <TableCell className="font-mono text-sm">{user.username}</TableCell>
                <TableCell>
                    <div className="space-y-1">
                        <div className="text-sm font-medium">
                            {bytesToGB(trafficUsed).toFixed(2)} / {bytesToGB(user.data_limit).toFixed(2)} GB
                        </div>
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full bg-primary transition-all', trafficPercent > 80 && 'bg-destructive')} style={{ width: `${Math.min(trafficPercent, 100)}%` }} />
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    {user.expiry_date_unix ? (
                        <div className="space-y-1">
                            <div className="text-sm">{formatDate(user.expiry_date_unix)}</div>
                            <div className={cn('text-xs', expiryInfo.isExpired ? 'text-destructive' : expiryInfo.daysLeft <= 7 ? 'text-yellow-500' : 'text-muted-foreground')}>
                                {expiryInfo.text}
                            </div>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">No expiry</span>
                    )}
                </TableCell>
                <TableCell>
                    {user.is_online ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Online</Badge>
                    ) : (
                        <Badge variant={user.status ? 'default' : 'destructive'}>{user.status ? 'Active' : 'Inactive'}</Badge>
                    )}
                </TableCell>
                <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="ghost" onClick={onToggleStatus} title={user.status ? 'Disable user' : 'Enable user'}>
                        <Power className={cn('h-4 w-4', user.status ? 'text-green-500' : 'text-gray-400')} />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </TableCell>
            </TableRow>

            {isExpanded && (
                <TableRow className="bg-muted/30">
                    <TableCell colSpan={6}>
                        <div className="space-y-3 py-4">
                            {subUrl && user.sub_id && (
                                <div className="rounded-md border bg-background p-3">
                                    <div className="mb-1 text-xs text-muted-foreground">Subscription Link:</div>
                                    <div className="break-all font-mono text-xs">{buildSubUrl(subUrl, user.sub_id)}</div>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={onToggleStatus}><Power className={cn('mr-2 h-4 w-4', user.status ? 'text-green-500' : 'text-gray-400')} />{user.status ? 'Disable' : 'Enable'}</Button>
                                <Button size="sm" variant="outline" onClick={onResetUsage}><RotateCcw className="mr-2 h-4 w-4" />Reset Usage</Button>
                                {subUrl && user.sub_id && (
                                    <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(buildSubUrl(subUrl, user.sub_id))}><Copy className="mr-2 h-4 w-4" />Copy Subscription</Button>
                                )}
                                {subUrl && user.sub_id && (
                                    <Button size="sm" variant="outline" onClick={() => onShowQr(user)}><QrCode className="mr-2 h-4 w-4" />QR Code</Button>
                                )}
                                <Button size="sm" variant="outline" onClick={onEdit}><Edit2 className="mr-2 h-4 w-4" />Edit</Button>
                                <Button size="sm" variant="destructive" onClick={onDelete}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

function UserCardMobile({ user, isExpanded, subUrl, onToggle, onEdit, onDelete, onResetUsage, onShowQr, onToggleStatus }: any) {
    const trafficUsed = user.used_data
    const trafficPercent = (trafficUsed / user.data_limit) * 100
    const expiryInfo = formatExpiryWithDays(user.expiry_date_unix ?? 0)

    return (
        <div className="overflow-hidden rounded-lg border">
            <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50">
                <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user.username}</span>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{bytesToGB(trafficUsed).toFixed(1)} / {bytesToGB(user.data_limit).toFixed(1)} GB</span>
                        <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
                            <div className={cn('h-full bg-primary transition-all', trafficPercent > 80 && 'bg-destructive')} style={{ width: `${Math.min(trafficPercent, 100)}%` }} />
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    {user.is_online ? (
                        <Badge className="bg-emerald-100 text-emerald-800">Online</Badge>
                    ) : (
                        <Badge variant={user.status ? 'default' : 'destructive'}>{user.status ? 'Active' : 'Inactive'}</Badge>
                    )}
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', isExpanded && 'rotate-180')} />
                </div>
            </button>

            {isExpanded && (
                <div className="space-y-3 border-t bg-muted/30 p-3">
                    {subUrl && user.sub_id && (
                        <div className="rounded-md border bg-background p-3">
                            <div className="mb-1 text-xs text-muted-foreground">Subscription Link:</div>
                            <div className="break-all font-mono text-xs">{buildSubUrl(subUrl, user.sub_id)}</div>
                        </div>
                    )}

                    <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Expiry Date</p>
                        {user.expiry_date_unix ? (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{formatDate(user.expiry_date_unix)}</span>
                                <span className={cn('text-xs', expiryInfo.isExpired ? 'text-destructive' : expiryInfo.daysLeft <= 7 ? 'text-yellow-500' : 'text-muted-foreground')}>
                                    ({expiryInfo.text})
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">No expiry</span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button size="sm" variant="outline" className="min-w-[80px] flex-1" onClick={e => { e.stopPropagation(); onToggleStatus() }}> <Power className={cn('mr-1 h-3 w-3', user.status ? 'text-green-500' : 'text-gray-400')} /> {user.status ? 'Disable' : 'Enable'} </Button>
                        <Button size="sm" variant="outline" className="min-w-[80px] flex-1" onClick={e => { e.stopPropagation(); onResetUsage() }}> <RotateCcw className="mr-1 h-3 w-3" /> Reset </Button>
                        {subUrl && user.sub_id && (<Button size="sm" variant="outline" className="min-w-[80px] flex-1" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(buildSubUrl(subUrl, user.sub_id)) }}> <Copy className="mr-1 h-3 w-3" /> Copy Sub </Button>)}
                        {subUrl && user.sub_id && (<Button size="sm" variant="outline" className="min-w-[80px] flex-1" onClick={e => { e.stopPropagation(); onShowQr(user) }}> <QrCode className="mr-1 h-3 w-3" /> QR </Button>)}
                        <Button size="sm" variant="outline" className="min-w-[80px] flex-1" onClick={e => { e.stopPropagation(); onEdit() }}> <Edit2 className="mr-1 h-3 w-3" /> Edit </Button>
                        <Button size="sm" variant="destructive" className="min-w-[80px] flex-1" onClick={e => { e.stopPropagation(); onDelete() }}> <Trash2 className="mr-1 h-3 w-3" /> Delete </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
