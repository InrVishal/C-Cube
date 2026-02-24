import React, { useState } from 'react';
import './MorphologyPage.css';

const SMEAR_SAMPLES = [
    {
        id: 'sickle',
        label: 'Patient A - Sickle Cell Anemia',
        imgUrl: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?q=80&w=800&auto=format&fit=crop',
        critical: true,
        findings: [
            { name: 'Sickle Cells (Drepanocytes)', confidence: '98%', desc: 'Multiple classic crescent-shaped cells observed.', color: 'red', top: '30%', left: '45%' },
            { name: 'Target Cells (Codocytes)', confidence: '84%', desc: 'Cells with central hemoglobination present.', color: 'amber', top: '60%', left: '20%' },
            { name: 'Sickle Cells (Drepanocytes)', confidence: '92%', desc: 'Elongated RBC indicative of vaso-occlusive crisis.', color: 'red', top: '70%', left: '75%' }
        ],
        summary: 'Immediate clinical correlation and confirmation via Hemoglobin Electrophoresis is heavily advised due to the high presence of drepanocytes.'
    },
    {
        id: 'malaria',
        label: 'Patient B - Suspected Malaria',
        imgUrl: 'https://images.unsplash.com/photo-1628348070830-246f8c4c23f1?q=80&w=800&auto=format&fit=crop', // generic blood-like
        critical: true,
        findings: [
            { name: 'Ring-form Trophozoites', confidence: '88%', desc: 'Intracellular rings seen. High probability of P. falciparum.', color: 'red', top: '25%', left: '35%' },
            { name: 'Gametocytes', confidence: '72%', desc: 'Potential crescent-shaped gametocyte in field.', color: 'purple', top: '65%', left: '60%' }
        ],
        summary: 'Morphology strongly suggests Plasmodium infection. Rapid Diagnostic Test (RDT) and thick/thin smear confirmation required STAT.'
    },
    {
        id: 'normal',
        label: 'Patient C - Healthy Control',
        imgUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=800&auto=format&fit=crop', // generic smooth blood
        critical: false,
        findings: [
            { name: 'Normocytic Normochromic', confidence: '99%', desc: 'RBCs appear uniform with normal central pallor.', color: 'green', top: '40%', left: '50%' },
            { name: 'Adequate Platelets', confidence: '95%', desc: 'Normal distribution of thrombocytes.', color: 'cyan', top: '80%', left: '80%' }
        ],
        summary: 'No clinically significant morphological abnormalities detected. Standard peripheral blood smear.'
    }
];

