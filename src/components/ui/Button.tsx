import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import "./Button.css"

const buttonVariants = cva(
    "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative",
    {
        variants: {
            variant: {
                primary:
                    "bg-components-button-primary-bg text-components-button-primary-text hover:bg-components-button-primary-bg-hover border border-components-button-primary-border hover:border-components-button-primary-border-hover disabled:bg-components-button-primary-bg-disabled disabled:border-components-button-primary-border-disabled disabled:text-components-button-primary-text-disabled shadow-sm",
                secondary:
                    "bg-components-button-secondary-bg text-components-button-secondary-text hover:bg-components-button-secondary-bg-hover border border-components-button-secondary-border hover:border-components-button-secondary-border-hover disabled:bg-components-button-secondary-bg-disabled disabled:border-components-button-secondary-border-disabled disabled:text-components-button-secondary-text-disabled shadow-sm",
                "secondary-accent":
                    "bg-components-button-secondary-bg text-components-button-secondary-accent-text hover:bg-components-button-secondary-bg-hover border border-components-button-secondary-border hover:border-components-button-secondary-border-hover disabled:bg-components-button-secondary-bg-disabled disabled:border-components-button-secondary-border-disabled disabled:text-components-button-secondary-accent-text-disabled shadow-sm",
                tertiary:
                    "bg-components-button-tertiary-bg text-components-button-tertiary-text hover:bg-components-button-tertiary-bg-hover disabled:text-components-button-tertiary-text-disabled",
                ghost:
                    "text-components-button-ghost-text hover:bg-components-button-ghost-bg-hover disabled:text-components-button-ghost-text-disabled",
                "ghost-accent":
                    "text-components-button-ghost-accent-text hover:bg-components-button-ghost-bg-hover disabled:text-components-button-ghost-accent-text-disabled",
                warning:
                    "text-components-button-warning-text border border-components-button-warning-border hover:bg-components-button-warning-bg-hover",
                destructive:
                    "bg-components-button-destructive-bg text-components-button-destructive-text hover:bg-components-button-destructive-bg-hover shadow-sm"
            },
            size: {
                small: "h-8 px-3 text-xs",
                medium: "h-9 px-4 py-2",
                large: "h-10 px-6 text-base",
                icon: "h-9 w-9",
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "medium",
        },
    }
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
    asChild?: boolean
    loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, loading, children, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                {loading && <span className="btn-spinner" />}
                <span className={cn(loading && "invisible")}>{children}</span>
            </button>
        )
    }
)
Button.displayName = "Button"

 export { Button }
