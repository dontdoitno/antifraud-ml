"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, User, Smartphone, MapPin, Package, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadTransactions, calculateRiskScore } from "@/lib/data-loader";
import { Transaction, RiskAssessment } from "@/lib/types";
import { formatCurrency, formatDate, formatPhoneNumber } from "@/lib/utils";

export default function TransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [transaction, setTransaction] = useState<Transaction | null>(null);
    const [risk, setRisk] = useState<RiskAssessment | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTransactions().then((transactions) => {
            const found = transactions.find(t => t.transaction_id === resolvedParams.id);
            if (found) {
                setTransaction(found);
                setRisk(calculateRiskScore(found));
            }
            setLoading(false);
        });
    }, [resolvedParams.id]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                    <p className="text-sm text-muted-foreground">Загрузка транзакции...</p>
                </div>
            </div>
        );
    }

    if (!transaction || !risk) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-3">
                    <XCircle className="h-12 w-12 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">Транзакция не найдена</p>
                    <Link href="/transactions">
                        <Button variant="outline">Вернуться к списку</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const getRiskIcon = () => {
        if (risk.score >= 80) return <AlertTriangle className="h-6 w-6 text-risk-high" />;
        if (risk.score >= 50) return <Shield className="h-6 w-6 text-risk-medium" />;
        return <CheckCircle className="h-6 w-6 text-risk-low" />;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/transactions">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold tracking-tight">Детали транзакции</h1>
                    <p className="text-muted-foreground">ID: {transaction.transaction_id}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                        Одобрить
                    </Button>
                    <Button variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">
                        Заблокировать
                    </Button>
                    <Button variant="outline">
                        Запросить проверку
                    </Button>
                </div>
            </div>

            {/* Risk Score Card */}
            <Card className="border-2">
                <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Risk Gauge */}
                        <div className="flex flex-col items-center justify-center">
                            <div className="relative">
                                <svg className="w-40 h-40 transform -rotate-90">
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke="hsl(var(--muted))"
                                        strokeWidth="12"
                                        fill="none"
                                    />
                                    <circle
                                        cx="80"
                                        cy="80"
                                        r="70"
                                        stroke={risk.score >= 80 ? '#ef4444' : risk.score >= 50 ? '#f59e0b' : '#10b981 '}
                                        strokeWidth="12"
                                        fill="none"
                                        strokeDasharray={`${(risk.score / 100) * 439.6} 439.6`}
                                        strokeLinecap="round"
                                        className="transition-all duration-1000"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    {getRiskIcon()}
                                    <p className="text-4xl font-bold mt-2">{risk.score}</p>
                                    <p className="text-xs text-muted-foreground uppercase">Risk Score</p>
                                </div>
                            </div>
                        </div>

                        {/* Risk Info */}
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h3 className="text-lg font-semibold">Оценка риска</h3>
                                    <Badge variant="risk" riskScore={risk.score}>
                                        {risk.level === 'high' ? 'Высокий риск' : risk.level === 'medium' ? 'Средний риск' : 'Низкий риск'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Уверенность модели: <span className="font-semibold">{(risk.confidence * 100).toFixed(1)}%</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg border border-border p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Сумма транзакции</p>
                                    <p className="text-xl font-bold">{formatCurrency(transaction.amount)}</p>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Время</p>
                                    <p className="text-xl font-bold">{formatDate(transaction.timestamp)}</p>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <p className="text-xs text-muted-foreground mb-1">Платежный метод</p>
                                    <p className="text-sm font-medium">
                                        {transaction.payment_gateway} • •••• {transaction.card_last4}
                                    </p>
                                </div>
                                <div className="rounded-lg border border-border p-3">
                                    <p className="text-xs text-muted-foreground mb-1">3D Secure</p>
                                    <p className="text-sm font-medium">
                                        {transaction.is_3ds_passed ? (
                                            <span className="text-green-500">✓ Пройдена</span>
                                        ) : (
                                            <span className="text-red-500">✗ Не пройдена</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card>
                <CardHeader>
                    <CardTitle>Факторы риска</CardTitle>
                    <CardDescription>Причины, повлиявшие на оценку</CardDescription>
                </CardHeader>
                <CardContent>
                    {risk.factors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
                            <p>Подозрительных факторов не обнаружено</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {risk.factors.map((factor, index) => (
                                <div
                                    key={index}
                                    className={`flex items-start gap-3 p-4 rounded-lg border ${factor.impact === 'high' ? 'border-risk-high/20 bg-risk-high/5' :
                                            factor.impact === 'medium' ? 'border-risk-medium/20 bg-risk-medium/5' :
                                                'border-risk-low/20 bg-risk-low/5'
                                        }`}
                                >
                                    <div className="mt-0.5">
                                        {factor.impact === 'high' ? (
                                            <AlertTriangle className="h-5 w-5 text-risk-high" />
                                        ) : factor.impact === 'medium' ? (
                                            <Shield className="h-5 w-5 text-risk-medium" />
                                        ) : (
                                            <AlertTriangle className="h-5 w-5 text-risk-low" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-sm">{factor.name}</h4>
                                            <Badge
                                                className={`text-xs ${factor.impact === 'high' ? 'bg-risk-high/10 text-risk-high border-risk-high/20' :
                                                        factor.impact === 'medium' ? 'bg-risk-medium/10 text-risk-medium border-risk-medium/20' :
                                                            'bg-risk-low/10 text-risk-low border-risk-low/20'
                                                    }`}
                                            >
                                                {factor.impact === 'high' ? 'Высокий' : factor.impact === 'medium' ? 'Средний' : 'Низкий'} impact
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <CardTitle>Информация о клиенте</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">ID клиента</p>
                            <p className="font-mono text-sm">{transaction.customer_id}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Email</p>
                            <p className="text-sm">{transaction.email}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Зарегистрирован: {new Date(transaction.email_first_seen).toLocaleDateString('ru-RU')}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Телефон</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm">{formatPhoneNumber(transaction.phone)}</p>
                                {transaction.phone_verified ? (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                                        Подтвержден
                                    </Badge>
                                ) : (
                                    <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                        Не подтвержден
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="rounded-lg border border-border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Заказов</p>
                                <p className="text-2xl font-bold">{transaction.previous_orders}</p>
                            </div>
                            <div className="rounded-lg border border-border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Чарджбэков</p>
                                <p className={`text-2xl font-bold ${transaction.previous_chargebacks > 0 ? 'text-risk-high' : ''}`}>
                                    {transaction.previous_chargebacks}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Device & IP */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-5 w-5" />
                            <CardTitle>Устройство и IP</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">IP адрес</p>
                            <p className="font-mono text-sm">{transaction.ip}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {transaction.ip_region}, {transaction.ip_country}
                            </p>
                        </div>
                        {(transaction.vpn || transaction.proxy || transaction.tor) && (
                            <div className="rounded-lg border border-risk-high/20 bg-risk-high/5 p-3">
                                <p className="text-sm font-semibold text-risk-high mb-1">⚠️ Suspicious Network</p>
                                <div className="flex gap-2">
                                    {transaction.vpn && <Badge className="bg-risk-high/10 text-risk-high">VPN</Badge>}
                                    {transaction.proxy && <Badge className="bg-risk-high/10 text-risk-high">Proxy</Badge>}
                                    {transaction.tor && <Badge className="bg-risk-high/10 text-risk-high">Tor</Badge>}
                                </div>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Устройство</p>
                            <p className="text-sm">{transaction.device_os} • {transaction.browser}</p>
                            <p className="font-mono text-xs text-muted-foreground mt-1">{transaction.device_id}</p>
                        </div>
                        {transaction.is_emulator && (
                            <div className="rounded-lg border border-risk-high/20 bg-risk-high/5 p-3">
                                <p className="text-sm font-semibold text-risk-high">⚠️ Эмулятор обнаружен</p>
                            </div>
                        )}
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="rounded-lg border border-border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Velocity IP/24h</p>
                                <p className="text-2xl font-bold">{transaction.velocity_same_ip_24h}</p>
                            </div>
                            <div className="rounded-lg border border-border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Velocity Card/1h</p>
                                <p className="text-2xl font-bold">{transaction.velocity_same_card_1h}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-5 w-5" />
                            <CardTitle>Информация о доставке</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Тип доставки</p>
                            <p className="text-sm capitalize">{transaction.delivery_type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Адрес доставки</p>
                            <p className="text-sm">{transaction.delivery_address}</p>
                            {transaction.address_verified ? (
                                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 mt-2">
                                    Адрес подтвержден
                                </Badge>
                            ) : (
                                <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 mt-2">
                                    Адрес не подтвержден
                                </Badge>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Платежный адрес</p>
                            <p className="text-sm">{transaction.billing_address}</p>
                        </div>
                        {!transaction.addresses_match && (
                            <div className="rounded-lg border border-risk-medium/20 bg-risk-medium/5 p-3">
                                <p className="text-sm font-semibold text-risk-medium">⚠️ Адреса не совпадают</p>
                            </div>
                        )}
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Курьер</p>
                            <p className="text-sm">{transaction.delivery_person} • {transaction.last_mile_provider}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Information */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            <CardTitle>Информация о товаре</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Название</p>
                            <p className="text-sm font-semibold">{transaction.product_name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Категория</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm">{transaction.category}</p>
                                {transaction.is_high_risk_item && (
                                    <Badge className="bg-risk-high/10 text-risk-high border-risk-high/20">
                                        Высокий риск
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">SKU</p>
                            <p className="font-mono text-sm">{transaction.sku}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">Product ID</p>
                            <p className="font-mono text-sm">{transaction.product_id}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-3">
                            <div className="rounded-lg border border-border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Попытки оплаты</p>
                                <p className="text-2xl font-bold">{transaction.attempt_count}</p>
                            </div>
                            <div className="rounded-lg border border-border p-3">
                                <p className="text-xs text-muted-foreground mb-1">Время на checkout</p>
                                <p className="text-2xl font-bold">{transaction.time_on_checkout_sec}с</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
