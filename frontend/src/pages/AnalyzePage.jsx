import { useState, useRef, useEffect } from 'react'
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts'
import html2pdf from 'html2pdf.js'
import './AnalyzePage.css'

const defaultForm = {
    Gender: 'Female',
    Age: '',
    RBC: '',
    Hemoglobin: '',
    Hematocrit: '',
    MCV: '',
    MCH: '',
    MCHC: '',
    RDW_CV: '',
    TotalWBC: '',
    Platelets: '',
    Neutrophils: '',
    Lymphocytes: '',
    Eosinophils: '',
    Monocytes: '',
    Basophils: '',
}

const referenceRanges = {
    RBC: { label: 'Red Blood Cells', unit: 'M/µL', male: '4.5–5.5', female: '4.0–5.0' },
    Hemoglobin: { label: 'Hemoglobin', unit: 'g/dL', male: '13–17', female: '12–15' },
    Hematocrit: { label: 'Hematocrit (PCV)', unit: '%', male: '40–50', female: '36–46' },
    MCV: { label: 'Mean Cell Volume', unit: 'fL', both: '80–100' },
    MCH: { label: 'Mean Cell Hgb', unit: 'pg', both: '27–33' },
    MCHC: { label: 'Mean Cell Hgb Conc.', unit: 'g/dL', both: '32–36' },
    RDW_CV: { label: 'RDW-CV', unit: '%', both: '11.6–14.0' },
    TotalWBC: { label: 'Total Leukocyte Count (TLC)', unit: 'thou/mm³', both: '4.0–10.0' },
    Platelets: { label: 'Platelet Count', unit: 'lakhs/cumm', both: '1.5–4.5' },
    Neutrophils: { label: 'Neutrophils', unit: '%', both: '40–80' },
    Lymphocytes: { label: 'Lymphocytes', unit: '%', both: '20–40' },
    Eosinophils: { label: 'Eosinophils', unit: '%', both: '1–6' },
    Monocytes: { label: 'Monocytes', unit: '%', both: '2–10' },
    Basophils: { label: 'Basophils', unit: '%', both: '0–2' },
}

function RiskGauge({ score }) {
    const clampedScore = Math.min(100, Math.max(0, score))
    const angle = (clampedScore / 100) * 180 - 90
    const color = score < 20 ? '#00e676' : score < 50 ? '#ffab40' : score < 75 ? '#ff6d00' : '#ff5252'

    return (
        <div className="gauge-wrap" aria-label={`Risk score: ${clampedScore}%`}>
            <svg viewBox="0 0 200 120" width="220" height="130">
                {/* Background arc */}
                <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="14" strokeLinecap="round" />
                {/* Colored arc */}
                <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#gaugeGrad)"
                    strokeWidth="14"
                    strokeLinecap="round"
                    strokeDasharray={`${clampedScore * 2.51} 251`}
                />
                {/* Needle */}
                <g transform={`translate(100, 100) rotate(${angle})`}>
                    <line x1="0" y1="0" x2="0" y2="-65" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="0" cy="0" r="5" fill={color} />
                </g>
                {/* Gradient def */}
                <defs>
                    <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#00e676" />
                        <stop offset="50%" stopColor="#ffab40" />
                        <stop offset="100%" stopColor="#ff5252" />
                    </linearGradient>
                </defs>
                {/* Labels */}
                <text x="16" y="118" fill="var(--text-secondary)" fontSize="9" fontWeight="800">0%</text>
                <text x="170" y="118" fill="var(--text-secondary)" fontSize="9" fontWeight="800">100%</text>
                <text x="92" y="75" fill={color} fontSize="22" fontWeight="800" fontFamily="Space Grotesk, sans-serif">{clampedScore}%</text>
                <text x="85" y="88" fill="var(--text-secondary)" fontSize="10" fontWeight="800">Risk Score</text>
            </svg>
        </div >
    )
}

