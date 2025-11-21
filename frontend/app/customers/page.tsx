"use client";

import { Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CustomersPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Клиенты</h1>
                <p className="text-muted-foreground">Управление клиентской базой и профилями риска</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Управление клиентами</CardTitle>
                    <CardDescription>Функционал в разработке</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-semibold mb-2">Скоро здесь появится</p>
                    <p className="text-sm text-muted-foreground text-center max-w-md">
                        База клиентов, история покупок, профили риска, блэклисты и белые списки
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
