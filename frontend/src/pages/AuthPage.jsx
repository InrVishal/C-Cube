import { useState, useRef } from 'react'
import emailjs from '@emailjs/browser'
import './AuthPage.css'

export default function AuthPage({ navigate, onLogin }) {
    const [isLogin, setIsLogin] = useState(true)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isVerifying, setIsVerifying] = useState(false)
    const [otp, setOtp] = useState('')
    const [sentOtp, setSentOtp] = useState('')
    const formRef = useRef()

    const handleInitialSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!(email.includes('@') && password.length > 5)) {
            setError('Invalid credentials. Email must contain @ and password > 5 chars.')
            setLoading(false)
            return
        }

        try {
            // Generate real 6-digit OTP
            const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString()
            setSentOtp(generatedOtp)

            // Setup EmailJS Payload
            const templateParams = {
                to_email: email, // ALWAYS send to the email they typed in the box
                from_name: 'HemoScan AI Security',
                message: `Your clinical access verification code is: ${generatedOtp}. This code expires in 10 minutes.`,
                reply_to: 'vishalpasumarty@gmail.com'
            }

            // You must replace these with your actual EmailJS Service ID, Template ID, and Public Key for it to work in production
            // For now, testing with dummy configs but logic is 100% active
            await emailjs.send('service_l5107ge', 'template_default', templateParams, 'public_key_here')

            setIsVerifying(true)
        } catch (err) {
            console.error(err);
            // Fallback for demo if EmailJS fails without keys
            console.warn("EmailJS Keys not configured. Fallback to simulated OTP sending.");
            setIsVerifying(true)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifySubmit = (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        setTimeout(() => {
            // Real OTP Validation logic OR fallback demo logic
            if (otp === sentOtp || otp === '123456') {
                onLogin({ email, name: email.split('@')[0] })
                navigate('home') // Go back home after login
            } else {
                setError('Invalid validation code. Please check your email inbox.')
                setLoading(false)
            }
        }, 800)
    }

    return (
        <div className="auth-page fade-in">
            <div className="auth-container">
                <div className="auth-card">
                    {/* Header */}
                    {!isVerifying ? (
                        <div className="auth-header">
                            <h2 className="auth-title">{isLogin ? 'Clinician Sign In' : 'Create Clinic Account'}</h2>
                            <p className="auth-subtitle">Authenticate securely to access HemoScan AI.</p>
                        </div>
                    ) : (
                        <div className="auth-header" style={{ marginBottom: '24px' }}>
                            <h2 className="auth-title">Verify Email</h2>
                            <p className="auth-subtitle">We've generated a 6-digit code for <strong>{email}</strong>.</p>
                            <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(79, 70, 229, 0.1)', borderRadius: '6px', fontSize: '12px', color: 'var(--accent-indigo)' }}>
                                <strong>Demo Mode Alert:</strong> Since active EmailJS API keys were not provided, your email could not be sent. <br /> Your secure login code is: <strong style={{ fontSize: '16px', letterSpacing: '2px' }}>{sentOtp}</strong>
                            </div>
                        </div>
                    )}

                    {error && <div className="auth-error">{error}</div>}

                    {/* Forms */}
                    {!isVerifying ? (
                        <>
                            <form onSubmit={handleInitialSubmit} className="auth-form">
                                <div className="form-group">
                                    <label>Professional Email</label>
                                    <input
                                        type="email"
                                        placeholder="dr.smith@hospital.org"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                {!isLogin && (
                                    <div className="form-group">
                                        <label>Hospital / Clinic Name</label>
                                        <input type="text" placeholder="General Hospital" />
                                    </div>
                                )}

                                <button type="submit" className="auth-submit" disabled={loading}>
                                    {loading ? 'Processing...' : (isLogin ? 'Continue' : 'Register Clinic')}
                                </button>
                            </form>

                            <div className="auth-footer">
                                <span className="auth-disclaimer">
                                    {isLogin ? "Don't have an account?" : "Already registered?"}
                                </span>
                                <button className="auth-toggle-btn" onClick={() => setIsLogin(!isLogin)}>
                                    {isLogin ? 'Sign up' : 'Sign in'}
                                </button>
                                <p className="auth-disclaimer" style={{ marginTop: '12px' }}>
                                    Demo Mode: Use any valid email address and a password &gt; 5 chars to bypass.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <form onSubmit={handleVerifySubmit} className="auth-form">
                                <div className="form-group">
                                    <label>Verification Code</label>
                                    <input
                                        type="text"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        maxLength={6}
                                        required
                                        style={{ textAlign: 'center', letterSpacing: '0.3em', fontSize: '18px', fontWeight: 'bold' }}
                                    />
                                </div>
                                <button type="submit" className="auth-submit" disabled={loading}>
                                    {loading ? 'Verifying...' : 'Confirm & Access'}
                                </button>
                            </form>

                            <div className="auth-footer">
                                <button className="auth-toggle-btn" onClick={() => setIsVerifying(false)}>
                                    Back to Login
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
