"""
FraudGuard AI - Главное FastAPI приложение
Облачный сервис для обнаружения мошенничества в реальном времени
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from datetime import datetime, timezone
from typing import Optional, List
import numpy as np

from app.models import (
    TransactionRequest,
    TransactionResponse,
    RiskAssessment,
    HealthCheck
)
from app.ml.fraud_detector import FraudDetector
from services.risk_analyzer import RiskAnalyzer
from services.evidence_collector import EvidenceCollector
from app.config import settings
from app.ws import manager, broadcast_analysis
import json
import os

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Глобальные переменные для ML моделей
fraud_detector: Optional[FraudDetector] = None
risk_analyzer: Optional[RiskAnalyzer] = None
evidence_collector: Optional[EvidenceCollector] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    global fraud_detector, risk_analyzer, evidence_collector

    # Инициализация при запуске
    logger.info("Инициализация FraudGuard AI...")

    try:
        # Загрузка ML модели
        fraud_detector = FraudDetector()
        await fraud_detector.load_model()
        logger.info("✓ Модель машинного обучения загружена")

        # Инициализация анализатора рисков
        risk_analyzer = RiskAnalyzer()
        logger.info("✓ Анализатор рисков инициализирован")

        # Инициализация сборщика доказательств
        evidence_collector = EvidenceCollector()
        logger.info("✓ Сборщик доказательств инициализирован")

        logger.info("🚀 FraudGuard AI успешно запущен!")

    except Exception as e:
        logger.error(f"Ошибка инициализации: {str(e)}")
        raise

    yield

    # Очистка при завершении
    logger.info("Завершение работы FraudGuard AI...")
    fraud_detector = None
    risk_analyzer = None
    evidence_collector = None


# Создание FastAPI приложения
app = FastAPI(
    title="FraudGuard AI",
    description="Облачный сервис на основе ИИ для обнаружения мошенничества и предотвращения chargeback",
    version="1.0.0",
    lifespan=lifespan
)

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# === ЭНДПОИНТЫ API ===

@app.get("/", response_model=dict)
async def root():
    """Корневой эндпоинт"""
    return {
        "service": "FraudGuard AI",
        "version": "1.0.0",
        "status": "operational",
        "description": "Система обнаружения мошенничества в реальном времени"
    }


@app.get("/health", response_model=HealthCheck)
async def health_check():
    """Проверка здоровья сервиса"""
    is_model_loaded = fraud_detector is not None and fraud_detector.model is not None

    return HealthCheck(
        status="healthy" if is_model_loaded else "degraded",
        timestamp=datetime.now(timezone.utc),
        is_model_loaded=is_model_loaded,
        version="1.0.0"
    )


@app.post("/api/v1/analyze", response_model=TransactionResponse)
async def analyze_transaction(
    transaction: TransactionRequest,
    background_tasks: BackgroundTasks
):
    """
    Анализ транзакции в реальном времени

    Этапы анализа:
    1. Предобработка данных транзакции
    2. Предсказание вероятности мошенничества (ML модель)
    3. Расчет уровня риска
    4. Рекомендации по обработке транзакции
    """
    try:
        if fraud_detector is None:
            raise HTTPException(
                status_code=503,
                detail="Модель обнаружения мошенничества не загружена"
            )

        logger.info(f"Анализ транзакции: amount={transaction.amount}, type={transaction.type}")

        # 1. Предсказание вероятности мошенничества
        fraud_probability = await fraud_detector.predict(transaction)

        # 2. Анализ рисков
        risk_assessment = await risk_analyzer.assess_risk(
            transaction,
            fraud_probability
        )

        # 3. Формирование рекомендаций
        recommendations = _generate_recommendations(
            risk_assessment,
            transaction
        )

        # 4. Логирование в фоновом режиме
        background_tasks.add_task(
            _log_transaction,
            transaction,
            fraud_probability,
            risk_assessment
        )

        # Формирование ответа
        response = TransactionResponse(
            transaction_id=transaction.transaction_id or f"TXN_{datetime.now(timezone.utc).timestamp()}",
            is_fraud=fraud_probability > settings.FRAUD_THRESHOLD,
            fraud_probability=round(fraud_probability, 4),
            risk_level=risk_assessment.risk_level,
            risk_score=risk_assessment.risk_score,
            confidence=risk_assessment.confidence,
            recommendations=recommendations,
            requires_3d_secure=risk_assessment.requires_3d_secure,
            should_block=risk_assessment.should_block,
            risk_factors=risk_assessment.risk_factors,
            timestamp=datetime.now(timezone.utc)
        )

        # 5. Broadcast результатов через WebSocket (для демо)
        background_tasks.add_task(
            broadcast_analysis,
            response.transaction_id,
            response.risk_score,
            response.fraud_probability,
            response.is_fraud,
            response.timestamp
        )
        
        # 6. Сохранение транзакции в файл
        background_tasks.add_task(_save_transaction_to_file, transaction, response)

        logger.info(
            f"Анализ завершен: fraud_prob={fraud_probability:.4f}, "
            f"risk_level={risk_assessment.risk_level}"
        )

        return response

    except Exception as e:
        logger.error(f"Ошибка анализа транзакции: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка обработки транзакции: {str(e)}"
        )


@app.post("/api/v1/batch-analyze", response_model=List[TransactionResponse])
async def batch_analyze_transactions(transactions: List[TransactionRequest]):
    """Пакетный анализ нескольких транзакций"""
    try:
        results = []
        for transaction in transactions:
            # Создаем пустой BackgroundTasks для каждой транзакции
            bg_tasks = BackgroundTasks()
            result = await analyze_transaction(transaction, bg_tasks)
            results.append(result)

        return results

    except Exception as e:
        logger.error(f"Ошибка пакетного анализа: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/stats", response_model=dict)
async def get_statistics():
    """Получение статистики работы системы"""
    try:
        if fraud_detector is None:
            return {"error": "Модель не загружена"}

        stats = await fraud_detector.get_statistics()
        return stats

    except Exception as e:
        logger.error(f"Ошибка получения статистики: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.websocket("/ws/stream")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint для real-time стриминга результатов анализа"""
    await manager.connect(websocket)
    try:
        while True:
            # Ожидание сообщений от клиента (keep-alive)
            data = await websocket.receive_text()
            # Echo для проверки соединения
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")


# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

def _save_transaction_to_file(transaction: TransactionRequest, response: TransactionResponse):
    """Сохранить транзакцию в JSON файл для отображения на фронтенде"""
    try:
        transactions_file = "data/api_transactions.json"
        
        # Загрузить существующие транзакции
        if os.path.exists(transactions_file):
            with open(transactions_file, 'r', encoding='utf-8') as f:
                transactions = json.load(f)
        else:
            transactions = []
        
        # Создать объект транзакции для фронтенда
        transaction_data = {
            "transaction_id": response.transaction_id,
            "timestamp": response.timestamp.isoformat(),
            "product_id": getattr(transaction, 'product_id', '') or "PRODUCT-001",
            "product_name": getattr(transaction, 'product_name', '') or "Товар",
            "category": getattr(transaction, 'category', '') or "Электроника",
            "sku": f"SKU-{response.transaction_id[-6:]}",
            "amount": transaction.amount,
            "currency": getattr(transaction, 'currency', '') or "RUB",
            "payment_method": getattr(transaction, 'payment_method', '') or "card",
            "is_high_risk_item": response.risk_score >= 70,
            
            # Информация о клиенте
            "customer_id": getattr(transaction, 'customer_id', '') or getattr(transaction, 'nameOrig', '') or "CUSTOMER-001",
            "email": getattr(transaction, 'email', '') or f"customer@example.com",
            "email_domain": getattr(transaction, 'email', '').split('@')[1] if getattr(transaction, 'email', '') and '@' in getattr(transaction, 'email', '') else "example.com",
            "phone": "+7**********",
            "phone_verified": True,
            "previous_orders": 0,
            "previous_chargebacks": 0,
            
            # IP и геолокация
            "ip": transaction.ip_address or "0.0.0.0",
            "ip_country": getattr(transaction, 'ip_country', '') or "RU",
            "ip_region": getattr(transaction, 'ip_region', '') or transaction.location or "Москва",
            "proxy": False,
            "vpn": False,
            "tor": False,
            
            # Устройство
            "device_id": transaction.device_id or "device_unknown",
            "device_os": getattr(transaction, 'device_os', '') or "Windows",
            "browser": getattr(transaction, 'browser', '') or "Chrome 120",
            "is_emulator": False,
            
            # 3DS
            "is_3ds_passed": getattr(transaction, 'is_3ds_passed', False),
            "attempt_count": 1,
            
            #Результаты анализа
            "is_fraud": response.is_fraud,
            "fraud_probability": response.fraud_probability,
            "risk_level": response.risk_level,
            "risk_score": response.risk_score,  # Используем risk_score из response!
            "risk_factors": response.risk_factors,  # Сохраняем факторы риска!
            "fraud_type": "Финансовое мошенничество" if response.is_fraud else "",
            "chargeback_code": "" if not response.is_fraud else "FRAUD",
            "chargeback_date": "",
            
            # Дополнительно
            "payment_gateway": "API",
            "delivery_type": "courier",
            "session_length_sec": 120,
            "pages_viewed": 5,
        }
        
        # Добавить в начало списка (свежие сначала)
        transactions.insert(0, transaction_data)
        
        # Ограничить до 1000 транзакций
        transactions = transactions[:1000]
        
        # Сохранить
        os.makedirs("data", exist_ok=True)
        with open(transactions_file, 'w', encoding='utf-8') as f:
            json.dump(transactions, f, ensure_ascii=False, indent=2, default=str)
            
        logger.info(f"Транзакция {response.transaction_id} сохранена в {transactions_file}")
    except Exception as e:
        logger.error(f"Ошибка сохранения транзакции: {str(e)}")


