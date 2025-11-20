export interface Transaction {
    transaction_id: string;
    timestamp: string;
    product_id: string;
    product_name: string;
    category: string;
    sku: string;
    amount: number;
    currency: string;
    payment_method: string;
    is_high_risk_item: boolean;
    card_bin: string;
    card_last4: string;
    issuer_country: string;
    is_3ds_passed: boolean;
    attempt_count: number;
    payment_gateway: string;
    customer_id: string;
    email: string;
    email_domain: string;
    email_first_seen: string;
    phone: string;
    phone_verified: boolean;
    previous_orders: number;
    previous_chargebacks: number;
    ip: string;
    ip_country: string;
    ip_region: string;
    proxy: boolean;
    vpn: boolean;
    tor: boolean;
    device_id: string;
    device_os: string;
    browser: string;
    is_emulator: boolean;
    delivery_type: string;
    delivery_address: string;
    address_verified: boolean;
    billing_address: string;
    addresses_match: boolean;
    shipping_region: string;
    delivery_person: string;
    delivery_signature_required: boolean;
    last_mile_provider: string;
    session_length_sec: number;
    pages_viewed: number;
    time_on_checkout_sec: number;
    added_card_count: number;
    cart_abandon_rate: number;
    velocity_same_card_1h: number;
    velocity_same_ip_24h: number;
    is_fraud: boolean;
    fraud_type: string;
    chargeback_code: string;
    chargeback_date: string;
}

export interface RiskAssessment {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high';
    confidence: number; // 0-1
    factors: RiskFactor[];
}

export interface RiskFactor {
    name: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    value: string | number | boolean;
}

export interface Customer {
    customer_id: string;
    email: string;
    phone: string;
    phone_verified: boolean;
    previous_orders: number;
    previous_chargebacks: number;
    email_first_seen: string;
    total_spent: number;
    avg_order_value: number;
    risk_score: number;
}

export interface DashboardStats {
    fraud_rate: number;
    blocked_transactions: number;
    approved_transactions: number;
    pending_transactions: number;
    total_savings: number;
    model_accuracy: number;
    avg_risk_score: number;
    high_risk_count: number;
}

export interface TransactionStatus {
    status: 'approved' | 'blocked' | 'pending' | 'review';
    updated_at: string;
    updated_by?: string;
    reason?: string;
}

export interface FraudTrend {
    date: string;
    fraud_attempts: number;
    blocked: number;
    approved: number;
    total: number;
}

export interface RegionRisk {
    region: string;
    transaction_count: number;
    fraud_count: number;
    risk_score: number;
}

export interface Evidence {
    id: string;
    transaction_id: string;
    type: 'document' | 'screenshot' | 'email' | 'tracking' | 'signature' | 'other';
    description: string;
    file_url?: string;
    collected_at: string;
    collected_by: string;
}
