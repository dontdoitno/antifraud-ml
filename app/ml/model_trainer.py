"""
Модуль для обучения ML модели обнаружения мошенничества
Реализует процесс обучения из notebook
"""
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import StratifiedKFold
from sklearn.metrics import f1_score, precision_score, recall_score, classification_report
import logging
from typing import Tuple, Dict
import os

from app.ml.preprocessor import TransactionPreprocessor

logger = logging.getLogger(__name__)


class ModelTrainer:
    """
    Обучение модели XGBoost для обнаружения мошенничества

    Реализует подход из notebook:
    - Random oversampling для балансировки классов
    - 5-fold cross-validation
    - Параметры модели оптимизированы для максимизации recall
    """

    def __init__(self):
        self.preprocessor = TransactionPreprocessor()
        self.model = None

        # Параметры XGBoost из notebook
        self.params = {
            'objective': 'binary:logistic',
            'eval_metric': 'aucpr',
            'learning_rate': 0.05,
            'max_depth': 6,
            'min_child_weight': 1,
            'subsample': 0.8,
            'colsample_bytree': 0.8,
            'verbosity': 1
        }

        self.num_boost_round = 100

    def load_and_prepare_data(self, data_path: str) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Загрузка и подготовка данных из CSV файла

        Args:
            data_path: Путь к CSV файлу с данными

        Returns:
            X, y: Признаки и целевая переменная
        """
        logger.info(f"Загрузка данных из {data_path}")

        # Загрузка данных
        data = pd.read_csv(data_path)
        logger.info(f"Загружено {len(data)} транзакций")

        # Удаление ненужных признаков (из notebook)
        data_model = data.drop(['nameOrig', 'nameDest', 'step', 'isFlaggedFraud'], axis=1)

        # One-hot encoding для типов транзакций
        dummies = pd.get_dummies(data_model['type'], prefix='type').astype(int)
        data_model = pd.concat([data_model.drop('type', axis=1), dummies], axis=1)

        # Оставляем только CASH_OUT и TRANSFER (из notebook: мошенничество только в этих типах)
        data_model['prelim'] = data_model['type_CASH_OUT'] + data_model['type_TRANSFER']
        data_model = data_model[data_model['prelim'] != 0]
        data_model = data_model.drop(['type_CASH_IN', 'type_DEBIT', 'type_PAYMENT', 'prelim'], axis=1)

        logger.info(f"После фильтрации: {len(data_model)} транзакций")

        # Логарифмическое биннирование суммы
        data_model = self._create_fraud_share_feature(data_model)

        # Создание признака изменения баланса получателя
        data_model['balanceChange_Dest'] = data_model['newbalanceDest'] - data_model['oldbalanceDest']

        # Удаление выбросов (IQR метод из notebook)
        data_model = self._remove_outliers_iqr(data_model, 'isFraud')

        logger.info(f"После удаления выбросов: {len(data_model)} транзакций")

        # Разделение на признаки и целевую переменную
        y = data_model['isFraud']
        X = data_model.drop(['isFraud', 'bucket'], axis=1)

        logger.info(f"Классы: {y.value_counts().to_dict()}")
        logger.info(f"Признаки: {X.columns.tolist()}")

        return X, y

    def _create_fraud_share_feature(self, data: pd.DataFrame) -> pd.DataFrame:
        """Создание признака доли мошенничества по бакетам (из notebook)"""
        num_buckets = 25

        positive_amounts = data['amount'][data['amount'] > 0]
        bins = np.logspace(
            np.log10(positive_amounts.min()),
            np.log10(positive_amounts.max()),
            num_buckets
        )

        data['bucket'] = np.digitize(data['amount'], bins)
        data['bucket'] = data['bucket'].apply(lambda x: bins[x] if x > 0 else np.nan)

        bucket_fraud_share = data.groupby('bucket')['isFraud'].mean()
        bucket_fraud_share = bucket_fraud_share.fillna(0)

        data['fraud_share'] = data['bucket'].map(bucket_fraud_share)
        data['fraud_share'] = data['fraud_share'].fillna(0) + 1  # +1 как в notebook

        return data

    def _remove_outliers_iqr(self, data: pd.DataFrame, target_column: str) -> pd.DataFrame:
        """Удаление выбросов методом IQR (из notebook)"""
        majority_class = data[data[target_column] == 0]
        minority_class = data[data[target_column] == 1]

        for column in majority_class.select_dtypes(include=['number']).columns:
            if column == target_column:
                continue

            Q1 = majority_class[column].quantile(0.25)
            Q3 = majority_class[column].quantile(0.75)
            IQR = Q3 - Q1

            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR

            majority_class = majority_class[
                (majority_class[column] >= lower_bound) &
                (majority_class[column] <= upper_bound)
            ]

        cleaned_data = pd.concat([majority_class, minority_class])
        return cleaned_data

    def random_oversample(self, df: pd.DataFrame, feature: str, ratio: float) -> pd.DataFrame:
        """
        Random oversampling (из notebook)

        Args:
            df: DataFrame с данными
            feature: Название целевой колонки
            ratio: Желаемое соотношение минорного класса к мажорному
        """
        df_majority = df.loc[df[feature] == df[feature].mode()[0]].copy()
        df_minority = df.loc[df[feature] != df[feature].mode()[0]].copy()

        new_minority_size = int(len(df_majority) * ratio)
        df_minority_oversampled = df_minority.sample(new_minority_size, replace=True)

        df_oversampled = pd.concat([df_majority, df_minority_oversampled], axis=0)

        return df_oversampled

    def train(self, X: pd.DataFrame, y: pd.Series, n_splits: int = 5) -> Dict:
        """
        Обучение модели с кросс-валидацией (из notebook)

        Args:
            X: Признаки
            y: Целевая переменная
            n_splits: Количество фолдов для кросс-валидации

        Returns:
            Словарь с метриками
        """
        logger.info("Начало обучения модели")

        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)

        metrics_list = []
        models = []

        for fold, (train_idx, val_idx) in enumerate(cv.split(X, y)):
            logger.info(f"Обучение fold {fold + 1}/{n_splits}")

            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]

            # Random oversampling
            training_merged = X_train.copy()
            training_merged['isFraud'] = y_train
            training_merged_oversampled = self.random_oversample(training_merged, 'isFraud', 0.5)

            y_train = training_merged_oversampled['isFraud']
            X_train = training_merged_oversampled.drop(['isFraud'], axis=1)

            # Преобразование boolean в int32
            for col in X_train.columns:
                if X_train[col].dtype == 'bool':
                    X_train[col] = X_train[col].astype('int32')
                    X_val[col] = X_val[col].astype('int32')

            # Создание DMatrix
            dtrain = xgb.DMatrix(X_train, label=y_train)
            dval = xgb.DMatrix(X_val, label=y_val)

            # Обучение модели
            model = xgb.train(
                self.params,
                dtrain,
                num_boost_round=self.num_boost_round,
                evals=[(dval, 'validation')],
                verbose_eval=False
            )

            # Предсказания
            y_pred_proba = model.predict(dval)
            y_pred = (y_pred_proba > 0.5).astype(int)

            # Метрики
            precision = precision_score(y_val, y_pred)
            recall = recall_score(y_val, y_pred)
            f1 = f1_score(y_val, y_pred)

            metrics_list.append({
                'fold': fold + 1,
                'precision': precision,
                'recall': recall,
                'f1_score': f1
            })

            models.append(model)

            logger.info(f"Fold {fold + 1} - Precision: {precision:.4f}, Recall: {recall:.4f}, F1: {f1:.4f}")

        # Усреднение метрик
        avg_metrics = {
            'precision': np.mean([m['precision'] for m in metrics_list]),
            'recall': np.mean([m['recall'] for m in metrics_list]),
            'f1_score': np.mean([m['f1_score'] for m in metrics_list])
        }

        logger.info(f"\nСредние метрики:")
        logger.info(f"Precision: {avg_metrics['precision']:.4f}")
        logger.info(f"Recall: {avg_metrics['recall']:.4f}")
        logger.info(f"F1-Score: {avg_metrics['f1_score']:.4f}")

        # Выбираем лучшую модель по recall
        best_idx = np.argmax([m['recall'] for m in metrics_list])
        self.model = models[best_idx]

        logger.info(f"Выбрана модель из fold {best_idx + 1} с recall={metrics_list[best_idx]['recall']:.4f}")

        return {
            'fold_metrics': metrics_list,
            'average_metrics': avg_metrics
        }

    def save_model(self, path: str = "data/models/fraud_model.json"):
        """Сохранение обученной модели"""
        if self.model is None:
            raise ValueError("Модель не обучена")

        os.makedirs(os.path.dirname(path), exist_ok=True)
        self.model.save_model(path)
        logger.info(f"Модель сохранена в {path}")


if __name__ == "__main__":
    # Пример использования
    trainer = ModelTrainer()

    # Путь к данным (нужно указать реальный путь)
    data_path = "data/raw/PS_20174392719_1491204439457_log.csv"

    if os.path.exists(data_path):
        X, y = trainer.load_and_prepare_data(data_path)
        metrics = trainer.train(X, y)
        trainer.save_model()
    else:
        print(f"Файл данных не найден: {data_path}")
