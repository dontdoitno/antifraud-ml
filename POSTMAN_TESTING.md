# Postman Testing - Обновлённая Инструкция  

## ✅ **Система работает!**

**WebSocket:** ✅ Подключен  
**Backend:** ✅ Сохраняет транзакции  
**Frontend:** ✅ Отображает в реальном времени

---

## 🎯 Полный формат транзакции

Используйте этот полный JSON для тестирования в Postman:

```json
{
  "type": "PAYMENT",
  "amount": 5500,
  "nameOrig": "C1234567890",
  "oldbalanceOrg": 50000,
  "newbalanceOrig": 44500,
  "nameDest": "M9876543210",
  "oldbalanceDest": 100000,
  "newbalanceDest": 105500,
  "ip_address": "185.25.119.84",
  "device_id": "device_test_123",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
  "location": "Москва",
  "email": "test.user@example.com",
  "product_name": "PlayStation 5 Console",
  "category": "Электроника",
  "customer_id": "CUST-12345",
  "payment_method": "Visa",
  "currency": "RUB",
  "ip_country": "RU",
  "ip_region": "Москва",
  "device_os": "Windows 11",
  "browser": "Chrome 120",
  "is_3ds_passed": true
}
```

---

## 📝 Примеры для тестирования

### 1️⃣ Нормальная транзакция (LOW RISK)

```json
{
  "type": "PAYMENT",
  "amount": 8999,
  "nameOrig": "C2345678901",
  "oldbalanceOrg": 100000,
  "newbalanceOrig": 91001,
  "nameDest": "M1234567890",
  "oldbalanceDest": 500000,
  "newbalanceDest": 508999,
  "ip_address": "185.25.119.84",
  "device_id": "device_apple_001",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1",
  "location": "Москва",
  "email": "john.smith@gmail.com",
  "product_name": "PlayStation 5 God of War Bundle",
  "category": "Электроника",
  "customer_id": "CUST-67890",
  "payment_method": "MasterCard",
  "currency": "RUB",
  "ip_country": "RU",
  "ip_region": "Москва",
  "device_os": "macOS",
  "browser": "Safari 16",
  "is_3ds_passed": true
}
```

**Ожидается:**
- `risk_score`: 5-15  
- `risk_level`: LOW  
- `is_fraud`: false  
- Статус: "Одобрена" 🟢

---

### 2️⃣ Средний риск (MEDIUM RISK)

```json
{
  "type": "PAYMENT",
  "amount": 35000,
  "nameOrig": "C9876543210",
  "oldbalanceOrg": 40000,
  "newbalanceOrig": 5000,
  "nameDest": "M5555555555",
  "oldbalanceDest": 100000,
  "newbalanceDest": 135000,
  "ip_address": "95.108.151.200",
  "device_id": "device_android_suspicious",
  "user_agent": "Mozilla/5.0 (Linux; Android 10) Mobile Safari/537",
  "location": "Краснодар",
  "email": "new.user.2024@tempmail.com",
  "product_name": "PlayStation VR2 Headset",
  "category": "Электроника",
  "customer_id": "CUST-NEW001",
  "payment_method": "Visa",
  "currency": "RUB",
  "ip_country": "RU",
  "ip_region": "Краснодарский край",
  "device_os": "Android 10",
  "browser": "Mobile Safari",
  "is_3ds_passed": false
}
```

**Ожидается:**
- `risk_score`: 50-70  
- `risk_level`: MEDIUM  
- `is_fraud`: false  
- Статус: "На проверке" 🟡

---

### 3️⃣ Высокий риск / FRAUD (HIGH RISK)

