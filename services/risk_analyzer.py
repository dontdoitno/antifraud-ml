"""
Анализатор рисков транзакций
Реализует многоуровневую оценку рисков и рекомендации
"""
import logging
from typing import List
from app.models import TransactionRequest, RiskAssessment, RiskLevel

logger = logging.getLogger(__name__)


class RiskAnalyzer:
    """
    Анализатор рисков для определения уровня угрозы транзакции

    Учитывает:
    - Вероятность мошенничества от ML модели
    - Тип транзакции
    - Сумму транзакции
    - Паттерны балансов
    - Дополнительные факторы (IP, устройство и т.д.)
    """

    def __init__(self):
        # Пороги для определения уровней риска
        self.risk_thresholds = {
            'CRITICAL': 0.85,
            'HIGH': 0.65,
            'MEDIUM': 0.35,
            'LOW': 0.0
        }

        # Пороги для 3D-Secure
        self.require_3ds_threshold = 0.50

        # Пороги для блокировки
        self.block_threshold = 0.80

    async def assess_risk(
        self,
        transaction: TransactionRequest,
        fraud_probability: float
    ) -> RiskAssessment:
        """
        Комплексная оценка рисков транзакции

        Args:
            transaction: Данные транзакции
            fraud_probability: Вероятность мошенничества от ML модели

        Returns:
            RiskAssessment: Детальная оценка рисков
        """
        risk_factors = []

        # 1. Базовая оценка по вероятности от ML
        base_risk_score = fraud_probability * 100

        # 2. Модификация на основе типа транзакции
        type_multiplier = self._get_type_risk_multiplier(transaction.type)
        risk_score = base_risk_score * type_multiplier

        if type_multiplier > 1.0:
            risk_factors.append(f"Высокорисковый тип транзакции: {transaction.type}")

        # 3. Анализ суммы транзакции
        amount_risk = self._analyze_amount(transaction.amount)
        risk_score += amount_risk

        if amount_risk > 5:
            if transaction.amount > 500000:
                risk_factors.append(f"Очень большая сумма транзакции: {transaction.amount:,.2f} руб")
            elif transaction.amount < 100:
                risk_factors.append(f"Подозрительно малая сумма: {transaction.amount:,.2f} руб")

        # 4. Анализ балансов
        balance_risk = self._analyze_balances(transaction)
        risk_score += balance_risk

        if balance_risk > 10:
            risk_factors.append("Подозрительное изменение балансов")

        # 5. Анализ дополнительных факторов
        additional_risk = self._analyze_additional_factors(transaction)
        risk_score += additional_risk

        # Ограничение риска в диапазоне 0-100
        risk_score = max(0, min(100, risk_score))

        # Определение уровня риска
        risk_level = self._determine_risk_level(risk_score / 100)

        # Определение необходимости 3D-Secure
        requires_3d_secure = (risk_score / 100) >= self.require_3ds_threshold

        # Определение необходимости блокировки
        should_block = (risk_score / 100) >= self.block_threshold

        # Уверенность в оценке (зависит от количества данных)
        confidence = self._calculate_confidence(transaction, fraud_probability)

        return RiskAssessment(
            risk_level=risk_level,
            risk_score=round(risk_score, 2),
            confidence=round(confidence, 4),
            requires_3d_secure=requires_3d_secure,
            should_block=should_block,
            risk_factors=risk_factors
        )

    def _get_type_risk_multiplier(self, transaction_type: str) -> float:
        """Множитель риска по типу транзакции"""
        risk_multipliers = {
            'TRANSFER': 1.2,
            'CASH_OUT': 1.3,
            'PAYMENT': 0.8,
            'CASH_IN': 0.7,
            'DEBIT': 0.7
        }
        return risk_multipliers.get(transaction_type, 1.0)

    def _analyze_amount(self, amount: float) -> float:
        """
        Анализ суммы транзакции

        Returns:
            Дополнительные баллы риска (0-20)
        """
        risk = 0.0

        # Очень большие суммы
        if amount > 1_000_000:
            risk += 15
        elif amount > 500_000:
            risk += 10
        elif amount > 200_000:
            risk += 5

        # Подозрительно малые суммы
        if amount < 100:
            risk += 8
        elif amount < 500:
            risk += 3

        # Круглые суммы (часто используются в мошенничестве)
        if amount % 10000 == 0 and amount > 10000:
            risk += 3

        return risk

    def _analyze_balances(self, transaction: TransactionRequest) -> float:
        """
        Анализ паттернов изменения балансов

        Returns:
            Дополнительные баллы риска (0-25)
        """
        risk = 0.0

        # Проверка баланса отправителя
        if transaction.oldbalanceOrg > 0:
            # Баланс полностью обнулился
            if transaction.newbalanceOrig == 0:
                risk += 15

            # Неожиданное изменение баланса
            expected_new_balance = transaction.oldbalanceOrg - transaction.amount
            if abs(transaction.newbalanceOrig - expected_new_balance) > transaction.amount * 0.05:
                risk += 10

        # Проверка баланса получателя
        if transaction.oldbalanceDest >= 0:
            expected_new_dest = transaction.oldbalanceDest + transaction.amount

            # Баланс получателя не изменился (подозрительно)
            if transaction.newbalanceDest == transaction.oldbalanceDest:
                risk += 20

            # Баланс получателя обнулился
            if transaction.oldbalanceDest > 0 and transaction.newbalanceDest == 0:
                risk += 15

            # Неожиданное изменение
            if abs(transaction.newbalanceDest - expected_new_dest) > transaction.amount * 0.1:
                risk += 12

        return risk

    def _analyze_additional_factors(self, transaction: TransactionRequest) -> float:
        """
        Анализ дополнительных факторов риска

        Returns:
            Дополнительные баллы риска (0-15)
        """
        risk = 0.0

        # Отсутствие IP адреса
        if not transaction.ip_address:
            risk += 5

        # Отсутствие device ID
        if not transaction.device_id:
            risk += 5

        # Можно добавить проверку IP по геолокации
        # Можно добавить проверку device fingerprint
        # Можно добавить проверку velocity (частота транзакций)

        return risk

    def _determine_risk_level(self, normalized_risk: float) -> RiskLevel:
        """Определение уровня риска"""
        if normalized_risk >= self.risk_thresholds['CRITICAL']:
            return RiskLevel.CRITICAL
        elif normalized_risk >= self.risk_thresholds['HIGH']:
            return RiskLevel.HIGH
        elif normalized_risk >= self.risk_thresholds['MEDIUM']:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def _calculate_confidence(
        self,
        transaction: TransactionRequest,
        fraud_probability: float
    ) -> float:
        """
        Расчет уверенности в оценке

        Уверенность выше, если:
        - Есть дополнительные данные (IP, device_id)
        - Вероятность от ML модели близка к 0 или 1
        """
        confidence = 0.5  # Базовая уверенность

        # Вклад от вероятности ML модели
        # Чем ближе к краям (0 или 1), тем выше уверенность
        ml_confidence = abs(fraud_probability - 0.5) * 2
        confidence += ml_confidence * 0.3

        # Вклад от наличия дополнительных данных
        if transaction.ip_address:
            confidence += 0.1
        if transaction.device_id:
            confidence += 0.1

        return min(1.0, confidence)
