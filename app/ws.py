"""
WebSocket Manager for FraudShield.AI
Handles real-time broadcasting of fraud analysis results to connected clients
"""
from fastapi import WebSocket, WebSocketDisconnect
from broadcaster import Broadcast
from typing import List, Dict, Any
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Broadcaster instance (memory-based for simplicity)
broadcast = Broadcast("memory://")


class ConnectionManager:
    """Manages WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection"""
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        """Send a message to a specific client"""
        await websocket.send_text(message)
    
    async def broadcast_message(self, message: Dict[Any, Any]):
        """Broadcast a message to all connected clients"""
        message_str = json.dumps(message, default=str)
        
        # Remove disconnected clients
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending to client: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
        
        logger.info(f"Broadcasted message to {len(self.active_connections)} clients")


# Global connection manager instance
manager = ConnectionManager()


async def broadcast_analysis(
    transaction_id: str,
    risk_score: float,
    probability: float,
    is_fraud: bool,
    timestamp: datetime = None
):
    """
    Broadcast fraud analysis result to all connected WebSocket clients
    
    Args:
        transaction_id: Unique transaction identifier
        risk_score: Risk score (0-100)
        probability: Fraud probability (0-1)
        is_fraud: Whether transaction is classified as fraud
        timestamp: Analysis timestamp
    """
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    
    message = {
        "transaction_id": transaction_id,
        "risk_score": round(risk_score, 2),
        "probability": round(probability, 4),
        "is_fraud": is_fraud,
        "timestamp": timestamp.isoformat()
    }
    
    await manager.broadcast_message(message)
    logger.info(f"Broadcasted analysis for {transaction_id}: is_fraud={is_fraud}, risk={risk_score}")
