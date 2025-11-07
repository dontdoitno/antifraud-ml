"""
Тесты для API
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, MagicMock, patch
from app.main import app
from app.ml.fraud_detector import FraudDetector
from services.risk_analyzer import RiskAnalyzer
from services.evidence_collector import EvidenceCollector
from app.models import RiskAssessment, RiskLevel

# Мокирование сервисов для тестов
@pytest.fixture(autouse=True)
def setup_services(monkeypatch):
    """Инициализация моков сервисов перед каждым тестом"""
    # Создаем моки
    mock_fraud_detector = MagicMock(spec=FraudDetector)
    mock_fraud_detector.model = MagicMock()  # Модель существует
    mock_fraud_detector.predict = AsyncMock(return_value=0.3)
    mock_fraud_detector.get_statistics = AsyncMock(return_value={
        "total_predictions": 0,
        "fraud_detected": 0,
        "fraud_rate": 0.0,
        "last_prediction_time": None,
        "is_model_loaded": True
    })

    mock_risk_analyzer = MagicMock(spec=RiskAnalyzer)
    mock_risk_analyzer.assess_risk = AsyncMock(return_value=RiskAssessment(
        risk_level=RiskLevel.MEDIUM,
        risk_score=50.0,
        confidence=0.8,
        requires_3d_secure=False,
        should_block=False,
        risk_factors=[]
    ))

    mock_evidence_collector = MagicMock(spec=EvidenceCollector)
    mock_evidence_collector.log_transaction = AsyncMock()

    # Подменяем глобальные переменные через monkeypatch
    import app.main
    monkeypatch.setattr(app.main, 'fraud_detector', mock_fraud_detector)
    monkeypatch.setattr(app.main, 'risk_analyzer', mock_risk_analyzer)
    monkeypatch.setattr(app.main, 'evidence_collector', mock_evidence_collector)

client = TestClient(app)


def test_root():
    """Тест корневого эндпоинта"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "FraudGuard AI"
    assert data["status"] == "operational"


def test_health_check():
    """Тест проверки здоровья"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "is_model_loaded" in data


def test_analyze_transaction():
    """Тест анализа транзакции"""
    transaction_data = {
        "type": "TRANSFER",
        "amount": 150000.0,
        "oldbalanceOrg": 200000.0,
        "newbalanceOrig": 50000.0,
        "oldbalanceDest": 100000.0,
        "newbalanceDest": 250000.0,
        "ip_address": "192.168.1.1"
    }

    response = client.post("/api/v1/analyze", json=transaction_data)
    assert response.status_code == 200

    data = response.json()
    assert "transaction_id" in data
    assert "is_fraud" in data
    assert "fraud_probability" in data
    assert "risk_level" in data
    assert 0 <= data["fraud_probability"] <= 1
    assert data["risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]


def test_analyze_low_risk_transaction(monkeypatch):
    """Тест транзакции с низким риском"""
    # Настраиваем моки для низкого риска
    import app.main
    mock_fraud_detector = MagicMock(spec=FraudDetector)
    mock_fraud_detector.model = MagicMock()
    mock_fraud_detector.predict = AsyncMock(return_value=0.1)  # Низкая вероятность мошенничества

    mock_risk_analyzer = MagicMock(spec=RiskAnalyzer)
    mock_risk_analyzer.assess_risk = AsyncMock(return_value=RiskAssessment(
        risk_level=RiskLevel.LOW,
        risk_score=10.0,
        confidence=0.7,
        requires_3d_secure=False,
        should_block=False,
        risk_factors=[]
    ))

    monkeypatch.setattr(app.main, 'fraud_detector', mock_fraud_detector)
    monkeypatch.setattr(app.main, 'risk_analyzer', mock_risk_analyzer)

    transaction_data = {
        "type": "PAYMENT",
        "amount": 1000.0,
        "oldbalanceOrg": 50000.0,
        "newbalanceOrig": 49000.0,
        "oldbalanceDest": 10000.0,
        "newbalanceDest": 11000.0
    }

    response = client.post("/api/v1/analyze", json=transaction_data)
    assert response.status_code == 200

    data = response.json()
    # PAYMENT транзакции обычно имеют низкий риск
    assert data["fraud_probability"] < 0.3


def test_analyze_high_risk_transaction(monkeypatch):
    """Тест транзакции с высоким риском"""
    # Настраиваем моки для высокого риска
    import app.main
    mock_fraud_detector = MagicMock(spec=FraudDetector)
    mock_fraud_detector.model = MagicMock()
    mock_fraud_detector.predict = AsyncMock(return_value=0.85)  # Высокая вероятность мошенничества

    mock_risk_analyzer = MagicMock(spec=RiskAnalyzer)
    mock_risk_analyzer.assess_risk = AsyncMock(return_value=RiskAssessment(
        risk_level=RiskLevel.HIGH,
        risk_score=85.0,
        confidence=0.9,
        requires_3d_secure=True,
        should_block=True,
        risk_factors=["Высокий риск"]
    ))

    monkeypatch.setattr(app.main, 'fraud_detector', mock_fraud_detector)
    monkeypatch.setattr(app.main, 'risk_analyzer', mock_risk_analyzer)

    transaction_data = {
        "type": "TRANSFER",
        "amount": 500000.0,
        "oldbalanceOrg": 500000.0,
        "newbalanceOrig": 0.0,  # Баланс обнулился - подозрительно
        "oldbalanceDest": 0.0,
        "newbalanceDest": 0.0  # Баланс получателя не изменился - очень подозрительно
    }

    response = client.post("/api/v1/analyze", json=transaction_data)
    assert response.status_code == 200

    data = response.json()
    # Эта транзакция должна иметь высокий риск
    assert data["fraud_probability"] > 0.5
    assert data["should_block"] or data["requires_3d_secure"]


def test_batch_analyze():
    """Тест пакетного анализа"""
    transactions = [
        {
            "type": "TRANSFER",
            "amount": 10000.0,
            "oldbalanceOrg": 50000.0,
            "newbalanceOrig": 40000.0,
            "oldbalanceDest": 20000.0,
            "newbalanceDest": 30000.0
        },
        {
            "type": "PAYMENT",
            "amount": 5000.0,
            "oldbalanceOrg": 30000.0,
            "newbalanceOrig": 25000.0,
            "oldbalanceDest": 0.0,
            "newbalanceDest": 0.0
        }
    ]

    response = client.post("/api/v1/batch-analyze", json=transactions)
    assert response.status_code == 200

    data = response.json()
    assert len(data) == 2
    assert all("transaction_id" in item for item in data)


def test_invalid_transaction():
    """Тест с невалидными данными"""
    transaction_data = {
        "type": "INVALID_TYPE",
        "amount": -1000.0  # Отрицательная сумма
    }

    response = client.post("/api/v1/analyze", json=transaction_data)
    assert response.status_code == 422  # Validation error


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
