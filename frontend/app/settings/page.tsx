"use client";

import { useState } from "react";
import { Settings as SettingsIcon, Key, Users, CreditCard, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [telegramNotifications, setTelegramNotifications] = useState(true);
    const [webhookEvents, setWebhookEvents] = useState(false);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Настройки</h1>
                <p className="text-muted-foreground">Конфигурация системы и управление доступом</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Key className="h-5 w-5" />
                            <CardTitle>API Keys</CardTitle>
                        </div>
                        <CardDescription>Управление ключами доступа</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Production Key</p>
                                <code className="text-xs font-mono">fs_live_••••••••••••••••••••</code>
                            </div>
                            <div className="p-3 rounded-lg border border-border">
                                <p className="text-xs text-muted-foreground mb-1">Test Key</p>
                                <code className="text-xs font-mono">fs_test_••••••••••••••••••••</code>
                            </div>
                            <Button variant="outline" className="w-full">Создать новый ключ</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="h-5 w-5" />
                            <CardTitle>Команда</CardTitle>
                        </div>
                        <CardDescription>Управление пользователями</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                                <div>
                                    <p className="text-sm font-medium">Администратор</p>
                                    <p className="text-xs text-muted-foreground">admin@fraudshield.ai</p>
                                </div>
                                <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">Owner</span>
                            </div>
                            <Button variant="outline" className="w-full">Пригласить пользователя</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <Bell className="h-5 w-5" />
                            <CardTitle>Уведомления</CardTitle>
                        </div>
                        <CardDescription>Настройка оповещений</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Email уведомления</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">Получать уведомления на email</span>
                                </div>
                                <Switch
                                    checked={emailNotifications}
                                    onCheckedChange={setEmailNotifications}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Telegram уведомления</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">Получать уведомления в Telegram</span>
                                </div>
                                <Switch
                                    checked={telegramNotifications}
                                    onCheckedChange={setTelegramNotifications}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">Webhook события</span>
                                    <span className="text-xs text-muted-foreground mt-0.5">Отправлять события через webhook</span>
                                </div>
                                <Switch
                                    checked={webhookEvents}
                                    onCheckedChange={setWebhookEvents}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="h-5 w-5" />
                            <CardTitle>Биллинг</CardTitle>
                        </div>
                        <CardDescription>Тарифный план и оплата</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-600/10 border border-blue-500/20">
                                <p className="text-sm font-semibold mb-1">Рост</p>
                                <p className="text-2xl font-bold mb-2">₽4 990 <span className="text-sm font-normal text-muted-foreground">/мес</span></p>
                                <p className="text-xs text-muted-foreground">До 10,000 транзакций/месяц</p>
                            </div>
                            <Button variant="outline" className="w-full">Изменить план</Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
