"""
FraudGuard AI - Главное FastAPI приложение
Облачный сервис для обнаружения мошенничества в реальном времени
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
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
            timestamp=datetime.now(timezone.utc)
        )

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


# === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

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
