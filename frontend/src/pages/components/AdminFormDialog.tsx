import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { adminSchema, AdminFormData, AdminOutput } from '@/types'
import { adminAPI, dashboardAPI } from '@/lib/api'
import { bytesToGB } from '@/lib/traffic-converter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Loader2 } from 'lucide-react'

interface AdminFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    admin?: AdminOutput | null
}

export function AdminFormDialog({
    isOpen,
    onClose,
    onSuccess,
    admin,
}: AdminFormDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null)
    const [panels, setPanels] = useState<{ name: string; panel_type: string }[]>([])
    const [loadingPanels, setLoadingPanels] = useState(false)
    const [marzbanInbounds, setMarzbanInbounds] = useState<Record<string, string[]> | null>(null)
    const [loadingInbounds, setLoadingInbounds] = useState(false)
    const [selectedInbounds, setSelectedInbounds] = useState<Record<string, string[]>>({})

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<AdminFormData>({
        resolver: zodResolver(adminSchema),
        defaultValues: {
            username: '',
            password: '',
            panel: '',
            inbound_id: "",
            marzban_inbounds: null,
            flow: null,
            traffic: 0,
            update_return_traffic: false,
            delete_return_traffic: false,
            is_active: true,
            expiry_date: null,
        },
    })

    useEffect(() => {
        if (isOpen) {
            loadPanels()
        }
    }, [isOpen])

    useEffect(() => {
        if (admin) {
            setValue('username', admin.username)
            setValue('password', '') // Don't pre-fill password
            setValue('panel', admin.panel)
            setValue('inbound_id', admin.inbound_id || '')
            setValue('marzban_inbounds', admin.marzban_inbounds)
            setValue('flow', (admin as any).flow ?? null)
            setValue('traffic', bytesToGB(admin.traffic))
            setValue('update_return_traffic', admin.update_return_traffic)
            setValue('delete_return_traffic', admin.delete_return_traffic)
            setValue('is_active', admin.is_active)
            // If admin has an expiry_date (YYYY-MM-DD), convert to remaining days for the input
            if (admin.expiry_date) {
                try {
                    const exp = new Date(admin.expiry_date + 'T00:00:00')
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const diffMs = exp.getTime() - today.getTime()
                    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                    setValue('expiry_date', diffDays > 0 ? diffDays : 0)
                } catch (e) {
                    setValue('expiry_date', admin.expiry_date)
                }
            } else {
                setValue('expiry_date', null)
            }

            // Parse marzban_inbounds if available
            if (admin.marzban_inbounds) {
                try {
                    setSelectedInbounds(JSON.parse(admin.marzban_inbounds))
                } catch (e) {
                    console.error('Failed to parse marzban_inbounds:', e)
                }
            }
        } else {
            reset()
            setSelectedInbounds({})
            setMarzbanInbounds(null)
        }
    }, [admin, isOpen, setValue, reset])

    const loadPanels = async () => {
        try {
            setLoadingPanels(true)
            const fetchedPanels = await dashboardAPI.getPanels()
            setPanels(fetchedPanels.map((p) => ({ name: p.name, panel_type: p.panel_type })))
        } catch (err) {
            console.error('Failed to load panels:', err)
        } finally {
            setLoadingPanels(false)
        }
    }

    const loadMarzbanInbounds = async (panelName: string) => {
        try {
            setLoadingInbounds(true)
            const inbounds = await adminAPI.getPanelInbounds(panelName)
            setMarzbanInbounds(inbounds)
        } catch (err) {
            console.error('Failed to load inbounds:', err)
            setMarzbanInbounds(null)
        } finally {
            setLoadingInbounds(false)
        }
    }

    const handlePanelChange = (panelName: string) => {
        const selectedPanel = panels.find(p => p.name === panelName)
        const panelType = selectedPanel?.panel_type
        
        setValue('panel', panelName)

        // Reset inbound selections
        setSelectedInbounds({})
        setMarzbanInbounds(null)

        // Handle guard panel special case
        if (panelType === 'guard') {
            // Set inbound_id to "1,2,3" automatically
            setValue('inbound_id', '1,2,3')
            // Set flow to null (empty)
            setValue('flow', null)
        } else if (panelType === 'marzban') {
            // Load inbounds for marzban
            loadMarzbanInbounds(panelName)
            // Reset inbound_id and flow for marzban
            setValue('inbound_id', '')
            setValue('flow', null)
        } else if (panelType === '3x-ui' || panelType === 'tx-ui') {
            // For 3x-ui and tx-ui, keep fields empty for user to fill
            setValue('inbound_id', '')
            setValue('flow', null)
        } else {
            // For other panel types
            setValue('inbound_id', '')
            setValue('flow', null)
        }
    }

    const toggleInbound = (protocol: string, tag: string) => {
        setSelectedInbounds(prev => {
            const updated = { ...prev }
            if (!updated[protocol]) {
                updated[protocol] = []
            }

            if (updated[protocol].includes(tag)) {
                updated[protocol] = updated[protocol].filter(t => t !== tag)
                if (updated[protocol].length === 0) {
                    delete updated[protocol]
                }
            } else {
                updated[protocol] = [...updated[protocol], tag]
            }

            return updated
        })
    }

    const onSubmit = async (data: AdminFormData) => {
        setServerError(null)

        try {
            // Get selected panel type
            const selectedPanel = panels.find(p => p.name === data.panel)

            // Convert expiry days (number) to date string YYYY-MM-DD for backend
            let expiryForSubmit: string | null = null
            if (data.expiry_date === null || data.expiry_date === undefined || data.expiry_date === '') {
                expiryForSubmit = null
            } else if (typeof data.expiry_date === 'number') {
                const d = new Date()
                d.setHours(0, 0, 0, 0)
                d.setDate(d.getDate() + Math.max(0, Math.floor(data.expiry_date)))
                expiryForSubmit = d.toISOString().slice(0, 10)
            } else {
                expiryForSubmit = String(data.expiry_date)
            }

            const passwordToSend = data.password?.trim() ? data.password : undefined

            const submitData: any = {
                ...data,
                expiry_date: expiryForSubmit,
                marzban_inbounds: Object.keys(selectedInbounds).length > 0
                    ? JSON.stringify(selectedInbounds)
                    : null,
                marzban_password: selectedPanel?.panel_type === 'marzban' ? passwordToSend : null,
            }

            if (!passwordToSend) {
                delete submitData.password
                delete submitData.marzban_password
            }

            if (admin?.id) {
                // Update
                await adminAPI.updateAdmin(admin.id, submitData)
            } else {
                // Create
                await adminAPI.createAdmin(submitData)
            }

            onSuccess()
        } catch (error: any) {
            console.error('Form submission error:', error)
            setServerError(error?.message || 'Operation failed')
        }
    }

    const panelRequiresInboundFields = (panelType: string | undefined) => {
        // Only show inbound fields for 3x-ui and tx-ui, hide for guard
        return ['3x-ui', 'tx-ui'].includes(panelType || '')
    }

    // Get current panel type
    const currentPanelType = panels.find(p => p.name === watch('panel'))?.panel_type
    const shouldShowInboundFields = watch('panel') && panelRequiresInboundFields(currentPanelType)

    // Ensure expiry input can be cleared to `null` (No Expiry)
    const expiryRegister = register('expiry_date', {
        setValueAs: (v: any) => {
            if (v === '' || v === undefined || v === null) return null
            const n = Number(v)
            return Number.isNaN(n) ? null : Math.floor(n)
        },
    })

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{admin ? 'Edit Admin' : 'Create New Admin'}</DialogTitle>
                    <DialogDescription>
                        {admin ? 'Update admin information' : 'Add a new admin account'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {serverError && (
                        <div className="flex items-gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>{serverError}</p>
                        </div>
                    )}

                    {/* Username */}
                    <div className="space-y-2">
                        <Label htmlFor="username">Username *</Label>
                        <Input
                            id="username"
                            placeholder="admin_name"
                            disabled={isSubmitting || !!admin}
                            {...register('username')}
                        />
                        {errors.username && (
                            <p className="text-sm text-destructive">{errors.username.message}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Password {admin ? '(optional)' : '*'}</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder={admin ? 'Leave empty to keep current' : 'Enter password'}
                            disabled={isSubmitting}
                            {...register('password', {
                                required: admin ? false : 'Password is required',
                            })}
                        />
                        {errors.password && (
                            <p className="text-sm text-destructive">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Panel Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="panel">Panel *</Label>
                        <Select
                            value={watch('panel')}
                            onValueChange={handlePanelChange}
                            disabled={isSubmitting || loadingPanels}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select a panel" />
                            </SelectTrigger>
                            <SelectContent>
                                {panels.map((panel) => (
                                    <SelectItem key={panel.name} value={panel.name}>
                                        {panel.name} ({panel.panel_type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.panel && (
                            <p className="text-sm text-destructive">{errors.panel.message}</p>
                        )}
                    </div>

                    {/* Marzban Inbounds Selection */}
                    {currentPanelType === 'marzban' && (
                        <div className="space-y-2">
                            <Label>Marzban Inbounds *</Label>
                            {loadingInbounds ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading inbounds...
                                </div>
                            ) : marzbanInbounds ? (
                                <div className="space-y-3 p-3 border rounded-md">
                                    {Object.entries(marzbanInbounds).map(([protocol, tags]) => (
                                        <div key={protocol} className="space-y-2">
                                            <div className="font-medium text-sm capitalize">{protocol}</div>
                                            <div className="space-y-1 pl-4">
                                                {tags.map((tag) => (
                                                    <label key={tag} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedInbounds[protocol]?.includes(tag) || false}
                                                            onChange={() => toggleInbound(protocol, tag)}
                                                            disabled={isSubmitting}
                                                            className="rounded border border-input"
                                                        />
                                                        <span className="text-sm">{tag}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground">
                                    No inbounds available or failed to load
                                </div>
                            )}
                        </div>
                    )}

                    {/* Inbound ID - Only for 3x-ui and tx-ui panels (not for guard) */}
                    {shouldShowInboundFields && (
                        <div className="space-y-2">
                            <Label htmlFor="inbound_id">Inbound ID *</Label>
                            <Input
                                id="inbound_id"
                                type="text"
                                placeholder="Enter inbound ID"
                                disabled={isSubmitting}
                                {...register('inbound_id')}
                            />
                            {errors.inbound_id && (
                                <p className="text-sm text-destructive">
                                    {errors.inbound_id.message}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Flow - Only for 3x-ui and tx-ui panels (not for guard) */}
                    {shouldShowInboundFields && (
                        <div className="space-y-2">
                            <Label htmlFor="flow">Flow *</Label>
                            <Select
                                value={watch('flow') ?? 'none'}
                                onValueChange={(val) => setValue('flow', val === 'none' ? null : val)}
                                disabled={isSubmitting}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select flow" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    <SelectItem value="xtls-rprx-vision">xtls-rprx-vision</SelectItem>
                                    <SelectItem value="xtls-rprx-vision-udp443">xtls-rprx-vision-udp443</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.flow && (
                                <p className="text-sm text-destructive">{errors.flow.message}</p>
                            )}
                        </div>
                    )}

                    {/* Traffic */}
                    <div className="space-y-2">
                        <Label htmlFor="traffic">Traffic (GB)</Label>
                        <Input
                            id="traffic"
                            type="number"
                            step="0.1"
                            min="0"
                            placeholder="0"
                            disabled={isSubmitting}
                            {...register('traffic', { valueAsNumber: true })}
                        />
                        {errors.traffic && (
                            <p className="text-sm text-destructive">{errors.traffic.message}</p>
                        )}
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <Label htmlFor="expiry_date">Expiry (days)</Label>
                        <Input
                            id="expiry_date"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="Enter number of days (e.g. 10)"
                            disabled={isSubmitting}
                            {...expiryRegister}
                            onChange={(e) => {
                                // Preserve react-hook-form's onChange
                                try {
                                    expiryRegister.onChange && expiryRegister.onChange(e)
                                } catch (err) {
                                    // ignore
                                }
                                // If user clears the input, explicitly set null
                                if ((e.target as HTMLInputElement).value === '') {
                                    setValue('expiry_date', null)
                                }
                            }}
                        />
                        {errors.expiry_date && (
                            <p className="text-sm text-destructive">{errors.expiry_date.message}</p>
                        )}
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                disabled={isSubmitting}
                                {...register('update_return_traffic')}
                                className="rounded border border-input"
                            />
                            <span className="text-sm">Update Return Traffic</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                disabled={isSubmitting}
                                {...register('delete_return_traffic')}
                                className="rounded border border-input"
                            />
                            <span className="text-sm">Delete Return Traffic</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                disabled={isSubmitting}
                                defaultChecked
                                {...register('is_active')}
                                className="rounded border border-input"
                            />
                            <span className="text-sm">Active</span>
                        </label>
                    </div>
                </form>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : admin ? 'Update Admin' : 'Create Admin'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}