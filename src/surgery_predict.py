import os
import pickle
import sys

# Ensure the local directory is in path so it can import recovery_companion_v4
sys.path.insert(0, os.path.dirname(__file__))
import recovery_companion_v4 as rc

class SurgeryRecoveryModel:
    def __init__(self, model_path="models/recovery_model_v4.pkl"):
        # Absolute path resolution
        abs_path = os.path.join(os.path.dirname(__file__), model_path)
        self.bundle = None
        if os.path.exists(abs_path):
            try:
                with open(abs_path, "rb") as f:
                    self.bundle = pickle.load(f)
                print(f"[Surgery Model] Successfully loaded {abs_path}")
            except Exception as e:
                print(f"[Surgery Model ERROR] Failed to load model: {e}")
        else:
            print(f"[Surgery Model WARNING] {abs_path} not found.")

    def interpret_risk(self, prob):
        percentage = int(prob * 100)
        
        if percentage >= 70:
            zone = "High"
            message = "High risk of post-operative complications detected. Strict monitoring required."
        elif percentage >= 40:
            zone = "Medium"
            message = "Moderate risk. Ensure patient adheres to recovery protocols and hydration."
        else:
            zone = "Low"
            message = "Low risk. Patient is on track for a safe pre/post-operation baseline."

        return {
            "risk_percentage": percentage,
            "zone": zone,
            "message": message
        }

    def predict(self, data: dict):
        if not self.bundle:
            # Fallback if model doesn't load
            prob = 0.52 + (data.get("pain_level", 5) * 0.05) - (data.get("mobility_score", 5) * 0.02)
            if prob > 0.99: prob = 0.99
            if prob < 0.01: prob = 0.01
            return self.interpret_risk(prob)

        patient_data = {
            "disease": data.get("disease", "general_surgery"),
            "prognosis_class": data.get("prognosis_class", "recoverable"),
            "prognosis_enc": data.get("prognosis_enc", 0),
            "days_since_discharge": data.get("days_since_discharge", 0), # pre-op means 0
            
            "pain_level": data.get("pain_level", 4),
            "temperature": data.get("temperature", 98.6),
            "heart_rate": data.get("heart_rate", 75),
            "sbp": data.get("sbp", 120),
            "spo2": data.get("spo2", 98),
            "sleep_hours": data.get("sleep_hours", 7.0),
            "fatigue": data.get("fatigue", 3),
            "appetite": data.get("appetite", 5),
            "mobility_score": data.get("mobility_score", 6),
            "swelling": data.get("swelling", 0),
            "medication_adherence": data.get("medication_adherence", 1),
            
            "age": data.get("age", 65),
            "bmi": data.get("bmi", 28),
            "comorbidity_count": data.get("comorbidity_count", 0),
            
            "prev_pain_level": data.get("prev_pain_level", 5),
            "prev_mobility_score": data.get("prev_mobility_score", 5),
            "_sick_base": 0
        }

        try:
            r = rc.predict_risk(self.bundle, patient_data)
            prob = r.get("risk_probability", 0.0)
            return self.interpret_risk(prob)
        except Exception as e:
            print(f"[Surgery Model Prediction Error] {e}")
            prob = 0.45
            return self.interpret_risk(prob)
