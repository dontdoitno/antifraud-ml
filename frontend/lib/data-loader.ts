import Papa from 'papaparse';
import { Transaction, RiskAssessment, RiskFactor } from './types';

// Load transactions from CSV file
export async function loadTransactions(): Promise<Transaction[]> {
    try {
        const response = await fetch('/data/ecommerce_fraud_dataset.csv');
        const csvText = await response.text();

        const parsed = Papa.parse<any>(csvText, {
            header: true,
            dynamicTyping: false, // Keep as strings, we'll convert manually
            skipEmptyLines: true,
        });

        // Convert CSV rows to Transaction objects
        const transactions: Transaction[] = parsed.data.map((row: any) => ({
            transaction_id: row.transaction_id,
            timestamp: row.timestamp,
            product_id: row.product_id,
            product_name: row.product_name,
            category: row.category,
            sku: row.sku,
            amount: parseFloat(row.amount) || 0,
            currency: row.currency,
            payment_method: row.payment_method,
            is_high_risk_item: row.is_high_risk_item === 'True' || row.is_high_risk_item === '1' || row.is_high_risk_item === true,
            card_bin: row.card_bin,
            card_last4: row.card_last4,
            issuer_country: row.issuer_country,
            is_3ds_passed: row.is_3ds_passed === 'True' || row.is_3ds_passed === '1' || row.is_3ds_passed === true,
            attempt_count: parseInt(row.attempt_count) || 1,
            payment_gateway: row.payment_gateway,
            customer_id: row.customer_id,
            email: row.email,
            email_domain: row.email_domain,
            email_first_seen: row.email_first_seen,
            phone: row.phone,
            phone_verified: row.phone_verified === 'True' || row.phone_verified === '1' || row.phone_verified === true,
            previous_orders: parseInt(row.previous_orders) || 0,
            previous_chargebacks: parseInt(row.previous_chargebacks) || 0,
            ip: row.ip,
            ip_country: row.ip_country,
            ip_region: row.ip_region,
            proxy: row.proxy === 'True' || row.proxy === '1' || row.proxy === true,
            vpn: row.vpn === 'True' || row.vpn === '1' || row.vpn === true,
            tor: row.tor === 'True' || row.tor === '1' || row.tor === true,
            device_id: row.device_id,
            device_os: row.device_os,
            browser: row.browser,
            is_emulator: row.is_emulator === 'True' || row.is_emulator === '1' || row.is_emulator === true,
            delivery_type: row.delivery_type,
            delivery_address: row.delivery_address,
            address_verified: row.address_verified === 'True' || row.address_verified === '1' || row.address_verified === true,
            billing_address: row.billing_address,
            addresses_match: row.addresses_match === 'True' || row.addresses_match === '1' || row.addresses_match === true,
            shipping_region: row.shipping_region,
            delivery_person: row.delivery_person,
            delivery_signature_required: row.delivery_signature_required === 'True' || row.delivery_signature_required === '1' || row.delivery_signature_required === true,
            last_mile_provider: row.last_mile_provider,
            session_length_sec: parseInt(row.session_length_sec) || 0,
            pages_viewed: parseInt(row.pages_viewed) || 0,
            time_on_checkout_sec: parseInt(row.time_on_checkout_sec) || 0,
            added_card_count: parseInt(row.added_card_count) || 1,
            cart_abandon_rate: parseFloat(row.cart_abandon_rate) || 0,
            velocity_same_card_1h: parseInt(row.velocity_same_card_1h) || 0,
            velocity_same_ip_24h: parseInt(row.velocity_same_ip_24h) || 0,
            is_fraud: row.is_fraud === 'True' || row.is_fraud === '1' || row.is_fraud === true || row.is_fraud === 'TRUE',
            fraud_type: row.fraud_type || '',
            chargeback_code: row.chargeback_code || '',
            chargeback_date: row.chargeback_date || '',
        })).filter(t => t.transaction_id); // Filter out any empty rows

        console.log(`Loaded ${transactions.length} transactions from CSV`);

        // Загрузить транзакции из API (если есть)
        let apiTransactions: Transaction[] = [];
        try {
            const apiResponse = await fetch('/data/api_transactions.json');
            if (apiResponse.ok) {
                apiTransactions = await apiResponse.json();
                console.log(`Loaded ${apiTransactions.length} API transactions`);
            }
        } catch (error) {
            console.log('No API transactions file found, using only CSV data');
        }

        // Объединить транзакции (API транзакции первыми - они свежее)
        const allTransactions = [...apiTransactions, ...transactions];

        console.log(`Total: ${allTransactions.length} transactions (${apiTransactions.length} from API, ${transactions.length} from CSV)`);
        return allTransactions;
    } catch (error) {
        console.error('Error loading transactions from CSV:', error);
        // Return empty array if loading fails
        return [];
    }
}


export function calculateRiskScore(transaction: Transaction): RiskAssessment {
    // Если risk_score уже есть в транзакции (из API), используем его
    if (transaction.risk_score !== undefined && transaction.risk_score !== null) {
        let level: 'low' | 'medium' | 'high' = 'low';
        if (transaction.risk_score >= 80) level = 'high';
        else if (transaction.risk_score >= 50) level = 'medium';

        // Преобразуем строковые факторы из backend в RiskFactor объекты
        const backendFactors = transaction.risk_factors || [];
        const factors: RiskFactor[] = backendFactors.map(factorText => {
            // Определяем уровень влияния по ключевым словам
            let impact: 'low' | 'medium' | 'high' = 'medium';
            const highKeywords = ['VPN', 'Proxy', 'Tor', 'эмулятор', 'чарджбек', '3D Secure'];
            const lowKeywords = ['Телефон', 'Адрес доставки не подтвержден'];

            if (highKeywords.some(keyword => factorText.includes(keyword))) {
                impact = 'high';
            } else if (lowKeywords.some(keyword => factorText.includes(keyword))) {
                impact = 'low';
            }

            return {
                name: factorText,
                description: factorText,
                impact,
                value: true
            };
        });

        return {
            score: transaction.risk_score,
            level,
            confidence: transaction.fraud_probability || 0.5,
            factors  // Используем факторы из backend!
        };
    }

    // Иначе рассчитываем самостоятельно (для CSV транзакций)
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
