import joblib
import os
import pandas as pd
import numpy as np

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')

FEATURE_COLS = ['Gender_enc', 'Age', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC']

class AnemiaModel:
    def __init__(self, model_dir=MODEL_DIR):
        self.pipeline  = joblib.load(os.path.join(model_dir, 'best_model.pkl'))
        self.gender_le = joblib.load(os.path.join(model_dir, 'gender_encoder.pkl'))
        self.target_le = joblib.load(os.path.join(model_dir, 'target_encoder.pkl'))

    def predict(self, data: dict) -> dict:
        """
        data keys: Gender (str), Age (float), RBC, Hemoglobin, Hematocrit, MCV, MCH, MCHC
        Returns: { diagnosis, risk_score, probabilities }
        """
        gender_enc = int(self.gender_le.transform([data['Gender']])[0])

        row = [[
            gender_enc,
            float(data['Age']),
            float(data['RBC']),
            float(data['Hemoglobin']),
            float(data['Hematocrit']),
            float(data['MCV']),
            float(data['MCH']),
            float(data['MCHC']),
        ]]

        pred_idx   = int(self.pipeline.predict(row)[0])
        diagnosis  = str(self.target_le.inverse_transform([pred_idx])[0])

        proba     = self.pipeline.predict_proba(row)[0]
        classes   = list(self.target_le.classes_)

        # Build probability dict {label: percentage}
        probs = {cls: round(float(p) * 100, 2) for cls, p in zip(classes, proba)}

        # Risk score = probability of being anemic (1 - P(Non-Anemic)), clamped 0–99
        non_anemic_idx = classes.index('Non-Anemic') if 'Non-Anemic' in classes else -1
        if non_anemic_idx >= 0:
            risk_score = round((1 - float(proba[non_anemic_idx])) * 100, 2)
        else:
            risk_score = round(100 - probs.get('Non-Anemic', 0), 2)

        risk_score = max(0.0, min(99.9, risk_score))

        return {
            'diagnosis':     diagnosis,
            'risk_score':    risk_score,
            'probabilities': probs,
        }


if __name__ == '__main__':
    m = AnemiaModel()
    # Test sample: Female, 28y, mild anemia profile
    test = {
        'Gender': 'Female', 'Age': 28,
        'RBC': 4.0, 'Hemoglobin': 11.2, 'Hematocrit': 34.0,
        'MCV': 85.0, 'MCH': 28.0, 'MCHC': 32.9
    }
    print("Run 1:", m.predict(test))
    print("Run 2:", m.predict(test))
    print("Run 3:", m.predict(test))
