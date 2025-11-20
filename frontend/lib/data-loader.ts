import Papa from 'papaparse';
import { Transaction, RiskAssessment, RiskFactor } from './types';

// Since CSV files are gitignored, we'll create mock data based on the structure
// In production, this would read from the actual CSV file
export async function loadTransactions(): Promise<Transaction[]> {
    // For demo purposes, we'll return mock data structured like the real CSV
    // In production, you would use: const response = await fetch('/data/ecommerce_fraud_dataset.csv');

    return MOCK_TRANSACTIONS;
}

export function calculateRiskScore(transaction: Transaction): RiskAssessment {
    let score = 0;
    const factors: RiskFactor[] = [];

    // High risk item
    if (transaction.is_high_risk_item) {
        score += 20;
        factors.push({
            name: 'Товар высокого риска',
            description: 'Продукт в категории высокого риска (игровая консоль, VR)',
            impact: 'high',
            value: true
        });
    }

    // 3DS not passed
    if (!transaction.is_3ds_passed) {
        score += 25;
        factors.push({
            name: '3DS не пройдена',
            description: '3D Secure аутентификация не была выполнена',
            impact: 'high',
            value: false
        });
    }

    // Multiple payment attempts
    if (transaction.attempt_count > 1) {
        score += transaction.attempt_count * 10;
        factors.push({
            name: 'Множественные попытки оплаты',
            description: `${transaction.attempt_count} попытки оплаты`,
            impact: 'medium',
            value: transaction.attempt_count
        });
    }

    // VPN/Proxy/Tor usage
    if (transaction.vpn || transaction.proxy || transaction.tor) {
        score += 30;
        factors.push({
            name: 'Подозрительный IP',
            description: 'Использование VPN, Proxy или Tor',
            impact: 'high',
            value: true
        });
    }

    // Emulator detected
    if (transaction.is_emulator) {
        score += 35;
        factors.push({
            name: 'Эмулятор устройства',
            description: 'Обнаружено использование эмулятора',
            impact: 'high',
            value: true
        });
    }

    // Address mismatch
    if (!transaction.addresses_match) {
        score += 15;
        factors.push({
            name: 'Несовпадение адресов',
            description: 'Адрес доставки не совпадает с платежным адресом',
            impact: 'medium',
            value: false
        });
    }

    // High velocity
    if (transaction.velocity_same_card_1h > 2) {
        score += 20;
        factors.push({
            name: 'Высокая частота транзакций',
            description: `${transaction.velocity_same_card_1h} транзакций с той же карты за час`,
            impact: 'high',
            value: transaction.velocity_same_card_1h
        });
    }

    if (transaction.velocity_same_ip_24h > 5) {
        score += 15;
        factors.push({
            name: 'Множество транзакций с IP',
            description: `${transaction.velocity_same_ip_24h} транзакций с того же IP за 24 часа`,
            impact: 'medium',
            value: transaction.velocity_same_ip_24h
        });
    }

    // Previous chargebacks
    if (transaction.previous_chargebacks > 0) {
        score += transaction.previous_chargebacks * 30;
        factors.push({
            name: 'История чарджбэков',
            description: `${transaction.previous_chargebacks} предыдущих чарджбэков`,
            impact: 'high',
            value: transaction.previous_chargebacks
        });
    }

    // Phone not verified
    if (!transaction.phone_verified) {
        score += 10;
        factors.push({
            name: 'Телефон не подтвержден',
            description: 'Номер телефона не прошел верификацию',
            impact: 'low',
            value: false
        });
    }

    // Address not verified
    if (!transaction.address_verified) {
        score += 10;
        factors.push({
            name: 'Адрес не подтвержден',
            description: 'Адрес доставки не верифицирован',
            impact: 'low',
            value: false
        });
    }

    // High cart abandonment rate
    if (transaction.cart_abandon_rate > 0.3) {
        score += 10;
        factors.push({
            name: 'Высокий показатель брошенных корзин',
            description: `${(transaction.cart_abandon_rate * 100).toFixed(0)}% корзин не оформлены`,
            impact: 'low',
            value: `${(transaction.cart_abandon_rate * 100).toFixed(0)}%`
        });
    }

    // New email
    const emailAge = new Date().getTime() - new Date(transaction.email_first_seen).getTime();
    const daysSinceEmailCreated = emailAge / (1000 * 60 * 60 * 24);
    if (daysSinceEmailCreated < 30) {
        score += 15;
        factors.push({
            name: 'Новый email',
            description: `Email зарегистрирован ${Math.floor(daysSinceEmailCreated)} дней назад`,
            impact: 'medium',
            value: `${Math.floor(daysSinceEmailCreated)} дней`
        });
    }

    // Ensure score doesn't exceed 100
    score = Math.min(100, score);

    // Calculate confidence based on number of factors
    const confidence = Math.min(0.95, 0.5 + (factors.length * 0.05));

    let level: 'low' | 'medium' | 'high' = 'low';
    if (score >= 80) level = 'high';
    else if (score >= 50) level = 'medium';

    return {
        score,
        level,
        confidence,
        factors: factors.sort((a, b) => {
            const impactOrder = { high: 0, medium: 1, low: 2 };
            return impactOrder[a.impact] - impactOrder[b.impact];
        })
    };
}

