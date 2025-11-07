"""
Препроцессор транзакций
Реализует все этапы feature engineering из notebook
"""
import numpy as np
import pandas as pd
from typing import Dict
import logging

from app.models import TransactionRequest

logger = logging.getLogger(__name__)


class TransactionPreprocessor:
    """
    Препроцессор для подготовки данных транзакций

    Реализует feature engineering из notebook:
    1. One-hot encoding для типов транзакций
    2. Создание признака изменения баланса получателя
    3. Логарифмическое биннирование сумм транзакций
    4. Расчет доли мошенничества по бакетам
    """

    def __init__(self):
        # Границы бакетов для сумм транзакций (из notebook)
        self.num_buckets = 25
        self.fraud_share_by_bucket = self._initialize_fraud_shares()

    def _initialize_fraud_shares(self) -> Dict[float, float]:
        """
        Инициализация долей мошенничества по бакетам
        Эти значения должны быть предварительно рассчитаны на обучающих данных
        """
        # Примерные значения из анализа данных
        # В реальной системе эти значения должны быть загружены из файла
        return {
            100.0: 0.001,
            500.0: 0.005,
            1000.0: 0.008,
            5000.0: 0.012,
            10000.0: 0.015,
            50000.0: 0.025,
            100000.0: 0.040,
            200000.0: 0.055,
            500000.0: 0.070,
            1000000.0: 0.085,
        }

    def preprocess(self, transaction: TransactionRequest) -> pd.DataFrame:
        """
        Предобработка транзакции для модели

        Args:
            transaction: Входные данные транзакции

        Returns:
            DataFrame с подготовленными признаками
        """
        # Создание базового DataFrame
        data = {
            'amount': transaction.amount,
            'oldbalanceOrg': transaction.oldbalanceOrg,
            'newbalanceOrig': transaction.newbalanceOrig,
            'oldbalanceDest': transaction.oldbalanceDest,
            'newbalanceDest': transaction.newbalanceDest,
        }

        df = pd.DataFrame([data])

        # 1. One-hot encoding для типов транзакций
        # Из notebook: используются только CASH_OUT и TRANSFER
        df['type_CASH_OUT'] = 1 if transaction.type == "CASH_OUT" else 0
        df['type_TRANSFER'] = 1 if transaction.type == "TRANSFER" else 0

        # 2. Создание признака изменения баланса получателя
        df['balanceChange_Dest'] = df['newbalanceDest'] - df['oldbalanceDest']

        # 3. Логарифмическое биннирование суммы транзакции
        bucket = self._calculate_bucket(transaction.amount)
        df['bucket'] = bucket

        # 4. Добавление признака доли мошенничества для бакета
        fraud_share = self._get_fraud_share(bucket)
        df['fraud_share'] = fraud_share + 1  # +1 как в notebook

        # 5. Удаление признака bucket (используется только для расчета fraud_share)
        df = df.drop(['bucket'], axis=1)

        # Порядок признаков должен соответствовать обучению модели
        feature_order = [
            'amount',
            'oldbalanceOrg',
            'newbalanceOrig',
            'oldbalanceDest',
            'newbalanceDest',
            'type_CASH_OUT',
            'type_TRANSFER',
            'balanceChange_Dest',
            'fraud_share'
        ]

        df = df[feature_order]

        logger.debug(f"Подготовлены признаки: {df.columns.tolist()}")

        return df

    def _calculate_bucket(self, amount: float) -> float:
        """
        Логарифмическое биннирование суммы транзакции
        Реализация из notebook
        """
        if amount <= 0:
            return 0.0

        # Логарифмические границы бакетов
        min_amount = 0.01
        max_amount = 10000000.0

        bins = np.logspace(
            np.log10(min_amount),
            np.log10(max_amount),
            self.num_buckets
        )

        # Определение бакета
        bucket_idx = np.digitize(amount, bins)

        if bucket_idx > 0 and bucket_idx < len(bins):
            return bins[bucket_idx]
        elif bucket_idx == 0:
            return bins[0]
        else:
            return bins[-1]

    def _get_fraud_share(self, bucket: float) -> float:
        """
        Получение доли мошенничества для бакета
        """
        # Находим ближайший бакет
        closest_bucket = min(
            self.fraud_share_by_bucket.keys(),
            key=lambda x: abs(x - bucket)
        )

        return self.fraud_share_by_bucket.get(closest_bucket, 0.01)

    def update_fraud_shares(self, fraud_shares: Dict[float, float]):
        """
        Обновление долей мошенничества по бакетам
        Используется при дообучении модели
        """
        self.fraud_share_by_bucket.update(fraud_shares)
        logger.info("Доли мошенничества обновлены")
