import * as React from "react";
import { cn, getRiskBgColor, getStatusColor } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'risk' | 'status';
    riskScore?: number;
    status?: string;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
    ({ className, variant = 'default', riskScore, status, children, ...props }, ref) => {
        let variantClasses = '';

        if (variant === 'risk' && riskScore !== undefined) {
            variantClasses = getRiskBgColor(riskScore);
        } else if (variant === 'status' && status) {
            variantClasses = getStatusColor(status);
        } else {
            variantClasses = 'bg-primary/10 text-primary border-primary/20';
        }

        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
                    variantClasses,
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Badge.displayName = "Badge";

export { Badge };
