import { useEffect, useState } from 'react'
import {
    ChevronDown,
    Plus,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react'
import { adminAPI, dashboardAPI } from '@/lib/api'
import { bytesToGB } from '@/lib/traffic-converter'
import { formatDate, cn, calculateRemainingDays } from '@/lib/utils'
import { AdminOutput } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { AdminFormDialog } from './components/AdminFormDialog'

interface ExpandedRow {
    [key: string]: boolean
}

export function AdminsPage() {
    const [admins, setAdmins] = useState<AdminOutput[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedRows, setExpandedRows] = useState<ExpandedRow>({})
    const [selectedAdmin, setSelectedAdmin] = useState<AdminOutput | null>(null)
    const [showAdminDialog, setShowAdminDialog] = useState(false)
    const [adminToDelete, setAdminToDelete] = useState<number | null>(null)

    useEffect(() => {
        fetchAdmins()
    }, [])

    const fetchAdmins = async () => {
        try {
            setLoading(true)
            const data = await dashboardAPI.getAdmins()
            setAdmins(data)
            setError(null)
        } catch (err: any) {
            console.error('Failed to fetch admins:', err)
            setError(err?.message || 'Failed to fetch admins')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteAdmin = async () => {
        if (!adminToDelete) return

        try {
            await adminAPI.deleteAdmin(adminToDelete)
            setAdminToDelete(null)
            fetchAdmins()
        } catch (err: any) {
            console.error('Failed to delete admin:', err)
            alert(err?.message || 'Failed to delete admin')
        }
    }

    const handleToggleStatus = async (adminId: number) => {
        try {
            await adminAPI.toggleAdminStatus(adminId)
            fetchAdmins()
        } catch (err: any) {
            console.error('Failed to toggle admin status:', err)
            alert(err?.message || 'Failed to toggle admin status')
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Admins Management</h1>
                <p className="text-muted-foreground">Manage admin accounts for panels</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Admins Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Admins</CardTitle>
                        <CardDescription>
                            {admins.length} admin{admins.length !== 1 ? 's' : ''} total
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => {
                            setSelectedAdmin(null)
                            setShowAdminDialog(true)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Admin
                    </Button>
                </CardHeader>

                <CardContent>
                    {admins.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No admins yet</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View - Cards */}
                            <div className="md:hidden space-y-3">
                                {admins.map((admin) => (
                                    <MobileAdminCard
                                        key={admin.id}
                                        admin={admin}
                                        isExpanded={expandedRows[admin.id.toString()] || false}
                                        onToggle={() => {
                                            setExpandedRows(prev => ({
                                                ...prev,
                                                [admin.id.toString()]: !prev[admin.id.toString()],
                                            }))
                                        }}
                                        onEdit={() => {
                                            setSelectedAdmin(admin)
                                            setShowAdminDialog(true)
                                        }}
                                        onDelete={() => setAdminToDelete(admin.id)}
                                        onToggleStatus={() => handleToggleStatus(admin.id)}
                                    />
                                ))}
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Username</TableHead>
                                            <TableHead>Panel</TableHead>
                                            <TableHead>Traffic</TableHead>
                                            <TableHead>Expiry</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {admins.map((admin) => (
                                            <AdminDetailsRow
                                                key={admin.id}
                                                admin={admin}
                                                isExpanded={expandedRows[admin.id.toString()] || false}
                                                onToggle={() => {
                                                    setExpandedRows(prev => ({
                                                        ...prev,
                                                        [admin.id.toString()]: !prev[admin.id.toString()],
                                                    }))
                                                }}
                                                onEdit={() => {
                                                    setSelectedAdmin(admin)
                                                    setShowAdminDialog(true)
                                                }}
                                                onDelete={() => setAdminToDelete(admin.id)}
                                                onToggleStatus={() => handleToggleStatus(admin.id)}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Admin Form Dialog */}
            <AdminFormDialog
                isOpen={showAdminDialog}
                onClose={() => {
                    setShowAdminDialog(false)
                    setSelectedAdmin(null)
                }}
                onSuccess={() => {
                    fetchAdmins()
                    setShowAdminDialog(false)
                    setSelectedAdmin(null)
                }}
                admin={selectedAdmin}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!adminToDelete} onOpenChange={() => adminToDelete && setAdminToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Admin</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this admin account? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAdmin} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface AdminDetailsRowProps {
    admin: AdminOutput
    isExpanded: boolean
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
    onToggleStatus: () => void
}

function AdminDetailsRow({
    admin,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onToggleStatus,
}: AdminDetailsRowProps) {
    const remainingDays = calculateRemainingDays(admin.expiry_date)

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
                <TableCell className="font-mono text-sm font-semibold">{admin.username}</TableCell>
                <TableCell className="text-sm">{admin.panel}</TableCell>
                <TableCell>
                    <div className="text-sm font-medium">
                        {admin.initial_traffic !== undefined
                            ? `${bytesToGB(admin.traffic).toFixed(2)} / ${bytesToGB(admin.initial_traffic).toFixed(2)} GB`
                            : `${bytesToGB(admin.traffic).toFixed(2)} GB`}
                    </div>
                </TableCell>
                <TableCell>
                    {admin.expiry_date ? (
                        <div className="text-sm">
                            {formatDate(admin.expiry_date)}
                            {remainingDays !== null && (
                                <Badge className="ml-2" variant={remainingDays < 30 ? 'destructive' : 'default'}>
                                    {remainingDays} days
                                </Badge>
                            )}
                        </div>
                    ) : (
                        'No expiry'
                    )}
                </TableCell>
                <TableCell>
                    <Badge variant={admin.is_active ? 'default' : 'destructive'}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="ghost" onClick={onToggleStatus}>
                        {admin.is_active ? (
                            <ToggleRight className="h-4 w-4 text-green-600" />
                        ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
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
                    <TableCell colSpan={7}>
                        <div className="py-4 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Inbound ID</p>
                                    <p className="font-mono font-semibold">{admin.inbound_id || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Update Return Traffic</p>
                                    <p className="font-mono font-semibold">{admin.update_return_traffic ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Delete Return Traffic</p>
                                    <p className="font-mono font-semibold">{admin.delete_return_traffic ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

// Mobile Admin Card Component
function MobileAdminCard({
    admin,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onToggleStatus,
}: AdminDetailsRowProps) {
    const remainingDays = calculateRemainingDays(admin.expiry_date)

    return (
        <div className="border rounded-lg overflow-hidden">
            {/* Compact View */}
            <button
                onClick={onToggle}
                className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
            >
                <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm truncate block">{admin.username}</span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">{admin.panel}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                            {admin.initial_traffic !== undefined
                                ? `${bytesToGB(admin.traffic).toFixed(1)} / ${bytesToGB(admin.initial_traffic).toFixed(1)} GB`
                                : `${bytesToGB(admin.traffic).toFixed(1)} GB`}
                        </span>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={admin.is_active ? 'default' : 'destructive'} className="text-xs">
                        {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
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
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Traffic</p>
                            <p className="font-mono font-medium">
                                {admin.initial_traffic !== undefined
                                    ? `${bytesToGB(admin.traffic).toFixed(2)} / ${bytesToGB(admin.initial_traffic).toFixed(2)} GB`
                                    : `${bytesToGB(admin.traffic).toFixed(2)} GB`}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Expiry</p>
                            {admin.expiry_date ? (
                                <div>
                                    <p className="font-medium">{formatDate(admin.expiry_date)}</p>
                                    {remainingDays !== null && (
                                        <span className={cn(
                                            'text-xs',
                                            remainingDays < 30 ? 'text-destructive' : 'text-muted-foreground'
                                        )}>
                                            {remainingDays} days left
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-muted-foreground">No expiry</span>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Inbound ID</p>
                            <p className="font-mono font-medium">{admin.inbound_id || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Update Return Traffic</p>
                            <p className="font-medium">{admin.update_return_traffic ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Delete Return Traffic</p>
                            <p className="font-medium">{admin.delete_return_traffic ? 'Yes' : 'No'}</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[70px]"
                            onClick={(e) => {
                                e.stopPropagation()
                                onToggleStatus()
                            }}
                        >
                            {admin.is_active ? (
                                <ToggleRight className="h-3 w-3 mr-1 text-green-600" />
                            ) : (
                                <ToggleLeft className="h-3 w-3 mr-1" />
                            )}
                            {admin.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[70px]"
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
                            className="flex-1 min-w-[70px]"
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
