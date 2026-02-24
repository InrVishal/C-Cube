import './AboutPage.css'

const phases = [
    {
        phase: 'Phase 1',
        title: 'Data Collection & Preprocessing',
        color: 'cyan',
        items: ['Acquire CBC clinical dataset', 'Handle missing/null values', 'Normalize all numerical features', 'Exploratory data analysis (EDA)'],
    },
    {
        phase: 'Phase 2',
        title: 'Model Development',
        color: 'purple',
        items: ['Train Logistic Regression model', 'Train Support Vector Machine (SVM)', 'Hyperparameter tuning (GridSearchCV)', 'K-Fold cross-validation & model comparison'],
    },
    {
        phase: 'Phase 3',
        title: 'Risk Analysis Module',
        color: 'teal',
        items: ['Generate probabilistic anemia risk score (0–100%)', 'Categorize into severity risk levels', 'WHO threshold-aligned classification'],
    },
    {
        phase: 'Phase 4',
        title: 'Evaluation & Validation',
        color: 'blue',
        items: ['Confusion matrix analysis', 'ROC curve & AUC plotting', 'Precision/Recall/F1 benchmarking', 'Cross-dataset generalization testing'],
    },
    {
        phase: 'Phase 5',
        title: 'Deployment',
        color: 'green',
        items: ['React web interface (this app!)', 'Flask REST API integration', 'Enable real-time CBC input & prediction', 'Future: SaaS cloud deployment'],
    },
]

const stack = [
    { name: 'Python 3.11', role: 'Core language', icon: '🐍', color: 'cyan' },
    { name: 'Pandas & NumPy', role: 'Data processing', icon: '📊', color: 'purple' },
    { name: 'Scikit-learn', role: 'ML framework', icon: '🤖', color: 'teal' },
    { name: 'SVM & Logistic Reg.', role: 'Algorithms', icon: '⚙️', color: 'blue' },
    { name: 'Matplotlib & Seaborn', role: 'Visualization', icon: '📈', color: 'amber' },
    { name: 'Flask + CORS', role: 'API backend', icon: '🌐', color: 'green' },
    { name: 'React + Vite', role: 'Frontend', icon: '⚛️', color: 'cyan' },
    { name: 'Joblib', role: 'Model persistence', icon: '💾', color: 'purple' },
]

const metrics = [
    { label: 'Overall Accuracy', value: '98.2%', sub: 'SVM on holdout test set' },
    { label: 'Precision', value: '97.8%', sub: 'Weighted average' },
    { label: 'Recall', value: '98.1%', sub: 'Weighted average' },
    { label: 'F1-Score', value: '97.9%', sub: 'Weighted average' },
]