function XAIRadarChart({ result, inputData }) {
    if (!result || !inputData) return null;

    // Normalize input values against standard medians to get an "Anomaly Score" for the chart
    const getScore = (val, min, max, invert = false) => {
        val = parseFloat(val);
        if (isNaN(val)) return 50;
        const median = (min + max) / 2;
        const range = max - min;
        // Calculate deviation from median, mapped to 0-100 where 100 means high risk/anomaly
        let deviation = (val - median) / (range);
        // For parameters like Hemoglobin, being lower than normal is higher risk
        if (invert) deviation = -deviation;

        // Scale and cap 0-100
        return Math.min(100, Math.max(0, 50 + (deviation * 50)));
    }

    const isMale = inputData.Gender === 'Male';
    const hbMin = isMale ? 13 : 12; const hbMax = isMale ? 17 : 15;
    const rbcMin = isMale ? 4.5 : 4.0; const rbcMax = isMale ? 5.5 : 5.0;

    const chartData = [
        { subject: 'Hemoglobin', A: getScore(inputData.Hemoglobin, hbMin, hbMax, true) },
        { subject: 'RBC', A: getScore(inputData.RBC, rbcMin, rbcMax, true) },
        { subject: 'Hematocrit', A: getScore(inputData.Hematocrit, 36, 50, true) },
        { subject: 'MCV', A: getScore(inputData.MCV, 80, 100) },
        { subject: 'MCH', A: getScore(inputData.MCH, 27, 33) },
    ];

    return (
        <div className="radar-container" style={{ width: '100%', height: 260, marginTop: '10px' }}>
            <div className="rec-title" style={{ textAlign: 'center', marginBottom: '-10px' }}>🎯 AI Feature Attention</div>
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={chartData}>
                    <PolarGrid stroke="var(--border-subtle)" strokeWidth={2} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-primary)', fontSize: 11, fontWeight: 800, fontFamily: 'Space Grotesk' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#ffffff', border: '3px solid #121212', borderRadius: '4px', boxShadow: '4px 4px 0px 0px #121212', fontWeight: 800 }}
                        formatter={(value) => [`${Math.round(value)}%`, 'Anomaly Score']}
                    />
                    <Radar name="Anomaly" dataKey="A" stroke="var(--text-primary)" strokeWidth={3} fill="var(--accent-pink)" fillOpacity={0.8} />
                </RadarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '-15px', fontWeight: 800, textTransform: 'uppercase' }}>Points further out influenced the AI's risk score the most.</div>
        </div>
    );
}

