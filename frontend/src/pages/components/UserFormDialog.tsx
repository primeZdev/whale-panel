import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userSchema, UserFormData, ClientsOutput } from '@/types'
import { userAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { AlertCircle, Loader2 } from 'lucide-react'

interface UserFormDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    user?: ClientsOutput | null
}

export function UserFormDialog({ isOpen, onClose, onSuccess, user }: UserFormDialogProps): JSX.Element {
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
    } = useForm<UserFormData>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            email: '',
            totalGb: 0.1,
            expiryDatetime: null,
        },
    })

    useEffect(() => {
        if (user) {
            setValue('email', user.username)
            setValue('totalGb', user.data_limit / (1024 ** 3))
            if (user.expiry_date_unix) {
                const exp = new Date(user.expiry_date_unix)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const diffMs = exp.getTime() - today.getTime()
                const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                setValue('expiryDatetime', diffDays > 0 ? diffDays : 0)
            }
        } else {
            reset()
        }
    }, [user, isOpen, setValue, reset])

    const onSubmit = async (data: UserFormData) => {
        setServerError(null)

        try {
            // Convert expiry days (number) to date string YYYY-MM-DD for backend
            let expiryForSubmit: string | null | undefined = null
            if (data.expiryDatetime === null || data.expiryDatetime === undefined || data.expiryDatetime === '') {
                expiryForSubmit = null
            } else if (typeof data.expiryDatetime === 'number') {
                const d = new Date()
                d.setHours(0, 0, 0, 0)
                d.setDate(d.getDate() + Math.max(0, Math.floor(data.expiryDatetime)))
                expiryForSubmit = d.toISOString().slice(0, 10)
            } else {
                expiryForSubmit = String(data.expiryDatetime)
            }

            if (user?.uuid || user?.username || user?.id) {
                await userAPI.updateUser(
                    user.uuid || user.username || '0',
                    data.email,
                    data.totalGb,
                    expiryForSubmit,
                    user.sub_id || '',
                    true,
                    user.flow || '',
                    user.id?.toString()
                )
            } else {
                // Create
                await userAPI.createUser(
                    data.email,
                    data.totalGb,
                    expiryForSubmit
                )
            }

            onSuccess()
        } catch (error: any) {
            console.error('Form submission error:', error)
            setServerError(error?.message || 'Operation failed')
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{user ? 'Edit User' : 'Create New User'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Update user information' : 'Add a new user to the system'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {serverError && (
                        <div className="flex items-gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                            <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5" />
                            <p>{serverError}</p>
                        </div>
                    )}

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Username/Email *</Label>
                        <Input
                            id="email"
                            type="text"
                            placeholder="username or email"
                            disabled={isSubmitting || !!user}
                            {...register('email')}
                        />
                        {errors.email && (
                            <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Traffic in GB */}
                    <div className="space-y-2">
                        <Label htmlFor="totalGb">Traffic (GB) *</Label>
                        <Input
                            id="totalGb"
                            type="number"
                            step="0.1"
                            min="0.1"
                            placeholder="1.0"
                            disabled={isSubmitting}
                            {...register('totalGb', { valueAsNumber: true })}
                        />
                        {errors.totalGb && (
                            <p className="text-sm text-destructive">{errors.totalGb.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Minimum 0.1 GB</p>
                    </div>

                    {/* Expiry Date */}
                    <div className="space-y-2">
                        <Label htmlFor="expiryDatetime">Expiry (days)</Label>
                        <Input
                            id="expiryDatetime"
                            type="number"
                            min={0}
                            step={1}
                            placeholder="Enter number of days (e.g. 10)"
                            disabled={isSubmitting}
                            {...register('expiryDatetime', { valueAsNumber: true })}
                        />
                        {errors.expiryDatetime && (
                            <p className="text-sm text-destructive">{errors.expiryDatetime.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">Optional - Leave empty for no expiry</p>
                    </div>
                </form>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Saving...' : user ? 'Update User' : 'Create User'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
