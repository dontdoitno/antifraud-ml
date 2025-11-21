import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function formatCurrency(amount: number, currency: string = 'RUB'): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('ru-RU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
    const now = new Date();
    const target = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - target.getTime()) / 1000);

    if (diffInSeconds < 60) return 'только что';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} д назад`;

    return formatDate(date);
}

export function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
}

export function getRiskColor(score: number): string {
    if (score >= 80) return 'text-risk-high';
    if (score >= 50) return 'text-risk-medium';
    return 'text-risk-low';
}

export function getRiskBgColor(score: number): string {
    if (score >= 80) return 'bg-risk-high/10 text-risk-high border-risk-high/20';
    if (score >= 50) return 'bg-risk-medium/10 text-risk-medium border-risk-medium/20';
    return 'bg-risk-low/10 text-risk-low border-risk-low/20';
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'approved': return 'bg-status-approved/10 text-status-approved border-status-approved/20';
        case 'blocked': return 'bg-status-blocked/10 text-status-blocked border-status-blocked/20';
        case 'pending': return 'bg-status-pending/10 text-status-pending border-status-pending/20';
        case 'review': return 'bg-status-review/10 text-status-review border-status-review/20';
        default: return 'bg-muted text-muted-foreground';
    }
}

export function truncateEmail(email: string, maxLength: number = 25): string {
    if (email.length <= maxLength) return email;
    const [localPart, domain] = email.split('@');
    if (localPart.length > maxLength - domain.length - 4) {
        return `${localPart.slice(0, maxLength - domain.length - 7)}...@${domain}`;
    }
    return email;
}

export function formatPhoneNumber(phone: string): string {
    // Format Russian phone numbers: +7 (XXX) XXX-XX-XX
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('7') && cleaned.length === 11) {
        return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
}

export function truncateId(id: string, prefix: number = 10): string {
    return id.length > prefix ? `${id.slice(0, prefix)}...` : id;
}

export function calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}
