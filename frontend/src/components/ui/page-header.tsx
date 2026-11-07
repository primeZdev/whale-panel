import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
    title: string
    description?: string
    action?: ReactNode
    className?: string
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
    return (
        <div className={cn('flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div>
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                {description && <p className="text-muted-foreground">{description}</p>}
            </div>
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    )
}
