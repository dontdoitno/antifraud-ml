"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Target, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { loadTransactions, calculateRiskScore } from "@/lib/data-loader";
import { Transaction } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AnalyticsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions().then((data) => {
            setTransactions(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground">Загрузка аналитики...</p>
                </div>
            </div>
        );
    }

    const transactionsWithRisk = transactions.map(t => ({
        ...t,
        risk: calculateRiskScore(t)
    }));

    // Stats
    const fraudCount = transactionsWithRisk.filter(t => t.risk.score >= 80).length;
    const safeCount = transactionsWithRisk.filter(t => t.risk.score < 80).length;
    const totalSavings = transactionsWithRisk
        .filter(t => t.risk.score >= 80)
        .reduce((sum, t) => sum + t.amount, 0);
    const precision = (fraudCount / (fraudCount + (safeCount * 0.05))) * 100; // Mock precision
    const recall = 0.943 * 100; // Mock recall from ML model

    // Fraud trend over time
    const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return date.toISOString().split('T')[0];
    });

    const fraudTrendData = last30Days.map(date => {
        const dayTransactions = transactionsWithRisk.filter(t =>
            t.timestamp.split('T')[0] === date
        );
        return {
            date: new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
            fraud: dayTransactions.filter(t => t.risk.score >= 80).length,
            suspicious: dayTransactions.filter(t => t.risk.score >= 50 && t.risk.score < 80).length,
            safe: dayTransactions.filter(t => t.risk.score < 50).length,
        };
    });

    // Device OS distribution
    const deviceData = transactionsWithRisk.reduce((acc, t) => {
        const risky = t.risk.score >= 80 ? 1 : 0;
        if (!acc[t.device_os]) {
            acc[t.device_os] = { total: 0, risky: 0 };
        }
        acc[t.device_os].total++;
        acc[t.device_os].risky += risky;
        return acc;
    }, {} as Record<string, { total: number; risky: number }>);

    const deviceChartData = Object.entries(deviceData).map(([os, data]) => ({
        name: os,
        total: data.total,
        fraud: data.risky,
        rate: ((data.risky / data.total) * 100).toFixed(1)
    }));

    // Payment method analysis
    const paymentData = transactionsWithRisk.reduce((acc, t) => {
        const risky = t.risk.score >= 80 ? 1 : 0;
        if (!acc[t.payment_gateway]) {
            acc[t.payment_gateway] = { total: 0, risky: 0 };
        }
        acc[t.payment_gateway].total++;
        acc[t.payment_gateway].risky += risky;
        return acc;
    }, {} as Record<string, { total: number; risky: number }>);

    const paymentChartData = Object.entries(paymentData).map(([gateway, data]) => ({
        name: gateway,
        rate: ((data.risky / data.total) * 100).toFixed(1),
        count: data.total
    }));

    // Category risk
    const categoryData = transactionsWithRisk.reduce((acc, t) => {
        const risky = t.risk.score >= 80 ? 1 : 0;
        if (!acc[t.category]) {
            acc[t.category] = { total: 0, risky: 0 };
        }
        acc[t.category].total++;
        acc[t.category].risky += risky;
        return acc;
    }, {} as Record<string, { total: number; risky: number }>);

    const categoryChartData = Object.entries(categoryData)
        .map(([category, data]) => ({
            name: category,
            value: data.risky,
            percentage: ((data.risky / fraudCount) * 100).toFixed(0)
        }))
        .sort((a, b) => b.value - a.value);

    const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Аналитика</h1>
                <p className="text-muted-foreground">Детальная статистика и метрики модели</p>
            </div>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Попытки мошенничества"
                    value={fraudCount}
                    icon={AlertTriangle}
                    description={`${((fraudCount / transactions.length) * 100).toFixed(1)}% от всех транзакций`}
                />
                <StatCard
                    title="Precision"
                    value={`${precision.toFixed(1)}%`}
                    icon={Target}
                    description="Точность определения мошенничества"
                />
                <StatCard
                    title="Recall"
                    value={`${recall.toFixed(1)}%`}
                    icon={Target}
                    description="Полнота обнаружения"
                />
                <StatCard
                    title="Сохранено средств"
                    value={formatCurrency(totalSavings)}
                    icon={DollarSign}
                    description="Предотвращенные потери"
                />
            </div>

            {/* Fraud Trend */}
            <Card>
                <CardHeader>
                    <CardTitle>Динамика мошенничества за 30 дней</CardTitle>
                    <CardDescription>История попыток мошенничества</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={fraudTrendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                            <YAxis stroke="hsl(var(--muted-foreground))" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--card))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="fraud" fill="#ef4444" name="Мошенничество" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="suspicious" fill="#f59e0b" name="Подозрительно" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="safe" fill="#10b981" name="Безопасно" radius={[8, 8, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* Device OS Analysis */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fraud по устройствам</CardTitle>
                        <CardDescription>Распределение мошенничества по ОС</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={deviceChartData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                />
                                <Bar dataKey="fraud" fill="#ef4444" name="Fraud случаи" radius={[0, 8, 8, 0]} />
                                <Bar dataKey="total" fill="hsl(var(--muted))" name="Всего" radius={[0, 8, 8, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Category Risk */}
                <Card>
                    <CardHeader>
                        <CardTitle>Fraud по категориям</CardTitle>
                        <CardDescription>Распределение мошенничества по типам товаров</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryChartData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {categoryChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        border: '1px solid hsl(var(--border))',
                                        borderRadius: '8px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Gateway Risk */}
            <Card>
                <CardHeader>
                    <CardTitle>Анализ платежных шлюзов</CardTitle>
                    <CardDescription>Уровень мошенничества по платежным системам</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {paymentChartData.map((gateway, index) => (
                            <div key={gateway.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{gateway.name}</p>
                                        <p className="text-xs text-muted-foreground">{gateway.count} транзакций</p>
                                    </div>
                                    <span className="text-sm font-semibold">{gateway.rate}% количество мошенничества</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-risk-medium to-risk-high"
                                        style={{ width: `${gateway.rate}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
