import { useEffect, useState } from 'react'
import {
    Zap,
    Users,
    HardDrive,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Plus,
    Edit2,
    Trash2,
    RotateCcw,
    UserX,
    ExternalLink,
    Server,
    Clock,
    Wifi,
    Copy,
    QrCode,
    Search,
    Power,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { dashboardAPI, userAPI } from '@/lib/api'
import { bytesToGB, formatTraffic } from '@/lib/traffic-converter'
import { formatDate, formatExpiryWithDays, cn } from '@/lib/utils'
import { getUserRole } from '@/lib/auth'
import { DashboardData, ClientsOutput } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { UserFormDialog } from './components/UserFormDialog'

    function buildSubUrl(subUrl?: string, subId?: string) {
        if (!subUrl || !subId) return ''

        if (subId.startsWith('http://') || subId.startsWith('https://')) {
            return subId
        }

        const cleanBase = subUrl.replace(/\/+$/, '')
        const cleanId = subId.replace(/^\/+/, '')

        return `${cleanBase}/${cleanId}`
    }


interface ExpandedRow {
    [key: string]: boolean
}

export function DashboardPage() {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedRows, setExpandedRows] = useState<ExpandedRow>({})
    const [selectedUser, setSelectedUser] = useState<ClientsOutput | null>(null)
    const [showUserDialog, setShowUserDialog] = useState(false)
    const [userToDelete, setUserToDelete] = useState<string | null>(null)
    const [showQrDialog, setShowQrDialog] = useState(false)
    const [qrUser, setQrUser] = useState<ClientsOutput | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState('')
    const usersPerPage = 5

    const userRole = getUserRole()

    useEffect(() => {
        fetchDashboardData()
    }, [])

    // Auto-refresh system info every 5 seconds for superadmin
    useEffect(() => {
        if (userRole !== 'superadmin') return

        const interval = setInterval(async () => {
            try {
                const systemInfo = await dashboardAPI.getSystemInfo()
                setDashboardData((prevData) =>
                    prevData ? { ...prevData, system: systemInfo } : null
                )
            } catch (err) {
                console.warn('Failed to refresh system info:', err)
            }
        }, 5000) // 5 seconds

        return () => clearInterval(interval)
    }, [userRole])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const data = await dashboardAPI.getDashboardData()

            // Fetch system info if user is superadmin
            if (userRole === 'superadmin') {
                try {
                    const systemInfo = await dashboardAPI.getSystemInfo()
                    data.system = systemInfo
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
            // userToDelete format: "uuid|username|id"
            const [uuid, username, id] = userToDelete.split('|')
            await userAPI.deleteUser(uuid, username, id)
            setUserToDelete(null)
            fetchDashboardData()
        } catch (err: any) {
            console.error('Failed to delete user:', err)
            alert(err?.message || 'Failed to delete user')
        }
    }

    const handleResetUsage = async (email: string) => {
        try {
            await userAPI.resetUserUsage(email)
            fetchDashboardData()
        } catch (err: any) {
            console.error('Failed to reset usage:', err)
            alert(err?.message || 'Failed to reset usage')
        }
    }

    const handleToggleStatus = async (user: ClientsOutput) => {
        try {
            // Toggle status and update user
            await userAPI.updateUser(
                user.uuid || '0',
                user.username,
                user.data_limit / (1024 ** 3), // Convert back to GB
                user.expiry_date_unix ? new Date(user.expiry_date_unix).toISOString().slice(0, 10) : null,
                user.sub_id || '',
                !user.status, // Toggle status
                user.flow || '',
                user.id?.toString()
            )
            fetchDashboardData()
        } catch (err: any) {
            console.error('Failed to toggle status:', err)
            alert(err?.message || 'Failed to toggle user status')
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
            {/* Page Title */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground">Welcome back!</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            {/* SuperAdmin Stats Row */}
            {userRole === 'superadmin' && dashboardData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Total Panels */}
                    {dashboardData.panels && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Panels</CardTitle>
                                <Server className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{dashboardData.panels.length}</div>
                                <p className="text-xs text-muted-foreground">Configured panels</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Total Active Admins */}
                    {dashboardData.admins && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Active Admins</CardTitle>
                                <Users className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dashboardData.admins.filter(a => a.is_active).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Active administrators</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Total Inactive Admins */}
                    {dashboardData.admins && (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Inactive Admins</CardTitle>
                                <UserX className="h-4 w-4 text-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-destructive">
                                    {dashboardData.admins.filter(a => !a.is_active).length}
                                </div>
                                <p className="text-xs text-muted-foreground">Inactive administrators</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* System Stats Row */}
            {dashboardData?.system && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                            <HardDrive className="h-4 w-4 text-indigo-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(dashboardData.system.used_memory / 1024 / 1024 / 1024).toFixed(2)} GB
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total: {(dashboardData.system.total_memory / 1024 / 1024 / 1024).toFixed(2)} GB
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                            <HardDrive className="h-4 w-4 text-pink-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(dashboardData.system.disk_used / 1024 / 1024 / 1024).toFixed(2)} GB
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Total: {(dashboardData.system.disk_total / 1024 / 1024 / 1024).toFixed(2)} GB
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                            <Zap className="h-4 w-4 text-orange-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{dashboardData.system.cpu_percent.toFixed(1)}%</div>
                            <p className="text-xs text-muted-foreground">Current usage</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Admin News - Only for admin role */}
            {userRole === 'admin' && dashboardData?.news && dashboardData.news.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            News & Updates
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {dashboardData.news.map((newsItem, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/20 transition-colors duration-150"
                                style={{ direction: /[\u0600-\u06FF]/.test(newsItem) ? 'rtl' : 'ltr' }}
                            >
                                <Zap className="h-4 w-4 text-yellow-500 mt-1 flex-shrink-0" />
                                <div className="text-sm text-muted-foreground break-words">{newsItem}</div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}



            {/* Admin Stats Row - Only for admin role */}
            {userRole === 'admin' && dashboardData && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Remaining Traffic */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Remaining Traffic</CardTitle>
                            <Zap className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData.remaining_traffic !== undefined
                                    ? `${bytesToGB(dashboardData.remaining_traffic).toFixed(2)} GB`
                                    : 'N/A'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {dashboardData.remaining_traffic !== undefined
                                    ? formatTraffic(dashboardData.remaining_traffic)
                                    : 'No data'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Expiry Date */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Expiry Date</CardTitle>
                            <Clock className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData.expiry_time
                                    ? formatDate(dashboardData.expiry_time)
                                    : 'No expiry'}
                            </div>
                            <p className="text-xs text-muted-foreground">Account expiration</p>
                        </CardContent>
                    </Card>

                    {/* Total Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData.users?.length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Registered users</p>
                        </CardContent>
                    </Card>

                    {/* Online Users */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
                            <Wifi className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-500">
                                {dashboardData.users?.filter(u => u.is_online).length || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">Currently connected</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Advertisement Card */}
            {dashboardData?.ads && dashboardData.ads.text && (
                <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800 relative">
                    <CardContent className="p-4 pt-8">
                        <a
                            href={dashboardData.ads.link || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <div className="flex flex-col gap-2" dir="rtl">
                                <div className="flex-1 min-w-0" dir="rtl">
                                    {dashboardData.ads.title && (
                                        <h3 className="font-bold text-yellow-900 dark:text-yellow-100 text-sm mb-1 group-hover:text-yellow-700 dark:group-hover:text-yellow-200 transition-colors" dir="rtl">
                                            {dashboardData.ads.title}
                                        </h3>
                                    )}
                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" dir="rtl">
                                        {dashboardData.ads.text}
                                    </p>
                                    {dashboardData.ads.button && (
                                        <div className="mt-3 flex justify-start">
                                            <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-sm font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105" dir="rtl">
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

            {/* Users Table */}
            {dashboardData?.users && (
                <Card>
                    <CardHeader className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <CardTitle>Your Users</CardTitle>
                            </div>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setSelectedUser(null)
                                    setShowUserDialog(true)
                                }}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add User
                            </Button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Search users by email or username..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value)
                                    setCurrentPage(1) // Reset to first page when searching
                                }}
                                className="pl-10"
                            />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {(() => {
                            // Filter users based on search query
                            const filteredUsers = dashboardData.users.filter(user =>
                                user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                (user.uuid && user.uuid.toLowerCase().includes(searchQuery.toLowerCase()))
                            )

                            if (filteredUsers.length === 0) {
                                return (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground">
                                            {searchQuery ? 'No users found matching your search' : 'No users yet'}
                                        </p>
                                    </div>
                                )
                            }

                            const reversedUsers = [...filteredUsers].reverse()
                            const paginatedUsers = reversedUsers.slice(
                                (currentPage - 1) * usersPerPage,
                                currentPage * usersPerPage
                            )

                            return (
                                <>
                                    {/* Mobile View - Cards */}
                                    <div className="md:hidden space-y-3">
                                        {paginatedUsers.map((user) => {
                                            const userKey = `${user.uuid || user.id}-${user.username}`
                                            return (
                                                <MobileUserCard
                                                    key={`mobile-${userKey}`}
                                                    user={user}
                                                    isExpanded={expandedRows[userKey] || false}
                                                    subUrl={dashboardData.sub_url}
                                                    onToggle={() => {
                                                        setExpandedRows(prev => ({
                                                            ...prev,
                                                            [userKey]: !prev[userKey],
                                                        }))
                                                    }}
                                                    onEdit={() => {
                                                        setSelectedUser(user)
                                                        setShowUserDialog(true)
                                                    }}
                                                    onDelete={() => setUserToDelete(`${user.uuid || '0'}|${user.username}|${user.id}`)}
                                                    onResetUsage={() => handleResetUsage(user.username)}
                                                    onShowQr={(user) => {
                                                        setQrUser(user)
                                                        setShowQrDialog(true)
                                                    }}
                                                    onToggleStatus={() => handleToggleStatus(user)}
                                                />
                                            )
                                        })}
                                    </div>

                                    {/* Desktop View - Table */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-12"></TableHead>
                                                    <TableHead>Email</TableHead>
                                                    <TableHead>Traffic</TableHead>
                                                    <TableHead>Expiry</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {paginatedUsers.map((user) => {
                                                    const userKey = `${user.uuid || user.id}-${user.username}`
                                                    return (
                                                        <DetailsRow
                                                            key={`desktop-${userKey}`}
                                                            user={user}
                                                            isExpanded={expandedRows[userKey] || false}
                                                            subUrl={dashboardData.sub_url}
                                                            onToggle={() => {
                                                                setExpandedRows(prev => ({
                                                                    ...prev,
                                                                    [userKey]: !prev[userKey],
                                                                }))
                                                            }}
                                                            onEdit={() => {
                                                                setSelectedUser(user)
                                                                setShowUserDialog(true)
                                                            }}
                                                            onDelete={() => setUserToDelete(`${user.uuid || '0'}|${user.username}|${user.id}`)}
                                                            onResetUsage={() => handleResetUsage(user.username)}
                                                            onShowQr={(user) => {
                                                                setQrUser(user)
                                                                setShowQrDialog(true)
                                                            }}
                                                            onToggleStatus={() => handleToggleStatus(user)}
                                                        />
                                                    )
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {/* Pagination */}
                                    {filteredUsers.length > usersPerPage && (
                                        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t mt-4 gap-3">
                                            <p className="text-sm text-muted-foreground text-center sm:text-left">
                                                Showing {((currentPage - 1) * usersPerPage) + 1} to {Math.min(currentPage * usersPerPage, filteredUsers.length)} of {filteredUsers.length}
                                                {searchQuery && dashboardData.users && ` (filtered from ${dashboardData.users.length} total)`}
                                            </p>
                                            <div className="flex items-center gap-1 sm:gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                    disabled={currentPage === 1}
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                    <span className="hidden sm:inline">Previous</span>
                                                </Button>
                                                <span className="text-sm text-muted-foreground px-1 sm:px-2">
                                                    {currentPage} / {Math.ceil(filteredUsers.length / usersPerPage)}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(filteredUsers.length / usersPerPage), p + 1))}
                                                    disabled={currentPage >= Math.ceil(filteredUsers.length / usersPerPage)}
                                                >
                                                    <span className="hidden sm:inline">Next</span>
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </CardContent>
                </Card>
            )}

            {/* User Form Dialog */}
            <UserFormDialog
                isOpen={showUserDialog}
                onClose={() => {
                    setShowUserDialog(false)
                    setSelectedUser(null)
                }}
                onSuccess={() => {
                    fetchDashboardData()
                    setShowUserDialog(false)
                    setSelectedUser(null)
                }}
                user={selectedUser}
            />

            {/* Delete Confirmation Dialog */}
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
                        <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* QR Code Dialog */}
            <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Subscription QR Code</DialogTitle>
                        <DialogDescription>
                            Scan this QR code.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center space-y-4">
                        {qrUser && dashboardData?.sub_url && (
                            <>
                                <div className="p-4 bg-white rounded-lg border">
                                    <QRCodeSVG
                                        value={buildSubUrl(dashboardData.sub_url, qrUser.sub_id)}
                                        size={200}
                                        level="M"
                                    />
                                </div>
                                <div className="w-full space-y-2">
                                    <div className="text-sm text-muted-foreground text-center">
                                        <p><strong>User:</strong> {qrUser?.username}</p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-md break-all text-xs font-mono">
                                        {buildSubUrl(dashboardData.sub_url, qrUser.sub_id)}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    )
}

interface DetailsRowProps {
    user: ClientsOutput
    isExpanded: boolean
    subUrl?: string
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
    onResetUsage: () => void
    onShowQr: (user: ClientsOutput) => void
    onToggleStatus: () => void
}

function DetailsRow({
    user,
    isExpanded,
    subUrl,
    onToggle,
    onEdit,
    onDelete,
    onResetUsage,
    onShowQr,
    onToggleStatus,
}: DetailsRowProps) {
    const trafficUsed = user.used_data
    const trafficPercent = (trafficUsed / user.data_limit) * 100

    return (
        <>
            <TableRow>
                <TableCell>
                    <button
                        onClick={onToggle}
                        className="p-1 hover:bg-muted rounded"
                    >
                        <ChevronDown
                            className={cn(
                                'h-4 w-4 transition-transform',
                                isExpanded && 'transform rotate-180'
                            )}
                        />
                    </button>
                </TableCell>
                <TableCell className="font-mono text-sm">{user.username}</TableCell>
                <TableCell>
                    <div className="space-y-1">
                        <div className="text-sm font-medium">
                            {bytesToGB(trafficUsed).toFixed(2)} / {bytesToGB(user.data_limit).toFixed(2)} GB
                        </div>
                        <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full bg-primary transition-all',
                                    trafficPercent > 80 && 'bg-destructive',
                                    trafficPercent > 90 && 'bg-destructive'
                                )}
                                style={{ width: `${Math.min(trafficPercent, 100)}%` }}
                            />
                        </div>
                    </div>
                </TableCell>
                <TableCell>
                    {user.expiry_date_unix ? (
                        <div className="space-y-1">
                            <div className="text-sm">{formatDate(user.expiry_date_unix)}</div>
                            <div className={cn(
                                'text-xs',
                                formatExpiryWithDays(user.expiry_date_unix).isExpired
                                    ? 'text-destructive'
                                    : formatExpiryWithDays(user.expiry_date_unix).daysLeft <= 7
                                        ? 'text-yellow-500'
                                        : 'text-muted-foreground'
                            )}>
                                {formatExpiryWithDays(user.expiry_date_unix).text}
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
                        <Badge variant={user.status ? 'default' : 'destructive'}>
                            {user.status ? 'Active' : 'Inactive'}
                        </Badge>
                    )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onToggleStatus}
                        title={user.status ? 'Disable user' : 'Enable user'}
                    >
                        <Power className={cn("h-4 w-4", user.status ? "text-green-500" : "text-gray-400")} />
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
                        <div className="py-4 space-y-3">
                            {subUrl && user.sub_id && (
                                <div className="p-3 bg-background rounded-md border">
                                    <div className="text-xs text-muted-foreground mb-1">Subscription Link:</div>
                                    {buildSubUrl(subUrl, user.sub_id)}
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2 pt-2">
                                <Button size="sm" variant="outline" onClick={onToggleStatus}>
                                    <Power className={cn("h-4 w-4 mr-2", user.status ? "text-green-500" : "text-gray-400")} />
                                    {user.status ? 'Disable' : 'Enable'}
                                </Button>
                                <Button size="sm" variant="outline" onClick={onResetUsage}>
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                    Reset Usage
                                </Button>
                                {subUrl && user.sub_id && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            navigator.clipboard.writeText(buildSubUrl(subUrl, user.sub_id))

                                        }}
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy Subscription
                                    </Button>
                                )}
                                {subUrl && user.sub_id && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onShowQr(user)}
                                    >
                                        <QrCode className="h-4 w-4 mr-2" />
                                        QR Code
                                    </Button>
                                )}
                                <Button size="sm" variant="outline" onClick={onEdit}>
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={onDelete}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

// Mobile User Card Component
interface MobileUserCardProps {
    user: ClientsOutput
    isExpanded: boolean
    subUrl?: string
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
    onResetUsage: () => void
    onShowQr: (user: ClientsOutput) => void
    onToggleStatus: () => void
}

function MobileUserCard({
    user,
    isExpanded,
    subUrl,
    onToggle,
    onEdit,
    onDelete,
    onResetUsage,
    onShowQr,
    onToggleStatus,
}: MobileUserCardProps) {
    const trafficUsed = user.used_data
    const trafficPercent = (trafficUsed / user.data_limit) * 100

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Compact View - Always visible */}
            <button
                onClick={onToggle}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
                {/* Left: Name & Traffic */}
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{user.username}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                            {bytesToGB(trafficUsed).toFixed(1)} / {bytesToGB(user.data_limit).toFixed(1)} GB
                        </span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full bg-primary transition-all',
                                    trafficPercent > 80 && 'bg-destructive'
                                )}
                                style={{ width: `${Math.min(trafficPercent, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Status & Chevron */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    {user.is_online ? (
                        <Badge className="text-xs bg-emerald-100 text-emerald-800">Online</Badge>
                    ) : (
                        <Badge variant={user.status ? 'default' : 'destructive'} className="text-xs">
                            {user.status ? 'Active' : 'Inactive'}
                        </Badge>
                    )}
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 text-muted-foreground transition-transform',
                            isExpanded && 'transform rotate-180'
                        )}
                    />
                </div>
            </button>

            {/* Expanded View */}
            {isExpanded && (
                <div className="border-t p-3 space-y-3 bg-muted/30">
                    {/* Subscription Link */}
                    {subUrl && user.sub_id && (
                        <div className="p-3 bg-background rounded-md border">
                            <div className="text-xs text-muted-foreground mb-1">Subscription Link:</div>
                            {buildSubUrl(subUrl, user.sub_id)}
                        </div>
                    )}

                    {/* Expiry */}
                    <div className="text-sm">
                        <p className="text-xs text-muted-foreground">Expiry Date</p>
                        {user.expiry_date_unix ? (
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{formatDate(user.expiry_date_unix)}</span>
                                <span className={cn(
                                    'text-xs',
                                    formatExpiryWithDays(user.expiry_date_unix).isExpired
                                        ? 'text-destructive'
                                        : formatExpiryWithDays(user.expiry_date_unix).daysLeft <= 7
                                            ? 'text-yellow-500'
                                            : 'text-muted-foreground'
                                )}>
                                    ({formatExpiryWithDays(user.expiry_date_unix).text})
                                </span>
                            </div>
                        ) : (
                            <span className="text-muted-foreground">No expiry</span>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleStatus()
                            }}
                        >
                            <Power className={cn("h-3 w-3 mr-1", user.status ? "text-green-500" : "text-gray-400")} />
                            {user.status ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                                e.stopPropagation()
                                onResetUsage()
                            }}
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                        {subUrl && user.sub_id && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 min-w-[80px]"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    navigator.clipboard.writeText(buildSubUrl(subUrl, user.sub_id))

                                }}
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                Copy Sub
                            </Button>
                        )}
                        {subUrl && user.sub_id && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 min-w-[80px]"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onShowQr(user)
                                }}
                            >
                                <QrCode className="h-3 w-3 mr-1" />
                                QR
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                                e.stopPropagation()
                                onEdit()
                            }}
                        >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 min-w-[80px]"
                            onClick={(e) => {
                                e.stopPropagation()
                                onDelete()
                            }}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
