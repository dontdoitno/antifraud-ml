#!/usr/bin/env python3
"""
Скрипт для запуска FraudGuard AI
"""
import uvicorn
import sys
import os

# Добавляем текущую директорию в PYTHONPATH
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════╗
    ║      FraudGuard AI - Starting...      ║
    ║  Система обнаружения мошенничества    ║
    ╚═══════════════════════════════════════╝
    """)

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
