import { useEffect, useState } from 'react'
import {
    Download,
    Upload,
    FileText,
    Bell,
    Trash2,
    Database,
    RotateCcw,
    Eye,
    Plus,
    Bot,
} from 'lucide-react'
import { superadminAPI, botAPI } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
        <div className="space-y-6 p-4 md:p-6 max-w-full overflow-x-hidden">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage database, logs, bot, and news</p>
            </div>

            {/* Success Toast */}
            {showSuccessToast && (
                <div className="fixed top-4 right-4 z-50 max-w-md rounded-lg border border-green-200 bg-green-50 p-4 shadow-lg dark:border-green-800 dark:bg-green-900/30">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h3 className="font-semibold text-green-800 dark:text-green-300">
                                ✅ Bot Settings Updated!
                            </h3>
                            <p className="mt-1 text-sm text-green-700 dark:text-green-400">
                                Please restart the container with:
                            </p>
                            <code className="mt-2 block rounded bg-green-100 px-3 py-2 text-sm font-mono text-green-800 dark:bg-green-800/50 dark:text-green-300">
                                whale-panel restart
                            </code>
                        </div>
                        <button
                            onClick={() => setShowSuccessToast(false)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 5 Main Boxes - 2 rows (3 + 2) */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Bot Box */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5 text-purple-500" />
                            Telegram Bot
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleBotSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Bot Token</label>
                                <Input
                                    name="token"
                                    value={botConfig.token}
                                    onChange={handleBotChange}
                                    placeholder="Enter bot token"
                                    required
                                    disabled={botLoading}
                                    className="text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Admin ID</label>
                                <Input
                                    name="admin_id"
                                    type="number"
                                    value={botConfig.admin_id}
                                    onChange={handleBotChange}
                                    placeholder="Enter admin ID"
                                    required
                                    disabled={botLoading}
                                    className="text-sm"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                                <div>
                                    <span className="text-sm font-medium">Status</span>
                                    <span className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${botConfig.is_active
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                        {botConfig.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setBotConfig(prev => ({
                                            ...prev,
                                            is_active: !prev.is_active,
                                        }))
                                    }
                                    className={`relative inline-flex items-center h-6 w-12 rounded-full transition-colors duration-300 flex-shrink-0 ${botConfig.is_active ? 'bg-green-500' : 'bg-red-500'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-300 ${botConfig.is_active ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            <Button
                                type="submit"
                                disabled={savingBot || botLoading}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                {savingBot ? 'Saving...' : 'Save Bot Settings'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Backup & Restore Box */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5 text-blue-500" />
                            Database Backup & Restore
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <p className="text-sm text-muted-foreground mb-4">
                                Download a backup of the current database or restore from a saved file.
                            </p>
                            <Button
                                onClick={handleDownloadBackup}
                                disabled={backupLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                {backupLoading ? 'Downloading...' : 'Download Backup'}
                            </Button>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Restore the database from a `.db` backup file.
                            </p>
                            <div className="grid gap-3">
                                <Button
                                    onClick={() => document.getElementById('restore-file-input')?.click()}
                                    disabled={restoreLoading}
                                    className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    {restoreLoading ? 'Restoring...' : 'Select Backup File'}
                                </Button>
                                <Input
                                    id="restore-file-input"
                                    type="file"
                                    accept=".db"
                                    onChange={handleRestoreBackup}
                                    disabled={restoreLoading}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Logs Box */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-violet-500" />
                            Application Logs
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                            View the latest application logs.
                        </p>
                        <Button
                            onClick={() => {
                                fetchLogs()
                                setShowLogsModal(true)
                            }}
                            disabled={logsLoading}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            <Eye className="mr-2 h-4 w-4" />
                            {logsLoading ? 'Loading...' : 'Show Logs'}
                        </Button>
                    </CardContent>
                </Card>

                {/* News Box */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-rose-500" />
                            News Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                            Manage system news and announcements.
                        </p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    fetchNews()
                                    setShowNewsDialog(true)
                                }}
                                disabled={newsLoading}
                                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white"
                            >
                                <Eye className="mr-2 h-4 w-4" />
                                {newsLoading ? 'Loading...' : 'Show News'}
                            </Button>
                            <Button
                                onClick={() => setShowAddNewsDialog(true)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Create News
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Logs Modal */}
            <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Application Logs</DialogTitle>
                        <DialogDescription>
                            Latest 10 application logs
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        <Button
                            onClick={fetchLogs}
                            disabled={logsLoading}
                            size="sm"
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {logsLoading ? 'Refreshing...' : 'Refresh Logs'}
                        </Button>
                        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto border">
                            {logs.length > 0 ? (
                                <pre className="text-xs whitespace-pre-wrap font-mono">
                                    {logs.join('\n')}
                                </pre>
                            ) : (
                                <p className="text-sm text-muted-foreground">No logs available</p>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* News Display Modal */}
            <Dialog open={showNewsDialog} onOpenChange={setShowNewsDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Current News</DialogTitle>
                        <DialogDescription>
                            All system announcements
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                        {news.length > 0 ? (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {news.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 bg-muted rounded-md border flex items-start justify-between gap-3"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm break-words">{item.message}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {new Date(item.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setNewsToDelete(item.id)}
                                            size="sm"
                                            variant="ghost"
                                            className="shrink-0 hover:bg-destructive/10">
                                            <Trash2 className="h-4 w-4 text-red-600" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No news available
                            </p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add News Modal */}
            <Dialog open={showAddNewsDialog} onOpenChange={setShowAddNewsDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create News</DialogTitle>
                        <DialogDescription>
                            Add a new system announcement
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Message</label>
                            <Textarea
                                placeholder="Enter news message..."
                                value={newNewsMessage}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNewsMessage(e.target.value)}
                                className="mt-2 min-h-[100px]"
                                disabled={addingNews}
                            />
                        </div>
                        <div className="flex gap-2 justify-end">
                            <Button
                                onClick={() => {
                                    setShowAddNewsDialog(false)
                                    setNewNewsMessage('')
                                }}
                                variant="outline"
                                disabled={addingNews}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleAddNews}
                                disabled={addingNews || !newNewsMessage.trim()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
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
                        <AlertDialogDescription>
                            Are you sure you want to delete this news? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="flex justify-end gap-3">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteNews}
                            disabled={deletingNews}
                            className="bg-red-600 hover:bg-red-700 text-white">
                            <Trash2 className="mr-2 h-4 w-4" />
                            {deletingNews ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog >
        </div >
    )
}