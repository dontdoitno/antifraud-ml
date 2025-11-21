"use client";

import { Bell, Search, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./sidebar-context";

export function Header() {
    const { toggleSidebar } = useSidebar();

    return (
        <header className="flex h-16 items-center justify-between border-b border-border/50 bg-card/30 backdrop-blur-xl px-6">
            {/* Mobile Menu Button (optional, for mobile responsiveness) */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleSidebar}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Search */}
            <div className="flex-1 max-w-md">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Поиск по транзакциям, email, IP..."
                        className="w-full rounded-lg border border-input bg-background/50 py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                </Button>

                {/* User */}
                <Button variant="ghost" className="gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                        <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left text-sm hidden md:block">
                        <p className="font-medium">Администратор</p>
                        <p className="text-xs text-muted-foreground">admin@fraudshield.ai</p>
                    </div>
                </Button>
            </div>
        </header>
    );
}
