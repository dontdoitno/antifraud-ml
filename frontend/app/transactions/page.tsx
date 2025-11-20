"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Filter, Download, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadTransactions, calculateRiskScore } from "@/lib/data-loader";
import { Transaction } from "@/lib/types";
import { formatCurrency, formatDate, truncateEmail, truncateId } from "@/lib/utils";

type FilterType = 'all' | 'high-risk' | 'medium-risk' | 'low-risk' | 'no-3ds';

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<'date' | 'amount' | 'risk'>('date');

    useEffect(() => {
        loadTransactions().then((data) => {
            setTransactions(data);
            setFilteredTransactions(data);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        let filtered = [...transactions];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.ip.includes(searchQuery) ||
                t.transaction_id.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Risk filter
        const transactionsWithRisk = filtered.map(t => ({
            ...t,
            risk: calculateRiskScore(t)
        }));

        if (activeFilter === 'high-risk') {
            filtered = transactionsWithRisk.filter(t => t.risk.score >= 80).map(({ risk, ...t }) => t);
        } else if (activeFilter === 'medium-risk') {
            filtered = transactionsWithRisk.filter(t => t.risk.score >= 50 && t.risk.score < 80).map(({ risk, ...t }) => t);
        } else if (activeFilter === 'low-risk') {
            filtered = transactionsWithRisk.filter(t => t.risk.score < 50).map(({ risk, ...t }) => t);
        } else if (activeFilter === 'no-3ds') {
            filtered = filtered.filter(t => !t.is_3ds_passed);
        }

        // Sort
        if (sortBy === 'date') {
            filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } else if (sortBy === 'amount') {
            filtered.sort((a, b) => b.amount - a.amount);
        } else if (sortBy === 'risk') {
            const withRisk = filtered.map(t => ({ ...t, risk: calculateRiskScore(t) }));
            withRisk.sort((a, b) => b.risk.score - a.risk.score);
            filtered = withRisk.map(({ risk, ...t }) => t);
        }

        setFilteredTransactions(filtered);
    }, [searchQuery, activeFilter, sortBy, transactions]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground">Загрузка транзакций...</p>
                </div>
            </div>
        );
    }

    const filters: { value: FilterType; label: string; count: number }[] = [
        { value: 'all', label: 'Все', count: transactions.length },
        {
            value: 'high-risk',
            label: 'Высокий риск',
            count: transactions.filter(t => calculateRiskScore(t).score >= 80).length
        },
        {
            value: 'medium-risk',
            label: 'Средний риск',
            count: transactions.filter(t => {
                const score = calculateRiskScore(t).score;
                return score >= 50 && score < 80;
            }).length
        },
        {
            value: 'low-risk',
            label: 'Низкий риск',
            count: transactions.filter(t => calculateRiskScore(t).score < 50).length
        },
        {
            value: 'no-3ds',
            label: 'Без 3DS',
            count: transactions.filter(t => !t.is_3ds_passed).length
        },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Транзакции</h1>
                    <p className="text-muted-foreground">Управление и мониторинг всех платежных операций</p>
                </div>
                <Button className="gap-2">
                    <Download className="h-4 w-4" />
                    Экспорт
                </Button>
            </div>

            {/* Filters and Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        {/* Search */}
                        <div className="flex-1 w-full">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Поиск по email, IP, ID транзакции..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="date">По дате</option>
                                <option value="amount">По сумме</option>
                                <option value="risk">По риску</option>
                            </select>
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                        {filters.map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setActiveFilter(filter.value)}
                                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${activeFilter === filter.value
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    }`}
                            >
                                {filter.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeFilter === filter.value ? 'bg-primary-foreground/20' : 'bg-background'
                                    }`}>
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {filteredTransactions.length} {filteredTransactions.length === 1 ? 'транзакция' : 'транзакций'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-border">
                                <tr className="text-sm text-muted-foreground">
                                    <th className="px-6 py-3 text-left font-medium">ID</th>
                                    <th className="px-6 py-3 text-left font-medium">Время</th>
                                    <th className="px-6 py-3 text-left font-medium">Клиент</th>
                                    <th className="px-6 py-3 text-left font-medium">Товар</th>
                                    <th className="px-6 py-3 text-right font-medium">Сумма</th>
                                    <th className="px-6 py-3 text-center font-medium">Риск</th>
                                    <th className="px-6 py-3 text-center font-medium">3DS</th>
                                    <th className="px-6 py-3 text-center font-medium">Статус</th>
                                    <th className="px-6 py-3 text-right font-medium">Действия</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTransactions.map((transaction) => {
                                    const risk = calculateRiskScore(transaction);
                                    // Determine status based on risk score and fraud flag
                                    let status: 'approved' | 'blocked' | 'pending' | 'review' = 'pending';
                                    if (transaction.is_fraud || risk.score >= 80) {
                                        status = 'blocked';
                                    } else if (risk.score >= 50) {
                                        status = 'review';
                                    } else {
                                        status = 'approved';
                                    }

                                    const getStatusBadge = () => {
                                        switch (status) {
                                            case 'approved':
                                                return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Одобрена</Badge>;
                                            case 'blocked':
                                                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">Заблокирована</Badge>;
                                            case 'review':
                                                return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">На проверке</Badge>;
                                            default:
                                                return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20 text-xs">Ожидает</Badge>;
                                        }
                                    };

                                    return (
                                        <tr
                                            key={transaction.transaction_id}
                                            className="hover:bg-accent/50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <code className="text-xs text-muted-foreground">
                                                    {truncateId(transaction.transaction_id, 12)}
                                                </code>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {formatDate(transaction.timestamp)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium">{truncateEmail(transaction.email, 20)}</p>
                                                    <p className="text-xs text-muted-foreground">{transaction.ip_region}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-medium">{transaction.product_name}</p>
                                                    <p className="text-xs text-muted-foreground">{transaction.category}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold">
                                                {formatCurrency(transaction.amount)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    <Badge variant="risk" riskScore={risk.score}>
                                                        {risk.score}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {transaction.is_3ds_passed ? (
                                                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                                                            ✓ Да
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs">
                                                            ✗ Нет
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center">
                                                    {getStatusBadge()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Link href={`/transactions/${transaction.transaction_id}`}>
                                                    <Button size="sm" variant="ghost">
                                                        Подробнее
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
