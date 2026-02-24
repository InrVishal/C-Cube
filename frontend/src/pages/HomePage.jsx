import './HomePage.css'

const stats = [
    { value: '98.2%', label: 'Model Accuracy', icon: '🎯' },
    { value: '4', label: 'Anemia Categories', icon: '🩸' },
    { value: '<2s', label: 'Prediction Time', icon: '⚡' },
    { value: '8', label: 'CBC Parameters', icon: '🔬' },
]

const features = [
    {
        icon: '🧬',
        title: 'CBC Parameter Analysis',
        desc: 'Analyzes Hemoglobin, RBC, MCV, MCH, MCHC, Hematocrit, and more for comprehensive blood profiling.',
        color: 'cyan',
    },
    {
        icon: '🤖',
        title: 'Dual ML Engines',
        desc: 'Leverages both Logistic Regression and Support Vector Machine (SVM) for robust and accurate classification.',
        color: 'purple',
    },
    {
        icon: '📊',
        title: 'Risk Score Generation',
        desc: 'Produces a numerical anemia risk score (0–100%) alongside severity categorization for clinical guidance.',
        color: 'teal',
    },
    {
        icon: '💡',
        title: 'Explainable AI',
        desc: 'Highlights the key contributing blood features that influenced each prediction for clinical transparency.',
        color: 'blue',
    },
    {
        icon: '⚕️',
        title: 'WHO-Standard Thresholds',
        desc: 'Classification aligned with WHO hemoglobin thresholds — gender-aware and age-appropriate.',
        color: 'green',
    },
    {
        icon: '🏥',
        title: 'Clinical Integration Ready',
        desc: 'Designed with a REST API to integrate into hospital management systems and diagnostic lab workflows.',
        color: 'amber',
    },
]

const workflow = [
    { step: '01', title: 'Data Collection', desc: 'Acquire CBC parameters from patient blood tests' },
    { step: '02', title: 'Preprocessing', desc: 'Normalize features, handle missing values, encode demographics' },
    { step: '03', title: 'ML Classification', desc: 'SVM/LR models classify into Non-Anemic, Mild, Moderate, or Severe' },
    { step: '04', title: 'Risk Scoring', desc: 'Generate a probabilistic anemia risk score (0–100%)' },
    { step: '05', title: 'Reporting', desc: 'Visualize results with probability breakdown and key insights' },
]

