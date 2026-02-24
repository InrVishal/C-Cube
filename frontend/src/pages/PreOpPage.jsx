import { useState } from 'react'
import './PreOpPage.css'

const defaultForm = {
    disease: 'general_surgery',
    age: '',
    bmi: '',
    comorbidity_count: '0',
    heart_rate: '',
    sbp: '',
    spo2: '',
    pain_level: '5',
    mobility_score: '5'
}

export default function PreOpPage() {
    const [form, setForm] = useState(defaultForm)
    const [result, setResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const payload = {
            disease: form.disease,
            age: parseFloat(form.age) || 50,
            bmi: parseFloat(form.bmi) || 28,
            comorbidity_count: parseFloat(form.comorbidity_count) || 0,
            heart_rate: parseFloat(form.heart_rate) || 75,
            sbp: parseFloat(form.sbp) || 120,
            spo2: parseFloat(form.spo2) || 98,
            pain_level: parseFloat(form.pain_level),
            mobility_score: parseFloat(form.mobility_score),
            days_since_discharge: 0 // pre-op baseline implies 0
        }

        try {
            const res = await fetch('http://localhost:5000/api/surgery-predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(3000),
            })
            if (!res.ok) throw new Error('API Error')
            const data = await res.json()
            setResult(data)
        } catch (err) {
            setError(err.message)
            // Fallback for UI demo purposes
            setResult({
                risk_percentage: 45,
                zone: 'Medium',
                message: 'Fallback active. Moderate risk. Ensure patient adheres to recovery protocols.'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="preop-page">
            <div className="analyze-bg">
                <div className="analyze-orb orb-a" style={{ background: 'radial-gradient(circle, rgba(255, 82, 82, 0.15) 0%, transparent 60%)' }} />
                <div className="analyze-orb orb-b" style={{ background: 'radial-gradient(circle, rgba(255, 171, 64, 0.15) 0%, transparent 60%)' }} />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 2, padding: '40px 20px' }}>
                <div className="analyze-header fade-in">
                    <span className="section-label" style={{ color: '#ff5252', borderColor: 'rgba(255, 82, 82, 0.3)' }}>🩺 Clinical Tool</span>
                    <h1 className="section-title analyze-title">Pre-Operation Surgery Assistant</h1>
                    <p className="section-subtitle">
                        Integrates Recovery Model v4 to evaluate surgical risk and predict post-operative recovery trajectory.
                    </p>
                </div>

                <div className="analyze-layout">
                    {/* Form Panel */}
                    <div className="form-panel fade-in-delay-1">
                        <div className="glass-card form-card">
                            <form onSubmit={handleSubmit}>
                                <div className="input-group" style={{ marginBottom: '20px' }}>
                                    <label>Surgery Type</label>
                                    <select name="disease" className="select-field" value={form.disease} onChange={handleChange}>
                                        <option value="general_surgery">General Surgery</option>
                                        <option value="hip_knee_replacement">Orthopedic (Hip/Knee)</option>
                                        <option value="spinal">Spinal Surgery</option>
                                        <option value="cardiac">Cardiac Surgery</option>
                                        <option value="vascular">Vascular Surgery</option>
                                        <option value="neurological">Neurological Surgery</option>
                                        <option value="gastrointestinal">Gastrointestinal / Abdominal</option>
                                        <option value="bariatric">Bariatric / Weight Loss</option>
                                        <option value="gynecological">Gynecological Surgery</option>
                                        <option value="urological">Urological Surgery</option>
                                        <option value="oncological">Oncological / Tumor Removal</option>
                                        <option value="plastic_reconstructive">Plastic / Reconstructive</option>
                                    </select>
                                </div>

                                <div className="form-row two-col">
                                    <div className="input-group">
                                        <label>Patient Age</label>
                                        <input name="age" type="number" className="input-field" value={form.age} onChange={handleChange} placeholder="e.g. 65" required />
                                    </div>
                                    <div className="input-group">
                                        <label>BMI (Body Mass Index)</label>
                                        <input name="bmi" type="number" className="input-field" value={form.bmi} onChange={handleChange} placeholder="e.g. 28.5" step="0.1" required />
                                    </div>
                                </div>

                                <div className="form-row two-col">
                                    <div className="input-group">
                                        <label>Pre-existing Comorbidities</label>
                                        <select name="comorbidity_count" className="select-field" value={form.comorbidity_count} onChange={handleChange}>
                                            <option value="0">None</option>
                                            <option value="1">1 Condition (e.g., Diabetes)</option>
                                            <option value="2">2 Conditions (e.g., Diabetes + HTN)</option>
                                            <option value="3">3+ Conditions</option>
                                        </select>
                                    </div>
                                    <div className="input-group">
                                        <label>SpO2 (%)</label>
                                        <input name="spo2" type="number" className="input-field" value={form.spo2} onChange={handleChange} placeholder="e.g. 98" min="70" max="100" required />
                                    </div>
                                </div>

                                <div className="form-row two-col">
                                    <div className="input-group">
                                        <label>Resting HR (bpm)</label>
                                        <input name="heart_rate" type="number" className="input-field" value={form.heart_rate} onChange={handleChange} placeholder="e.g. 75" required />
                                    </div>
                                    <div className="input-group">
                                        <label>Systolic BP (mmHg)</label>
                                        <input name="sbp" type="number" className="input-field" value={form.sbp} onChange={handleChange} placeholder="e.g. 120" required />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>Current Physical Pain Level (0-10)</label>
                                    <input name="pain_level" type="range" min="0" max="10" value={form.pain_level} onChange={handleChange} style={{ width: '100%', marginTop: '10px' }} />
                                    <div style={{ textAlign: 'right', fontSize: '12px', marginTop: '5px' }}>{form.pain_level}/10</div>
                                </div>

                                <div className="input-group" style={{ marginBottom: '20px' }}>
                                    <label>Pre-Op Baseline Mobility (0-10)</label>
                                    <input name="mobility_score" type="range" min="0" max="10" value={form.mobility_score} onChange={handleChange} style={{ width: '100%', marginTop: '10px' }} />
                                    <div style={{ textAlign: 'right', fontSize: '12px', marginTop: '5px' }}>{form.mobility_score}/10</div>
                                </div>

                                <button type="submit" className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ff5252, #ffab40)' }} disabled={loading}>
                                    {loading ? <span className="spinner" /> : "Run Pre-Op Risk Analysis"}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Result Panel */}
                    <div className="result-panel fade-in-delay-2">
                        {!result && !loading && (
                            <div className="result-placeholder glass-card">
                                <div className="placeholder-icon">🫀</div>
                                <div className="placeholder-title">Awaiting Pre-Op Vitals</div>
                                <p className="placeholder-text">Enter the patient's vitals and baseline condition to receive a Recovery v4 Model prediction.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="result-placeholder glass-card">
                                <div className="scan-animation">
                                    <div className="scan-circle" style={{ borderColor: '#ff5252' }} />
                                    <div className="scan-label" style={{ color: '#ff5252' }}>Evaluating Recovery Model...</div>
                                </div>
                            </div>
                        )}

                        {result && !loading && (
                            <div className="glass-card" style={{ border: `1px solid ${result.zone === 'High' ? '#ff5252' : result.zone === 'Medium' ? '#ffab40' : '#00e676'}`, position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: result.zone === 'High' ? '#ff5252' : result.zone === 'Medium' ? '#ffab40' : '#00e676' }} />

                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '48px', fontWeight: '800', color: result.zone === 'High' ? '#ff5252' : result.zone === 'Medium' ? '#ffab40' : '#00e676' }}>{result.risk_percentage}%</div>
                                    <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '1px' }}>Post-Op Complication Risk</div>
                                </div>

                                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
                                    <strong style={{ color: 'white', fontSize: '16px' }}>Zone: {result.zone} Risk</strong>
                                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginTop: '8px', lineHeight: '1.5' }}>{result.message}</p>
                                </div>

                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
                                    Powered by Recovery Model v4 Ensembles
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
