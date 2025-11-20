import * as React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./card";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    description?: string;
    className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, description, className }: StatCardProps) {
    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardContent className="p-6 flex items-center justify-center min-h-[120px]">
                <div className="flex items-center justify-between w-full">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
                            {trend && (
                                <span
                                    className={cn(
                                        "text-xs font-medium flex items-center gap-1",
                                        trend.isPositive ? "text-green-500" : "text-red-500"
                                    )}
                                >
                                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
                                </span>
                            )}
                        </div>
                        {description && (
                            <p className="text-xs text-muted-foreground">{description}</p>
                        )}
                    </div>
                    <div className="rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 p-3">
                        <Icon className="h-6 w-6 text-primary" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
