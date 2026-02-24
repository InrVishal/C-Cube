import { useState, useRef } from 'react'
import Papa from 'papaparse'
import './BatchAnalyzePage.css'

export default function BatchAnalyzePage() {
    const [data, setData] = useState([])
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [stats, setStats] = useState(null)
    const fileInputRef = useRef(null)

    // Fallback simulation for fast client-side batching if API is not running/too slow
    const simulatePrediction = (row) => {
        const hb = parseFloat(row.Hemoglobin) || 0
        const mcv = parseFloat(row.MCV) || 90
        const gender = row.Gender || 'Female'
        const hbThreshold = gender === 'Male' ? 13.0 : 12.0

        let diagnosis = 'Non-Anemic'
        if (hb < hbThreshold) {
            if (hb >= 11.0) diagnosis = 'Mild'
            else if (hb >= 8.0) diagnosis = 'Moderate'
            else diagnosis = 'Severe'
        }

        const hbDeficit = Math.max(0, hbThreshold - hb)
        const mcvPenalty = Math.max(0, 80 - mcv) * 0.5
        const rawRisk = (hbDeficit / hbThreshold) * 85 + mcvPenalty
        const risk_score = parseFloat(Math.min(99, Math.max(1, rawRisk)).toFixed(1))

        return { diagnosis, risk_score }
    }

    const processBatch = async (parsedData) => {
        setLoading(true)
        setError(null)

        try {
            // Keep only valid rows
            const validData = parsedData.filter(d => d.Hemoglobin && d.Gender && d.MCV)
            if (validData.length === 0) throw new Error("No valid CBC data found in CSV.")

            // We'll simulate batch processing for speed and reliability in demo
            const batchResults = validData.map(row => {
                const res = simulatePrediction(row)
                return { ...row, ...res }
            })

            // Calculate aggregations
            const diagCounts = { 'Non-Anemic': 0, 'Mild': 0, 'Moderate': 0, 'Severe': 0 }
            let totalRisk = 0

            batchResults.forEach(r => {
                diagCounts[r.diagnosis] = (diagCounts[r.diagnosis] || 0) + 1
                totalRisk += r.risk_score
            })

            setStats({
                total: batchResults.length,
                counts: diagCounts,
                avgRisk: (totalRisk / batchResults.length).toFixed(1)
            })

            setResults(batchResults)
            setData(validData)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (!file) return

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: function (results) {
                processBatch(results.data)
            },
            error: function () {
                setError("Failed to parse CSV file.")
            }
        })
    }

    const loadDemoCohort = () => {
        // Generate a mock hospital cohort
        const mockCohort = Array.from({ length: 45 }).map((_, i) => ({
            PatientID: `PT-${1000 + i}`,
            Gender: Math.random() > 0.5 ? 'Female' : 'Male',
            Age: Math.floor(Math.random() * 60) + 20,
            Hemoglobin: (9 + Math.random() * 7).toFixed(1),
            MCV: (70 + Math.random() * 30).toFixed(1),
            RBC: (3.5 + Math.random() * 2).toFixed(1)
        }))
        processBatch(mockCohort)
    }

    return (
        <div className="batch-page">
            <div className="analyze-bg">
                <div className="analyze-orb orb-a" style={{ background: 'radial-gradient(circle, rgba(144, 19, 254, 0.15) 0%, transparent 60%)' }} />
            </div>

            <div className="container" style={{ position: 'relative', zIndex: 2, padding: '40px 20px' }}>
                <div className="analyze-header fade-in">
                    <span className="section-label" style={{ color: '#bc13fe', borderColor: 'rgba(188, 19, 254, 0.3)' }}>🏥 Enterprise Features</span>
                    <h1 className="section-title analyze-title">Hospital Cohort Analysis</h1>
                    <p className="section-subtitle">
                        Upload bulk CSV records to perform population-level anemia risk stratification instantly.
                    </p>
                </div>

                <div className="batch-upload-zone glass-card fade-in-delay-1" style={{ textAlign: 'center', padding: '50px 20px', marginBottom: '40px' }}>
                    <div style={{ fontSize: '40px', marginBottom: '15px' }}>📂</div>
                    <h3 style={{ marginBottom: '10px' }}>Upload Patient Cohort Data (.csv)</h3>
                    <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '25px', fontSize: '14px' }}>Required columns: Gender, Hemoglobin, MCV, RBC</p>

                    <input
                        type="file"
                        accept=".csv"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />

                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                        <button className="btn-primary" onClick={() => fileInputRef.current.click()}>
                            Select CSV File
                        </button>
                        <button className="btn-outline" onClick={loadDemoCohort}>
                            Load Demo Cohort
                        </button>
                    </div>
                    {error && <div style={{ color: '#ff5252', marginTop: '15px' }}>{error}</div>}
                </div>

                {loading && (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '4px', margin: '0 auto 20px' }}></div>
                        <h2>Stratifying Cohort...</h2>
                    </div>
                )}

                {!loading && stats && (
                    <div className="fade-in-delay-2">
                        {/* Dashboard Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center' }}>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Total Processed</div>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: 'white' }}>{stats.total}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderBottom: '4px solid #00e676' }}>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Healthy</div>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: '#00e676' }}>{stats.counts['Non-Anemic']}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderBottom: '4px solid #ffab40' }}>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Mild / Moderate</div>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: '#ffab40' }}>{stats.counts['Mild'] + stats.counts['Moderate']}</div>
                            </div>
                            <div className="glass-card" style={{ padding: '20px', textAlign: 'center', borderBottom: '4px solid #ff5252' }}>
                                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Severe Alert</div>
                                <div style={{ fontSize: '36px', fontWeight: '800', color: '#ff5252' }}>{stats.counts['Severe']}</div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0 }}>Population Results</h3>
                                <button className="btn-outline" style={{ padding: '6px 15px', fontSize: '12px' }}>Export Results</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="ref-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr>
                                            <th>Patient ID</th>
                                            <th>Gender</th>
                                            <th>Hemoglobin</th>
                                            <th>MCV</th>
                                            <th>AI Diagnosis</th>
                                            <th>Risk Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((r, i) => (
                                            <tr key={i}>
                                                <td>{r.PatientID || `Unk-${i}`}</td>
                                                <td>{r.Gender}</td>
                                                <td>{r.Hemoglobin} g/dL</td>
                                                <td>{r.MCV} fL</td>
                                                <td>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                                                        backgroundColor: r.diagnosis === 'Severe' ? 'rgba(255, 82, 82, 0.2)' :
                                                            r.diagnosis === 'Moderate' ? 'rgba(255, 109, 0, 0.2)' :
                                                                r.diagnosis === 'Mild' ? 'rgba(255, 171, 64, 0.2)' : 'rgba(0, 230, 118, 0.2)',
                                                        color: r.diagnosis === 'Severe' ? '#ff5252' : r.diagnosis === 'Moderate' ? '#ff6d00' : r.diagnosis === 'Mild' ? '#ffab40' : '#00e676'
                                                    }}>
                                                        {r.diagnosis}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ width: '60px', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                                                            <div style={{ width: `${r.risk_score}%`, height: '100%', background: r.risk_score > 70 ? '#ff5252' : r.risk_score > 40 ? '#ffab40' : '#00e676', borderRadius: '3px' }}></div>
                                                        </div>
                                                        <span style={{ fontSize: '12px' }}>{r.risk_score}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