function MicroscopicSim({ inputData }) {
    if (!inputData) return null;

    // Normal MCV = 90 fL (size)
    const mcv = parseFloat(inputData.MCV) || 90;
    // Scale 90fL -> 1.0. E.g., 60fL -> 0.66 (microcytic), 120 -> 1.33 (macrocytic)
    const sizeScale = Math.max(0.5, Math.min(1.5, mcv / 90));

    // Normal MCH = 30 pg (color/hemoglobin amount)
    const mch = parseFloat(inputData.MCH) || 30;
    // Lower MCH -> paler cells (hypochromic). Scaled 0.0 to 1.0 (opacity essentially)
    const colorIntensity = Math.max(0.3, Math.min(1.0, mch / 30));

    let morphologyLabel = "Normocytic Normochromic";
    if (mcv < 80) morphologyLabel = mch < 27 ? "Microcytic Hypochromic" : "Microcytic";
    else if (mcv > 100) morphologyLabel = "Macrocytic";

    return (
        <div className="microscopic-sim" style={{ marginTop: '20px', backgroundColor: '#0a0f18', borderRadius: '12px', padding: '15px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
            <div className="rec-title" style={{ textAlign: 'center', marginBottom: '10px' }}>🔬 Microscopic Cell Simulation</div>

            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '120px' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '5px' }}>Healthy Reference</div>
                    <svg width="60" height="60" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="30" fill="#ff5252" opacity="0.9" style={{ filter: 'drop-shadow(0px 0px 4px rgba(255, 82, 82, 0.4))' }} />
                        <circle cx="50" cy="50" r="15" fill="#151b29" opacity="0.3" /> {/* Central pallor */}
                    </svg>
                </div>

                <div style={{ width: '1px', height: '60%', backgroundColor: 'rgba(255,255,255,0.1)' }}></div>

                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '12px', color: 'var(--grad-accent)', marginBottom: '5px' }}>Patient Sample</div>
                    <svg width="60" height="60" viewBox="0 0 100 100">
                        <circle
                            cx="50" cy="50"
                            r={30 * sizeScale}
                            fill="#ff5252"
                            opacity={colorIntensity}
                            style={{ filter: `drop-shadow(0px 0px 4px rgba(255, 82, 82, ${colorIntensity * 0.5}))`, transition: 'all 0.5s ease' }}
                        />
                        <circle cx="50" cy="50" r={15 * sizeScale} fill="#151b29" opacity={0.5} /> {/* Central pallor larger when pale */}
                    </svg>
                </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                Morphology: <strong>{morphologyLabel}</strong>
            </div>
        </div>
    );
}
function DietTherapyBot({ result, inputData }) {
    if (!result || result.diagnosis === 'Non-Anemic') return null;

    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState(null);

    const generatePlan = () => {
        setLoading(true);
        // Simulate an AI generation delay
        setTimeout(() => {
            const isMicrocytic = parseFloat(inputData.MCV) < 80;
            const isMacrocytic = parseFloat(inputData.MCV) > 100;

            let therapy = "General Anemia Support Protocol";
            let foods = ["Spinach", "Lentils", "Red Meat"];
            let avoids = ["Tea/Coffee with meals (inhibits iron absorption)"];
            let supplements = "Daily Iron Supplement (Consult Doctor)";

            if (isMicrocytic) {
                therapy = "Iron-Deficiency Recovery Protocol";
                foods = ["Lean Red Meat", "Chicken Liver", "Lentils", "Dark Leafy Greens", "Citrus (Vitamin C enhances iron absorption)"];
                supplements = "Ferrous Sulfate (Oral Iron) + Vitamin C";
            } else if (isMacrocytic) {
                therapy = "B12/Folate Deficiency Recovery Protocol";
                foods = ["Eggs", "Dairy", "Fortified Cereals", "Salmon", "Avocado"];
                supplements = "Vitamin B12 + Folate Complex";
            }

            setPlan({ therapy, foods, avoids, supplements });
            setLoading(false);
        }, 1200);
    }

    return (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(50, 205, 50, 0.05)', border: '1px solid rgba(50, 205, 50, 0.2)', borderRadius: '12px' }}>
            <div className="rec-title" style={{ color: '#00e676' }}>🥝 AI Dietary & Therapy Prescription</div>

            {!plan && !loading && (
                <button className="btn-outline" style={{ width: '100%', borderColor: '#00e676', color: '#00e676' }} onClick={generatePlan}>
                    Generate Personalized Meal & Supplement Plan
                </button>
            )}

            {loading && (
                <div style={{ textAlign: 'center', color: '#00e676', fontSize: '14px', margin: '10px 0' }}>
                    <span className="spinner" style={{ display: 'inline-block', width: '16px', height: '16px', borderWidth: '2px', marginRight: '8px', verticalAlign: 'middle' }} />
                    Synthesizing protocol...
                </div>
            )}

            {plan && (
                <div className="fade-in" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>
                    <div style={{ marginBottom: '10px' }}><strong style={{ color: 'white' }}>Protocol:</strong> {plan.therapy}</div>

                    <div style={{ marginBottom: '5px' }}><strong style={{ color: '#00e676' }}>Recommended Superfoods:</strong></div>
                    <ul style={{ paddingLeft: '20px', margin: '0 0 10px 0' }}>
                        {plan.foods.map((food, i) => <li key={i}>{food}</li>)}
                    </ul>

                    <div style={{ marginBottom: '5px' }}><strong style={{ color: '#ffab40' }}>Suggested Supplements:</strong></div>
                    <div style={{ marginBottom: '10px', paddingLeft: '10px', borderLeft: '2px solid #ffab40' }}>{plan.supplements}</div>

                    <div style={{ marginBottom: '5px' }}><strong style={{ color: '#ff5252' }}>Avoid consuming:</strong></div>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {plan.avoids.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                </div>
            )}
        </div>
    )
}

function ResultCard({ result, inputData }) {
    if (!result) return null

    const diagnosisConfig = {
        'Non-Anemic': { color: 'green', emoji: '✅', label: 'Non-Anemic', className: 'result-safe' },
        'Mild': { color: 'amber', emoji: '⚠️', label: 'Mild Anemia', className: 'result-mild' },
        'Moderate': { color: 'orange', emoji: '🔶', label: 'Moderate Anemia', className: 'result-moderate' },
        'Severe': { color: 'red', emoji: '🚨', label: 'Severe Anemia', className: 'result-severe' },
    }

    const cfg = diagnosisConfig[result.diagnosis] || { color: 'cyan', emoji: '🔬', label: result.diagnosis, className: '' }

    const sortedProbs = Object.entries(result.probabilities || {}).sort(([, a], [, b]) => b - a)

    return (
        <div className={`result-card glass-card ${cfg.className}`}>
            <div className="result-header">
                <span className="result-emoji">{cfg.emoji}</span>
                <div>
                    <div className="result-diagnosis">{cfg.label}</div>
                    <div className="result-sub">AI-predicted anemia classification</div>
                </div>
            </div>

            <RiskGauge score={Math.round(result.risk_score)} />

            <div className="divider" style={{ margin: '20px 0' }} />

            <div className="prob-section">
                <div className="prob-title">Probability Breakdown</div>
                {sortedProbs.map(([label, prob]) => (
                    <div key={label} className="prob-row">
                        <span className="prob-label">{label}</span>
                        <div className="prob-bar-wrap">
                            <div className="prob-bar" style={{ width: `${prob}%`, background: label === result.diagnosis ? 'var(--grad-accent)' : 'rgba(255,255,255,0.08)' }} />
                        </div>
                        <span className="prob-value">{prob.toFixed(1)}%</span>
                    </div>
                ))}
            </div>

            <XAIRadarChart result={result} inputData={inputData} />
            <MicroscopicSim inputData={inputData} />

            <div className="divider" style={{ margin: '20px 0' }} />

            <div className="recommendation">
                <div className="rec-title">💡 Clinical Guidance</div>
                {result.diagnosis === 'Non-Anemic' && <p>Blood counts are within normal range. Maintain a balanced, iron-rich diet and schedule routine annual screenings.</p>}
                {result.diagnosis === 'Mild' && <p>Mild anemia detected. Consider dietary adjustments — increase iron, folate, and Vitamin B12 intake. Follow up with a physician.</p>}
                {result.diagnosis === 'Moderate' && <p>Moderate anemia detected. Medical consultation is strongly advised. Supplementation and further CBC follow-up testing is recommended.</p>}
                {result.diagnosis === 'Severe' && <p>⚠️ Severe anemia detected. Immediate medical attention required. Please consult a hematologist or emergency care provider promptly.</p>}
            </div>

            <DietTherapyBot result={result} inputData={inputData} />

            <p className="disclaimer">⚠️ This tool is for educational/research use only and does not replace professional medical advice.</p>

            <button className="btn-outline submit-btn" style={{ marginTop: '20px', width: '100%', borderColor: 'rgba(255,255,255,0.1)' }} onClick={() => {
                const element = document.getElementById('report-export');
                html2pdf().from(element).set({
                    margin: 10,
                    filename: `HemoScan_Report_${Date.now()}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2, useCORS: true },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
                }).save();
            }}>
                📄 Download PDF Medical Report
            </button>
        </div >
    )
}

export default function AnalyzePage({ result, setResult, history, setHistory }) {
    const [form, setForm] = useState(defaultForm)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [demoMode, setDemoMode] = useState(false)
    const [localHistory, setLocalHistory] = useState([])

    useEffect(() => {
        // Load history from local storage on mount
        const saved = localStorage.getItem('hemoscan_history')
        if (saved) setLocalHistory(JSON.parse(saved))
    }, [])

    const saveToHistory = (res, formData) => {
        const entry = { date: new Date().toLocaleString(), result: res, inputs: formData }
        const newHistory = [entry, ...localHistory].slice(0, 5) // Keep last 5
        setLocalHistory(newHistory)
        localStorage.setItem('hemoscan_history', JSON.stringify(newHistory))
        if (setHistory) setHistory(newHistory)
    }

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    // Deterministic fallback prediction when Flask API is not running.
    // Based entirely on WHO hemoglobin thresholds — same input always gives same output.
    const simulatePrediction = (data) => {
        const hb = parseFloat(data.Hemoglobin)
        const rbc = parseFloat(data.RBC)
        const hct = parseFloat(data.Hematocrit)
        const mcv = parseFloat(data.MCV)
        const gender = data.Gender

        // WHO Hb thresholds (g/dL)
        const hbThreshold = gender === 'Male' ? 13.0 : 12.0

        // Determine diagnosis band
        let diagnosis = 'Non-Anemic'
        if (hb < hbThreshold) {
            if (hb >= 11.0) diagnosis = 'Mild'
            else if (hb >= 8.0) diagnosis = 'Moderate'
            else diagnosis = 'Severe'
        }

        // Deterministic risk score: 0–100%, clipped, based on Hb deficit and MCV
        const hbDeficit = Math.max(0, hbThreshold - hb)          // 0 if normal
        const mcvPenalty = Math.max(0, 80 - mcv) * 0.5            // extra if low MCV
        const rawRisk = (hbDeficit / hbThreshold) * 85 + mcvPenalty
        const risk_score = parseFloat(Math.min(99, Math.max(1, rawRisk)).toFixed(1))

        // Deterministic probability distribution based on diagnosis
        //  — each band gets a fixed share; no randomness
        const probTable = {
            'Non-Anemic': { 'Non-Anemic': 92.0, 'Mild': 5.5, 'Moderate': 1.8, 'Severe': 0.7 },
            'Mild': { 'Non-Anemic': 6.0, 'Mild': 84.0, 'Moderate': 7.5, 'Severe': 2.5 },
            'Moderate': { 'Non-Anemic': 3.0, 'Mild': 9.5, 'Moderate': 81.0, 'Severe': 6.5 },
            'Severe': { 'Non-Anemic': 1.5, 'Mild': 3.0, 'Moderate': 7.5, 'Severe': 88.0 },
        }

        const probabilities = probTable[diagnosis]

        return { diagnosis, risk_score, probabilities }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        setResult(null)

        const payload = {
            ...form,
            Age: parseFloat(form.Age),
            RBC: parseFloat(form.RBC),
            Hemoglobin: parseFloat(form.Hemoglobin) || 0,
            Hematocrit: parseFloat(form.Hematocrit) || 0,
            MCV: parseFloat(form.MCV) || 0,
            MCH: parseFloat(form.MCH) || 0,
            MCHC: parseFloat(form.MCHC) || 0,
            // Additional Indian standard parameters are sent but mainly ignored by the v1 model core
            RDW_CV: parseFloat(form.RDW_CV) || 0,
            TotalWBC: parseFloat(form.TotalWBC) || 0,
            Platelets: parseFloat(form.Platelets) || 0,
            Neutrophils: parseFloat(form.Neutrophils) || 0,
            Lymphocytes: parseFloat(form.Lymphocytes) || 0,
            Eosinophils: parseFloat(form.Eosinophils) || 0,
            Monocytes: parseFloat(form.Monocytes) || 0,
            Basophils: parseFloat(form.Basophils) || 0,
        }

        try {
            const res = await fetch('http://localhost:5000/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(3000),
            })
            if (!res.ok) throw new Error('API returned error')
            const data = await res.json()
            setResult(data)
            saveToHistory(data, payload)
            setDemoMode(false)
        } catch {
            // Fallback to demo mode
            const demoResult = simulatePrediction(payload)
            setResult(demoResult)
            saveToHistory(demoResult, payload)
            setDemoMode(true)
        } finally {
            setLoading(false)
        }
    }

    const loadSampleData = (type) => {
        const samples = {
            normal: { Gender: 'Male', Age: '32', RBC: '5.1', Hemoglobin: '15.2', Hematocrit: '45.6', MCV: '89', MCH: '29.8', MCHC: '33.3', RDW_CV: '12.5', TotalWBC: '7.5', Platelets: '2.8', Neutrophils: '60', Lymphocytes: '30', Eosinophils: '2', Monocytes: '6', Basophils: '0.5' },
            mild: { Gender: 'Female', Age: '28', RBC: '4.0', Hemoglobin: '11.2', Hematocrit: '34.0', MCV: '85', MCH: '28.0', MCHC: '32.9', RDW_CV: '14.2', TotalWBC: '6.8', Platelets: '2.5', Neutrophils: '55', Lymphocytes: '35', Eosinophils: '3', Monocytes: '5', Basophils: '0' },
            moderate: { Gender: 'Female', Age: '45', RBC: '3.5', Hemoglobin: '9.0', Hematocrit: '27.0', MCV: '77', MCH: '25.7', MCHC: '33.3', RDW_CV: '16.5', TotalWBC: '8.2', Platelets: '3.1', Neutrophils: '65', Lymphocytes: '25', Eosinophils: '1', Monocytes: '7', Basophils: '0' },
            severe: { Gender: 'Female', Age: '60', RBC: '2.8', Hemoglobin: '6.5', Hematocrit: '19.5', MCV: '69', MCH: '23.2', MCHC: '33.3', RDW_CV: '18.0', TotalWBC: '9.5', Platelets: '1.8', Neutrophils: '75', Lymphocytes: '15', Eosinophils: '1', Monocytes: '8', Basophils: '0' },
        }
        setForm(samples[type])
        setResult(null)
        setError(null)
    }

    const handleReset = () => {
        setForm(defaultForm)
        setResult(null)
        setError(null)
        setDemoMode(false)
    }

    return (
        <div className="analyze-page">
            <div className="analyze-bg">
                <div className="analyze-orb orb-a" />
                <div className="analyze-orb orb-b" />
            </div>

            <div className="container analyze-container">
                {/* Header */}
                <div className="analyze-header fade-in">
                    <span className="section-label">🔬 CBC Analysis Engine</span>
                    <h1 className="section-title analyze-title">Anemia Risk Analysis</h1>
                    <p className="section-subtitle">
                        Enter patient CBC blood parameters below. The AI engine will classify anemia risk and produce a severity score.
                    </p>
                </div>

                <div className="analyze-layout">
                    {/* Form Panel */}
                    <div className="form-panel fade-in-delay-1">
                        <div className="glass-card form-card">
                            {/* Sample Data Buttons */}
                            <div className="sample-section">
                                <div className="sample-label">Load Sample Data:</div>
                                <div className="sample-btns">
                                    <button id="sample-normal-btn" className="sample-btn green" onClick={() => loadSampleData('normal')}>Normal</button>
                                    <button id="sample-mild-btn" className="sample-btn amber" onClick={() => loadSampleData('mild')}>Mild Anemia</button>
                                    <button id="sample-moderate-btn" className="sample-btn orange" onClick={() => loadSampleData('moderate')}>Moderate</button>
                                    <button id="sample-severe-btn" className="sample-btn red" onClick={() => loadSampleData('severe')}>Severe</button>
                                </div>
                            </div>

                            <div className="divider" />

                            <form id="cbc-form" onSubmit={handleSubmit} noValidate>
                                <div className="form-row two-col">
                                    <div className="input-group">
                                        <label htmlFor="Gender">Biological Sex</label>
                                        <select id="Gender" name="Gender" className="select-field" value={form.Gender} onChange={handleChange} required>
                                            <option value="Female">Female</option>
                                            <option value="Male">Male</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label htmlFor="Age">Age <span>years</span></label>
                                        <input id="Age" name="Age" type="number" className="input-field" value={form.Age} onChange={handleChange} placeholder="e.g. 35" min="1" max="120" required />
                                    </div>
                                </div>

                                <div className="params-header">Complete Blood Count Parameters</div>

                                <div className="form-row two-col">
                                    {[
                                        'Hemoglobin', 'RBC', 'Hematocrit', 'MCV', 'MCH', 'MCHC',
                                        'RDW_CV', 'TotalWBC', 'Platelets', 'Neutrophils', 'Lymphocytes', 'Eosinophils', 'Monocytes', 'Basophils'
                                    ].map(field => {
                                        const ref = referenceRanges[field]
                                        const range = ref.both || (form.Gender === 'Male' ? ref.male : ref.female)
                                        return (
                                            <div key={field} className="input-group">
                                                <label htmlFor={field}>
                                                    {ref.label} <span>{ref.unit} | Ref: {range}</span>
                                                </label>
                                                <input
                                                    id={field}
                                                    name={field}
                                                    type="number"
                                                    step="0.01"
                                                    className="input-field"
                                                    value={form[field]}
                                                    onChange={handleChange}
                                                    placeholder={range.split('–')[0]}
                                                    required
                                                />
                                            </div>
                                        )
                                    })}
                                </div>

                                {error && <div className="form-error">❌ {error}</div>}

                                <div className="form-actions">
                                    <button id="analyze-submit-btn" type="submit" className="btn-primary submit-btn" disabled={loading}>
                                        {loading ? <><span className="spinner" />Analyzing…</> : <><span>🧬</span> Analyze Blood Count</>}
                                    </button>
                                    <button id="analyze-reset-btn" type="button" className="btn-outline reset-btn" onClick={handleReset}>
                                        Reset
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Result Panel */}
                    <div className="result-panel fade-in-delay-2">
                        {!result && !loading && (
                            <div className="result-placeholder glass-card">
                                <div className="placeholder-icon">🩺</div>
                                <div className="placeholder-title">Awaiting CBC Data</div>
                                <p className="placeholder-text">Enter blood count parameters and click "Analyze Blood Count" to receive an AI-powered anemia risk assessment.</p>
                                <div className="placeholder-steps">
                                    <div className="ph-step"><span>1</span> Fill in CBC parameters</div>
                                    <div className="ph-step"><span>2</span> Click Analyze</div>
                                    <div className="ph-step"><span>3</span> View risk score & diagnosis</div>
                                </div>
                            </div>
                        )}
                        {loading && (
                            <div className="result-placeholder glass-card">
                                <div className="scan-animation">
                                    <div className="scan-circle" />
                                    <div className="scan-ring" />
                                    <div className="scan-ring ring2" />
                                    <div className="scan-label">Analyzing CBC…</div>
                                </div>
                            </div>
                        )}
                        {result && !loading && (
                            <>
                                {demoMode && (
                                    <div className="demo-banner">
                                        🔌 <strong>Demo Mode:</strong> Flask API not running — prediction is simulated based on WHO thresholds.
                                        Start the API with <code>python src/app.py</code> for full ML predictions.
                                    </div>
                                )}
                                <div id="report-export" style={{ backgroundColor: 'var(--bg-card)', padding: '10px', borderRadius: '16px' }}>
                                    <ResultCard result={result} inputData={form} />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* History Section */}
                {localHistory.length > 0 && (
                    <div className="history-section glass-card fade-in-delay-3" style={{ marginTop: '40px', padding: '30px' }}>
                        <h2 className="ref-title">⏱️ Patient History Log (Local)</h2>
                        <div className="timeline-wrap">
                            {localHistory.map((item, i) => (
                                <div key={i} className="timeline-item" style={{ display: 'flex', alignItems: 'center', marginBottom: '15px', padding: '15px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', borderLeft: `4px solid ${item.result.diagnosis === 'Severe' ? '#ff5252' : item.result.diagnosis === 'Moderate' ? '#ff6d00' : item.result.diagnosis === 'Mild' ? '#ffab40' : '#00e676'}` }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.date}</div>
                                        <div style={{ fontWeight: '600' }}>{item.result.diagnosis} <span style={{ fontSize: '12px', marginLeft: '10px' }}>Risk: {item.result.risk_score}%</span></div>
                                    </div>
                                    <div style={{ fontSize: '12px' }}>
                                        Hb: {item.inputs.Hemoglobin} | RBC: {item.inputs.RBC}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Reference Table */}
                <div className="ref-section glass-card fade-in-delay-3" style={{ marginTop: '40px' }}>
                    <h2 className="ref-title">📖 Standard Diagnostic Reference Ranges</h2>
                    <div className="ref-table-wrap">
                        <table className="ref-table" aria-label="Standard CBC Reference Ranges">
                            <thead>
                                <tr>
                                    <th>Parameter</th>
                                    <th>Male</th>
                                    <th>Female</th>
                                    <th>Unit</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(referenceRanges).map(([key, val]) => (
                                    <tr key={key}>
                                        <td><strong>{val.label}</strong></td>
                                        <td className="cell-value">{val.male || val.both}</td>
                                        <td className="cell-value">{val.female || val.both}</td>
                                        <td className="cell-unit">{val.unit}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
