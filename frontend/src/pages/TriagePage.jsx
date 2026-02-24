import React, { useState, useEffect } from 'react';
import './TriagePage.css';

const MOCK_NAMES = ["Aryan K.", "Priya S.", "Rohan M.", "Anjali D.", "Vikram R.", "Neha P.", "Suresh V.", "Meera T."];
const AI_DIAGNOSES = ["Critical Anemia", "Severe Leukocytosis", "Normal", "Mild Thrombocytopenia", "Acute Sepsis Risk"];

const generateRandomPatient = () => {
    const risk = Math.floor(Math.random() * 100);
    let severity = "Low";
    let diagnosis = "Normal";
    if (risk > 80) { severity = "Critical"; diagnosis = AI_DIAGNOSES[0]; }
    else if (risk > 60) { severity = "High"; diagnosis = AI_DIAGNOSES[4]; }
    else if (risk > 30) { severity = "Moderate"; diagnosis = AI_DIAGNOSES[3]; }

    return {
        id: Math.random().toString(36).substr(2, 9),
        name: MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)],
        age: Math.floor(Math.random() * 60) + 18,
        riskScore: risk,
        severity: severity,
        diagnosis: diagnosis,
        timeAdmitted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        isNew: true
    };
};

export default function TriagePage({ navigate }) {
    const [patients, setPatients] = useState([
        { id: '1', name: 'Simran K.', age: 45, riskScore: 88, severity: 'Critical', diagnosis: 'Severe Anemia', timeAdmitted: '09:12 AM', isNew: false },
        { id: '2', name: 'Kabir B.', age: 34, riskScore: 12, severity: 'Low', diagnosis: 'Normal', timeAdmitted: '09:45 AM', isNew: false },
        { id: '3', name: 'Zara F.', age: 29, riskScore: 65, severity: 'High', diagnosis: 'Leukocytosis Risk', timeAdmitted: '10:05 AM', isNew: false }
    ]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [manualEntry, setManualEntry] = useState({ name: '', age: '', riskScore: '', diagnosis: '' });

    // Auto sort when patients chage
    useEffect(() => {
        const sorted = [...patients].sort((a, b) => b.riskScore - a.riskScore);
        // Only trigger setter if actually different order to avoid loop, simple check by id mapped
        const currentIds = patients.map(p => p.id).join(',');
        const sortedIds = sorted.map(p => p.id).join(',');
        if (currentIds !== sortedIds) {
            setPatients(sorted);
        }
    }, [patients]);

    // Clear new flag after 3 seconds
    useEffect(() => {
        const hasNew = patients.some(p => p.isNew);
        if (hasNew) {
            const timer = setTimeout(() => {
                setPatients(prev => prev.map(p => ({ ...p, isNew: false })));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [patients]);

    const handleAdmit = () => {
        setIsSimulating(true);
        setTimeout(() => {
            const newPatient = generateRandomPatient();
            setPatients(prev => [...prev, newPatient]);
            setIsSimulating(false);
        }, 800);
    };

    const handleManualSubmit = (e) => {
        e.preventDefault();
        let risk = parseInt(manualEntry.riskScore) || 0;
        let severity = "Low";
        if (risk > 80) severity = "Critical";
        else if (risk > 60) severity = "High";
        else if (risk > 30) severity = "Moderate";

        const newPatient = {
            id: Math.random().toString(36).substr(2, 9),
            name: manualEntry.name || 'Unknown',
            age: parseInt(manualEntry.age) || 30,
            riskScore: risk,
            severity: severity,
            diagnosis: manualEntry.diagnosis || 'Normal',
            timeAdmitted: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            isNew: true
        };
        setPatients(prev => [...prev, newPatient]);
        setShowManualForm(false);
        setManualEntry({ name: '', age: '', riskScore: '', diagnosis: '' });
    };

    const getSeverityBadge = (severity) => {
        switch (severity) {
            case 'Critical': return <span className="badge badge-red pulse-critical">Critical</span>;
            case 'High': return <span className="badge badge-amber">High Priority</span>;
            case 'Moderate': return <span className="badge badge-cyan">Monitor</span>;
            default: return <span className="badge badge-green">Routine</span>;
        }
    }

    return (
        <div className="triage-page fade-in">
            <div className="container">
                <div className="triage-header">
                    <div className="header-text">
                        <h1 className="triage-title">AI Triage <span>Board</span></h1>
                        <p className="triage-subtitle">Real-time auto-prioritization of incoming ER bloodwork. Highest risk patients are routed to the top instantly.</p>
                    </div>
                    <div className="header-actions">
                        <button className="btn-outline" onClick={() => setShowManualForm(true)}>
                            + Manual Entry
                        </button>
                        <button className="btn-primary" onClick={handleAdmit} disabled={isSimulating}>
                            {isSimulating ? 'Processing...' : '+ Auto Admit'}
                        </button>
                    </div>
                </div>

                <div className="triage-board glass-card">
                    <div className="board-header">
                        <div className="col">Patient</div>
                        <div className="col">Status</div>
                        <div className="col">Predicted Risk</div>
                        <div className="col">AI Flag</div>
                        <div className="col">Arrival Time</div>
                        <div className="col right">Action</div>
                    </div>
                    <div className="board-body flex-col gap-2">
                        {patients.map((patient, index) => (
                            <div key={patient.id} className={`triage-row ${patient.isNew ? 'row-highlight' : ''}`} style={{ animationDelay: `${index * 0.05}s` }}>
                                <div className="col font-bold">
                                    <div className="patient-name">{patient.name}</div>
                                    <div className="text-sm text-gray">{patient.age} yrs</div>
                                </div>
                                <div className="col">
                                    {getSeverityBadge(patient.severity)}
                                </div>
                                <div className="col font-bold" style={{ color: patient.riskScore > 80 ? 'var(--accent-red)' : 'var(--text-primary)' }}>
                                    {patient.riskScore}%
                                    {patient.riskScore > 80 && <span style={{ fontSize: '10px', marginLeft: '5px' }}>⚠️</span>}
                                </div>
                                <div className="col text-sm">{patient.diagnosis}</div>
                                <div className="col text-sm text-gray">{patient.timeAdmitted}</div>
                                <div className="col right">
                                    <button className="btn-outline" onClick={() => navigate('analyze')} style={{ padding: '6px 14px', fontSize: '12px' }}>Review CBC</button>
                                </div>
                            </div>
                        ))}
                        {patients.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Waiting room is empty.</div>
                        )}
                    </div>
                </div>
                {showManualForm && (
                    <div className="modal-overlay">
                        <div className="modal-card">
                            <h3>Manual Patient Entry</h3>
                            <form onSubmit={handleManualSubmit}>
                                <div className="form-group">
                                    <label>Patient Name</label>
                                    <input type="text" required value={manualEntry.name} onChange={e => setManualEntry({ ...manualEntry, name: e.target.value })} placeholder="e.g. John D." />
                                </div>
                                <div className="form-group">
                                    <label>Age</label>
                                    <input type="number" required value={manualEntry.age} onChange={e => setManualEntry({ ...manualEntry, age: e.target.value })} placeholder="e.g. 45" />
                                </div>
                                <div className="form-group">
                                    <label>Predicted Risk Score (0-100)</label>
                                    <input type="number" required min="0" max="100" value={manualEntry.riskScore} onChange={e => setManualEntry({ ...manualEntry, riskScore: e.target.value })} placeholder="e.g. 85" />
                                </div>
                                <div className="form-group">
                                    <label>Diagnosis / AI Flag</label>
                                    <input type="text" required value={manualEntry.diagnosis} onChange={e => setManualEntry({ ...manualEntry, diagnosis: e.target.value })} placeholder="e.g. Severe Anemia" />
                                </div>
                                <div className="modal-actions">
                                    <button type="button" className="btn-outline" onClick={() => setShowManualForm(false)}>Cancel</button>
                                    <button type="submit" className="btn-primary">Add Patient</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
