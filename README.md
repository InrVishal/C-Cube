# HemoScan AI – Anemia Detection & Risk Analysis System

**Category:** Generative AI & Clinical Decision Support  
**Stack:** React.js, Vite, Flask, Python, Scikit-Learn, Pandas, Numpy, Google Gemini API

---

## 🔬 Project Overview
HemoScan AI is a high-end, AI-driven Clinical Decision Support System (CDSS) designed specifically to detect, predict, and manage Anemia and other blood-borne anomalies. By analyzing Complete Blood Count (CBC) parameters alongside demographic data, the model supports early diagnosis and rapid clinical decision-making.

This platform bridges classical Machine Learning with modern Generative AI to provide an interactive, real-time diagnostic dashboard modeled after premium HealthTech software.

### 🌟 Core Features

#### 1. Pre-Op AI Analyzer (CBC Risk Prediction)
The core ML engine uses a highly trained Scikit-Learn pipeline (Random Forest/SVC) to ingest 8 critical CBC parameters (Hematocrit, Hemoglobin, RBC, MCV, MCH, MCHC, Age, Gender). 
* Outputs a **Calculated Anemia Risk Score (0-99%)**
* Classifies the patient into severity profiles (Mild, Moderate, Severe, Normal).
* The UI features a real-time animated SVG Risk Gauge that updates immediately upon prediction.

#### 2. Generative AI "Recovery Companion" (Google Gemini)
HemoScan integrates directly with the **Google Gemini API** to provide an intelligent, context-aware chatbot.
* **Diet & Nutrition Bot:** Generates custom dietary plans, iron-rich food recommendations, and meal scheduling for anemic patients.
* **Therapy & Lifestyle Bot:** Suggests fatigue management, supplement routines, and post-diagnosis lifestyle changes based on modern clinical guidelines.

#### 3. AI Triage Board (Smart ER Prioritization)
A live, real-time patient queue designed for Emergency Rooms and busy clinics.
* Incoming patient data is assigned an immediate AI Risk Score.
* **Auto-Sorting:** Critical patients (Risk > 80%) instantly flash and jump to the top of the queue, overriding routine cases.
* Supports both **Simulated Auto-Admittance** and **Manual Data Entry** via a secure overriding modal.

#### 4. Digital Morphology (Smear Scanner)
A visually interactive simulation of a high-end WSI (Whole Slide Imaging) microscope.
* Allows clinicians to drag & drop peripheral blood smear images directly into the browser.
* Simulates neural network WSI analysis with scanning sweep animations.
* Dynamically plots spatial annotations highlighting anomalous cell morphology (e.g., Target Cells, Sickle Cells, Gametocytes).

#### 5. Secure Clinical Gateway (EmailJS 2FA)
* Protects the dashboard behind a mocked clinical login screen.
* Integrates **EmailJS** to fire real OTP (One-Time Password) validation codes straight to the clinician's inbox, ensuring HIPAA-level simulation security.

---

## ⚙️ Technical Architecture

### Frontend (User Interface)
* **Framework:** React.js (via Vite)
* **Styling:** Custom Vanilla CSS utilizing a sleek "Off-White HealthTech" aesthetic (Glassmorphism, diffracted drop shadows, clinical colors).
* **Routing:** React Router DOM
* **Email Auth:** `@emailjs/browser`

### Backend (Predictive Engine & GenAI)
* **API Framework:** Flask (Python)
* **Machine Learning Context:** `predict.py` loads `scikit-learn` pickled models (`.pkl`) and data encoders to scale incoming requests and return JSON probabilities.
* **LLM Engine:** `google.generativeai` handles prompt wrapping and context injection for the Recovery Chatbots. 
* **Data Processing:** `Pandas` and `Numpy`

---

## 🚀 How to Run Locally

1. **Start the Flask Backend**
```bash
# In the root repo folder
python src/app.py
```
*(Runs on http://127.0.0.1:5000)*

2. **Start the React Frontend**
```bash
# In a new terminal, navigate to the frontend folder
cd frontend
npm install
npm run dev
```
*(Runs on http://localhost:5173)*