export default function HomePage({ navigate }) {
    return (
        <div className="home-page">
            {/* ── Hero ── */}
            <section className="hero-section" aria-label="Hero">
                <div className="hero-bg">
                    <div className="hero-orb orb-1" />
                    <div className="hero-orb orb-2" />
                    <div className="hero-orb orb-3" />
                    <div className="hero-grid" />
                </div>

                <div className="container hero-content">
                    <div className="fade-in">
                        <span className="section-label">🩸 AI-Powered Hematology</span>
                    </div>
                    <h1 className="fade-in-delay-1 hero-title">
                        Detect <span className="gradient-text">Anemia</span><br />
                        Before It Progresses
                    </h1>
                    <p className="fade-in-delay-2 hero-subtitle">
                        HemoScan AI is a clinical decision support system that uses machine learning
                        to analyze CBC blood parameters and predict anemia risk with &gt;98% accuracy —
                        enabling early, data-driven diagnosis.
                    </p>
                    <div className="fade-in-delay-3 hero-actions">
                        <button id="hero-analyze-btn" className="btn-primary hero-btn" onClick={() => navigate('analyze')}>
                            <span>🔬</span> Analyze CBC Now
                        </button>
                        <button id="hero-learn-btn" className="btn-outline" onClick={() => navigate('about')}>
                            Learn More
                        </button>
                    </div>

                    {/* Animated blood cell visual */}
                    <div className="hero-visual fade-in-delay-3">
                        <div className="cell-ring ring-1" />
                        <div className="cell-ring ring-2" />
                        <div className="cell-ring ring-3" />
                        <div className="cell-core">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <circle cx="32" cy="32" r="30" fill="url(#cellGrad)" opacity="0.9" />
                                <ellipse cx="32" cy="32" rx="14" ry="10" fill="rgba(0,0,0,0.3)" />
                                <defs>
                                    <radialGradient id="cellGrad" cx="40%" cy="35%">
                                        <stop offset="0%" stopColor="#ff6b9d" />
                                        <stop offset="60%" stopColor="#e53e6f" />
                                        <stop offset="100%" stopColor="#c41255" />
                                    </radialGradient>
                                </defs>
                            </svg>
                            <span className="cell-label">RBC</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="stats-section" aria-label="Key Statistics">
                <div className="container">
                    <div className="stats-grid">
                        {stats.map((s, i) => (
                            <div key={i} className={`stat-card glass-card fade-in-delay-${i % 3}`} id={`stat-card-${i}`}>
                                <span className="stat-icon">{s.icon}</span>
                                <div className="stat-value gradient-text">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="features-section" aria-label="Features">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">Capabilities</span>
                        <h2 className="section-title">Why HemoScan AI?</h2>
                        <p className="section-subtitle">
                            A comprehensive system designed to bring AI-powered precision to hematology diagnosis — fast, explainable, and clinically aligned.
                        </p>
                    </div>
                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div key={i} className={`feature-card glass-card feature-${f.color}`} id={`feature-card-${i}`}>
                                <div className={`feature-icon-wrap icon-${f.color}`}>
                                    <span className="feature-icon">{f.icon}</span>
                                </div>
                                <h3 className="feature-title">{f.title}</h3>
                                <p className="feature-desc">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Workflow ── */}
            <section className="workflow-section" aria-label="System Workflow">
                <div className="container">
                    <div className="section-header">
                        <span className="section-label">How It Works</span>
                        <h2 className="section-title">5-Step Diagnostic Pipeline</h2>
                        <p className="section-subtitle">
                            From raw CBC data to actionable clinical insights in under 2 seconds.
                        </p>
                    </div>
                    <div className="workflow-steps">
                        {workflow.map((w, i) => (
                            <div key={i} className="workflow-step" id={`workflow-step-${i}`}>
                                <div className="step-number">{w.step}</div>
                                {i < workflow.length - 1 && <div className="step-connector" />}
                                <div className="step-content glass-card">
                                    <div className="step-title">{w.title}</div>
                                    <div className="step-desc">{w.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="cta-section" aria-label="Call to Action">
                <div className="container">
                    <div className="cta-card">
                        <div className="cta-glow" />
                        <span className="section-label" style={{ marginBottom: '20px' }}>Ready to Start?</span>
                        <h2 className="cta-title">Analyze CBC Data Instantly</h2>
                        <p className="cta-subtitle">
                            Enter blood count parameters and get an accurate anemia risk assessment with severity classification in seconds.
                        </p>
                        <button id="cta-analyze-btn" className="btn-primary cta-btn" onClick={() => navigate('analyze')}>
                            🔬 Start CBC Analysis
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="footer" aria-label="Footer">
                <div className="container footer-inner">
                    <div className="footer-brand">
                        <span className="brand-text" style={{ fontSize: '18px' }}>
                            Hemo<span className="brand-accent">Scan</span> AI
                        </span>
                        <p>AI-Driven Anemia Detection & Risk Analysis System</p>
                    </div>
                    <div className="footer-stack">
                        <span className="badge badge-cyan">Python</span>
                        <span className="badge badge-purple">Scikit-learn</span>
                        <span className="badge badge-cyan">SVM</span>
                        <span className="badge badge-purple">Flask</span>
                        <span className="badge badge-cyan">React</span>
                    </div>
                    <p className="footer-copy">© 2025 HemoScan AI. Built for clinical decision support.</p>
                </div>
            </footer>
        </div>
    )
}
