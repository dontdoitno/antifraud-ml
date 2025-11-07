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
    should_block: bool = Field(False, description="Следует ли блокировать транзакцию")

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
