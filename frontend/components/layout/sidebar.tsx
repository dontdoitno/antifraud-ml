"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    CreditCard,
    Users,
    BarChart3,
    FileText,
    Settings,
    Shield,
    Plug,
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

    return (
        <div className="flex w-64 flex-col border-r border-border/50 bg-card/30 backdrop-blur-xl">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 border-b border-border/50 px-6">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 p-2">
                    <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-lg font-bold">FraudShield</h1>
                    <p className="text-xs text-muted-foreground">AI Protection</p>
                </div>
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
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                                isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {item.name}
                            {isActive && (
                                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-border/50 p-4">
                <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 p-3 border border-blue-500/20">
                    <p className="text-xs font-medium">ML Model v2.1</p>
                    <p className="text-xs text-muted-foreground">Accuracy: 94.3%</p>
                </div>
            </div>
        </div>
    );
}
