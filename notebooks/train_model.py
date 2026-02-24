import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    classification_report, accuracy_score,
    confusion_matrix, ConfusionMatrixDisplay
)
import joblib
import os

BASE = 'c:/Users/visha/OneDrive/Desktop/genai'
DATA_PATH = f'{BASE}/data/anemia_dataset.csv'
MODEL_DIR = f'{BASE}/src/models'

def main():
    # ── 1. Load / (re)generate data ──────────────────────────────────────────
    if not os.path.exists(DATA_PATH):
        print("Dataset not found. Generating…")
        import sys; sys.path.insert(0, f'{BASE}/data')
        from generate_data import generate_anemia_data
        df = generate_anemia_data(3000)
        df.to_csv(DATA_PATH, index=False)
    else:
        df = pd.read_csv(DATA_PATH)

    print(f"Dataset loaded: {len(df)} rows")
    print(df['Result'].value_counts())

    # ── 2. Encode features ───────────────────────────────────────────────────
    gender_le = LabelEncoder()
    df['Gender_enc'] = gender_le.fit_transform(df['Gender'])

    target_le = LabelEncoder()
    df['Label'] = target_le.fit_transform(df['Result'])

    feature_cols = ['Gender_enc', 'Age', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC']
    X = df[feature_cols].values
    y = df['Label'].values

    # ── 3. Train / Test split  ───────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── 4. Build pipelines ───────────────────────────────────────────────────
    svm_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('svm',    SVC(C=10, gamma='scale', kernel='rbf', probability=True, random_state=42))
    ])

    lr_pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('lr',     LogisticRegression(C=5, max_iter=2000, random_state=42))
    ])

    rf_pipe = Pipeline([
        ('rf', RandomForestClassifier(n_estimators=200, max_depth=12, random_state=42, n_jobs=-1))
    ])

    models = {'SVM': svm_pipe, 'Logistic Regression': lr_pipe, 'Random Forest': rf_pipe}

    # ── 5. Cross-validation comparison ───────────────────────────────────────
    print("\n── Cross-Validation (5-fold) ──────────────────────────────────────")
    best_score, best_name, best_pipe = 0, None, None
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    for name, pipe in models.items():
        scores = cross_val_score(pipe, X_train, y_train, cv=cv, scoring='accuracy', n_jobs=-1)
        mean_acc = scores.mean()
        print(f"  {name}: CV Accuracy = {mean_acc:.4f} ± {scores.std():.4f}")
        if mean_acc > best_score:
            best_score, best_name, best_pipe = mean_acc, name, pipe

    print(f"\n✅ Best model: {best_name} (CV Acc = {best_score:.4f})")

    # ── 6. Train best model on full training set ─────────────────────────────
    best_pipe.fit(X_train, y_train)

    # ── 7. Evaluate on held-out test set ─────────────────────────────────────
    y_pred = best_pipe.predict(X_test)
    test_acc = accuracy_score(y_test, y_pred)
    print(f"\n── Test Set Evaluation ({best_name}) ─────────────────────────────")
    print(f"  Accuracy: {test_acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=target_le.classes_))

    # Verify determinism — same input → same output every single time
    print("── Determinism check ─────────────────────────────────────────────")
    sample = X_test[0:1]
    p1 = best_pipe.predict(sample)[0]
    p2 = best_pipe.predict(sample)[0]
    p3 = best_pipe.predict(sample)[0]
    print(f"  Predictions for same sample: {p1}, {p2}, {p3}  →  {'✅ DETERMINISTIC' if p1==p2==p3 else '❌ RANDOM - PROBLEM!'}")

    # ── 8. Save artefacts ────────────────────────────────────────────────────
    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(best_pipe,  os.path.join(MODEL_DIR, 'best_model.pkl'))
    joblib.dump(gender_le,  os.path.join(MODEL_DIR, 'gender_encoder.pkl'))
    joblib.dump(target_le,  os.path.join(MODEL_DIR, 'target_encoder.pkl'))
    # Keep legacy svm_model.pkl name too for compatibility
    joblib.dump(best_pipe,  os.path.join(MODEL_DIR, 'svm_model.pkl'))

    print(f"\nModels saved to {MODEL_DIR}")

if __name__ == '__main__':
    main()
