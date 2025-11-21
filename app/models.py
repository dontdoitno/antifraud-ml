"""
Pydantic модели для валидации данных API
"""
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, List, Dict
from datetime import datetime, timezone
from enum import Enum


class TransactionType(str, Enum):
    """Типы транзакций"""
    PAYMENT = "PAYMENT"
    TRANSFER = "TRANSFER"
    CASH_OUT = "CASH_OUT"
    CASH_IN = "CASH_IN"
    DEBIT = "DEBIT"


class RiskLevel(str, Enum):
    """Уровни риска"""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class TransactionRequest(BaseModel):
    """Запрос на анализ транзакции"""
    transaction_id: Optional[str] = Field(None, description="ID транзакции")
    type: TransactionType = Field(..., description="Тип транзакции")
    amount: float = Field(..., gt=0, description="Сумма транзакции")

    # Данные отправителя
    nameOrig: Optional[str] = Field(None, description="ID отправителя")
    oldbalanceOrg: float = Field(0.0, ge=0, description="Баланс отправителя до транзакции")
    newbalanceOrig: float = Field(0.0, ge=0, description="Баланс отправителя после транзакции")

    # Данные получателя
    nameDest: Optional[str] = Field(None, description="ID получателя")
    oldbalanceDest: float = Field(0.0, ge=0, description="Баланс получателя до транзакции")
    newbalanceDest: float = Field(0.0, ge=0, description="Баланс получателя после транзакции")

    # Дополнительные параметры для анализа рисков
    ip_address: Optional[str] = Field(None, description="IP-адрес клиента")
    device_id: Optional[str] = Field(None, description="ID устройства")
    user_agent: Optional[str] = Field(None, description="User Agent браузера")
    location: Optional[str] = Field(None, description="Геолокация")
    timestamp: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc))
    
    # Поля для отображения на фронтенде
    email: Optional[str] = Field(None, description="Email клиента")
    product_id: Optional[str] = Field(None, description="ID товара")
    product_name: Optional[str] = Field(None, description="Название товара")
    category: Optional[str] = Field(None, description="Категория товара")
    sku: Optional[str] = Field(None, description="SKU товара")
    customer_id: Optional[str] = Field(None, description="ID клиента")
    payment_method: Optional[str] = Field(None, description="Метод оплаты")
    currency: Optional[str] = Field("RUB", description="Валюта")
    is_high_risk_item: Optional[bool] = Field(False, description="Товар высокого риска")
    
    # Данные карты
    card_bin: Optional[str] = Field(None, description="BIN карты")
    card_last4: Optional[str] = Field(None, description="Последние 4 цифры карты")
    issuer_country: Optional[str] = Field(None, description="Страна эмитента карты")
    is_3ds_passed: Optional[bool] = Field(False, description="Пройдена ли 3DS верификация")
    attempt_count: Optional[int] = Field(1, description="Количество попыток оплаты")
    payment_gateway: Optional[str] = Field(None, description="Платежный шлюз")
    
    # Данные клиента
    email_domain: Optional[str] = Field(None, description="Домен email")
    email_first_seen: Optional[str] = Field(None, description="Когда email был впервые зарегистрирован")
    phone: Optional[str] = Field(None, description="Телефон")
    phone_verified: Optional[bool] = Field(False, description="Телефон подтвержден")
    previous_orders: Optional[int] = Field(0, description="Количество предыдущих заказов")
    previous_chargebacks: Optional[int] = Field(0, description="Количество предыдущих чарджбеков")
    
    # IP и геолокация
    ip_country: Optional[str] = Field(None, description="Страна по IP")
    ip_region: Optional[str] = Field(None, description="Регион по IP")
    proxy: Optional[bool] = Field(False, description="Использование прокси")
    vpn: Optional[bool] = Field(False, description="Использование VPN")
    tor: Optional[bool] = Field(False, description="Использование Tor")
    
    # Устройство
    device_os: Optional[str] = Field(None, description="ОС устройства")
    browser: Optional[str] = Field(None, description="Браузер")
    is_emulator: Optional[bool] = Field(False, description="Использование эмулятора")
    
    # Доставка
    delivery_type: Optional[str] = Field(None, description="Тип доставки (courier/pickup)")
    delivery_address: Optional[str] = Field(None, description="Адрес доставки")
    address_verified: Optional[bool] = Field(False, description="Адрес подтвержден")
    billing_address: Optional[str] = Field(None, description="Платежный адрес")
    addresses_match: Optional[bool] = Field(False, description="Адреса совпадают")
    shipping_region: Optional[str] = Field(None, description="Регион доставки")
    delivery_person: Optional[str] = Field(None, description="Получатель")
    delivery_signature_required: Optional[bool] = Field(False, description="Требуется подпись")
    last_mile_provider: Optional[str] = Field(None, description="Служба доставки")
    
    # Поведенческие метрики
    session_length_sec: Optional[int] = Field(0, description="Длительность сессии в секундах")
    pages_viewed: Optional[int] = Field(0, description="Просмотрено страниц")
    time_on_checkout_sec: Optional[int] = Field(0, description="Время на странице оформления")
    added_card_count: Optional[int] = Field(1, description="Количество добавленных карт")
    cart_abandon_rate: Optional[float] = Field(0.0, description="Процент брошенных корзин")
    
    # Velocity метрики
    velocity_same_card_1h: Optional[int] = Field(0, description="Транзакций с той же карты за час")
    velocity_same_ip_24h: Optional[int] = Field(0, description="Транзакций с того же IP за 24 часа")

    @field_validator('amount')
    @classmethod
    def validate_amount(cls, v):
        if v <= 0:
            raise ValueError('Сумма должна быть положительной')
        if v > 10_000_000:  # Максимальная сумма транзакции
            raise ValueError('Сумма транзакции превышает максимально допустимую')
        return v

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "TRANSFER",
                "amount": 150000.0,
                "nameOrig": "C123456789",
                "oldbalanceOrg": 200000.0,
                "newbalanceOrig": 50000.0,
                "nameDest": "C987654321",
                "oldbalanceDest": 100000.0,
                "newbalanceDest": 250000.0,
                "ip_address": "192.168.1.1",
                "device_id": "device_12345"
            }
        }
    )