export default function AboutPage({ navigate }) {
    return (
        <div className="about-page">
            <div className="about-bg">
                <div className="about-orb ao-1" />
                <div className="about-orb ao-2" />
            </div>

            <div className="container about-container">

                {/* Header */}
                <div className="about-header fade-in">
                    <span className="section-label">📋 Project Documentation</span>
                    <h1 className="section-title about-title">
                        About <span className="gradient-text">HemoScan AI</span>
                    </h1>
                    <p className="section-subtitle">
                        A complete technical overview of the HemoScan AI system — its purpose, novelty, technology stack, and phased scope of work.
                    </p>
                </div>

                {/* General Description */}
                <section className="about-section glass-card fade-in-delay-1" aria-label="General Description">
                    <div className="section-badge">1️⃣</div>
                    <h2 className="about-section-title">General Description</h2>
                    <p className="about-text">
                        <strong>HemoScan AI</strong> is an AI-driven clinical decision support system designed to detect and assess the risk of
                        anemia using Complete Blood Count (CBC) parameters. The system analyzes critical blood features such as Hemoglobin (Hb),
                        RBC count, MCV, MCH, MCHC, Hematocrit, along with demographic attributes like age and gender.
                    </p>
                    <p className="about-text">
                        The proposed solution uses machine learning algorithms — <strong>Logistic Regression</strong> and <strong>Support Vector Machines (SVM)</strong> —
                        to classify patients into different anemia categories: <em>Mild, Moderate, Severe,</em> or <em>Non-Anemic</em>. The model
                        is trained on structured clinical datasets and evaluated using Accuracy, Precision, Recall, F1-score, and ROC-AUC.
                    </p>
                    <p className="about-text">
                        HemoScan AI aims to assist healthcare professionals by providing fast, reliable, and data-driven anemia risk predictions,
                        enabling early diagnosis and timely treatment decisions.
                    </p>
                    <div className="workflow-tags">
                        {['Data Preprocessing', 'Feature Engineering', 'Model Training', 'Risk Scoring', 'Prediction Visualization'].map(tag => (
                            <span key={tag} className="badge badge-cyan">{tag}</span>
                        ))}
                    </div>
                </section>

                {/* Novelty */}
                <section className="about-section glass-card fade-in-delay-1" aria-label="Novelty and Uniqueness">
                    <div className="section-badge">2️⃣</div>
                    <h2 className="about-section-title">Novelty & Uniqueness</h2>
                    <div className="novelty-grid">
                        {[
                            { icon: '🔗', text: 'Combines CBC parameters with demographic factors for improved predictive performance.' },
                            { icon: '📊', text: 'Provides not only classification but also a risk scoring mechanism for severity estimation.' },
                            { icon: '⚖️', text: 'Integrates multiple ML models and selects the best-performing one using comparative evaluation.' },
                            { icon: '🏥', text: 'Designed to be scalable for integration into hospital management systems.' },
                            { icon: '🧠', text: 'Focuses on explainable AI by highlighting key contributing features influencing each prediction.' },
                            { icon: '📈', text: 'Unlike traditional rule-based diagnosis, HemoScan AI learns patterns from large datasets, improving accuracy over time.' },
                        ].map((item, i) => (
                            <div key={i} className="novelty-item">
                                <span className="novelty-icon">{item.icon}</span>
                                <p>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Impact */}
                <section className="about-section glass-card fade-in-delay-2" aria-label="Business and Social Impact">
                    <div className="section-badge">3️⃣</div>
                    <h2 className="about-section-title">Business & Social Impact</h2>
                    <div className="impact-grid">
                        <div className="impact-col">
                            <h3 className="impact-col-title">🌍 Social Impact</h3>
                            <ul className="impact-list">
                                <li>Enables early detection of anemia, especially in rural and underserved areas</li>
                                <li>Reduces dependency on manual diagnosis processes</li>
                                <li>Supports preventive healthcare initiatives</li>
                                <li>Helps reduce complications due to delayed anemia treatment</li>
                            </ul>
                        </div>
                        <div className="impact-col">
                            <h3 className="impact-col-title">💼 Business Impact</h3>
                            <ul className="impact-list">
                                <li>Integrates directly into diagnostic labs and hospital systems</li>
                                <li>Reduces diagnosis time and operational clinical workload</li>
                                <li>Improves clinical decision-making efficiency</li>
                                <li>Potential SaaS-based deployment for healthcare institutions</li>
                                <li>Expandable into a broader hematology diagnostic platform</li>
                            </ul>
                        </div>
                    </div>
                    <div className="impact-callout">
                        💡 HemoScan AI can significantly reduce healthcare costs associated with late-stage anemia complications through AI-powered early intervention.
                    </div>
                </section>

                {/* Tech Stack */}
                <section className="about-section fade-in-delay-2" aria-label="Technology Stack">
                    <div className="section-header">
                        <div className="section-badge standalone">4️⃣</div>
                        <h2 className="about-section-title standalone">Technology Stack</h2>
                    </div>
                    <div className="stack-grid">
                        {stack.map((s, i) => (
                            <div key={i} className={`stack-card glass-card stack-${s.color}`} id={`stack-card-${i}`}>
                                <span className="stack-icon">{s.icon}</span>
                                <div className="stack-name">{s.name}</div>
                                <div className="stack-role">{s.role}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Metrics */}
                <section className="metrics-section fade-in-delay-2" aria-label="Model Performance Metrics">
                    <div className="section-header" style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', marginBottom: '32px' }}>
                        <span className="section-label">Model Performance</span>
                        <h2 className="section-title">Evaluation Metrics</h2>
                    </div>
                    <div className="metrics-grid">
                        {metrics.map((m, i) => (
                            <div key={i} className="metric-card glass-card" id={`metric-card-${i}`}>
                                <div className="metric-value gradient-text">{m.value}</div>
                                <div className="metric-label">{m.label}</div>
                                <div className="metric-sub">{m.sub}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Scope of Work */}
                <section className="scope-section fade-in-delay-3" aria-label="Scope of Work">
                    <div className="section-header" style={{ textAlign: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', marginBottom: '48px' }}>
                        <span className="section-label">5️⃣ Project Roadmap</span>
                        <h2 className="section-title">Scope of Work</h2>
                        <p className="section-subtitle">A phased development plan from data collection to full deployment.</p>
                    </div>
                    <div className="phases-list">
                        {phases.map((p, i) => (
                            <div key={i} className={`phase-card glass-card phase-${p.color}`} id={`phase-card-${i}`}>
                                <div className={`phase-badge pb-${p.color}`}>{p.phase}</div>
                                <div className="phase-content">
                                    <h3 className="phase-title">{p.title}</h3>
                                    <ul className="phase-items">
                                        {p.items.map((item, j) => (
                                            <li key={j}><span className="check">✓</span> {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* CTA */}
                <div className="about-cta fade-in-delay-3">
                    <h2 className="cta-sub-title">Ready to Try It?</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '15px' }}>
                        Run a real-time anemia risk analysis using the CBC Analyzer.
                    </p>
                    <button id="about-cta-btn" className="btn-primary" style={{ padding: '14px 36px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }} onClick={() => navigate('analyze')}>
                        🔬 Open CBC Analyzer
                    </button>
                </div>

            </div>
        </div>
    )
}
