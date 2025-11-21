"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { Button } from "@/components/ui/button";
import {
    LayoutDashboard,
    CreditCard,
    Users,
    BarChart3,
    FileText,
    Settings,
    Shield,
    Plug,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

const navigation = [
    { name: "Обзор", href: "/", icon: LayoutDashboard },
    { name: "Транзакции", href: "/transactions", icon: CreditCard },
    { name: "Клиенты", href: "/customers", icon: Users },
    { name: "Аналитика", href: "/analytics", icon: BarChart3 },
    { name: "Доказательства", href: "/evidence", icon: FileText },
    { name: "Интеграции", href: "/integrations", icon: Plug },
    { name: "Настройки", href: "/settings", icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isCollapsed, toggleSidebar } = useSidebar();

    return (
        <div className={cn(
            "flex flex-col border-r border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-300 ease-in-out relative",
            isCollapsed ? "w-20" : "w-64"
        )}>
            {/* Logo */}
            <div className={cn(
                "flex h-16 items-center border-b border-border/50 px-6 transition-all duration-300",
                isCollapsed ? "justify-center" : "gap-2"
            )}>
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2 flex-shrink-0">
                    <Shield className="h-6 w-6 text-white" />
                </div>
                {!isCollapsed && (
                    <div className="overflow-hidden">
                        <h1 className="text-lg font-bold whitespace-nowrap">FraudShield</h1>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">AI Protection</p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-4">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            title={isCollapsed ? item.name : undefined}
                            className={cn(
                                "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all group",
                                isCollapsed ? "justify-center" : "gap-3",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && (
                                <>
                                    <span className="whitespace-nowrap">{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                </>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            {!isCollapsed && (
                <div className="border-t border-border/50 p-4">
                    <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-3 border border-blue-500/20">
                        <p className="text-xs font-medium">ML Model v2.1</p>
                        <p className="text-xs text-muted-foreground">Accuracy: 94.3%</p>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <div className="absolute -right-3 top-20 z-10">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-6 w-6 rounded-full bg-card border-2 shadow-md hover:bg-accent"
                    onClick={toggleSidebar}
                >
                    {isCollapsed ? (
                        <ChevronRight className="h-4 w-4" />
                    ) : (
                        <ChevronLeft className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
