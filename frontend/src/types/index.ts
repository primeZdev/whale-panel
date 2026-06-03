import { z } from 'zod'

// Auth Types
export interface DecodedToken {
    sub: string
    role: 'admin' | 'superadmin'
    panel: string
    exp: number
}

// Login Form
export const loginSchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters'),
    password: z
        .string()
        .min(1, 'Password is required')
        .min(4, 'Password must be at least 4 characters')
        .max(100, 'Password must be less than 100 characters'),
})

export type LoginFormData = z.infer<typeof loginSchema>

// Admin Form
export const adminSchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters'),

    password: z.string()
    .optional()
    .refine(
        (val) => val === undefined || val === '' || val.length >= 4,
        { message: "Password must be at least 4 characters" }
    )
    .refine(
        (val) => val === undefined || val === '' || val.length <= 100,
        { message: "Password must be less than 100 characters" }
    ),

    panel: z
        .string()
        .min(1, 'Panel selection is required'),

    inbound_id: z
        .string()
        .regex(
            /^\d+(,\d+)*$/,
            'Inbound IDs must be like: 1,2,3'
        )
        .optional()
        .nullable(),

    marzban_inbounds: z
        .string()
        .optional()
        .nullable(),

    marzban_password: z
        .string()
        .optional()
        .nullable(),

    flow: z
        .string()
        .optional()
        .nullable(),

    traffic: z
        .number()
        .min(0, 'Traffic cannot be negative')
        .default(0),

    update_return_traffic: z
        .boolean()
        .default(false),

    delete_return_traffic: z
        .boolean()
        .default(false),

    is_active: z
        .boolean()
        .default(true),

    expiry_date: z
        .union([z.string(), z.number()])
        .nullable()
        .optional(),
})
    .superRefine((val, ctx) => {
        // If panel is 3x-ui, flow must be provided (not null/empty)
        if (val.panel === '3x-ui') {
            const f = val.flow
            if (f === null || f === undefined || String(f).trim() === '') {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Flow is required for 3x-ui panels', path: ['flow'] })
            }
        }
    })

export type AdminFormData = z.infer<typeof adminSchema>

export interface AdminOutput {
    id: number
    username: string
    is_active: boolean
    panel: string
    inbound_id: string | null
    marzban_inbounds: string | null
    marzban_password: string | null
    flow?: string | null
    traffic: number
    initial_traffic: number
    update_return_traffic: boolean | false
    delete_return_traffic: boolean | false
    expiry_date: string | null
}

// Panel Form
export const panelSchema = z.object({
    panel_type: z
        .string()
        .min(1, 'Panel type is required')
        .default('3x-ui'),

    name: z
        .string()
        .min(1, 'Panel name is required')
        .min(3, 'Panel name must be at least 3 characters')
        .max(100, 'Panel name must be less than 100 characters'),

    url: z
        .string()
        .min(1, 'Panel URL is required')
        .url('Must be a valid URL')
        .max(500, 'URL must be less than 500 characters'),

    sub_url: z
        .string()
        .url('Must be a valid URL if provided')
        .nullable()
        .optional(),

    username: z
        .string()
        .min(1, 'Username is required')
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters'),

    password: z
        .string()
        .min(1, 'Password is required')
        .min(4, 'Password must be at least 4 characters')
        .max(100, 'Password must be less than 100 characters'),

    token: z
        .string()
        .optional()
        .nullable(),

    is_active: z
        .boolean()
        .default(true),
})

    .superRefine((val, ctx) => {
        if (val.panel_type === '3x-ui') {
            const token = val.token
            if (token === undefined || token === null || String(token).trim() === '') {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Token is required for 3x-ui panels',
                    path: ['token'],
                })
            } else if (typeof token === 'string' && token.length > 500) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Token must be less than 500 characters',
                    path: ['token'],
                })
            }
        }
    })

export type PanelFormData = z.infer<typeof panelSchema>

export interface PanelOutput {
    id: number
    panel_type: string
    name: string
    url: string
    is_active: boolean
}

// User Form
export const userSchema = z.object({
    email: z
        .string()
        .min(1, 'Username/Email is required')
        .max(100, 'Maximum 100 characters'),

    totalGb: z
        .number()
        .min(0.1, 'Minimum traffic is 0.1 GB')
        .max(109951.16, 'Maximum traffic is ~107 TB'),

    expiryDatetime: z
        .union([z.string(), z.number()])
        .optional()
        .nullable(),
})

export type UserFormData = z.infer<typeof userSchema>

export interface ClientsOutput {
    id: number
    uuid: string
    username: string
    status: boolean
    is_online: boolean
    data_limit: number
    used_data: number
    expiry_date: string | null
    expiry_date_unix: number | null
    sub_id?: string
    flow?: string
}

// API Response Types
export interface ResponseModel<T = any> {
    success: boolean
    message: string
    data?: T
}

export interface LoginResponse {
    access_token: string
    token_type: string
}

export interface DashboardData {
    remaining_traffic?: number
    initial_traffic?: number
    expiry_time?: string
    news?: string[]
    sub_url?: string
    users?: ClientsOutput[]
    admins?: AdminOutput[]
    panels?: PanelOutput[]
    system?: {
        total_memory: number
        used_memory: number
        cpu_percent: number
        disk_total: number
        disk_used: number
    }
    ads?: {
        title?: string
        text?: string
        link?: string
        button?: string
    }
}

export interface AdsData {
    title?: string
    text?: string
    link?: string
    button?: string
}