// Mock transactions data based on real CSV structure
const MOCK_TRANSACTIONS: Transaction[] = [
    {
        transaction_id: "TXN-446703939",
        timestamp: "2025-07-31T00:51:19.365975Z",
        product_id: "PSVR2-01",
        product_name: "PlayStation VR2",
        category: "vr_headsets",
        sku: "PSVR2-1000",
        amount: 77174,
        currency: "RUB",
        payment_method: "card",
        is_high_risk_item: true,
        card_bin: "556048",
        card_last4: "8465",
        issuer_country: "RU",
        is_3ds_passed: true,
        attempt_count: 1,
        payment_gateway: "Yandex.Kassa",
        customer_id: "USER-825483",
        email: "юрий.gamer1994@mail.ru",
        email_domain: "mail.ru",
        email_first_seen: "2021-10-31",
        phone: "+79861549690",
        phone_verified: true,
        previous_orders: 15,
        previous_chargebacks: 0,
        ip: "148.153.15.198",
        ip_country: "RU",
        ip_region: "Краснодар",
        proxy: false,
        vpn: false,
        tor: false,
        device_id: "device_fpr_59457132",
        device_os: "macOS",
        browser: "Edge 111",
        is_emulator: false,
        delivery_type: "courier",
        delivery_address: "Краснодар, ул. Первомайская, д. 23, кв. 42",
        address_verified: true,
        billing_address: "Краснодар, ул. Первомайская, д. 23, кв. 42",
        addresses_match: true,
        shipping_region: "Краснодар",
        delivery_person: "Николай Морозов",
        delivery_signature_required: true,
        last_mile_provider: "СДЭК",
        session_length_sec: 1632,
        pages_viewed: 11,
        time_on_checkout_sec: 194,
        added_card_count: 2,
        cart_abandon_rate: 0.02,
        velocity_same_card_1h: 1,
        velocity_same_ip_24h: 7,
        is_fraud: false,
        fraud_type: "",
        chargeback_code: "",
        chargeback_date: ""
    },
    {
        transaction_id: "TXN-418569014",
        timestamp: "2025-11-02T05:51:19.317718Z",
        product_id: "DUALSE-01",
        product_name: "DualSense Wireless Controller",
        category: "accessories",
        sku: "DUALSE-WH",
        amount: 8319,
        currency: "RUB",
        payment_method: "card",
        is_high_risk_item: true,
        card_bin: "556048",
        card_last4: "1152",
        issuer_country: "RU",
        is_3ds_passed: true,
        attempt_count: 1,
        payment_gateway: "Yandex.Kassa",
        customer_id: "USER-985162",
        email: "николай.gamer2000@mail.ru",
        email_domain: "mail.ru",
        email_first_seen: "2025-04-01",
        phone: "+79684261365",
        phone_verified: false,
        previous_orders: 14,
        previous_chargebacks: 0,
        ip: "171.188.165.45",
        ip_country: "RU",
        ip_region: "Воронеж",
        proxy: false,
        vpn: false,
        tor: false,
        device_id: "device_fpr_85557757",
        device_os: "Linux",
        browser: "Edge 118",
        is_emulator: false,
        delivery_type: "pickup",
        delivery_address: "Воронеж, ул. Центральная, д. 170, кв. 24",
        address_verified: true,
        billing_address: "Воронеж, ул. Центральная, д. 170, кв. 24",
        addresses_match: true,
        shipping_region: "Воронеж",
        delivery_person: "Сергей Орлов",
        delivery_signature_required: true,
        last_mile_provider: "Яндекс.Доставка",
        session_length_sec: 430,
        pages_viewed: 17,
        time_on_checkout_sec: 278,
        added_card_count: 1,
        cart_abandon_rate: 0.15,
        velocity_same_card_1h: 2,
        velocity_same_ip_24h: 2,
        is_fraud: false,
        fraud_type: "",
        chargeback_code: "",
        chargeback_date: ""
    },
    // Add more mock transactions...
];

