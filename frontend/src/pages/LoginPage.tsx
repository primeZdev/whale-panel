import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authAPI } from '@/lib/api'
import { getDecodedToken, isTokenValid, setToken } from '@/lib/auth'
import { type LoginFormData, loginSchema } from '@/types'

const LOGO_URL = 'https://raw.githubusercontent.com/primeZdev/whale-panel/main/media/whale-panel.png'

export function LoginPage() {
    const navigate = useNavigate()
    const [serverError, setServerError] = useState<string | null>(null)

    useEffect(() => {
        if (isTokenValid()) {
            navigate('/', { replace: true })
        }
    }, [navigate])

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

    const onSubmit = async (data: LoginFormData) => {
        setServerError(null)

        try {
            const response = await authAPI.login(data.username, data.password)
            setToken(response.access_token)

            const decoded = getDecodedToken()
            if (decoded?.role) {
                navigate('/', { replace: true })
                return
            }

            setServerError('Failed to determine user role')
        } catch (error: any) {
            setServerError(error?.response?.data?.message || error?.message || 'Failed to login. Please check your credentials.')
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.18),_transparent_35%),linear-gradient(to_bottom,_#09090b,_#0f172a_42%,_#020617)] p-4 text-foreground">
            <div className="absolute right-4 top-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <Card className="border-border/70 bg-card/75 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl">
                    <CardHeader className="space-y-4 pb-4 text-center">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-violet-500/20 bg-white/90 p-2 shadow-[0_0_30px_rgba(139,92,246,0.2)] dark:bg-slate-900/80">
                            <img src={LOGO_URL} alt="Whale Panel logo" className="h-full w-full object-contain" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-bold tracking-tight">Whale Panel</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">Login to your admin panel</CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {serverError && (
                                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                                    <p>{serverError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                                <Input
                                    id="username"
                                    placeholder="Enter your username"
                                    disabled={isSubmitting}
                                    className="h-11 border-border/80 bg-background/60"
                                    {...register('username')}
                                />
                                {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    disabled={isSubmitting}
                                    className="h-11 border-border/80 bg-background/60"
                                    {...register('password')}
                                />
                                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
                            </div>

                            <Button
                                type="submit"
                                className="h-11 w-full bg-gradient-to-r from-violet-600 to-indigo-500 text-white shadow-[0_12px_24px_rgba(99,102,241,0.35)] hover:from-violet-500 hover:to-indigo-400"
                                disabled={isSubmitting}
                            >
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? 'Logging in...' : 'Login'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