```json
{
  "type": "PAYMENT",
  "amount": 99999,
  "nameOrig": "C0000000001",
  "oldbalanceOrg": 500,
  "newbalanceOrig": 0,
  "nameDest": "M9999999999",
  "oldbalanceDest": 0,
  "newbalanceDest": 99999,
  "ip_address": "1.2.3.4",
  "device_id": "device_emulator_001",
  "user_agent": "curl/7.68.0",
  "location": "Unknown",
  "email": "scammer@suspicious-domain.xyz",
  "product_name": "Multiple PlayStation Consoles x10",
  "category": "Электроника",
  "customer_id": "CUST-FRAUD",
  "payment_method": "Unknown Card",
  "currency": "RUB",
  "ip_country": "Unknown",
  "ip_region": "Unknown",
  "device_os": "Unknown",
  "browser": "curl",
  "is_3ds_passed": false
}
```

**Ожидается:**
- `risk_score`: 85-95  
- `risk_level`: HIGH  
- `is_fraud`: true  
- Статус: "Заблокирована" 🔴

---

## 🧪 Как тестировать

### Шаг 1: Откройте страницу  
**URL:** http://localhost:3000/transactions  
**Проверьте:** Статус должен быть 🟢 "Live" (зелёная пульсация)

### Шаг 2: Откройте Postman  
- Method: **POST**  
- URL: `http://localhost:8000/api/v1/analyze`  
- Headers: `Content-Type: application/json`  
- Body: Скопируйте любой пример выше

### Шаг 3: Нажмите Send

### Шаг 4: Наблюдайте результат  
✨ **В браузере (http://localhost:3000/transactions):**
1. Транзакция мгновенно появится (~100-300ms)
2. Строка подсветится зелёным с пульсацией
3. Левый border станет зелёным (4px)
4. Через 5 секунд анимация исчезнет

**В таблице вы увидите:**
- **ID транзакции**: TXN_...
- **Время**: Текущее время
- **Клиент**: test.user@example.com / Москва
- **Товар**: PlayStation 5 Console / Электроника
- **Сумма**: 5,500 ₽
- **Риск**: Зелёный/Жёлтый/Красный badge с числом
- **3DS**: ✅ или ❌
- **Статус**: Одобрена/На проверке/Заблокирована

---

## 🎬 Быстрый тест

Используйте готовый файл:

```bash
cd /Users/vikafg/Documents/GitHub/antifraud-ml
curl -X POST http://localhost:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d @test_transaction.json
```

Или в Postman:
1. Body → raw → JSON
2. Вставьте содержимое `test_transaction.json`
3. Send
4. Смотрите на браузер! 🚀

---

## ✅ Что проверить

- [ ] WebSocket статус "Live" (зелёный)
- [ ] Транзакция появляется мгновенно
- [ ] Зелёная анимация отображается
- [ ] Все поля заполнены правильно (email, product, категория)
- [ ] Risk score соответствует ожиданиям
- [ ] Статус корректный (Одобрена/На проверке/Заблокирована)
- [ ] Анимация исчезает через 5 секунд
- [ ] Можно кликнуть "Подробнее" для детального просмотра

---

## � Объяснение полей

| Поле | Обязательное? | Описание |
|------|---------------|----------|
| `type` | ✅ Да | PAYMENT/TRANSFER/CASH_OUT |
| `amount` | ✅ Да | Сумма транзакции |
| `nameOrig` | Нет | ID отправителя |
| `oldbalanceOrg` | Нет | Баланс до транзакции |
| `newbalanceOrig` | Нет | Баланс после |
| `email` | � Рекомендуется | Отображается в таблице |
| `product_name` | 🌟 Рекомендуется | Отображается в таблице |
| `category` | 🌟 Рекомендуется | Отображается в таблице |
| `ip_address` | Нет | Для ML анализа |
| `device_id` | Нет | Для ML анализа |
| `is_3ds_passed` | Нет | Показывается в таблице (✅/❌) |

**Примечание:** Все необязательные поля будут заполнены значениями по умолчанию, если не указаны.

---

## 💡 Совет

Создайте **Postman Collection** с 3 примерами (Low/Medium/High risk) для быстрого переключения между тестами!

🎉 **Готово к демонстрации!**
