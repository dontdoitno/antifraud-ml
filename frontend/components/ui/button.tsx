import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'ghost' | 'outline';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
        return (
            <button
                className={cn(
                    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
                    {
                        // Variants
                        'bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95': variant === 'default',
                        'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80': variant === 'secondary',
                        'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90': variant === 'destructive',
                        'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
                        'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground': variant === 'outline',
                        // Sizes
                        'h-9 px-4 py-2 text-sm': size === 'default',
                        'h-8 px-3 text-xs rounded-md': size === 'sm',
                        'h-10 px-6 text-base': size === 'lg',
                        'h-9 w-9 p-0': size === 'icon',
                    },
                    className
                )}
                ref={ref}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : null}
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