class RiskAssessment(BaseModel):
    """Оценка рисков транзакции"""
    risk_level: RiskLevel
    risk_score: float = Field(..., ge=0, le=100)
    confidence: float = Field(..., ge=0, le=1)
    requires_3d_secure: bool = False
    should_block: bool = False
    risk_factors: List[str] = []


class TransactionResponse(BaseModel):
    """Ответ с результатами анализа транзакции"""
    transaction_id: str
    is_fraud: bool = Field(..., description="Является ли транзакция мошеннической")
    fraud_probability: float = Field(..., ge=0, le=1, description="Вероятность мошенничества")
    risk_level: RiskLevel = Field(..., description="Уровень риска")
    risk_score: float = Field(..., ge=0, le=100, description="Оценка риска (0-100)")
    confidence: float = Field(..., ge=0, le=1, description="Уверенность модели")

    recommendations: List[str] = Field(default_factory=list, description="Рекомендации")
    requires_3d_secure: bool = Field(False, description="Требуется ли 3D-Secure")
    should_block: bool = Field(False, description="Следует ли заблокировать транзакцию")
    risk_factors: List[str] = Field(default_factory=list, description="Факторы риска")

    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "transaction_id": "TXN_1234567890",
                "is_fraud": True,
                "fraud_probability": 0.8523,
                "risk_level": "HIGH",
                "risk_score": 85.23,
                "confidence": 0.92,
                "recommendations": [
                    "БЛОКИРОВАТЬ ТРАНЗАКЦИЮ - высокий риск мошенничества",
                    "Требуется подтверждение через 3D-Secure"
                ],
                "requires_3d_secure": True,
                "should_block": True,
                "timestamp": "2025-11-07T14:30:00"
            }
        }
    )


class EvidenceRecord(BaseModel):
    """Запись доказательств для защиты от chargeback"""
    transaction_id: str
    tracking_number: Optional[str] = None
    delivery_signature: Optional[str] = None
    customer_communication: List[Dict] = []
    ip_logs: List[str] = []
    device_fingerprint: Optional[str] = None
    screenshots: List[str] = []
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HealthCheck(BaseModel):
    """Статус здоровья сервиса"""
    status: str
    timestamp: datetime
    is_model_loaded: bool = Field(..., description="Загружена ли ML модель")
    version: str

    model_config = ConfigDict(protected_namespaces=())
