import { getApiClient } from './api-client'
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
}

// Admin API
export const adminAPI = {
    createAdmin: async (data: AdminFormData): Promise<AdminOutput> => {
        const submitData = {
            ...data,
            traffic: gbToBytes(data.traffic),
        }

        const response = await api.post<ResponseModel<AdminOutput>>(`/superadmin/admin`, submitData)

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to create admin')
        }

        return response.data.data!
    },

    updateAdmin: async (adminId: number, data: AdminFormData): Promise<AdminOutput> => {
        const submitData = {
            ...data,
            traffic: gbToBytes(data.traffic),
        }

        const response = await api.put<ResponseModel<AdminOutput>>(
            `/superadmin/admin/${adminId}`,
            submitData
        )

        if (!response.data.success) {
            throw new Error(response.data.message || 'Failed to update admin')
        }

        return response.data.data!
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
            id: crypto.randomUUID(),
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
