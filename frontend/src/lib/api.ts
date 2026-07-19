import { getApiClient } from './api-client'
import { v4 as uuidv4 } from 'uuid'
import {
    LoginResponse,
    DashboardData,
    AdminOutput,
    PanelOutput,
    ClientsOutput,
    ResponseModel,
    AdminFormData,
    PanelFormData,
} from '@/types'
import { gbToBytes } from './traffic-converter'

const api = getApiClient()

// Auth API
export const authAPI = {
    login: async (username: string, password: string): Promise<LoginResponse> => {
        const data = new URLSearchParams()
        data.append('username', username)
        data.append('password', password)

        const response = await api.post<ResponseModel<LoginResponse>>(`/login`, data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        })

        if (!response.data.success) {
            throw new Error(response.data.message || 'Login failed')
        }

        return response.data.data!
    },
}

// Dashboard API
export const dashboardAPI = {
    getDashboardData: async (): Promise<DashboardData> => {
        const response = await api.get<ResponseModel<DashboardData>>(`/dashboard/`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch dashboard data')
        }

        return response.data.data || {}
    },

    getAdmins: async (): Promise<AdminOutput[]> => {
        const response = await api.get<ResponseModel<AdminOutput[]>>(`/superadmin/admins`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch admins')
        }

        return response.data.data || []
    },

    getPanels: async (): Promise<PanelOutput[]> => {
        const response = await api.get<ResponseModel<PanelOutput[]>>(`/superadmin/panels`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch panels')
        }

        return response.data.data || []
    },

    getSystemInfo: async (): Promise<any> => {
        const response = await api.get<ResponseModel<any>>(`/superadmin/system`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch system info')
        }

        return response.data.data || {}
    },
}

export const botAPI = {
    getBotConfig: async (): Promise<{ token: string; admin_id: number; is_active: boolean }> => {
        try {
            const response = await api.get<ResponseModel<{ token: string; admin_id: number; is_active: boolean }>>(`/superadmin/tgbot`)
            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to fetch bot config')
            }
            return response.data.data || { token: '', admin_id: 0, is_active: false }
        } catch (error: any) {
            if (error.response?.status === 404) {
                return { token: '', admin_id: 0, is_active: false }
            }
            throw error
        }
    },

    updateBotConfig: async (config: { token: string; admin_id: number; is_active: boolean }): Promise<void> => {
        const response = await api.post<ResponseModel<void>>(`/superadmin/tgbot`, config)
        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update bot config')
        }
    },
}

// Admin API
export const adminAPI = {
    getAdmins: async (): Promise<AdminOutput[]> => {
        const response = await api.get<ResponseModel<AdminOutput[]>>(`/superadmin/admins`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch admins')
        }

        return response.data.data || []
    },

    createAdmin: async (data: AdminFormData): Promise<AdminOutput> => {
        const submitData = {
            ...data,
            traffic: gbToBytes(data.traffic),
        }

        try {
            const response = await api.post<ResponseModel<AdminOutput>>(`/superadmin/admin`, submitData)

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to create admin')
            }

            return response.data.data!
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Failed to create admin'
            throw new Error(message)
        }
    },

    updateAdmin: async (adminId: number, data: AdminFormData): Promise<AdminOutput> => {
        const submitData = {
            ...data,
            traffic: gbToBytes(data.traffic),
        }

        try {
            const response = await api.put<ResponseModel<AdminOutput>>(
                `/superadmin/admin/${adminId}`,
                submitData
            )

            if (!response.data.success) {
                throw new Error(response.data.message || 'Failed to update admin')
            }

            return response.data.data!
        } catch (error: any) {
            const message = error?.response?.data?.message || error?.message || 'Failed to update admin'
            throw new Error(message)
        }
    },

    deleteAdmin: async (adminId: number): Promise<void> => {
        const response = await api.delete<ResponseModel<void>>(
            `/superadmin/admin/${adminId}`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete admin')
        }
    },

    toggleAdminStatus: async (adminId: number): Promise<AdminOutput> => {
        const response = await api.patch<ResponseModel<AdminOutput>>(
            `/superadmin/admin/${adminId}/status`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to toggle admin status')
        }

        return response.data.data!
    },

    getPanelInbounds: async (panelName: string): Promise<Record<string, string[]>> => {
        const response = await api.get<ResponseModel<Record<string, string[]>>>(
            `/superadmin/panel/${panelName}/inbounds`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch panel inbounds')
        }

        return response.data.data || {}
    },
}

