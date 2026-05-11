import { useState, useRef } from 'react'

export default function BrokenAuthLab({ onBack }) {
  const [username, setUsername] = useState('admin')
  const [logs, setLogs] = useState([])
  const [running, setRunning] = useState(false)
  const [found, setFound] = useState(null)
  const stopRef = useRef(false)

  const wordlist = [
    'password', '123456', 'admin', 'admin123', 'root',
    'toor', 'letmein', 'qwerty', 'abc123', 'monkey',
    'master', 'dragon', 'pass', 'test', 'password1'
  ]

  const sleep = (ms) => new Promise(r => setTimeout(r, ms))

  const runBruteforce = async () => {
    setLogs([])
    setFound(null)
    setRunning(true)
    stopRef.current = false

    for (let i = 0; i < wordlist.length; i++) {
      if (stopRef.current) break

      const password = wordlist[i]
      const start = Date.now()

      try {
        const res = await fetch('http://localhost:4000/broken-auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        })
        const data = await res.json()
        const ms = Date.now() - start

        const log = {
          attempt: i + 1,
          password,
          status: data.success ? 'success' : 'fail',
          ms
        }

        setLogs(prev => [...prev, log])

        if (data.success) {
          setFound({ username, password, user: data.user })
          stopRef.current = true
          break
        }
      } catch {
        setLogs(prev => [...prev, { attempt: i + 1, password, status: 'error', ms: 0 }])
      }

      await sleep(150)
    }

    setRunning(false)
  }

  const stopAttack = () => {
    stopRef.current = true
    setRunning(false)
  }

  return (
    <div className="page lab-page">
      <div className="noise" />
      <header className="dash-header">
        <div className="dash-logo">
          <div className="badge">LAB</div>
          <span>Broken Auth - Brute Force</span>
        </div>
        <button className="btn-logout" onClick={onBack}>← Volver</button>
      </header>

      <main className="lab-main">
        <div className="lab-info">
          <div className="lab-tag">🔐 Broken Auth</div>
          <h2>Broken Authentication Lab</h2>
          <p>El endpoint de login no tiene rate limiting ni bloqueo por intentos fallidos. Esto permite ataques de fuerza bruta automatizados para descubrir contraseñas.</p>
        </div>

        <div className="lab-grid">
          {/* Panel izquierdo */}
          <div className="lab-panel">
            <h3>Configuración del ataque</h3>

            <div className="field">
              <label>Username objetivo</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>

            <div className="wordlist-box">
              <label>Wordlist ({wordlist.length} passwords)</label>
              <div className="wordlist-items">
                {wordlist.map((w, i) => (
                  <span key={i} className="wordlist-item">{w}</span>
                ))}
              </div>
            </div>

            {!running ? (
              <button className="btn-login" onClick={runBruteforce}>
                🚀 Iniciar Brute Force →
              </button>
            ) : (
              <button className="btn-logout" style={{ padding: '0.85rem', fontSize: '1rem' }} onClick={stopAttack}>
                ⛔ Detener ataque
              </button>
            )}

            {found && (
              <div className="found-box">
                <div className="result-badge attack">🎯 Contraseña encontrada!</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '0.5rem' }}>
                  <code>username: <span style={{ color: '#ffd93d' }}>{found.username}</span></code>
                  <code>password: <span style={{ color: '#6bcb77' }}>{found.password}</span></code>
                  <code>role: <span style={{ color: 'var(--accent)' }}>{found.user.role}</span></code>
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho: logs */}
          <div className="lab-panel">
            <h3>Log de intentos {running && <span className="blink">●</span>}</h3>

            {logs.length === 0 && !running && (
              <p className="no-results">Inicia el ataque para ver los intentos</p>
            )}

            <div className="attack-logs">
              {logs.map((log, i) => (
                <div key={i} className={`log-entry ${log.status}`}>
                  <span className="log-attempt">#{log.attempt}</span>
                  <span className="log-password">{log.password}</span>
                  <span className={`log-status ${log.status}`}>
                    {log.status === 'success' ? '✓ FOUND' : '✗ fail'}
                  </span>
                  <span className="log-ms">{log.ms}ms</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Writeup */}
        <div className="writeup">
          <h3>📝 Writeup</h3>
          <div className="writeup-grid">
            <div className="writeup-section">
              <h4>🔴 Cómo explotarlo</h4>
              <p>Sin rate limiting, un atacante puede probar miles de contraseñas por segundo usando herramientas como <strong>Hydra</strong> o <strong>Burp Suite Intruder</strong>:</p>
              <code className="block-code">{`hydra -l admin -P wordlist.txt \\
  http-post-form \\
  "localhost:4000/broken-auth/login:username=^USER^&password=^PASS^:Invalid"`}</code>
            </div>
            <div className="writeup-section">
              <h4>🟢 Cómo arreglarlo</h4>
              <p>Implementar múltiples capas de protección:</p>
              <code className="block-code">{`// 1. Rate limiting
const rateLimit = require('express-rate-limit')
app.use('/login', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 5 // max 5 intentos
}))

// 2. Bloquear cuenta después de X intentos
// 3. Agregar CAPTCHA
// 4. Usar bcrypt para passwords`}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}