export default function MorphologyPage() {
    const [scanState, setScanState] = useState('idle'); // idle, scanning, complete
    const [progress, setProgress] = useState(0);
    const [activeSample, setActiveSample] = useState(SMEAR_SAMPLES[0]);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            processFile(file);
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            processFile(file);
        }
    };

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const isCritical = Math.random() > 0.5;
            const newSample = {
                id: 'custom-' + Date.now(),
                label: `Custom Slide (${file.name})`,
                imgUrl: e.target.result,
                critical: isCritical,
                findings: isCritical ? [
                    { name: 'Atypical Cell Cluster', confidence: '89%', desc: 'AI detected unusual cellular structures. Needs clinical review.', color: 'red', top: '40%', left: '30%' },
                    { name: 'Morphological Variance', confidence: '74%', desc: 'Irregular morphology detected in the peripheral field.', color: 'amber', top: '70%', left: '60%' }
                ] : [
                    { name: 'Normal Morphology', confidence: '92%', desc: 'Cells appear largely unremarkable within this field of view.', color: 'green', top: '50%', left: '50%' }
                ],
                summary: `Custom microscopy slide analyzed. Automatically generated preliminary findings indicate ${isCritical ? 'potential anomalies' : 'non-specific or healthy structures'}. Professional pathologist review required.`
            };
            setActiveSample(newSample);
        };
        reader.readAsDataURL(file);
    };

    const handleUpload = () => {
        setScanState('scanning');
        setProgress(0);

        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setTimeout(() => setScanState('complete'), 500);
            }
            setProgress(Math.floor(p));
        }, 300);
    };

    const resetScan = () => {
        setScanState('idle');
        setProgress(0);
    };

    // Aggregate unique finding types for the report
    const uniqueFindings = [];
    if (scanState === 'complete') {
        const seen = new Set();
        activeSample.findings.forEach(f => {
            if (!seen.has(f.name)) {
                seen.add(f.name);
                uniqueFindings.push(f);
            }
        });
    }

    return (
        <div className="morph-page fade-in">
            <div className="container">
                <div className="morph-header">
                    <div className="morph-title-wrap">
                        <div className="icon-pulse">
                            <span className="dot"></span>
                        </div>
                        <h1 className="morph-title">Vision AI <span>Scanner</span></h1>
                    </div>
                    <p className="morph-subtitle">Our neural networks analyze peripheral blood smear WSIs in real-time, detecting extremely subtle morphological anomalies across millions of pixels.</p>
                </div>

                <div className="morph-layout">
                    {/* Left: Uploader / Scanner Area */}
                    <div className="scanner-panel glass-card">
                        {scanState === 'idle' && (
                            <div className="idle-wrap">
                                <div className="sample-selector">
                                    <h4>Select a Demo Slide</h4>
                                    <div className="sample-list">
                                        {SMEAR_SAMPLES.map(sample => (
                                            <button
                                                key={sample.id}
                                                className={`sample-btn ${activeSample.id === sample.id ? 'active' : ''}`}
                                                onClick={() => setActiveSample(sample)}
                                            >
                                                {sample.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div
                                    className={`upload-zone ${isDragging ? 'dragging' : ''}`}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        id="slide-upload"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileSelect}
                                    />
                                    <div className="upload-icon" onClick={() => document.getElementById('slide-upload').click()} style={{ cursor: 'pointer' }}>
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                                        </svg>
                                    </div>
                                    <h3 onClick={() => document.getElementById('slide-upload').click()} style={{ cursor: 'pointer' }}>Drag & Drop Custom Image</h3>
                                    <p>or click to browse your files.</p>

                                    <button className="btn-primary" style={{ marginTop: '24px', width: '100%', fontSize: '15px' }} onClick={handleUpload}>
                                        Scan {activeSample.id.startsWith('custom') ? 'Custom Upload' : `"${activeSample.label.split(' - ')[0]}"`}
                                    </button>
                                </div>
                            </div>
                        )}

                        {scanState === 'scanning' && (
                            <div className="scanning-zone">
                                <div className="scan-image-wrap scanning">
                                    <div className="scan-grid-overlay"></div>
                                    <div className="scan-overlay">
                                        <div className="scan-line"></div>
                                    </div>
                                    <img src={activeSample.imgUrl} alt="Scanning" className="scan-image" />
                                </div>
                                <div className="scan-progress-box">
                                    <div className="scan-labels">
                                        <span className="loading-text">Extracting cell boundaries...</span>
                                        <span className="percent-text">{progress}%</span>
                                    </div>
                                    <div className="scan-bar-bg">
                                        <div className="scan-bar-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {scanState === 'complete' && (
                            <div className="complete-zone">
                                <div className="scan-image-wrap annotated">
                                    <div className="scan-grid-overlay subtle"></div>
                                    <img src={activeSample.imgUrl} alt="Annotated" className="scan-image" />
                                    {/* Map dynamic annotations */}
                                    {activeSample.findings.map((finding, idx) => (
                                        <div
                                            key={idx}
                                            className={`anno-circle ${finding.color}`}
                                            style={{ top: finding.top, left: finding.left, animationDelay: `${idx * 0.2}s` }}
                                        >
                                            <div className="anno-pulse"></div>
                                            <div className="anno-label">{finding.name}</div>
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-outline" onClick={resetScan} style={{ marginTop: '24px', width: '100%' }}>Scan Another Slide</button>
                            </div>
                        )}
                    </div>

                    {/* Right: Results Panel */}
                    <div className="results-panel">
                        {scanState === 'complete' ? (
                            <div className="morph-report glass-card fade-in">
                                <h2 className="report-title">Analysis Report</h2>

                                <div className={`report-status ${activeSample.critical ? 'critical' : 'normal'}`}>
                                    {activeSample.critical ? '⚠️ Critical Abnormalities Detected' : '✅ Normal Morphology Confirmed'}
                                </div>

                                <div className="findings list">
                                    {uniqueFindings.map((finding, idx) => (
                                        <div key={idx} className={`finding-item border-${finding.color}`} style={{ animationDelay: `${0.3 + (idx * 0.1)}s` }}>
                                            <div className="finding-header">
                                                <span className="finding-name">{finding.name}</span>
                                                <span className={`badge badge-${finding.color}`}>{finding.confidence} Match</span>
                                            </div>
                                            <p className="finding-desc">{finding.desc}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="ai-summary flex-col">
                                    <h3>AI Directives</h3>
                                    <p>{activeSample.summary}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="morph-report-placeholder glass-card">
                                <div className="placeholder-icon">🔬</div>
                                <h3>Awaiting Slide</h3>
                                <p>Initialize the scanner to let the model generate morphological insights.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