// Panel API
export const panelAPI = {
    getPanels: async (): Promise<PanelOutput[]> => {
        const response = await api.get<ResponseModel<PanelOutput[]>>(`/superadmin/panels`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch panels')
        }

        return response.data.data || []
    },

    createPanel: async (data: PanelFormData): Promise<PanelOutput> => {
        const response = await api.post<ResponseModel<PanelOutput>>(`/superadmin/panel`, data)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create panel')
        }

        return response.data.data!
    },

    updatePanel: async (panelId: number, data: PanelFormData): Promise<PanelOutput> => {
        const response = await api.put<ResponseModel<PanelOutput>>(
            `/superadmin/panel/${panelId}`,
            data
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update panel')
        }

        return response.data.data!
    },

    deletePanel: async (panelId: number): Promise<void> => {
        const response = await api.delete<ResponseModel<void>>(
            `/superadmin/panel/${panelId}`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete panel')
        }
    },

    togglePanelStatus: async (panelId: number): Promise<PanelOutput> => {
        const response = await api.patch<ResponseModel<PanelOutput>>(
            `/superadmin/panel/${panelId}/status`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to toggle panel status')
        }

        return response.data.data!
    },
}

// SuperAdmin API
export const superadminAPI = {
    downloadBackup: async (): Promise<Blob> => {
        const response = await api.get(`/superadmin/backup`, {
            responseType: 'blob',
        })
        return response.data
    },

    restoreBackup: async (file: File): Promise<string> => {
        const formData = new FormData()
        formData.append('file', file)

        const response = await api.post<ResponseModel<void>>(`/superadmin/restore`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        })

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to restore backup')
        }

        return response.data.message || 'Database restored successfully'
    },

    getLogs: async (): Promise<string[]> => {
        const response = await api.get<ResponseModel<string[]>>(`/superadmin/logs`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch logs')
        }

        return response.data.data || []
    },

    getNews: async (): Promise<Array<{ id: number; message: string; created_at: string }>> => {
        const response = await api.get<ResponseModel<Array<{ id: number; message: string; created_at: string }>>>(`/superadmin/news`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to fetch news')
        }

        return response.data.data || []
    },

    addNews: async (message: string): Promise<void> => {
        const response = await api.post<ResponseModel<void>>(`/superadmin/news`, { news: message })

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to add news')
        }
    },

    deleteNews: async (newsId: number): Promise<void> => {
        const response = await api.delete<ResponseModel<void>>(`/superadmin/news/${newsId}`)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete news')
        }
    },
}

// Helper function to generate random sub_id (16 random characters)
function generateSubId(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    let result = ''
    for (const b of bytes) {
        result += chars[b % chars.length]
    }
    return result
}

// User API
export const userAPI = {
    createUser: async (email: string, totalGb: number, expiryDatetime?: string | null): Promise<ClientsOutput> => {
        const submitData = {
            email,
            id: uuidv4(),
            enable: true,
            expiry_time: expiryDatetime ? new Date(expiryDatetime + 'T00:00:00').getTime() : 0,
            total: Math.floor(totalGb * 1024 * 1024 * 1024),
            sub_id: generateSubId(),
            flow: '',
        }

        const response = await api.post<ResponseModel<ClientsOutput>>(`/admin/user`, submitData)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create user')
        }

        return response.data.data!
    },

    updateUser: async (
        userUuid: string,
        email: string,
        totalGb: number,
        expiryDatetime: string | null | undefined,
        subId: string,
        enable: boolean = true,
        flow: string = '',
        userId?: string
    ): Promise<ClientsOutput> => {
        // Sanitize sub_id to remove leading and trailing slashes to prevent double slashes in subscription URL
        const sanitizedSubId = subId?.replace(/^\/+|\/+$/g, '') || '';

        const submitData = {
            email,
            enable,
            expiry_time: expiryDatetime ? new Date(expiryDatetime + 'T00:00:00').getTime() : 0,
            total: Math.floor(totalGb * 1024 * 1024 * 1024),
            sub_id: sanitizedSubId,
            flow,
        }

        const identifier = (userUuid && userUuid !== '0') ? userUuid : (userId || '0')

        const response = await api.put<ResponseModel<ClientsOutput>>(
            `/admin/user/${identifier}`,
            submitData
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update user')
        }

        return response.data.data!
    },

    deleteUser: async (userUuid: string, username?: string, userId?: string): Promise<void> => {
        // Use userUuid if available (could be uuid or username), otherwise use username, then userId
        const identifier = (userUuid && userUuid !== '0')
            ? userUuid
            : (username || userId || '0')

        const response = await api.delete<ResponseModel<void>>(
            `/admin/user/${identifier}`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to delete user')
        }
    },

    toggleUserStatus: async (userUuid: string): Promise<ClientsOutput> => {
        const response = await api.patch<ResponseModel<ClientsOutput>>(
            `/admin/user/${userUuid}/status`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to toggle user status')
        }

        return response.data.data!
    },

    resetUserUsage: async (email: string): Promise<void> => {
        const response = await api.put<ResponseModel<void>>(
            `/admin/user/${email}/reset`
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to reset user usage')
        }
    },
}
