import { useEffect, useState } from 'react'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { panelSchema, PanelFormData, PanelOutput } from '@/types'
import { panelAPI } from '@/lib/api'
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
import { AlertCircle, Loader2, Info } from 'lucide-react'

const PANEL_TYPES = ['3x-ui', 'tx-ui', 'marzban']

interface PanelFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    panel?: PanelOutput | null
}

export function PanelFormDialog({
    isOpen,
    onClose,
    onSuccess,
    panel,
}: PanelFormDialogProps) {
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<PanelFormData>({
        resolver: zodResolver(panelSchema),
        defaultValues: {
            panel_type: '3x-ui',
            name: '',
            url: '',
            sub_url: null,
            username: 'none',
            password: 'none',
            token: '',
            is_active: true,
        },
    })

    const panelType = watch('panel_type')
    const usernameValue = watch('username')
    const passwordValue = watch('password')

    useEffect(() => {
        if (panel) {
            setValue('name', panel.name)
            setValue('panel_type', panel.panel_type)
            setValue('url', panel.url)
            setValue('is_active', panel.is_active)
            setValue('token', '')

            if (panel.panel_type === '3x-ui') {
                setValue('username', 'none')
                setValue('password', 'none')
            } else {
                setValue('username', '')
                setValue('password', '')
            }
            // Note: URL and credentials won't be pre-filled for security
        } else {
            reset()
        }
    }, [panel, isOpen, setValue, reset])

    useEffect(() => {
        if (panelType === '3x-ui') {
            setValue('username', 'none')
            setValue('password', 'none')
        } else {
            if (usernameValue === 'none') {
                setValue('username', '')
            }
            if (passwordValue === 'none') {
                setValue('password', '')
            }
            setValue('token', '')
        }
    }, [panelType, usernameValue, passwordValue, setValue])

    const onSubmit = async (data: PanelFormData) => {
        setServerError(null)

        try {
            if (panel?.id) {
                // Update
                await panelAPI.updatePanel(panel.id, data)
            } else {
                // Create
                await panelAPI.createPanel(data)
            }

            onSuccess()
        } catch (error: any) {
            console.error('Form submission error:', error)
            setServerError(error?.message || 'Operation failed')
        }
    }

    const onInvalid = (formErrors: FieldErrors<PanelFormData>) => {
        const firstError = Object.values(formErrors).find((error) => error?.message)
        setServerError(firstError?.message?.toString() || 'Please fix the highlighted form errors')
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{panel ? 'Edit Panel' : 'Create New Panel'}</DialogTitle>
                    <DialogDescription>
                        {panel ? 'Update panel information' : 'Add a new proxy panel'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                    {serverError && (
                        <div className="flex items-gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>{serverError}</p>
                        </div>
                    )}

                    {/* Panel Type */}
                    <div className="space-y-2">
                        <Label htmlFor="panel_type">Panel Type *</Label>
                        <Select
                            value={watch('panel_type')}
                            onValueChange={(value) => setValue('panel_type', value)}
                            disabled={isSubmitting}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select panel type" />
                            </SelectTrigger>
                            <SelectContent>
                                {PANEL_TYPES.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.panel_type && (
                            <p className="text-sm text-destructive">{errors.panel_type.message}</p>
                        )}
                    </div>

                    {/* Panel Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Panel Name *</Label>
                        <Input
                            id="name"
                            placeholder="My Panel"
                            disabled={isSubmitting || !!panel}
                            {...register('name')}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    {/* Panel URL */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="url">Panel URL *</Label>
                            <div className="group relative">
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="invisible group-hover:visible absolute left-0 top-6 z-50 w-64 p-2 text-xs bg-popover text-popover-foreground border rounded-md shadow-md">
                                    If your panel is Marzban, do not include the /urlpath.
                                </div>
                            </div>
                        </div>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://panel.example.com"
                            disabled={isSubmitting}
                            {...register('url')}
                        />
                        {errors.url && (
                            <p className="text-sm text-destructive">{errors.url.message}</p>
                        )}
                    </div>

                    {/* Subscription URL */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="sub_url">Subscription URL *</Label>
                            <div className="group relative">
                                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                <div className="invisible group-hover:visible absolute left-0 top-6 z-50 w-64 p-2 text-xs bg-popover text-popover-foreground border rounded-md shadow-md">
                                    {watch('panel_type') === 'marzban'
                                        ? 'For Marzban: Enter URL without prefix (e.g., https://sub.example.com)'
                                        : 'For 3x-ui/Sanaei: Enter URL with prefix (e.g., https://panel.example.com/sub)'}
                                </div>
                            </div>
                        </div>
                        <Input
                            id="sub_url"
                            type="url"
                            placeholder={
                                watch('panel_type') === 'marzban'
                                    ? 'https://sub.example.com'
                                    : 'https://panel.example.com/sub'
                            }
                            disabled={isSubmitting}
                            {...register('sub_url')}
                        />
                        {errors.sub_url && (
                            <p className="text-sm text-destructive">{errors.sub_url.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {watch('panel_type') === 'marzban'
                                ? 'Example: https://sub.example.com (without any path)'
                                : 'Example: https://panel.example.com/sub (with /sub prefix)'}
                        </p>
                    </div>

                    {panelType === '3x-ui' ? (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="token">Panel Token *</Label>
                                <Input
                                    id="token"
                                    placeholder="Enter token"
                                    disabled={isSubmitting}
                                    {...register('token')}
                                />
                                {errors.token && (
                                    <p className="text-sm text-destructive">{errors.token.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    For 3x-ui panels, provide the API token
                                </p>
                            </div>
                            <input type="hidden" value="none" {...register('username')} />
                            <input type="hidden" value="none" {...register('password')} />
                        </>
                    ) : (
                        <>
                            {/* Panel Username */}
                            <div className="space-y-2">
                                <Label htmlFor="username">Panel Username *</Label>
                                <Input
                                    id="username"
                                    placeholder="panel_admin"
                                    disabled={isSubmitting}
                                    {...register('username')}
                                />
                                {errors.username && (
                                    <p className="text-sm text-destructive">{errors.username.message}</p>
                                )}
                            </div>

                            {/* Panel Password */}
                            <div className="space-y-2">
                                <Label htmlFor="password">Panel Password *</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder={panel ? 'Leave empty to keep current' : 'Enter password'}
                                    disabled={isSubmitting}
                                    {...register('password')}
                                />
                                {errors.password && (
                                    <p className="text-sm text-destructive">{errors.password.message}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Active Checkbox */}
                    <div className="space-y-3">
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

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Saving...' : panel ? 'Update Panel' : 'Create Panel'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
