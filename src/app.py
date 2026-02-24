from flask import Flask, request, jsonify
from flask_cors import CORS
from predict import AnemiaModel
from surgery_predict import SurgeryRecoveryModel
import os

app = Flask(__name__)
CORS(app)

# Initialize model
model = AnemiaModel()
surgery_model = SurgeryRecoveryModel()

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        # Validate data
        required_fields = ['Gender', 'Age', 'RBC', 'Hemoglobin', 'Hematocrit', 'MCV', 'MCH', 'MCHC']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        result = model.predict(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/surgery-predict', methods=['POST'])
def surgery_predict():
    try:
        data = request.json or {}
        # Simple endpoint taking pain_level, heart_rate, age, mobility_score etc.
        # Fallback fields managed in surgery_predict.py
        result = surgery_model.predict(data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'message': 'HemoScan AI API is running'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
