"""
Сборщик доказательств для защиты от chargeback
Собирает и сохраняет все данные о транзакции для последующего оспаривания
"""
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional
import json

from app.models import TransactionRequest, RiskAssessment, EvidenceRecord

logger = logging.getLogger(__name__)


class EvidenceCollector:
    """
    Сборщик доказательств для защиты от chargeback

    Этап: ПОСЛЕ совершения платежа (документирование и оспаривание)

    Собирает:
    - IP-адреса и логи устройств
    - Данные о подтверждении через 3D-Secure
    - Трек-номера доставки
    - Переписку с клиентом
    - Скриншоты и другие артефакты
    """

    def __init__(self):
        self.evidence_storage: Dict[str, EvidenceRecord] = {}

    async def log_transaction(
        self,
        transaction: TransactionRequest,
        fraud_probability: float,
        risk_assessment: RiskAssessment
    ):
        """
        Логирование транзакции с сохранением всех данных

        Args:
            transaction: Данные транзакции
            fraud_probability: Вероятность мошенничества
            risk_assessment: Оценка рисков
        """
        transaction_id = transaction.transaction_id or f"TXN_{datetime.now(timezone.utc).timestamp()}"

        # Сбор IP логов
        ip_logs = []
        if transaction.ip_address:
            ip_logs.append(
                f"{datetime.now(timezone.utc).isoformat()} - IP: {transaction.ip_address} - "
                f"Amount: {transaction.amount} - Type: {transaction.type}"
            )

        # Создание записи доказательств
        evidence = EvidenceRecord(
            transaction_id=transaction_id,
            customer_communication=[],
            ip_logs=ip_logs,
            device_fingerprint=transaction.device_id,
            screenshots=[],
            timestamp=datetime.now(timezone.utc)
        )

        # Сохранение в хранилище
        self.evidence_storage[transaction_id] = evidence

        logger.info(f"Доказательства собраны для транзакции {transaction_id}")

    async def add_delivery_info(
        self,
        transaction_id: str,
        tracking_number: str,
        signature: Optional[str] = None
    ):
        """
        Добавление информации о доставке

        Args:
            transaction_id: ID транзакции
            tracking_number: Трек-номер доставки
            signature: Подпись получателя (если есть)
        """
        if transaction_id in self.evidence_storage:
            evidence = self.evidence_storage[transaction_id]
            evidence.tracking_number = tracking_number
            evidence.delivery_signature = signature

            logger.info(
                f"Добавлена информация о доставке для {transaction_id}: "
                f"track={tracking_number}"
            )
        else:
            logger.warning(f"Транзакция {transaction_id} не найдена в хранилище")

    async def add_communication(
        self,
        transaction_id: str,
        message_type: str,
        content: str,
        timestamp: Optional[datetime] = None
    ):
        """
        Добавление записи переписки с клиентом

        Args:
            transaction_id: ID транзакции
            message_type: Тип сообщения (email, chat, phone)
            content: Содержание сообщения
            timestamp: Время сообщения
        """
        if transaction_id in self.evidence_storage:
            evidence = self.evidence_storage[transaction_id]

            communication_record = {
                "type": message_type,
                "content": content,
                "timestamp": (timestamp or datetime.now(timezone.utc)).isoformat()
            }

            evidence.customer_communication.append(communication_record)

            logger.info(
                f"Добавлена запись переписки для {transaction_id}: "
                f"type={message_type}"
            )
        else:
            logger.warning(f"Транзакция {transaction_id} не найдена в хранилище")

    async def add_screenshot(self, transaction_id: str, screenshot_url: str):
        """
        Добавление скриншота

        Args:
            transaction_id: ID транзакции
            screenshot_url: URL или путь к скриншоту
        """
        if transaction_id in self.evidence_storage:
            evidence = self.evidence_storage[transaction_id]
            evidence.screenshots.append(screenshot_url)

            logger.info(f"Добавлен скриншот для {transaction_id}")
        else:
            logger.warning(f"Транзакция {transaction_id} не найдена в хранилище")

    async def get_evidence(self, transaction_id: str) -> Optional[EvidenceRecord]:
        """
        Получение всех доказательств по транзакции

        Args:
            transaction_id: ID транзакции

        Returns:
            EvidenceRecord или None
        """
        return self.evidence_storage.get(transaction_id)

    async def export_for_chargeback(self, transaction_id: str) -> Dict:
        """
        Экспорт доказательств в формате для оспаривания chargeback

        Args:
            transaction_id: ID транзакции

        Returns:
            Словарь с форматированными доказательствами
        """
        evidence = self.evidence_storage.get(transaction_id)

        if not evidence:
            return {"error": "Доказательства не найдены"}

        # Форматирование для банка/платежной системы
        chargeback_package = {
            "transaction_id": transaction_id,
            "evidence_collected_at": evidence.timestamp.isoformat(),
            "delivery_proof": {
                "tracking_number": evidence.tracking_number,
                "signature": evidence.delivery_signature
            },
            "customer_communication": evidence.customer_communication,
            "technical_data": {
                "ip_logs": evidence.ip_logs,
                "device_fingerprint": evidence.device_fingerprint
            },
            "visual_proof": {
                "screenshots": evidence.screenshots
            }
        }

        logger.info(f"Экспортированы доказательства для chargeback: {transaction_id}")

        return chargeback_package
