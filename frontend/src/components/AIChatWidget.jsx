import { useState } from 'react'
import './AIChatWidget.css'

export default function AIChatWidget() {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([{ sender: 'bot', text: 'Dr. Vega here. Need help analyzing a CBC result or interpreting a risk score?' }])
    const [input, setInput] = useState('')

    const handleSend = (e) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg = input.trim()
        setMessages(prev => [...prev, { sender: 'user', text: userMsg }])
        setInput('')

        // Simulate AI response
        setTimeout(() => {
            let reply = "I'm currently in demo mode, but I can assist with interpreting parameters like Hemoglobin, MCV, or MCH. Just run an analysis!"

            if (userMsg.toLowerCase().includes('mcv')) {
                reply = "MCV (Mean Corpuscular Volume) measures the average size of red blood cells. Low MCV (<80 fL) indicates microcytic anemia, often caused by iron deficiency."
            } else if (userMsg.toLowerCase().includes('mch')) {
                reply = "MCH (Mean Corpuscular Hemoglobin) measures the amount of hemoglobin per red blood cell. Low MCH (<27 pg) causes pale cells (hypochromic)."
            } else if (userMsg.toLowerCase().includes('severe')) {
                reply = "Severe anemia is typically classified when Hemoglobin falls below 8.0 g/dL. Immediate medical intervention is usually required."
            }

            setMessages(prev => [...prev, { sender: 'bot', text: reply }])
        }, 800)
    }

    return (
        <div className="chat-widget-wrapper">
            {!isOpen && (
                <button className="chat-fab" onClick={() => setIsOpen(true)}>
                    <span>🤖</span>
                    <div className="chat-fab-pulse"></div>
                </button>
            )}

            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="chat-avatar">🤖</div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>Dr. AI Vega</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>Clinical Assistant</div>
                            </div>
                        </div>
                        <button className="chat-close" onClick={() => setIsOpen(false)}>×</button>
                    </div>

                    <div className="chat-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-bubble-wrap ${m.sender}`}>
                                <div className={`chat-bubble ${m.sender}`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="chat-input-area" onSubmit={handleSend}>
                        <input
                            type="text"
                            placeholder="Ask about CBC parameters..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button type="submit">↑</button>
                    </form>
                </div>
            )}
        </div>
    )
}
