# 🔴 Примеры FRAUD транзакций - ПОЛНАЯ ВЕРСИЯ

## ⚠️ ВАЖНО: Используйте ЭТИ примеры для тестирования!

Эти примеры содержат **ВСЕ поля из CSV**, необходимые для правильной работы ML модели.

---

## 📋 Request #1: Reseller Fraud + VPN (TXN-850592075)

### Характеристики:
- 🚨 **VPN используется** (критично!)
- 🚨 Адреса не совпадают (Москва ≠ Волгоград)
- 🚨 Новый пользователь + 1 chargeback
- 🚨 Высокая velocity (11 транзакций с того же IP)
- 🚨 Карта из Украины
- 💰 Дорогой товар (74,990 ₽)

### JSON для Postman:

```json
{
  "type": "PAYMENT",
  "amount": 74990,
  "nameOrig": "C985922",
  "oldbalanceOrg": 80000,
  "newbalanceOrig": 5010,
  "nameDest": "M123456",
  "oldbalanceDest": 500000,
  "newbalanceDest": 574990,
  
  "ip_address": "182.94.126.113",
  "device_id": "device_fpr_39591801",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Opera/115.0.0.0",
  "location": "Краснодар",
  
  "email": "new.user24052@mail.ru",
  "email_domain": "mail.ru",
  "email_first_seen": "2025-11-11",
  "phone": "+79346446820",
  "phone_verified": false,
  "previous_orders": 0,
  "previous_chargebacks": 1,
  
  "product_id": "PSVR2-01",
  "product_name": "PlayStation VR2",
  "category": "vr_headsets",
  "sku": "PSVR2-1000",
  "is_high_risk_item": true,
  
  "customer_id": "USER-985922",
  "payment_method": "card",
  "payment_gateway": "Yandex.Kassa",
  "currency": "RUB",
  
  "card_bin": "427650",
  "card_last4": "1472",
  "issuer_country": "UA",
  "is_3ds_passed": true,
  "attempt_count": 2,
  
  "ip_country": "RU",
  "ip_region": "Краснодар",
  "proxy": false,
  "vpn": true,
  "tor": false,
  
  "device_os": "macOS",
  "browser": "Opera 115",
  "is_emulator": false,
  
  "delivery_type": "pickup",
  "delivery_address": "Москва, пункт выдачи №160",
  "address_verified": false,
  "billing_address": "Волгоград, пр. Мира, д. 139",
  "addresses_match": false,
  "shipping_region": "Москва",
  "delivery_person": "Виктор Козлов",
  "delivery_signature_required": true,
  "last_mile_provider": "СДЭК",
  
  "session_length_sec": 525,
  "pages_viewed": 12,
  "time_on_checkout_sec": 89,
  "added_card_count": 1,
  "cart_abandon_rate": 0.05,
  "velocity_same_card_1h": 3,
  "velocity_same_ip_24h": 11
}
```

**Ожидаемый результат:**
- `is_fraud`: **true** 🔴
- `risk_score`: **85-95**
- `risk_level`: **HIGH**
- Статус: **"Заблокирована"**

---

## 📋 Request #2: Reseller Fraud + Emulator (TXN-253152802)

### Характеристики:
- 🚨 **Эмулятор устройства** (критично!)
- 🚨 Адреса не совпадают (Москва ≠ Омск)
- 🚨 2 предыдущих chargeback
- 🚨 3DS не пройдена
- 🚨 Карта из Украины
- ⚠️ Новый email (зарегистрирован 2025-11-12)

```json
{
  "type": "PAYMENT",
  "amount": 49990,
  "nameOrig": "C120997",
  "oldbalanceOrg": 55000,
  "newbalanceOrig": 5010,
  "nameDest": "M999888",
  "oldbalanceDest": 300000,
  "newbalanceDest": 349990,
  
  "ip_address": "83.52.179.182",
  "device_id": "device_fpr_48892263",
  "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile Safari/604.1 Firefox/114.0",
  "location": "Волгоград",
  
  "email": "new.user87988@mail.ru",
  "email_domain": "mail.ru",
  "email_first_seen": "2025-11-12",
  "phone": "+79125010112",
  "phone_verified": true,
  "previous_orders": 2,
  "previous_chargebacks": 2,
  
  "product_id": "PS5-STD-01",
  "product_name": "PlayStation 5 Standard",
  "category": "game_consoles",
  "sku": "PS5STD-825SSD",
  "is_high_risk_item": true,
  
  "customer_id": "USER-120997",
  "payment_method": "card",
  "payment_gateway": "Yandex.Kassa",
  "currency": "RUB",
  
  "card_bin": "427650",
  "card_last4": "4988",
  "issuer_country": "UA",
  "is_3ds_passed": false,
  "attempt_count": 3,
  
  "ip_country": "RU",
  "ip_region": "Волгоград",
  "proxy": false,
  "vpn": false,
  "tor": false,
  
  "device_os": "iOS",
  "browser": "Firefox 114",
  "is_emulator": true,
  
  "delivery_type": "pickup",
  "delivery_address": "Москва, пункт выдачи №161",
  "address_verified": false,
  "billing_address": "Омск, ул. Советская, д. 93",
  "addresses_match": false,
  "shipping_region": "Москва",
  "delivery_person": "Иван Соколов",
  "delivery_signature_required": true,
  "last_mile_provider": "СДЭК",
  
  "session_length_sec": 243,
  "pages_viewed": 19,
  "time_on_checkout_sec": 137,
  "added_card_count": 1,
  "cart_abandon_rate": 0.05,
  "velocity_same_card_1h": 1,
  "velocity_same_ip_24h": 9
}
```

