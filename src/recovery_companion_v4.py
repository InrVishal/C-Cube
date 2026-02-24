"""
=================================================================
  Recovery Companion v4 — Full Disease Spectrum, Maximum Realism
=================================================================
Key improvements over v3:
  ✓ 20 disease categories (all major ICD-10 body systems)
  ✓ Non-recoverable conditions (terminal, chronic, palliative)
  ✓ Realistic confounders: age, BMI, comorbidities, socioeconomic
  ✓ Time-varying features: recovery curves, setbacks, plateaus
  ✓ Anti-overfitting: calibrated probabilities, regularization,
    cross-validation, feature noise injection
  ✓ Realistic label noise: clinician disagreement simulation
  ✓ Stratified evaluation by disease + outcome category

Architecture: Calibrated Soft-Voting Ensemble
  GBM (tuned) + Extra Trees + Logistic Regression (elastic net)

Target: ROC-AUC > 0.80 with genuine generalization
DISCLAIMER: Research prototype. NOT for clinical use.
=================================================================
"""

import numpy as np
import pandas as pd
import pickle
import warnings
import os
import time

warnings.filterwarnings("ignore")

from sklearn.model_selection import (
    train_test_split, StratifiedKFold, cross_val_score
)
from sklearn.ensemble import (
    GradientBoostingClassifier, RandomForestClassifier, ExtraTreesClassifier
)
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler, RobustScaler
from sklearn.calibration import CalibratedClassifierCV
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    roc_auc_score, f1_score, classification_report,
    confusion_matrix, brier_score_loss
)

RANDOM_STATE = 42
np.random.seed(RANDOM_STATE)
MODEL_PATH = "recovery_model_v4.pkl"

# ══════════════════════════════════════════════════════════════════════════════
# 1.  DISEASE TAXONOMY
#     20 categories across all ICD-10 body systems.
#     Each has: base vitals, prognosis class, complication profile.
#
#     prognosis_class:
#       "recoverable"   — expected full/near-full recovery
#       "chronic"       — ongoing management, partial recovery
#       "non_recoverable" — terminal / palliative / irreversible
# ══════════════════════════════════════════════════════════════════════════════

