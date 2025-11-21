"use client";

import { useEffect, useState } from "react";
import {
    Shield,
    TrendingDown,
    DollarSign,
    Target,
    AlertTriangle,
    CheckCircle,
    Clock,
    Activity
} from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadTransactions, calculateRiskScore } from "@/lib/data-loader";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatRelativeTime, getRiskBgColor } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function HomePage() {
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
                    <p className="text-sm text-muted-foreground">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    // Calculate stats
    const transactionsWithRisk = transactions.map(t => ({
        ...t,
        risk: calculateRiskScore(t)
    }));

    const highRiskCount = transactionsWithRisk.filter(t => t.risk.score >= 80).length;
    const mediumRiskCount = transactionsWithRisk.filter(t => t.risk.score >= 50 && t.risk.score < 80).length;
    const lowRiskCount = transactionsWithRisk.filter(t => t.risk.score < 50).length;
    const blockedCount = transactionsWithRisk.filter(t => t.risk.score >= 80).length;
    const avgRiskScore = transactionsWithRisk.reduce((sum, t) => sum + t.risk.score, 0) / transactionsWithRisk.length;
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const blockedAmount = transactionsWithRisk.filter(t => t.risk.score >= 80).reduce((sum, t) => sum + t.amount, 0);
    const fraudRate = (highRiskCount / transactions.length) * 100;

    // Prepare chart data
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
    });

    const trendData = last7Days.map(date => {
        const dayTransactions = transactionsWithRisk.filter(t =>
            t.timestamp.split('T')[0] === date
        );
        return {
            date: new Date(date).toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' }),
            fraud: dayTransactions.filter(t => t.risk.score >= 80).length,
            safe: dayTransactions.filter(t => t.risk.score < 80).length,
            total: dayTransactions.length
        };
    });

    // Region risk data
    const regionData: Record<string, { total: number; risky: number }> = {};
    transactionsWithRisk.forEach(t => {
        if (!regionData[t.ip_region]) {
            regionData[t.ip_region] = { total: 0, risky: 0 };
        }
        regionData[t.ip_region].total++;
        if (t.risk.score >= 70) regionData[t.ip_region].risky++;
    });

    const topRiskyRegions = Object.entries(regionData)
        .map(([region, data]) => ({
            region,
            risk: (data.risky / data.total) * 100,
            count: data.total
        }))
        .sort((a, b) => b.risk - a.risk)
        .slice(0, 5);

    // Fraud type distribution
    const fraudTypes = [
        { name: 'Украденные карты', value: highRiskCount * 0.4, color: '#ef4444' },
        { name: 'Friendly Fraud', value: highRiskCount * 0.3, color: '#f59e0b' },
        { name: 'Velocity Attack', value: highRiskCount * 0.2, color: '#8b5cf6' },
        { name: 'Другое', value: highRiskCount * 0.1, color: '#6b7280' },
    ];

    // Live feed - most recent transactions
    const liveFeed = transactionsWithRisk
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Обзор</h1>
                <p className="text-muted-foreground">Мониторинг мошеннических операций в реальном времени</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Уровень мошенничества"
                    value={`${fraudRate.toFixed(1)}%`}
                    icon={Shield}
                    trend={{ value: 2.3, isPositive: false }}
                    description="За последние 30 дней"
                />
                <StatCard
                    title="Заблокировано транзакций"
                    value={blockedCount}
                    icon={TrendingDown}
                    trend={{ value: 12.5, isPositive: true }}
                    description={`${highRiskCount} высокий риск`}
                />
                <StatCard
                    title="Защищено средств"
                    value={formatCurrency(blockedAmount)}
                    icon={DollarSign}
                    description="Предотвращенные потери"
                />
                <StatCard
                    title="Точность модели"
                    value="94.3%"
                    icon={Target}
                    trend={{ value: 1.2, isPositive: true }}
                    description="Precision & Recall"
                />
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Fraud Trend Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Динамика мошенничества</CardTitle>
                        <CardDescription>Тренд за последние 7 дней</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={trendData}>
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
                                <Line type="monotone" dataKey="fraud" stroke="#ef4444" strokeWidth={2} name="Мошенничество" />
                                <Line type="monotone" dataKey="safe" stroke="#10b981" strokeWidth={2} name="Безопасно" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Top Risky Regions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Регионы с повышенным риском</CardTitle>
                        <CardDescription>Топ-5 по уровню мошенничества</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {topRiskyRegions.map((region, index) => (
                                <div key={region.region} className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted font-semibold text-sm">
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="font-medium text-sm">{region.region}</p>
                                            <span className="text-xs text-muted-foreground">{region.count} транз.</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-risk-medium to-risk-high"
                                                style={{ width: `${region.risk}%` }}
                                            />
                                        </div>
                                    </div>
                                    <Badge variant="risk" riskScore={region.risk}>
                                        {region.risk.toFixed(0)}%
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid gap-4 lg:grid-cols-3">
                {/* Risk Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle>Распределение по риску</CardTitle>
                        <CardDescription>Категории транзакций</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-risk-high/10 border border-risk-high/20">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-risk-high" />
                                    <span className="font-medium">Высокий риск</span>
                                </div>
                                <span className="text-2xl font-bold text-risk-high">{highRiskCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-risk-medium/10 border border-risk-medium/20">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-risk-medium" />
                                    <span className="font-medium">Средний риск</span>
                                </div>
                                <span className="text-2xl font-bold text-risk-medium">{mediumRiskCount}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-risk-low/10 border border-risk-low/20">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-risk-low" />
                                    <span className="font-medium">Низкий риск</span>
                                </div>
                                <span className="text-2xl font-bold text-risk-low">{lowRiskCount}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Live Transaction Feed */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Активность в реальном времени</CardTitle>
                                <CardDescription>Последние транзакции</CardDescription>
                            </div>
                            <Activity className="h-5 w-5 text-primary animate-pulse" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {liveFeed.map((transaction) => (
                                <div
                                    key={transaction.transaction_id}
                                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-all"
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={`h-2 w-2 rounded-full ${transaction.risk.score >= 80 ? 'bg-risk-high' : transaction.risk.score >= 50 ? 'bg-risk-medium' : 'bg-risk-low'}`} />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">{transaction.email}</p>
                                            <p className="text-xs text-muted-foreground">{transaction.product_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-sm">{formatCurrency(transaction.amount)}</span>
                                        <Badge variant="risk" riskScore={transaction.risk.score}>
                                            {transaction.risk.score}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatRelativeTime(transaction.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
