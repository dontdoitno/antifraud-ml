"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
    checked?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
    ({ className, checked = false, onCheckedChange, onChange, disabled, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (disabled) return;
            const newChecked = e.target.checked;
            onCheckedChange?.(newChecked);
            onChange?.(e);
        };

        return (
            <label
                className={cn(
                    "relative inline-flex items-center cursor-pointer",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <input
                    type="checkbox"
                    ref={ref}
                    checked={checked}
                    onChange={handleChange}
                    disabled={disabled}
                    className="sr-only peer"
                    {...props}
                />
                <div
                    className={cn(
                        "relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out",
                        "bg-gray-300 dark:bg-gray-600",
                        "peer-checked:bg-primary",
                        "peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary peer-focus:ring-offset-2",
                        "shadow-inner",
                        disabled && "cursor-not-allowed"
                    )}
                >
                    <div
                        className={cn(
                            "absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full",
                            "shadow-md transform transition-transform duration-300 ease-in-out",
                            "border border-gray-300",
                            checked ? "translate-x-5" : "translate-x-0"
                        )}
                    />
                </div>
            </label>
        );
    }
);

Switch.displayName = "Switch";

export { Switch };