**Ожидаемый результат:**
- `is_fraud`: **true** 🔴
- `risk_score`: **90-95**
- `risk_level`: **HIGH**
- Статус: **"Заблокирована"**

---

## 📋 Request #3: Friendly Fraud (TXN-710876864)

### Характеристики:
- 🔴 **2 предыдущих chargeback** (history fraud!)
- ⚠️ Новый email
- ⚠️ Высокий cart abandonment (33%)
- ⚠️ Новый пользователь (0 заказов)
- ✅ Но: 3DS пройдена, адреса совпадают

```json
{
  "type": "PAYMENT",
  "amount": 59990,
  "nameOrig": "C111809",
  "oldbalanceOrg": 65000,
  "newbalanceOrig": 5010,
  "nameDest": "M111222",
  "oldbalanceDest": 400000,
  "newbalanceDest": 459990,
  
  "ip_address": "52.209.15.136",
  "device_id": "device_fpr_50992419",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Opera/102.0.0.0",
  "location": "Волгоград",
  
  "email": "new.user61457@mail.ru",
  "email_domain": "mail.ru",
  "email_first_seen": "2025-11-19",
  "phone": "+79033291232",
  "phone_verified": false,
  "previous_orders": 0,
  "previous_chargebacks": 2,
  
  "product_id": "PS5-SLIM-01",
  "product_name": "PlayStation 5 Slim",
  "category": "game_consoles",
  "sku": "PS5SLIM-825SSD",
  "is_high_risk_item": true,
  
  "customer_id": "USER-111809",
  "payment_method": "card",
  "payment_gateway": "Sberbank",
  "currency": "RUB",
  
  "card_bin": "554395",
  "card_last4": "3261",
  "issuer_country": "RU",
  "is_3ds_passed": true,
  "attempt_count": 1,
  
  "ip_country": "RU",
  "ip_region": "Волгоград",
  "proxy": false,
  "vpn": false,
  "tor": false,
  
  "device_os": "Windows",
  "browser": "Opera 102",
  "is_emulator": false,
  
  "delivery_type": "pickup",
  "delivery_address": "Волгоград, ул. Первомайская, д. 23, кв. 131",
  "address_verified": false,
  "billing_address": "Волгоград, ул. Первомайская, д. 23, кв. 131",
  "addresses_match": true,
  "shipping_region": "Волгоград",
  "delivery_person": "Сергей Петров",
  "delivery_signature_required": true,
  "last_mile_provider": "DPD",
  
  "session_length_sec": 214,
  "pages_viewed": 9,
  "time_on_checkout_sec": 186,
  "added_card_count": 2,
  "cart_abandon_rate": 0.33,
  "velocity_same_card_1h": 2,
  "velocity_same_ip_24h": 7
}
```

**Ожидаемый результат:**
- `is_fraud`: **true** 🔴
- `risk_score`: **70-85**
- `risk_level`: **MEDIUM/HIGH**
- Статус: **"На проверке"** или **"Заблокирована"**

---

## 📊 Сравнительная таблица

| Фактор | Request #1 | Request #2 | Request #3 |
|--------|------------|------------|------------|
| **VPN** | ✅ Да | ❌ Нет | ❌ Нет |
| **Эмулятор** | ❌ Нет | ✅ Да | ❌ Нет |
| **3DS** | ✅ Пройдена | ❌ Не пройдена | ✅ Пройдена |
| **Chargebacks** | 1 | 2 | 2 |
| **Карта** | 🇺🇦 UA | 🇺🇦 UA | 🇷🇺 RU |
| **Адреса** | ❌ Не совпадают | ❌ Не совпадают | ✅ Совпадают |
| **Velocity IP (24h)** | 11 | 9 | 7 |
| **Cart Abandon** | 5% | 5% | 33% |
| **Risk Level** | 🔴 HIGH (90+) | 🔴 HIGH (95+) | 🟡 MEDIUM-HIGH (75+) |

---

## 🎯 Как использовать

1. **Скопируйте любой JSON** выше
2. **Postman:**
   - Method: `POST`
   - URL: `http://localhost:8000/api/v1/analyze`
   - Headers: `Content-Type: application/json`
   - Body: Вставьте JSON
3. **Нажмите Send**
4. **Смотрите в браузер** → http://localhost:3000/transactions
5. **Транзакция появится** с 🔴 красным badge!

---

## 💡 Почему эти транзакции — FRAUD?

### Request #1 (Самый опасный)
- **VPN** скрывает реальный IP
- Несовпадение адресов (часто у мошенников)
- Высокая velocity (массовые покупки)
- Иностранная карта

### Request #2 (Технический fraud)
- **Эмулятор** — признак автоматизации
- 3DS не пройдена
- История chargebacks
- Попытка обхода защиты

### Request #3 (Friendly fraud)
- **История chargebacks** — главный признак
- Высокий cart abandonment (тестирование систем)
- Новый email с подозрительным доменом

---

## ✅ После отправки проверьте

**В консоли браузера (F12):**
```
WebSocket connected
New transaction received: {transaction_id: "TXN_...", ...}
Loaded 1 API transactions
```

**На странице /transactions:**
- Зелёная пульсация новой строки
- Красный badge "Заблокирована"
- Risk score 75-95
- Все детали: email, товар, регион и т.д.

---

## 🚀 Готово к демо!

Все 3 примера основаны на **реальных мошеннических транзакциях** из датасета и содержат **все необходимые поля** для корректной работы ML модели!