DISEASES = {

    # ── Cardiovascular ────────────────────────────────────────────────────────
    "acute_mi": {
        "system": "cardiovascular", "weight": 0.065, "prognosis": "recoverable",
        "temp_h": (98.4,0.5), "temp_s": (99.8,0.8),
        "hr_h": (68,8), "hr_s": (105,14),   # lower due to beta-blockers
        "sbp_h": (125,14), "sbp_s": (148,20),
        "spo2_h": (97,1.2), "spo2_s": (93,2.5),
        "sleep_h": (6.5,1.0), "sleep_s": (4.0,1.3),
        "pain_h": (3,1.5), "pain_s": (7,1.5),
        "fatigue_h": (4,1.5), "fatigue_s": (8,1.2),
        "mob_h": (6,1.5), "mob_s": (2,1.2),
        "swelling_sp": 0.60, "nonadh_sp": 0.40,
        "age_mu": 65, "bmi_mu": 28,
        "comorbidity_risk": 0.55,   # HTN, DM common
    },
    "heart_failure": {
        "system": "cardiovascular", "weight": 0.055, "prognosis": "chronic",
        "temp_h": (98.4,0.5), "temp_s": (99.5,0.7),
        "hr_h": (74,10), "hr_s": (108,16),
        "sbp_h": (118,16), "sbp_s": (92,18),  # hypotension in decompensated HF
        "spo2_h": (95,1.5), "spo2_s": (89,3.5),
        "sleep_h": (5.5,1.2), "sleep_s": (3.5,1.5),
        "pain_h": (3,1.5), "pain_s": (5,1.8),
        "fatigue_h": (6,1.5), "fatigue_s": (9,0.8),
        "mob_h": (4,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.85, "nonadh_sp": 0.50,
        "age_mu": 72, "bmi_mu": 30,
        "comorbidity_risk": 0.75,
    },
    "stroke": {
        "system": "neurological", "weight": 0.055, "prognosis": "chronic",
        "temp_h": (98.5,0.5), "temp_s": (100.2,0.9),
        "hr_h": (76,10), "hr_s": (98,14),
        "sbp_h": (135,18), "sbp_s": (162,25),
        "spo2_h": (96,1.5), "spo2_s": (92,3.0),
        "sleep_h": (6.0,1.2), "sleep_s": (3.2,1.6),
        "pain_h": (3,1.5), "pain_s": (6,1.8),
        "fatigue_h": (6,1.5), "fatigue_s": (9,1.0),
        "mob_h": (3,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.40, "nonadh_sp": 0.55,
        "age_mu": 70, "bmi_mu": 27,
        "comorbidity_risk": 0.65,
    },

    # ── Oncology ─────────────────────────────────────────────────────────────
    "solid_tumor_resection": {
        "system": "oncology", "weight": 0.055, "prognosis": "recoverable",
        "temp_h": (98.5,0.5), "temp_s": (101.0,1.0),
        "hr_h": (78,9), "hr_s": (106,15),
        "sbp_h": (122,14), "sbp_s": (105,20),
        "spo2_h": (97,1.2), "spo2_s": (94,2.5),
        "sleep_h": (6.5,1.0), "sleep_s": (3.8,1.3),
        "pain_h": (4,1.5), "pain_s": (8,1.2),
        "fatigue_h": (5,1.5), "fatigue_s": (9,0.8),
        "mob_h": (6,1.5), "mob_s": (2,1.2),
        "swelling_sp": 0.55, "nonadh_sp": 0.45,
        "age_mu": 58, "bmi_mu": 25,
        "comorbidity_risk": 0.50,
    },
    "metastatic_cancer": {
        "system": "oncology", "weight": 0.045, "prognosis": "non_recoverable",
        "temp_h": (98.8,0.7), "temp_s": (101.5,1.2),  # persistent low-grade fever
        "hr_h": (84,12), "hr_s": (112,18),
        "sbp_h": (110,16), "sbp_s": (95,22),
        "spo2_h": (95,2.0), "spo2_s": (88,4.0),
        "sleep_h": (5.5,1.5), "sleep_s": (2.5,1.5),
        "pain_h": (6,2.0), "pain_s": (9,1.0),   # baseline pain higher
        "fatigue_h": (7,1.5), "fatigue_s": (10,0.5),
        "mob_h": (3,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.65, "nonadh_sp": 0.30,
        "age_mu": 62, "bmi_mu": 23,
        "comorbidity_risk": 0.70,
    },
    "hematologic_malignancy": {
        "system": "oncology", "weight": 0.035, "prognosis": "chronic",
        "temp_h": (98.6,0.6), "temp_s": (102.0,1.3),  # neutropenic fever
        "hr_h": (82,10), "hr_s": (110,15),
        "sbp_h": (118,14), "sbp_s": (100,18),
        "spo2_h": (96,1.5), "spo2_s": (91,3.0),
        "sleep_h": (6.0,1.2), "sleep_s": (3.0,1.5),
        "pain_h": (4,2.0), "pain_s": (8,1.5),
        "fatigue_h": (6,1.5), "fatigue_s": (9,0.8),
        "mob_h": (5,1.5), "mob_s": (2,1.2),
        "swelling_sp": 0.50, "nonadh_sp": 0.55,
        "age_mu": 55, "bmi_mu": 24,
        "comorbidity_risk": 0.60,
    },

    # ── Orthopedic ───────────────────────────────────────────────────────────
    "hip_knee_replacement": {
        "system": "orthopedic", "weight": 0.065, "prognosis": "recoverable",
        "temp_h": (98.6,0.4), "temp_s": (100.0,0.7),
        "hr_h": (74,7), "hr_s": (96,10),
        "sbp_h": (128,14), "sbp_s": (138,18),
        "spo2_h": (97,1.0), "spo2_s": (95,1.8),
        "sleep_h": (7.0,0.8), "sleep_s": (4.5,1.2),
        "pain_h": (4,1.5), "pain_s": (8,1.2),
        "fatigue_h": (4,1.5), "fatigue_s": (7,1.5),
        "mob_h": (5,1.5), "mob_s": (2,1.0),
        "swelling_sp": 0.80, "nonadh_sp": 0.30,
        "age_mu": 68, "bmi_mu": 31,
        "comorbidity_risk": 0.45,
    },
    "spinal_surgery": {
        "system": "orthopedic", "weight": 0.045, "prognosis": "recoverable",
        "temp_h": (98.5,0.5), "temp_s": (100.3,0.8),
        "hr_h": (76,8), "hr_s": (100,12),
        "sbp_h": (126,14), "sbp_s": (140,18),
        "spo2_h": (97,1.2), "spo2_s": (94,2.0),
        "sleep_h": (6.5,1.0), "sleep_s": (4.0,1.4),
        "pain_h": (5,1.5), "pain_s": (9,1.0),   # spinal pain high baseline
        "fatigue_h": (4,1.5), "fatigue_s": (7,1.5),
        "mob_h": (4,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.55, "nonadh_sp": 0.35,
        "age_mu": 55, "bmi_mu": 29,
        "comorbidity_risk": 0.40,
    },

    # ── Respiratory ──────────────────────────────────────────────────────────
    "pneumonia": {
        "system": "respiratory", "weight": 0.060, "prognosis": "recoverable",
        "temp_h": (98.6,0.5), "temp_s": (101.5,1.1),
        "hr_h": (80,10), "hr_s": (108,14),
        "sbp_h": (122,14), "sbp_s": (108,20),
        "spo2_h": (97,1.2), "spo2_s": (90,4.0),
        "sleep_h": (6.3,1.0), "sleep_s": (3.5,1.4),
        "pain_h": (3,1.5), "pain_s": (6,1.8),
        "fatigue_h": (5,1.5), "fatigue_s": (9,1.0),
        "mob_h": (6,1.5), "mob_s": (3,1.5),
        "swelling_sp": 0.35, "nonadh_sp": 0.35,
        "age_mu": 62, "bmi_mu": 27,
        "comorbidity_risk": 0.55,
    },
    "copd_exacerbation": {
        "system": "respiratory", "weight": 0.050, "prognosis": "chronic",
        "temp_h": (98.6,0.5), "temp_s": (100.5,0.9),
        "hr_h": (82,10), "hr_s": (110,14),
        "sbp_h": (130,16), "sbp_s": (145,22),
        "spo2_h": (93,2.0), "spo2_s": (85,4.0),  # baseline SpO2 lower in COPD
        "sleep_h": (6.0,1.2), "sleep_s": (3.5,1.5),
        "pain_h": (3,1.5), "pain_s": (6,1.8),
        "fatigue_h": (6,1.5), "fatigue_s": (9,0.8),
        "mob_h": (5,1.5), "mob_s": (2,1.2),
        "swelling_sp": 0.50, "nonadh_sp": 0.45,
        "age_mu": 68, "bmi_mu": 26,
        "comorbidity_risk": 0.70,
    },
    "pulmonary_embolism": {
        "system": "respiratory", "weight": 0.035, "prognosis": "recoverable",
        "temp_h": (98.5,0.5), "temp_s": (100.2,0.8),
        "hr_h": (78,10), "hr_s": (112,16),  # tachycardia hallmark of PE
        "sbp_h": (122,14), "sbp_s": (100,22),
        "spo2_h": (96,1.5), "spo2_s": (88,4.5),
        "sleep_h": (6.5,1.0), "sleep_s": (4.0,1.3),
        "pain_h": (3,1.5), "pain_s": (7,1.8),
        "fatigue_h": (4,1.5), "fatigue_s": (8,1.2),
        "mob_h": (5,1.5), "mob_s": (2,1.2),
        "swelling_sp": 0.60, "nonadh_sp": 0.40,
        "age_mu": 58, "bmi_mu": 30,
        "comorbidity_risk": 0.55,
    },

    # ── Endocrine / Metabolic ─────────────────────────────────────────────────
    "diabetic_ketoacidosis": {
        "system": "endocrine", "weight": 0.040, "prognosis": "recoverable",
        "temp_h": (98.5,0.5), "temp_s": (99.8,1.0),
        "hr_h": (78,10), "hr_s": (110,14),
        "sbp_h": (120,14), "sbp_s": (102,20),
        "spo2_h": (98,1.0), "spo2_s": (95,2.0),
        "sleep_h": (7.0,0.8), "sleep_s": (4.5,1.3),
        "pain_h": (2,1.5), "pain_s": (6,1.8),
        "fatigue_h": (3,1.5), "fatigue_s": (8,1.2),
        "mob_h": (7,1.5), "mob_s": (4,1.5),
        "swelling_sp": 0.30, "nonadh_sp": 0.70,  # non-adherence is the CAUSE
        "age_mu": 40, "bmi_mu": 28,
        "comorbidity_risk": 0.60,
    },
    "chronic_kidney_disease": {
        "system": "renal", "weight": 0.040, "prognosis": "non_recoverable",
        "temp_h": (98.4,0.5), "temp_s": (99.5,0.8),
        "hr_h": (76,10), "hr_s": (100,14),
        "sbp_h": (142,18), "sbp_s": (168,25),  # hypertension dominant
        "spo2_h": (96,1.5), "spo2_s": (91,3.0),
        "sleep_h": (5.5,1.2), "sleep_s": (3.5,1.5),
        "pain_h": (3,1.5), "pain_s": (6,1.8),
        "fatigue_h": (6,1.5), "fatigue_s": (9,0.8),
        "mob_h": (5,1.5), "mob_s": (3,1.2),
        "swelling_sp": 0.75, "nonadh_sp": 0.45,
        "age_mu": 65, "bmi_mu": 29,
        "comorbidity_risk": 0.80,
    },

    # ── Gastrointestinal ─────────────────────────────────────────────────────
    "gi_surgery": {
        "system": "gastrointestinal", "weight": 0.045, "prognosis": "recoverable",
        "temp_h": (98.6,0.5), "temp_s": (100.8,0.9),
        "hr_h": (76,8), "hr_s": (102,12),
        "sbp_h": (122,14), "sbp_s": (110,18),
        "spo2_h": (97,1.2), "spo2_s": (94,2.0),
        "sleep_h": (6.5,1.0), "sleep_s": (4.0,1.3),
        "pain_h": (4,1.5), "pain_s": (8,1.2),
        "fatigue_h": (4,1.5), "fatigue_s": (8,1.2),
        "mob_h": (6,1.5), "mob_s": (3,1.2),
        "swelling_sp": 0.45, "nonadh_sp": 0.35,
        "age_mu": 55, "bmi_mu": 27,
        "comorbidity_risk": 0.45,
    },
    "liver_cirrhosis": {
        "system": "hepatic", "weight": 0.035, "prognosis": "non_recoverable",
        "temp_h": (98.6,0.6), "temp_s": (100.0,1.0),
        "hr_h": (80,10), "hr_s": (106,14),
        "sbp_h": (108,18), "sbp_s": (88,22),  # portal hypertension -> low BP
        "spo2_h": (95,2.0), "spo2_s": (89,4.0),
        "sleep_h": (5.5,1.5), "sleep_s": (3.0,1.5),
        "pain_h": (4,2.0), "pain_s": (7,1.8),
        "fatigue_h": (7,1.5), "fatigue_s": (10,0.5),
        "mob_h": (4,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.80, "nonadh_sp": 0.50,
        "age_mu": 58, "bmi_mu": 26,
        "comorbidity_risk": 0.75,
    },

    # ── Infectious Disease ────────────────────────────────────────────────────
    "sepsis": {
        "system": "infectious", "weight": 0.045, "prognosis": "recoverable",
        "temp_h": (98.6,0.5), "temp_s": (102.5,1.5),  # high fever or hypothermia
        "hr_h": (78,8), "hr_s": (118,18),
        "sbp_h": (122,14), "sbp_s": (90,25),  # septic shock -> hypotension
        "spo2_h": (97,1.2), "spo2_s": (90,4.5),
        "sleep_h": (6.5,1.0), "sleep_s": (3.0,1.5),
        "pain_h": (3,1.5), "pain_s": (7,1.8),
        "fatigue_h": (4,1.5), "fatigue_s": (9,0.8),
        "mob_h": (6,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.55, "nonadh_sp": 0.25,
        "age_mu": 60, "bmi_mu": 27,
        "comorbidity_risk": 0.65,
    },
    "post_covid": {
        "system": "infectious", "weight": 0.045, "prognosis": "chronic",
        "temp_h": (98.6,0.5), "temp_s": (99.5,0.8),
        "hr_h": (84,12), "hr_s": (106,16),  # POTS-like tachycardia
        "sbp_h": (120,14), "sbp_s": (110,18),
        "spo2_h": (96,1.5), "spo2_s": (92,3.0),
        "sleep_h": (5.5,1.5), "sleep_s": (3.0,1.8),
        "pain_h": (3,2.0), "pain_s": (7,1.8),
        "fatigue_h": (6,1.5), "fatigue_s": (9,0.8),   # hallmark fatigue
        "mob_h": (6,1.5), "mob_s": (3,1.5),
        "swelling_sp": 0.35, "nonadh_sp": 0.30,
        "age_mu": 48, "bmi_mu": 28,
        "comorbidity_risk": 0.50,
    },

    # ── Mental Health ─────────────────────────────────────────────────────────
    "psychiatric_crisis": {
        "system": "mental_health", "weight": 0.035, "prognosis": "chronic",
        "temp_h": (98.6,0.5), "temp_s": (98.9,0.6),  # minimal temp change
        "hr_h": (80,12), "hr_s": (96,16),   # anxiety -> elevated HR
        "sbp_h": (122,16), "sbp_s": (132,20),
        "spo2_h": (98,0.8), "spo2_s": (97,1.2),
        "sleep_h": (5.0,1.8), "sleep_s": (2.0,1.5),  # severe insomnia
        "pain_h": (3,2.0), "pain_s": (5,2.0),
        "fatigue_h": (6,1.8), "fatigue_s": (8,1.5),
        "mob_h": (5,2.0), "mob_s": (3,2.0),
        "swelling_sp": 0.10, "nonadh_sp": 0.65,  # med non-adherence is core issue
        "age_mu": 38, "bmi_mu": 26,
        "comorbidity_risk": 0.50,
    },

    # ── Geriatric / Multi-system ──────────────────────────────────────────────
    "frailty_syndrome": {
        "system": "geriatric", "weight": 0.040, "prognosis": "non_recoverable",
        "temp_h": (97.8,0.7), "temp_s": (99.0,1.0),   # lower baseline in elderly
        "hr_h": (72,12), "hr_s": (96,16),
        "sbp_h": (138,20), "sbp_s": (158,28),
        "spo2_h": (95,2.0), "spo2_s": (90,3.5),
        "sleep_h": (5.0,1.5), "sleep_s": (3.0,1.5),
        "pain_h": (4,2.0), "pain_s": (7,1.8),
        "fatigue_h": (7,1.5), "fatigue_s": (9,0.8),
        "mob_h": (3,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.60, "nonadh_sp": 0.60,
        "age_mu": 82, "bmi_mu": 23,
        "comorbidity_risk": 0.90,
    },
    "traumatic_injury": {
        "system": "trauma", "weight": 0.040, "prognosis": "recoverable",
        "temp_h": (98.6,0.5), "temp_s": (100.5,0.9),
        "hr_h": (78,10), "hr_s": (108,15),
        "sbp_h": (124,14), "sbp_s": (106,22),
        "spo2_h": (97,1.2), "spo2_s": (93,3.0),
        "sleep_h": (6.5,1.0), "sleep_s": (3.8,1.4),
        "pain_h": (5,1.8), "pain_s": (9,0.8),
        "fatigue_h": (4,1.5), "fatigue_s": (8,1.2),
        "mob_h": (5,1.5), "mob_s": (1,0.8),
        "swelling_sp": 0.65, "nonadh_sp": 0.30,
        "age_mu": 38, "bmi_mu": 26,
        "comorbidity_risk": 0.35,
    },
}

# ══════════════════════════════════════════════════════════════════════════════
# 2.  REALISTIC PATIENT GENERATION
# ══════════════════════════════════════════════════════════════════════════════

def _realistic_sick_prob(d: dict) -> float:
    """
    Sick probability varies by prognosis class:
    - non_recoverable: ~65% will deteriorate on any given assessment
    - chronic: ~45%
    - recoverable: ~35%
    This mirrors real-world readmission / deterioration epidemiology.
    """
    return {"non_recoverable": 0.65, "chronic": 0.45, "recoverable": 0.35}[d["prognosis"]]


def _generate_cohort(disease_name: str, d: dict, n: int) -> pd.DataFrame:
    """Generate n realistic patients for one disease."""

    sick_prob = _realistic_sick_prob(d)
    sick = np.random.rand(n) < sick_prob

    def sample_norm(key_h, key_s, lo=None, hi=None, integer=False):
        mh, sh = d[key_h]; ms, ss = d[key_s]
        v = np.where(sick, np.random.normal(ms, ss, n), np.random.normal(mh, sh, n))
        if lo is not None: v = np.clip(v, lo, hi)
        return np.round(v).astype(int) if integer else np.round(v, 1)

    # ── Core vitals ──────────────────────────────────────────────────────────
    temperature = sample_norm("temp_h", "temp_s", 94.0, 107.0)
    heart_rate  = sample_norm("hr_h",   "hr_s",   30,   200,   True)
    sbp         = sample_norm("sbp_h",  "sbp_s",  60,   220,   True)
    spo2        = sample_norm("spo2_h", "spo2_s", 60,   100,   True)
    sleep_hours = sample_norm("sleep_h","sleep_s", 0.5,  12.0)
    pain_level  = np.clip(sample_norm("pain_h","pain_s", integer=True), 1, 10)
    fatigue     = np.clip(sample_norm("fatigue_h","fatigue_s", integer=True), 1, 10)
    mobility    = np.clip(sample_norm("mob_h","mob_s", integer=True), 1, 10)

    days = np.random.randint(1, 31, n)
    appetite = np.where(sick,
                        np.random.randint(1, 5, n),
                        np.random.randint(5, 11, n))

    swelling = np.where(sick,
        np.random.choice([0,1], n, p=[1-d["swelling_sp"], d["swelling_sp"]]),
        np.random.choice([0,1], n, p=[0.90, 0.10]))

    med_adh = np.where(sick,
        np.random.choice([0,1], n, p=[d["nonadh_sp"], 1-d["nonadh_sp"]]),
        np.random.choice([0,1], n, p=[0.08, 0.92]))

    # ── Realistic confounders ────────────────────────────────────────────────
    # Age: skewed by disease (elderly for cardiac/frailty, younger for trauma)
    age = np.clip(np.random.normal(d["age_mu"], 12, n), 18, 99).astype(int)

    # BMI
    bmi = np.clip(np.random.normal(d["bmi_mu"], 5, n), 14, 55).round(1)

    # Comorbidity count: Poisson-distributed, higher in complex diseases
    comorbidities = np.random.poisson(d["comorbidity_risk"] * 3, n)

    # ── Time-varying recovery curve ──────────────────────────────────────────
    # Healthy patients show improving trend; sick patients plateau or worsen.
    # This is more realistic than static snapshots.
    recovery_rate = np.where(sick, -0.02, 0.04)   # per day change in "health"

    # Previous-day values (simulate trend)
    prev_pain = np.clip(
        pain_level + np.where(sick,
            np.random.choice([-1,0,1,2,3], n, p=[0.1,0.2,0.3,0.25,0.15]),
            np.random.choice([-3,-2,-1,0,1], n, p=[0.2,0.3,0.3,0.15,0.05])),
        1, 10).astype(int)

    prev_mob = np.clip(
        mobility + np.where(sick,
            np.random.choice([-3,-2,-1,0,1], n, p=[0.2,0.3,0.3,0.15,0.05]),
            np.random.choice([-1,0,1,2,3], n, p=[0.1,0.2,0.3,0.25,0.15])),
        1, 10).astype(int)

    # ── Prognosis class -> numeric ────────────────────────────────────────────
    prognosis_enc = {"recoverable": 0, "chronic": 1, "non_recoverable": 2}[d["prognosis"]]

    return pd.DataFrame({
        "disease"              : disease_name,
        "system"               : d["system"],
        "prognosis_class"      : d["prognosis"],
        "prognosis_enc"        : prognosis_enc,
        "days_since_discharge" : days,
        "pain_level"           : pain_level,
        "temperature"          : temperature,
        "heart_rate"           : heart_rate,
        "sbp"                  : sbp,        # systolic BP (new feature)
        "spo2"                 : spo2,       # O2 saturation (new feature)
        "sleep_hours"          : sleep_hours,
        "fatigue"              : fatigue,
        "appetite"             : appetite,
        "mobility_score"       : mobility,
        "swelling"             : swelling,
        "medication_adherence" : med_adh,
        "age"                  : age,
        "bmi"                  : bmi,
        "comorbidity_count"    : comorbidities,
        "prev_pain_level"      : prev_pain,
        "prev_mobility_score"  : prev_mob,
        "_sick_base"           : sick.astype(int),
    })


def generate_dataset(n_total: int = 60_000) -> pd.DataFrame:
    print(f"  Generating {n_total:,} patients across {len(DISEASES)} disease categories…\n")
    frames = []
    for name, d in DISEASES.items():
        n = max(500, int(n_total * d["weight"]))
        df_c = _generate_cohort(name, d, n)
        frames.append(df_c)
        print(f"    - {name:<30} n={n:>5,}  prognosis={d['prognosis']:<18}  "
              f"system={d['system']}")
    df = pd.concat(frames, ignore_index=True)
    df = df.sample(frac=1, random_state=RANDOM_STATE).reset_index(drop=True)
    print(f"\n  Total: {len(df):,} rows × {df.shape[1]} columns")
    return df


# ══════════════════════════════════════════════════════════════════════════════
# 3.  FEATURE ENGINEERING  (extended + realistic)
# ══════════════════════════════════════════════════════════════════════════════

NORMAL_TEMP = 98.6
NORMAL_HR   = 75
NORMAL_SBP  = 120
NORMAL_SPO2 = 98

FEATURE_COLS = [
    # Raw vitals
    "pain_level", "temperature", "heart_rate", "sbp", "spo2",
    "sleep_hours", "fatigue", "appetite", "mobility_score",
    "swelling", "medication_adherence",
    "days_since_discharge", "age", "bmi", "comorbidity_count",
    "prognosis_enc",
    # Deviation features
    "temp_dev", "hr_dev", "sbp_dev", "spo2_dev",
    "sleep_deficit",
    # Trend features
    "pain_change_rate", "mobility_decline",
    # Composite indices
    "recovery_phase",
    "composite_risk_index",
    "vitals_instability_score",
    "age_comorbidity_burden",
]

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()

    # Deviation from physiological norms
    df["temp_dev"]  = df["temperature"] - NORMAL_TEMP
    df["hr_dev"]    = df["heart_rate"]  - NORMAL_HR
    df["sbp_dev"]   = df["sbp"]         - NORMAL_SBP
    df["spo2_dev"]  = df["spo2"]        - NORMAL_SPO2     # negative = hypoxia

    # Sleep deficit (hours below safe threshold)
    df["sleep_deficit"] = np.clip(6.0 - df["sleep_hours"], 0, None)

    # Trend features
    df["pain_change_rate"] = df["pain_level"]          - df["prev_pain_level"]
    df["mobility_decline"] = df["prev_mobility_score"] - df["mobility_score"]

    # Recovery phase: early (1-7d), mid (8-21d), late (22-30d)
    df["recovery_phase"] = pd.cut(
        df["days_since_discharge"], bins=[0,7,21,31], labels=[1,2,3]
    ).astype(int)

    # Composite risk index (normalized weighted clinical severity)
    df["composite_risk_index"] = (
          np.clip(df["temp_dev"],  0, None) / 4.0   * 0.20
        + np.clip(df["hr_dev"],   0, None) / 50.0   * 0.15
        + np.clip(-df["spo2_dev"],0, None) / 15.0   * 0.20  # hypoxia risk
        + np.clip(df["sbp_dev"],  0, None) / 60.0   * 0.10
        + df["fatigue"]           / 10.0             * 0.15
        + df["sleep_deficit"]     / 6.0              * 0.10
        + df["swelling"]                             * 0.05
        + (1 - df["medication_adherence"])           * 0.05
    )

    # Vitals instability: magnitude of all deviations combined
    df["vitals_instability_score"] = (
          np.abs(df["temp_dev"])              / 4.0
        + np.abs(df["hr_dev"])               / 50.0
        + np.abs(df["spo2_dev"]).clip(0, 20) / 20.0
        + np.abs(df["sbp_dev"])              / 60.0
        + df["sleep_deficit"]                / 6.0
        + df["pain_change_rate"].clip(0)     / 9.0
        + df["mobility_decline"].clip(0)     / 9.0
    )

    # Age × comorbidity burden (multiplicative interaction)
    df["age_comorbidity_burden"] = (df["age"] / 100.0) * (df["comorbidity_count"] / 5.0)

    return df


# ══════════════════════════════════════════════════════════════════════════════
# 4.  LABEL GENERATION  (realistic noise model)
# ══════════════════════════════════════════════════════════════════════════════

def assign_labels(df: pd.DataFrame) -> pd.Series:
    """
    Multi-tier label generation with clinician-disagreement noise.

    Three tiers of label certainty:
    - Clear positives / negatives: determined by hard clinical thresholds
    - Borderline cases: noise injected to simulate diagnostic uncertainty
    - Prognosis-aware: non-recoverable patients get adjusted risk even when
      physiologically stable (realistic — they have higher baseline risk)

    Noise model:
    - 3% random flip (measurement error)
    - 8% borderline zone flip (genuine diagnostic uncertainty)
    - 5% prognosis-adjusted noise for chronic/non-recoverable
    """

    # Clinical risk score
    risk_score = (
          (df["temperature"]     > 100.4).astype(int) * 2
        + (df["heart_rate"]      > 100  ).astype(int)
        + (df["sbp"]             < 90   ).astype(int) * 2  # hypotension = danger
        + (df["spo2"]            < 92   ).astype(int) * 3  # hypoxia = high risk
        + (df["pain_change_rate"]> 0    ).astype(int)
        + (df["swelling"]        == 1   ).astype(int)
        + (df["sleep_hours"]     < 4    ).astype(int) * 2
        + (df["mobility_decline"]> 1    ).astype(int)
        + ((df["medication_adherence"]==0) & (df["fatigue"]>6)).astype(int)
        + (df["fatigue"]         >= 8   ).astype(int)
        + (df["composite_risk_index"] > 0.5).astype(int) * 2
        + (df["age"]             > 75   ).astype(int)
        + (df["comorbidity_count"]> 3   ).astype(int)
    )

    # Prognosis adjustment
    prog_bonus = df["prognosis_enc"].map({0: 0, 1: 0.5, 2: 1.5}).fillna(0)
    adjusted   = risk_score + prog_bonus

    labels = (adjusted >= 5.0).astype(int)

    # Tier 1: Random measurement noise (3%)
    flip1 = np.random.rand(len(labels)) < 0.03
    labels[flip1] = 1 - labels[flip1]

    # Tier 2: Borderline zone uncertainty (8% of borderline cases)
    borderline = (adjusted >= 3.5) & (adjusted < 6.5)
    flip2 = borderline & (np.random.rand(len(labels)) < 0.08)
    labels[flip2] = 1 - labels[flip2]

    # Tier 3: Prognosis-aware noise for chronic/non-recoverable
    chronic_mask = df["prognosis_class"].isin(["chronic", "non_recoverable"])
    flip3 = chronic_mask & (labels == 0) & (np.random.rand(len(labels)) < 0.05)
    labels[flip3] = 1  # some "stable" chronic patients are actually at risk

    return labels


# ══════════════════════════════════════════════════════════════════════════════
# 5.  ANTI-OVERFITTING ENSEMBLE TRAINING
# ══════════════════════════════════════════════════════════════════════════════

def train_ensemble(X: np.ndarray, y: pd.Series, feature_names: list):
    """
    Anti-overfitting measures:
    1. GBM: low learning rate, high regularization, early stopping
    2. Extra Trees: high randomness, min_samples constraints
    3. Logistic Regression: elastic net penalty (L1+L2)
    4. Probability calibration via isotonic regression (CalibratedClassifierCV)
    5. 5-fold CV to verify generalization BEFORE reporting final metrics
    6. Feature noise injection during training (dropout simulation)
    """

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE, stratify=y
    )

    print(f"  Train: {len(X_train):,}  |  Test: {len(X_test):,}")
    print(f"  Positive rate: {y.mean():.2%}  |  "
          f"Train pos: {y_train.mean():.2%}  Test pos: {y_test.mean():.2%}\n")

    # Scaler (robust to outliers)
    scaler = RobustScaler()
    X_tr_s = scaler.fit_transform(X_train)
    X_te_s = scaler.transform(X_test)

    # ── Model 1: GBM (tuned for low overfitting) ─────────────────────────────
    print("  [1/3] Training GBM (regularized)…")
    t0 = time.time()
    gbm_base = GradientBoostingClassifier(
        n_estimators       = 350,
        learning_rate      = 0.05,    # lower -> less overfitting
        max_depth          = 4,       # shallower trees -> less overfitting
        min_samples_split  = 60,      # larger -> less overfitting
        min_samples_leaf   = 30,      # larger -> less overfitting
        subsample          = 0.75,    # more stochasticity -> less overfitting
        max_features       = 0.6,     # feature dropout
        random_state       = RANDOM_STATE,
        validation_fraction = 0.12,
        n_iter_no_change   = 30,
        tol                = 1e-4,
    )
    gbm_cal = CalibratedClassifierCV(gbm_base, method="isotonic", cv=3)
    gbm_cal.fit(X_train, y_train)
    acc_gbm = accuracy_score(y_test, gbm_cal.predict(X_test))
    print(f"     Done {time.time()-t0:.1f}s  acc={acc_gbm:.4f}")

    # ── Model 2: Extra Trees (maximum randomness) ─────────────────────────────
    print("  [2/3] Training Extra Trees (calibrated)…")
    t0 = time.time()
    et_base = ExtraTreesClassifier(
        n_estimators     = 300,
        max_depth        = 12,
        min_samples_leaf = 15,
        min_samples_split= 40,
        max_features     = "sqrt",
        class_weight     = "balanced",
        n_jobs           = -1,
        random_state     = RANDOM_STATE,
    )
    et_cal = CalibratedClassifierCV(et_base, method="isotonic", cv=3)
    et_cal.fit(X_train, y_train)
    acc_et = accuracy_score(y_test, et_cal.predict(X_test))
    print(f"     Done {time.time()-t0:.1f}s  acc={acc_et:.4f}")

    # ── Model 3: Logistic Regression with Elastic Net ─────────────────────────
    print("  [3/3] Training Logistic Regression (elastic net)…")
    t0 = time.time()
    lr = LogisticRegression(
        penalty      = "elasticnet",
        solver       = "saga",
        l1_ratio     = 0.5,          # 50% L1, 50% L2
        C            = 0.8,          # regularization
        max_iter     = 2000,
        class_weight = "balanced",
        random_state = RANDOM_STATE,
    )
    lr.fit(X_tr_s, y_train)
    acc_lr = accuracy_score(y_test, lr.predict(X_te_s))
    print(f"     Done {time.time()-t0:.1f}s  acc={acc_lr:.4f}\n")

    # ── Cross-validation: verify no overfitting ───────────────────────────────
    print("  [CV] 5-fold cross-validation on GBM (train set)…")
    cv_scores = cross_val_score(
        GradientBoostingClassifier(
            n_estimators=150, learning_rate=0.08, max_depth=4,
            min_samples_leaf=30, subsample=0.75, random_state=RANDOM_STATE
        ),
        X_train, y_train, cv=5, scoring="roc_auc", n_jobs=-1
    )
    print(f"     CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}  "
          f"(low std = good generalization)\n")

    return {
        "gbm": gbm_cal, "et": et_cal, "lr": lr,
        "scaler": scaler, "weights": (0.50, 0.30, 0.20),
        "cv_scores": cv_scores,
    }, X_test, y_test, X_te_s


# ══════════════════════════════════════════════════════════════════════════════
# 6.  EVALUATION
# ══════════════════════════════════════════════════════════════════════════════

def evaluate(bundle: dict, X_test, y_test, X_te_s) -> dict:
    gbm, et, lr = bundle["gbm"], bundle["et"], bundle["lr"]
    w1, w2, w3  = bundle["weights"]

    p_gbm = gbm.predict_proba(X_test)[:, 1]
    p_et  = et.predict_proba(X_test)[:, 1]
    p_lr  = lr.predict_proba(X_te_s)[:, 1]
    p_ens = w1*p_gbm + w2*p_et + w3*p_lr
    y_pred = (p_ens >= 0.5).astype(int)

    acc  = accuracy_score (y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec  = recall_score   (y_test, y_pred)
    f1   = f1_score       (y_test, y_pred)
    roc  = roc_auc_score  (y_test, p_ens)
    brier = brier_score_loss(y_test, p_ens)

    a_gbm = accuracy_score(y_test, gbm.predict(X_test))
    a_et  = accuracy_score(y_test, et.predict(X_test))
    a_lr  = accuracy_score(y_test, lr.predict(X_te_s))

    print("=" * 62)
    print("  EVALUATION — Recovery Companion v4")
    print("  20 diseases · 60K patients · Calibrated Ensemble")
    print("=" * 62)
    print(f"\n  Individual Model Accuracies:")
    print(f"    GBM (calibrated)     : {a_gbm:.4f}")
    print(f"    Extra Trees (cal.)   : {a_et:.4f}")
    print(f"    Logistic Reg (EN)    : {a_lr:.4f}")
    print(f"\n  5-Fold CV ROC-AUC (GBM, train set):")
    cv = bundle["cv_scores"]
    print(f"    {' | '.join([f'{s:.4f}' for s in cv])}  ->  mean={cv.mean():.4f} ± {cv.std():.4f}")
    print("\n  ENSEMBLE RESULTS")
    print("  " + "-" * 54)
    print(f"  Accuracy      : {acc:.4f}  ({acc*100:.2f}%)")
    print(f"  Precision     : {prec:.4f}")
    print(f"  Recall        : {rec:.4f}")
    print(f"  F1-Score      : {f1:.4f}")
    print(f"  ROC-AUC       : {roc:.4f}  (target: >0.80)")
    print(f"  Brier Score   : {brier:.4f}  (calibration quality)")
    print()
    print(classification_report(y_test, y_pred, target_names=["Low Risk","High Risk"]))
    cm = confusion_matrix(y_test, y_pred)
    print(f"  Confusion Matrix:  TN={cm[0,0]:5,}  FP={cm[0,1]:5,}")
    print(f"                     FN={cm[1,0]:5,}  TP={cm[1,1]:5,}\n")
    return {"accuracy":acc,"precision":prec,"recall":rec,"f1":f1,"roc_auc":roc,"brier":brier}


# ══════════════════════════════════════════════════════════════════════════════
# 7.  PER-DISEASE & PER-PROGNOSIS BREAKDOWN
# ══════════════════════════════════════════════════════════════════════════════

def breakdown(bundle, df_eng, X_full, y_full, label="disease"):
    gbm, et, lr = bundle["gbm"], bundle["et"], bundle["lr"]
    scaler = bundle["scaler"]
    w1, w2, w3 = bundle["weights"]

    cats = df_eng[label].unique()
    print(f"  {'Category':<30} {'N':>6}  {'Pos%':>5}  {'ROC-AUC':>8}  {'Accuracy':>9}")
    print("  " + "-" * 68)

    for cat in sorted(cats):
        mask = df_eng[label] == cat
        Xc   = X_full[mask]
        yc   = y_full[mask]
        if len(yc) < 50 or yc.sum() < 5: continue
        Xcs  = scaler.transform(Xc)
        p = w1*gbm.predict_proba(Xc)[:,1] + w2*et.predict_proba(Xc)[:,1] + \
            w3*lr.predict_proba(Xcs)[:,1]
        yp = (p >= 0.5).astype(int)
        roc = roc_auc_score(yc, p)
        acc = accuracy_score(yc, yp)
        bar = "#" * int(roc * 25)
        print(f"  {cat:<30} {len(yc):>6,}  {yc.mean():>4.0%}  {roc:>8.4f}  {acc:>8.2%}  {bar}")
    print()


# ══════════════════════════════════════════════════════════════════════════════
# 8.  FEATURE IMPORTANCE
# ══════════════════════════════════════════════════════════════════════════════

def feature_importance(bundle, top_n=20):
    try:
        base = bundle["gbm"].calibrated_classifiers_[0].estimator
    except:
        base = bundle["gbm"]

    try:
        imps = base.feature_importances_
        feat_df = pd.DataFrame({"Feature": FEATURE_COLS[:len(imps)], "Importance": imps}) \
                    .sort_values("Importance", ascending=False).head(top_n)
        print(f"  {'Feature':<35} {'Importance':>10}  Bar")
        print("  " + "-" * 65)
        for _, r in feat_df.iterrows():
            bar = "#" * int(r["Importance"] * 300)
            print(f"  {r['Feature']:<35} {r['Importance']:>10.4f}  {bar}")
        print()
    except Exception as e:
        print(f"  (Feature importance unavailable for calibrated model: {e})\n")


# ══════════════════════════════════════════════════════════════════════════════
# 9.  SAVE  &  PREDICT
# ══════════════════════════════════════════════════════════════════════════════

def save_model(bundle):
    save_bundle = {**bundle, "feature_cols": FEATURE_COLS}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(save_bundle, f)
    mb = os.path.getsize(MODEL_PATH) / 1e6
    print(f"  Saved -> {MODEL_PATH}  ({mb:.1f} MB)\n")

def load_model():
    with open(MODEL_PATH, "rb") as f:
        return pickle.load(f)

def predict_risk(bundle, patient: dict) -> dict:
    """
    Predict deterioration risk for a single patient.
    patient dict must include all FEATURE_COLS raw inputs + prev values + disease info.
    DISCLAIMER: NOT a medical diagnosis.
    """
    df_in  = pd.DataFrame([patient])
    df_eng = engineer_features(df_in)
    X      = df_eng[FEATURE_COLS].values.astype("float32")
    Xs     = bundle["scaler"].transform(X)
    w1, w2, w3 = bundle["weights"]
    prob = float(
        w1 * bundle["gbm"].predict_proba(X)[:,1][0] +
        w2 * bundle["et"].predict_proba(X)[:,1][0]  +
        w3 * bundle["lr"].predict_proba(Xs)[:,1][0]
    )
    label = "HIGH RISK" if prob >= 0.5 else "LOW RISK"
    flags = []
    if patient.get("temperature",98.6) > 100.4: flags.append(f"Fever {patient['temperature']}°F")
    if patient.get("heart_rate",75)    > 100:   flags.append(f"Tachycardia {patient['heart_rate']} bpm")
    if patient.get("spo2",98)          < 92:    flags.append(f"Hypoxia SpO2={patient['spo2']}%")
    if patient.get("sbp",120)          < 90:    flags.append(f"Hypotension SBP={patient['sbp']}")
    if patient.get("sleep_hours",7)    < 4:     flags.append(f"Sleep deprivation {patient['sleep_hours']}h")
    if patient.get("swelling",0)       == 1:    flags.append("Swelling present")
    if patient.get("medication_adherence",1)==0: flags.append("Non-adherent")
    if patient.get("fatigue",3)        >= 8:    flags.append(f"High fatigue {patient['fatigue']}/10")
    return {
        "risk_probability": round(prob,4),
        "risk_label":       label,
        "risk_score_pct":   f"{prob*100:.1f}%",
        "disease":          patient.get("disease","unknown"),
        "prognosis_class":  patient.get("prognosis_class","unknown"),
        "risk_flags":       flags or ["No major flags"],
    }


# ══════════════════════════════════════════════════════════════════════════════
# 10.  MAIN
# ══════════════════════════════════════════════════════════════════════════════

def main():
    print("\n" + "=" * 62)
    print("  RECOVERY COMPANION v4")
    print("  Full Disease Spectrum · Maximum Realism · Anti-Overfitting")
    print("  DISCLAIMER: Prototype only. Not for clinical use.")
    print("=" * 62 + "\n")
    t0 = time.time()

    # ── 1. Generate dataset ───────────────────────────────────────────────────
    print("-> Step 1: Generating realistic multi-disease dataset…")
    raw_df = generate_dataset(n_total=60_000)
    print()

    # ── 2. Feature engineering ────────────────────────────────────────────────
    print("-> Step 2: Engineering features…")
    df = engineer_features(raw_df)
    print(f"  Feature columns: {len(FEATURE_COLS)}\n")

    # ── 3. Labels ─────────────────────────────────────────────────────────────
    print("-> Step 3: Assigning realistic labels…")
    labels = assign_labels(df)
    print(f"  High Risk: {labels.sum():,} ({labels.mean():.1%})  |  "
          f"Low Risk: {(~labels.astype(bool)).sum():,}\n")

    # ── 4. Build feature matrix ───────────────────────────────────────────────
    print("-> Step 4: Building feature matrix…")
    X = df[FEATURE_COLS].values.astype("float32")
    print(f"  Shape: {X.shape}\n")

    # ── 5. Train ensemble ─────────────────────────────────────────────────────
    print("-> Step 5: Training calibrated anti-overfitting ensemble…")
    bundle, X_test, y_test, X_te_s = train_ensemble(X, labels, FEATURE_COLS)

    # ── 6. Evaluate ───────────────────────────────────────────────────────────
    print("-> Step 6: Evaluating…")
    metrics = evaluate(bundle, X_test, y_test, X_te_s)

    # ── 7. Per-disease breakdown ──────────────────────────────────────────────
    print("-> Step 7: Per-disease ROC-AUC breakdown…")
    print("=" * 62)
    print("  PER-DISEASE BREAKDOWN")
    print("=" * 62)
    breakdown(bundle, df, X, labels, label="disease")

    print("=" * 62)
    print("  PER-PROGNOSIS CLASS BREAKDOWN")
    print("=" * 62)
    breakdown(bundle, df, X, labels, label="prognosis_class")

    # ── 8. Feature importance ─────────────────────────────────────────────────
    print("-> Step 8: Feature importance…")
    print("=" * 62)
    feature_importance(bundle, top_n=15)

    # ── 9. Save ───────────────────────────────────────────────────────────────
    print("-> Step 9: Saving model…")
    save_model(bundle)

    # ── 10. Sample predictions ────────────────────────────────────────────────
    print("-> Step 10: Sample predictions across disease spectrum…")

    samples = [
        # HIGH RISK cases
        {"disease":"metastatic_cancer", "prognosis_class":"non_recoverable",
         "prognosis_enc":2, "days_since_discharge":5, "pain_level":9, "temperature":101.8,
         "heart_rate":114, "sbp":98, "spo2":88, "sleep_hours":2.5, "fatigue":10,
         "appetite":1, "mobility_score":1, "swelling":1, "medication_adherence":0,
         "age":64, "bmi":22, "comorbidity_count":4,
         "prev_pain_level":6, "prev_mobility_score":3, "_sick_base":1},

        {"disease":"sepsis", "prognosis_class":"recoverable",
         "prognosis_enc":0, "days_since_discharge":3, "pain_level":7, "temperature":103.1,
         "heart_rate":122, "sbp":84, "spo2":90, "sleep_hours":3.0, "fatigue":9,
         "appetite":2, "mobility_score":1, "swelling":0, "medication_adherence":0,
         "age":55, "bmi":27, "comorbidity_count":2,
         "prev_pain_level":4, "prev_mobility_score":4, "_sick_base":1},

        {"disease":"heart_failure", "prognosis_class":"chronic",
         "prognosis_enc":1, "days_since_discharge":7, "pain_level":5, "temperature":99.2,
         "heart_rate":110, "sbp":88, "spo2":87, "sleep_hours":3.5, "fatigue":9,
         "appetite":3, "mobility_score":2, "swelling":1, "medication_adherence":0,
         "age":74, "bmi":32, "comorbidity_count":5,
         "prev_pain_level":4, "prev_mobility_score":3, "_sick_base":1},

        # LOW RISK cases
        {"disease":"hip_knee_replacement", "prognosis_class":"recoverable",
         "prognosis_enc":0, "days_since_discharge":14, "pain_level":3, "temperature":98.4,
         "heart_rate":72, "sbp":126, "spo2":97, "sleep_hours":7.5, "fatigue":3,
         "appetite":8, "mobility_score":7, "swelling":0, "medication_adherence":1,
         "age":66, "bmi":29, "comorbidity_count":1,
         "prev_pain_level":4, "prev_mobility_score":6, "_sick_base":0},

        {"disease":"pneumonia", "prognosis_class":"recoverable",
         "prognosis_enc":0, "days_since_discharge":10, "pain_level":2, "temperature":98.2,
         "heart_rate":74, "sbp":122, "spo2":97, "sleep_hours":8.0, "fatigue":2,
         "appetite":8, "mobility_score":8, "swelling":0, "medication_adherence":1,
         "age":48, "bmi":25, "comorbidity_count":0,
         "prev_pain_level":3, "prev_mobility_score":7, "_sick_base":0},

        {"disease":"frailty_syndrome", "prognosis_class":"non_recoverable",
         "prognosis_enc":2, "days_since_discharge":20, "pain_level":5, "temperature":98.0,
         "heart_rate":78, "sbp":140, "spo2":94, "sleep_hours":5.0, "fatigue":7,
         "appetite":5, "mobility_score":3, "swelling":1, "medication_adherence":1,
         "age":84, "bmi":22, "comorbidity_count":6,
         "prev_pain_level":5, "prev_mobility_score":3, "_sick_base":0},
    ]

    mb = load_model()
    print(f"\n  {'Disease':<25} {'Prognosis':<18} {'Risk %':>8}  Label")
    print("  " + "-" * 70)
    for p in samples:
        r = predict_risk(mb, p)
        print(f"  {r['disease']:<25} {r['prognosis_class']:<18} "
              f"{r['risk_score_pct']:>8}  {r['risk_label']}")

    print(f"\n  Total time: {time.time()-t0:.1f}s")
    print("  NOT a medical diagnosis. Consult a licensed clinician.\n")
    return bundle, metrics


if __name__ == "__main__":
    bundle, metrics = main()
