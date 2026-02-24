import { useState } from 'react'
import './Navbar.css'

const DropIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="url(#navGrad)" />
        <path d="M12 6c-1.5 0-2.8.6-3.8 1.6L12 14l3.8-6.4C14.8 6.6 13.5 6 12 6z" fill="white" opacity="0.9" />
        <path d="M8.2 7.6C7.1 8.7 6.4 10.3 6.4 12c0 3.1 2.5 5.6 5.6 5.6s5.6-2.5 5.6-5.6c0-1.7-.7-3.3-1.8-4.4L12 14 8.2 7.6z" fill="white" opacity="0.5" />
        <defs>
            <linearGradient id="navGrad" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#00d4ff" />
                <stop offset="100%" stopColor="#2979ff" />
            </linearGradient>
        </defs>
    </svg>
)

export default function Navbar({ page, navigate, user, onLogout }) {
    const [menuOpen, setMenuOpen] = useState(false)

    const links = [
        { id: 'home', label: 'Home' },
        { id: 'analyze', label: 'Analyze CBC' },
        { id: 'batch', label: 'Hospital Cohort' },
        { id: 'triage', label: 'Triage Queue' },
        { id: 'smear', label: 'Smear Scanner' },
        { id: 'preop', label: 'Pre-Op Assistant' },
        { id: 'postop', label: 'Post-Op Tracker' },
        { id: 'about', label: 'About' },
    ]

    return (
        <nav className="navbar" role="navigation" aria-label="Main Navigation">
            <div className="navbar-inner">
                <button className="navbar-brand" onClick={() => navigate('home')} id="nav-logo-btn">
                    <DropIcon />
                    <span className="brand-text">
                        Hemo<span className="brand-accent">Scan</span> AI
                    </span>
                </button>

                <ul className="navbar-links" role="list">
                    {links.map(link => (
                        <li key={link.id}>
                            <button
                                id={`nav-${link.id}`}
                                className={`nav-link ${page === link.id ? 'active' : ''}`}
                                onClick={() => navigate(link.id)}
                            >
                                {link.label}
                                {page === link.id && <span className="active-dot" />}
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="nav-actions">
                    {user ? (
                        <div className="user-profile">
                            <div className="avatar-circle">
                                {user.name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="user-name">Dr. {user.name}</span>
                            <button className="btn-outline logout-btn" onClick={onLogout} style={{ marginLeft: '15px', padding: '6px 12px', fontSize: '13px' }}>
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <button
                            id="nav-cta-btn"
                            className="btn-primary nav-cta"
                            onClick={() => navigate('auth')}
                        >
                            Sign In / Access System
                        </button>
                    )}
                </div>

                <button
                    className="hamburger"
                    id="nav-hamburger-btn"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle Mobile Menu"
                >
                    <span className={menuOpen ? 'line open' : 'line'} />
                    <span className={menuOpen ? 'line open' : 'line'} />
                    <span className={menuOpen ? 'line open' : 'line'} />
                </button>
            </div>

            {menuOpen && (
                <div className="mobile-menu">
                    {links.map(link => (
                        <button
                            key={link.id}
                            id={`mobile-nav-${link.id}`}
                            className={`mobile-link ${page === link.id ? 'active' : ''}`}
                            onClick={() => { navigate(link.id); setMenuOpen(false) }}
                        >
                            {link.label}
                        </button>
                    ))}
                    {user ? (
                        <button className="btn-outline" onClick={onLogout} style={{ marginTop: '15px' }}>
                            Sign Out (Dr. {user.name})
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={() => { navigate('auth'); setMenuOpen(false) }}>
                            Sign In
                        </button>
                    )}
                </div>
            )}
        </nav>
    )
}