// Add 20 more realistic mock transactions with varying risk levels
for (let i = 0; i < 20; i++) {
    const isHighRisk = Math.random() > 0.7;
    const isFraud = Math.random() > 0.85;

    MOCK_TRANSACTIONS.push({
        transaction_id: `TXN-${Math.floor(Math.random() * 900000000) + 100000000}`,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        product_id: isHighRisk ? "PS5-SLIM-01" : "PSPLUS-12",
        product_name: isHighRisk ? "PlayStation 5 Slim" : "PlayStation Plus (12 мес)",
        category: isHighRisk ? "game_consoles" : "subscriptions",
        sku: isHighRisk ? "PS5SLIM-825SSD" : "PSPLUS-12M",
        amount: isHighRisk ? Math.floor(Math.random() * 30000) + 50000 : Math.floor(Math.random() * 3000) + 500,
        currency: "RUB",
        payment_method: "card",
        is_high_risk_item: isHighRisk,
        card_bin: ["556048", "538012", "546955"][Math.floor(Math.random() * 3)],
        card_last4: String(Math.floor(Math.random() * 9000) + 1000),
        issuer_country: "RU",
        is_3ds_passed: !isFraud || Math.random() > 0.5,
        attempt_count: isFraud ? Math.floor(Math.random() * 3) + 1 : 1,
        payment_gateway: ["Yandex.Kassa", "TinkoffPay", "Raiffeisenbank"][Math.floor(Math.random() * 3)],
        customer_id: `USER-${Math.floor(Math.random() * 900000) + 100000}`,
        email: `user${i}@mail.ru`,
        email_domain: "mail.ru",
        email_first_seen: new Date(Date.now() - Math.random() * 1000 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        phone: `+7968${Math.floor(Math.random() * 9000000) + 1000000}`,
        phone_verified: !isFraud || Math.random() > 0.3,
        previous_orders: Math.floor(Math.random() * 20),
        previous_chargebacks: isFraud ? Math.floor(Math.random() * 2) : 0,
        ip: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        ip_country: "RU",
        ip_region: ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск"][Math.floor(Math.random() * 5)],
        proxy: isFraud && Math.random() > 0.7,
        vpn: isFraud && Math.random() > 0.6,
        tor: isFraud && Math.random() > 0.9,
        device_id: `device_fpr_${Math.floor(Math.random() * 90000000) + 10000000}`,
        device_os: ["Windows", "macOS", "Linux", "Android", "iOS"][Math.floor(Math.random() * 5)],
        browser: ["Chrome", "Firefox", "Safari", "Edge", "Opera"][Math.floor(Math.random() * 5)] + ` ${Math.floor(Math.random() * 20) + 100}`,
        is_emulator: isFraud && Math.random() > 0.8,
        delivery_type: Math.random() > 0.5 ? "courier" : "pickup",
        delivery_address: `Москва, ул. Тестовая, д. ${Math.floor(Math.random() * 200)}, кв. ${Math.floor(Math.random() * 100)}`,
        address_verified: !isFraud || Math.random() > 0.3,
        billing_address: `Москва, ул. Тестовая, д. ${Math.floor(Math.random() * 200)}, кв. ${Math.floor(Math.random() * 100)}`,
        addresses_match: !isFraud || Math.random() > 0.4,
        shipping_region: "Москва",
        delivery_person: ["Иван Петров", "Сергей Иванов", "Алексей Смирнов"][Math.floor(Math.random() * 3)],
        delivery_signature_required: true,
        last_mile_provider: ["СДЭК", "DPD", "Почта России"][Math.floor(Math.random() * 3)],
        session_length_sec: Math.floor(Math.random() * 2000) + 100,
        pages_viewed: Math.floor(Math.random() * 20) + 3,
        time_on_checkout_sec: Math.floor(Math.random() * 300) + 50,
        added_card_count: isFraud ? Math.floor(Math.random() * 3) + 1 : 1,
        cart_abandon_rate: Math.random() * 0.3,
        velocity_same_card_1h: isFraud ? Math.floor(Math.random() * 4) : Math.floor(Math.random() * 2),
        velocity_same_ip_24h: isFraud ? Math.floor(Math.random() * 10) + 3 : Math.floor(Math.random() * 5),
        is_fraud: isFraud,
        fraud_type: isFraud ? ["stolen_card", "friendly_fraud", "velocity_attack"][Math.floor(Math.random() * 3)] : "",
        chargeback_code: "",
        chargeback_date: ""
    });
}

export { MOCK_TRANSACTIONS };