def _generate_recommendations(
    risk_assessment: RiskAssessment,
    transaction: TransactionRequest
) -> List[str]:
    """Генерация рекомендаций на основе оценки рисков"""
    recommendations = []

    if risk_assessment.should_block:
        recommendations.append("БЛОКИРОВАТЬ ТРАНЗАКЦИЮ - высокий риск мошенничества")

    if risk_assessment.requires_3d_secure:
        recommendations.append("Требуется подтверждение через 3D-Secure")

    if risk_assessment.risk_level == "HIGH":
        recommendations.extend([
            "Запросить дополнительную верификацию пользователя",
            "Проверить историю транзакций клиента",
            "Зафиксировать IP-адрес и данные устройства"
        ])
    elif risk_assessment.risk_level == "MEDIUM":
        recommendations.extend([
            "Рекомендуется мониторинг транзакции",
            "Сохранить все доказательства проведения операции"
        ])
    else:
        recommendations.append("Транзакция может быть обработана в обычном режиме")

    # Специфичные рекомендации по типу транзакции
    if transaction.type in ["TRANSFER", "CASH_OUT"]:
        recommendations.append(
            "Для данного типа транзакций повышен риск - усилить контроль"
        )

    return recommendations


async def _log_transaction(
    transaction: TransactionRequest,
    fraud_probability: float,
    risk_assessment: RiskAssessment
):
    """Логирование транзакции (выполняется в фоновом режиме)"""
    try:
        # Здесь можно добавить сохранение в базу данных
        logger.info(
            f"Транзакция залогирована: "
            f"amount={transaction.amount}, "
            f"fraud_prob={fraud_probability:.4f}, "
            f"risk={risk_assessment.risk_level}"
        )

        # Опционально: сохранение в Evidence Collector
        if evidence_collector:
            await evidence_collector.log_transaction(
                transaction,
                fraud_probability,
                risk_assessment
            )
    except Exception as e:
        logger.error(f"Ошибка логирования транзакции: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
