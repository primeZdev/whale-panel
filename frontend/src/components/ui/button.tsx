import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 border border-white/10 shadow-[0_8px_24px_rgba(15,23,42,0.12)] backdrop-blur-md",
    {
        variants: {
            variant: {
                default:
                    "bg-primary/90 text-primary-foreground hover:bg-primary border-primary/30",
                destructive:
                    "bg-destructive/90 text-destructive-foreground hover:bg-destructive border-destructive/30",
                outline:
                    "border border-border/80 bg-background/40 text-foreground hover:bg-accent/70 hover:text-accent-foreground",
                secondary:
                    "bg-secondary/80 text-secondary-foreground hover:bg-secondary border-border/60",
                ghost:
                    "border-transparent bg-transparent hover:bg-accent/70 hover:text-accent-foreground shadow-none backdrop-blur-none",
                link:
                    "border-transparent bg-transparent text-primary underline-offset-4 hover:underline shadow-none backdrop-blur-none",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 rounded-lg px-3",
                xs: "h-7 rounded-md px-2 text-xs",
                lg: "h-11 rounded-xl px-8",
                icon: "h-10 w-10",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button, buttonVariants }
