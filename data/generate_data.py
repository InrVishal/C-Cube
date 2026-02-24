import pandas as pd
import numpy as np

def generate_anemia_data(n_samples=3000, seed=42):
    """
    Generate a realistic, clinically-consistent synthetic CBC dataset.
    Uses WHO anemia thresholds. All parameters are correlated and realistic.
    """
    rng = np.random.RandomState(seed)

    records = []

    for _ in range(n_samples):
        gender = rng.choice(['Male', 'Female'])
        age = int(rng.randint(15, 85))

        # Randomly assign an anemia severity for this patient (weighted to be mostly normal)
        severity = rng.choice(
            ['Non-Anemic', 'Mild', 'Moderate', 'Severe'],
            p=[0.55, 0.22, 0.16, 0.07]
        )

        # WHO Hb thresholds by gender
        if gender == 'Male':
            hb_normal_mean, hb_normal_std = 15.0, 1.0
            hct_base = 45.0
            rbc_base = 5.0
        else:
            hb_normal_mean, hb_normal_std = 13.5, 0.9
            hct_base = 42.0
            rbc_base = 4.5

        # Set Hb based on severity
        if severity == 'Non-Anemic':
            hb = rng.normal(hb_normal_mean, hb_normal_std)
            hb = max(hb, 12.0 if gender == 'Male' else 11.0)
        elif severity == 'Mild':
            upper = 13.0 if gender == 'Male' else 12.0
            hb = rng.uniform(10.0, upper - 0.01)
        elif severity == 'Moderate':
            hb = rng.uniform(8.0, 10.99)
        else:  # Severe
            hb = rng.uniform(4.5, 7.99)

        # Hematocrit correlated with Hb (Hct ≈ Hb × 3)
        hct = hb * 3.0 + rng.normal(0, 0.8)
        hct = max(10.0, hct)

        # RBC correlated with Hb and Hct
        rbc = (hct / 100.0) / (90e-15 / 1e6) / 1e12   # simplified physiology approximation
        # Simpler: RBC ~ Hb / (MCH/10)
        # Use a direct approach: RBC normal is ~ Hb / 3.0 M/µL
        rbc = hb / 2.95 + rng.normal(0, 0.2)
        rbc = max(1.0, rbc)

        # MCV = (Hct / RBC) * 10   (fL)
        mv = (hct / rbc) * 10
        # Add small realistic noise
        mcv = mv + rng.normal(0, 2.5)
        mcv = max(50, min(120, mcv))

        # MCH = Hb / RBC * 10  (pg)
        mch = (hb / rbc) * 10 + rng.normal(0, 1.0)
        mch = max(15, min(40, mch))

        # MCHC = Hb / Hct * 100  (g/dL)
        mchc = (hb / hct) * 100 + rng.normal(0, 0.5)
        mchc = max(24, min(38, mchc))

        records.append({
            'Gender': gender,
            'Age': age,
            'RBC': round(rbc, 2),
            'Hemoglobin': round(hb, 2),
            'Hematocrit': round(hct, 2),
            'MCV': round(mcv, 2),
            'MCH': round(mch, 2),
            'MCHC': round(mchc, 2),
            'Result': severity,
        })

    df = pd.DataFrame(records)
    return df


if __name__ == "__main__":
    df = generate_anemia_data(3000)
    out_path = 'c:/Users/visha/OneDrive/Desktop/genai/data/anemia_dataset.csv'
    df.to_csv(out_path, index=False)
    print(f"Dataset generated: {out_path}")
    print(df['Result'].value_counts())
    print(df.describe().round(2).to_string())
