"use client";

import { Plug, Box } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const integrations = [
    { name: 'WooCommerce', icon: '🛒', status: 'available' },
    { name: '1C-Bitrix', icon: '🏪', status: 'available' },
    { name: 'RetailCRM', icon: '📊', status: 'available' },
    { name: 'Tilda', icon: '🎨', status: 'available' },
    { name: 'Shopify', icon: '🛍️', status: 'coming-soon' },
];

export default function IntegrationsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Интеграции</h1>
                <p className="text-muted-foreground">Подключение к платформам e-commerce</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {integrations.map((integration) => (
                    <Card key={integration.name}>
                        <CardHeader>
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-4xl">{integration.icon}</div>
                                {integration.status === 'available' ? (
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                                        Доступно
                                    </span>
                                ) : (
                                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                        Скоро
                                    </span>
                                )}
                            </div>
                            <CardTitle>{integration.name}</CardTitle>
                            <CardDescription>Интеграция через API</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button variant="outline" className="w-full" disabled={integration.status !== 'available'}>
                                {integration.status === 'available' ? 'Подключить' : 'В разработке'}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>API Documentation</CardTitle>
                    <CardDescription>REST API для пользовательской интеграции</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center py-8">
                    <Box className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                        Документация API и примеры интеграции доступны в разделе Настройки → API Keys
                    </p>
                    <Button variant="outline">Перейти к API Keys</Button>
                </CardContent>
            </Card>
        </div>
    );
}
