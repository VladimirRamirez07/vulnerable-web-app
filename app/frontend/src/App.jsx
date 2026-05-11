import { useState } from 'react'
import './App.css'
import SQLiLab from './SQLiLab'
import XSSLab from './XSSLab'
import CSRFLab from './CSRFLab'
import IDORLab from './IDORLab'
import BrokenAuthLab from './BrokenAuthLab'

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (data.success) {
        onLogin(data.user)
      } else {
        setMessage(data.error)
      }
    } catch {
      setMessage('Error conectando al servidor')
    }
    setLoading(false)
  }

  return (
    <div className="page login-page">
      <div className="noise" />
      <div className="login-card">
        <div className="login-header">
          <div className="badge">LAB</div>
          <h1>Vulnerable<br />Web App</h1>
          <p className="subtitle">Entorno de práctica de seguridad</p>
        </div>
        <form onSubmit={handleLogin} className="login-form">
          <div className="field">
            <label>Usuario</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {message && <div className="error-msg">⚠ {message}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar →'}
          </button>
        </form>
        <div className="login-footer">
          <span className="vuln-tag">SQLi</span>
          <span className="vuln-tag">XSS</span>
          <span className="vuln-tag">CSRF</span>
          <span className="vuln-tag">IDOR</span>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ user, onLogout, onExplore }) {
  const vulns = [
    { id: 'sqli', name: 'SQL Injection', icon: '🗄️', color: '#ff6b6b', desc: 'Manipula consultas SQL para extraer datos' },
    { id: 'xss', name: 'XSS', icon: '📜', color: '#ffd93d', desc: 'Inyecta scripts en el navegador de la víctima' },
    { id: 'csrf', name: 'CSRF', icon: '🔄', color: '#6bcb77', desc: 'Fuerza acciones no autorizadas en nombre del usuario' },
    { id: 'broken-auth', name: 'Broken Auth', icon: '🔐', color: '#4d96ff', desc: 'Explota fallos en autenticación y sesiones' },
    { id: 'idor', name: 'IDOR', icon: '👁️', color: '#c77dff', desc: 'Accede a recursos de otros usuarios directamente' },
  ]

  return (
    <div className="page dashboard-page">
      <div className="noise" />
      <header className="dash-header">
        <div className="dash-logo">
          <div className="badge">LAB</div>
          <span>VulnWebApp</span>
        </div>
        <div className="dash-user">
          <span className={`role-badge ${user.role}`}>{user.role}</span>
          <span className="username">{user.username}</span>
          <button className="btn-logout" onClick={onLogout}>Salir</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-welcome">
          <h2>Bienvenido, <em>{user.username}</em></h2>
          <p>Selecciona una vulnerabilidad para explorarla</p>
        </div>

        <div className="vuln-grid">
          {vulns.map(v => (
            <div key={v.id} className="vuln-card" style={{ '--accent': v.color }}>
              <div className="vuln-icon">{v.icon}</div>
              <div className="vuln-info">
                <h3>{v.name}</h3>
                <p>{v.desc}</p>
              </div>
              <button className="btn-exploit" onClick={() => onExplore(v.id)}>Explorar →</button>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [lab, setLab] = useState(null)

  const handleLogout = async () => {
    await fetch('http://localhost:4000/auth/logout', { credentials: 'include' })
    setUser(null)
    setLab(null)
  }

  if (lab === 'sqli') return <SQLiLab onBack={() => setLab(null)} />
  if (lab === 'xss') return <XSSLab onBack={() => setLab(null)} />
  if (lab === 'csrf') return <CSRFLab onBack={() => setLab(null)} user={user} />
  if (lab === 'idor') return <IDORLab onBack={() => setLab(null)} user={user} />
  if (lab === 'broken-auth') return <BrokenAuthLab onBack={() => setLab(null)} user={user} />

  return user
    ? <Dashboard user={user} onLogout={handleLogout} onExplore={setLab} />
    : <LoginPage onLogin={setUser} />
}