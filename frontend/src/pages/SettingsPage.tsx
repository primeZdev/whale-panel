import { useEffect, useState } from 'react'
import {
    Bell,
    Bot,
    Database,
    Download,
    Eye,
    FileText,
    Plus,
    RotateCcw,
    Trash2,
    Upload,
} from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { PageHeader } from '@/components/ui/page-header'
import { Textarea } from '@/components/ui/textarea'
import { botAPI, superadminAPI } from '@/lib/api'

interface NewsItem {
    id: number
    message: string
    created_at: string
}

interface BotConfig {
    token: string
    admin_id: number
    is_active: boolean
}

export function SettingsPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [logsLoading, setLogsLoading] = useState(false)
    const [backupLoading, setBackupLoading] = useState(false)
    const [restoreLoading, setRestoreLoading] = useState(false)
    const [showLogsModal, setShowLogsModal] = useState(false)

    // Bot state
    const [botConfig, setBotConfig] = useState<BotConfig>({
        token: '',
        admin_id: 0,
        is_active: false,
    })
    const [botLoading, setBotLoading] = useState(false)
    const [savingBot, setSavingBot] = useState(false)

    // News state
    const [news, setNews] = useState<NewsItem[]>([])
    const [newsLoading, setNewsLoading] = useState(false)
    const [newNewsMessage, setNewNewsMessage] = useState('')
    const [addingNews, setAddingNews] = useState(false)
    const [newsToDelete, setNewsToDelete] = useState<number | null>(null)
    const [deletingNews, setDeletingNews] = useState(false)
    const [showNewsDialog, setShowNewsDialog] = useState(false)
    const [showAddNewsDialog, setShowAddNewsDialog] = useState(false)

    // Toast state
    const [showSuccessToast, setShowSuccessToast] = useState(false)

    useEffect(() => {
        fetchNews()
        fetchBotConfig()
    }, [])

    const fetchBotConfig = async () => {
        try {
            setBotLoading(true)
            const config = await botAPI.getBotConfig()
            setBotConfig({
                token: config.token || '',
                admin_id: Number(config.admin_id) || 0,
                is_active: Boolean(config.is_active),
            })
        } catch (err: any) {
            console.error('Failed to fetch bot config:', err)
            alert(err?.message || 'Failed to fetch bot config')
        } finally {
            setBotLoading(false)
        }
    }

    const handleBotSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSavingBot(true)

        try {
            await botAPI.updateBotConfig({
                token: botConfig.token,
                admin_id: Number(botConfig.admin_id),
                is_active: botConfig.is_active,
            })

            setShowSuccessToast(true)
            setTimeout(() => setShowSuccessToast(false), 5000)
        } catch (err: any) {
            console.error('Failed to update bot settings:', err)
            alert(err?.message || 'Failed to update bot settings')
        } finally {
            setSavingBot(false)
        }
    }

    const handleBotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setBotConfig(prev => ({
            ...prev,
            [name]: name === 'admin_id' ? Number(value) : value,
        }))
    }

    const fetchNews = async () => {
        try {
            setNewsLoading(true)
            const newsData = await superadminAPI.getNews()
            setNews(newsData)
        } catch (err: any) {
            console.error('Failed to fetch news:', err)
            alert(err?.message || 'Failed to fetch news')
        } finally {
            setNewsLoading(false)
        }
    }

    const fetchLogs = async () => {
        try {
            setLogsLoading(true)
            const logsData = await superadminAPI.getLogs()
            setLogs(logsData)
        } catch (err: any) {
            console.error('Failed to fetch logs:', err)
            alert(err?.message || 'Failed to fetch logs')
        } finally {
            setLogsLoading(false)
        }
    }

    const handleDownloadBackup = async () => {
        try {
            setBackupLoading(true)
            const blob = await superadminAPI.downloadBackup()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `backup-${new Date().toISOString().split('T')[0]}.db`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err: any) {
            console.error('Failed to download backup:', err)
            alert(err?.message || 'Failed to download backup')
        } finally {
            setBackupLoading(false)
        }
    }

    const handleRestoreBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        try {
            setRestoreLoading(true)
            const message = await superadminAPI.restoreBackup(file)
            alert(message)
        } catch (err: any) {
            console.error('Failed to restore backup:', err)
            alert(err?.message || 'Failed to restore backup')
        } finally {
            setRestoreLoading(false)
            event.target.value = ''
        }
    }

    const handleAddNews = async () => {
        if (!newNewsMessage.trim()) {
            alert('Please enter a news message')
            return
        }

        try {
            setAddingNews(true)
            await superadminAPI.addNews(newNewsMessage)
            setNewNewsMessage('')
            fetchNews()
        } catch (err: any) {
            console.error('Failed to add news:', err)
            alert(err?.message || 'Failed to add news')
        } finally {
            setAddingNews(false)
        }
    }

    const handleDeleteNews = async () => {
        if (!newsToDelete) return

        try {
            setDeletingNews(true)
            await superadminAPI.deleteNews(newsToDelete)
            setNewsToDelete(null)
            fetchNews()
        } catch (err: any) {
            console.error('Failed to delete news:', err)
            alert(err?.message || 'Failed to delete news')
        } finally {
            setDeletingNews(false)
        }
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Settings" description="Manage database, logs, bot, and news" />

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed right-4 top-4 z-50 max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg dark:border-emerald-800 dark:bg-emerald-950/40">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-emerald-800 dark:text-emerald-200">✅ Bot Settings Updated!</h3>
                            <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">Please restart the container with:</p>
                            <code className="mt-2 block rounded-md bg-emerald-100 px-3 py-2 font-mono text-sm text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">whale-panel restart</code>
                        </div>
                        <button type="button" onClick={() => setShowSuccessToast(false)} className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400">
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 4 Main Boxes - Stacked Layout */}
            <div className="flex flex-col gap-6">
                {/* Bot Box */}
                <Card className="panel-surface">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bot className="h-5 w-5 text-violet-500" />
                            Telegram Bot
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBotSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bot Token</label>
                                <Input name="token" value={botConfig.token} onChange={handleBotChange} placeholder="Enter bot token" required disabled={botLoading} />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin ID</label>
                                <Input name="admin_id" type="number" value={botConfig.admin_id} onChange={handleBotChange} placeholder="Enter admin ID" required disabled={botLoading} />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                                <div>
                                    <div className="text-sm font-medium">Status</div>
                                    <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${botConfig.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'}`}>
                                        {botConfig.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Toggle bot status"
                                    onClick={() => setBotConfig(prev => ({ ...prev, is_active: !prev.is_active }))
                                    }
                                    className={`relative inline-flex h-6 w-12 items-center rounded-full transition-colors ${botConfig.is_active ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
                                >
                                    <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${botConfig.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            <Button type="submit" disabled={savingBot || botLoading} className="w-full h-9 text-sm">
                                {savingBot ? 'Saving...' : 'Save Bot Settings'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Backup & Restore Box */}
                <Card className="panel-surface">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Database className="h-5 w-5 text-blue-500" />
                            Database Backup
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="mb-4 text-sm text-muted-foreground">Download a backup of the current database or restore from a saved file.</p>
                            <Button onClick={handleDownloadBackup} disabled={backupLoading} className="w-full h-9 text-sm">
                                <Download className="mr-2 h-4 w-4" />
                                {backupLoading ? 'Downloading...' : 'Download Backup'}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Restore the database from a .db file.</p>
                            <Button variant="outline" onClick={() => document.getElementById('restore-file-input')?.click()} disabled={restoreLoading} className="w-full h-9 text-sm">
                                <Upload className="mr-2 h-4 w-4" />
                                {restoreLoading ? 'Restoring...' : 'Select Backup File'}
                            </Button>
                            <Input id="restore-file-input" type="file" accept=".db" onChange={handleRestoreBackup} disabled={restoreLoading} className="hidden" />
                        </div>
                    </CardContent>
                </Card>

                {/* Logs Box */}
                <Card className="panel-surface">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FileText className="h-5 w-5 text-violet-500" />
                            Application Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-sm text-muted-foreground">View the latest application logs.</p>
                        <Button onClick={() => { void fetchLogs(); setShowLogsModal(true) }} disabled={logsLoading} className="w-full h-9 text-sm">
                            <Eye className="mr-2 h-4 w-4" />
                            {logsLoading ? 'Loading...' : 'Show Logs'}
                        </Button>
                    </CardContent>
                </Card>

                {/* News Box */}
                <Card className="panel-surface">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Bell className="h-5 w-5 text-rose-500" />
                            News Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">Manage system news and announcements.</p>
                        <div className="flex gap-2">
                            <Button variant="secondary" className="flex-1 h-9 text-sm" onClick={() => { void fetchNews(); setShowNewsDialog(true) }} disabled={newsLoading}>
                                <Eye className="mr-2 h-4 w-4" />
                                {newsLoading ? 'Loading...' : 'Show News'}
                            </Button>
                            <Button className="flex-1 h-9 text-sm" onClick={() => setShowAddNewsDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create News
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Modal */}
            <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Application Logs</DialogTitle>
                        <DialogDescription>Latest application logs</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Button variant="secondary" onClick={() => void fetchLogs()} disabled={logsLoading} size="sm" className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
                        </Button>
                        <div className="max-h-96 overflow-y-auto rounded-lg border bg-muted/30 p-4">
                            {logs.length > 0 ? (
                                <pre className="whitespace-pre-wrap break-words font-mono text-xs">{logs.join('\n')}</pre>
                            ) : (
                                <p className="text-sm text-muted-foreground">No logs available</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* News Display Modal */}
            <Dialog open={showNewsDialog} onOpenChange={setShowNewsDialog}>
                <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Current News</DialogTitle>
                        <DialogDescription>All system announcements</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {news.length > 0 ? (
                            <div className="max-h-96 space-y-3 overflow-y-auto">
                                {news.map(item => (
                                    <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm">{item.message}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                                        </div>
                                        <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={() => setNewsToDelete(item.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="py-4 text-center text-sm text-muted-foreground">No news available</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add News Modal */}
            <Dialog open={showAddNewsDialog} onOpenChange={setShowAddNewsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create News</DialogTitle>
                        <DialogDescription>Add a new system announcement</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea placeholder="Enter news message..." value={newNewsMessage} onChange={e => setNewNewsMessage(e.target.value)} className="mt-2 min-h-[100px]" disabled={addingNews} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => { setShowAddNewsDialog(false); setNewNewsMessage('') }} disabled={addingNews}>Cancel</Button>
                            <Button onClick={() => void handleAddNews()} disabled={addingNews || !newNewsMessage.trim()}>
                                <Plus className="mr-2 h-4 w-4" />
                                {addingNews ? 'Creating...' : 'Create News'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete News Confirmation Dialog */}
            <AlertDialog open={!!newsToDelete} onOpenChange={() => newsToDelete && setNewsToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete News</AlertDialogTitle>
                        <AlertDialogDescription>Are you sure you want to delete this news? This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => void handleDeleteNews()} disabled={deletingNews} className="bg-red-600 text-white hover:bg-red-700">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingNews ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}