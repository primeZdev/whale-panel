import { useEffect, useState } from 'react'
import {
    Plus,
    Edit2,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react'
import { panelAPI, dashboardAPI } from '@/lib/api'
import { cn } from '@/lib/utils'
import { PanelOutput } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { PanelFormDialog } from './components/PanelFormDialog'

interface ExpandedRow {
    [key: string]: boolean
}

export function PanelsPage() {
    const [panels, setPanels] = useState<PanelOutput[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [expandedRows, setExpandedRows] = useState<ExpandedRow>({})
    const [selectedPanel, setSelectedPanel] = useState<PanelOutput | null>(null)
    const [showPanelDialog, setShowPanelDialog] = useState(false)
    const [panelToDelete, setPanelToDelete] = useState<number | null>(null)

    useEffect(() => {
        fetchPanels()
    }, [])

    const fetchPanels = async () => {
        try {
            setLoading(true)
            const data = await dashboardAPI.getPanels()
            setPanels(data)
            setError(null)
        } catch (err: any) {
            console.error('Failed to fetch panels:', err)
            setError(err?.message || 'Failed to fetch panels')
        } finally {
            setLoading(false)
        }
    }

    const handleDeletePanel = async () => {
        if (!panelToDelete) return

        try {
            await panelAPI.deletePanel(panelToDelete)
            setPanelToDelete(null)
            fetchPanels()
        } catch (err: any) {
            console.error('Failed to delete panel:', err)
            alert(err?.message || 'Failed to delete panel')
        }
    }

    const handleToggleStatus = async (panelId: number) => {
        try {
            await panelAPI.togglePanelStatus(panelId)
            fetchPanels()
        } catch (err: any) {
            console.error('Failed to toggle panel status:', err)
            alert(err?.message || 'Failed to toggle panel status')
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
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Panels Management</h1>
                <p className="text-muted-foreground">Manage your proxy panels</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                    {error}
                </div>
            )}

            {/* Panels Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Panels</CardTitle>
                        <CardDescription>
                            {panels.length} panel{panels.length !== 1 ? 's' : ''} total
                        </CardDescription>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => {
                            setSelectedPanel(null)
                            setShowPanelDialog(true)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Panel
                    </Button>
                </CardHeader>

                <CardContent>
                    {panels.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground">No panels configured yet</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile View - Cards */}
                            <div className="md:hidden space-y-3">
                                {panels.map((panel) => (
                                    <MobilePanelCard
                                        key={panel.id}
                                        panel={panel}
                                        isExpanded={expandedRows[panel.id.toString()] || false}
                                        onToggle={() => {
                                            setExpandedRows(prev => ({
                                                ...prev,
                                                [panel.id.toString()]: !prev[panel.id.toString()],
                                            }))
                                        }}
                                        onEdit={() => {
                                            setSelectedPanel(panel)
                                            setShowPanelDialog(true)
                                        }}
                                        onDelete={() => setPanelToDelete(panel.id)}
                                        onToggleStatus={() => handleToggleStatus(panel.id)}
                                    />
                                ))}
                            </div>

                            {/* Desktop View - Table */}
                            <div className="hidden md:block overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-12"></TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {panels.map((panel) => (
                                            <PanelDetailsRow
                                                key={panel.id}
                                                panel={panel}
                                                onEdit={() => {
                                                    setSelectedPanel(panel)
                                                    setShowPanelDialog(true)
                                                }}
                                                onDelete={() => setPanelToDelete(panel.id)}
                                                onToggleStatus={() => handleToggleStatus(panel.id)}
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Panel Form Dialog */}
            <PanelFormDialog
                isOpen={showPanelDialog}
                onClose={() => {
                    setShowPanelDialog(false)
                    setSelectedPanel(null)
                }}
                onSuccess={() => {
                    fetchPanels()
                    setShowPanelDialog(false)
                    setSelectedPanel(null)
                }}
                panel={selectedPanel}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!panelToDelete} onOpenChange={() => panelToDelete && setPanelToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Panel</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this panel? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePanel} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

interface PanelDetailsRowProps {
    panel: PanelOutput
    isExpanded: boolean
    onToggle: () => void
    onEdit: () => void
    onDelete: () => void
    onToggleStatus: () => void
}

function PanelDetailsRow({
    panel,
    onEdit,
    onDelete,
    onToggleStatus,
}: Omit<PanelDetailsRowProps, 'isExpanded' | 'onToggle'>) {
    return (
        <>
            <TableRow>
                <TableCell className="w-0"></TableCell>
                <TableCell className="font-semibold text-foreground">{panel.name}</TableCell>
                <TableCell>
                    <span className="inline-flex rounded-full border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                        {panel.panel_type}
                    </span>
                </TableCell>
                <TableCell>
                    <span className={cn(
                        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold',
                        panel.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30'
                    )}>
                        {panel.is_active ? 'Active' : 'Inactive'}
                    </span>
                </TableCell>
                <TableCell className="space-x-2 text-right">
                    <Button size="sm" variant="ghost" onClick={onToggleStatus}>
                        {panel.is_active ? (
                            <ToggleRight className="h-4 w-4 text-emerald-400" />
                        ) : (
                            <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onEdit}>
                        <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={onDelete}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                </TableCell>
            </TableRow>
        </>
    )
}

// Mobile Panel Card Component
function MobilePanelCard({
    panel,
    isExpanded,
    onToggle,
    onEdit,
    onDelete,
    onToggleStatus,
}: PanelDetailsRowProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm">
            <button
                onClick={onToggle}
                className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/40"
            >
                <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{panel.name}</span>
                    <div className="mt-1 flex items-center gap-2">
                        <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {panel.panel_type}
                        </span>
                    </div>
                </div>

                <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={cn(
                        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        panel.is_active
                            ? 'bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30'
                            : 'bg-red-500/10 text-red-400 ring-1 ring-red-500/30'
                    )}>
                        {panel.is_active ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </button>

            {isExpanded && (
                <div className="space-y-3 border-t border-border/80 bg-muted/20 p-3">
                    <div className="rounded-xl border border-border bg-card p-3 text-sm">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Panel</p>
                        <p className="mt-1 font-medium text-foreground">{panel.name}</p>
                        <p className="mt-1 text-muted-foreground">{panel.panel_type}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[70px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleStatus();
                            }}
                        >
                            {panel.is_active ? (
                                <ToggleRight className="mr-1 h-3 w-3 text-emerald-400" />
                            ) : (
                                <ToggleLeft className="mr-1 h-3 w-3" />
                            )}
                            {panel.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 min-w-[70px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit();
                            }}
                        >
                            <Edit2 className="mr-1 h-3 w-3" />
                            Edit
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 min-w-[70px]"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                        >
                            <Trash2 className="mr-1 h-3 w-3" />
                            Delete
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
