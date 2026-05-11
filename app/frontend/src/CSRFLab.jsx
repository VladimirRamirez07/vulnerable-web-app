import { useState } from 'react'

export default function CSRFLab({ onBack, user }) {
  const [password, setPassword] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showAttack, setShowAttack] = useState(false)

  const legitimateChange = async () => {
    setLoading(true)
    setResult(null)
    const res = await fetch('http://localhost:4000/csrf/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ userId: user?.id || 1, newPassword: password })
    })
    const data = await res.json()
    setResult({ type: 'legitimate', ...data })
    setLoading(false)
  }

  const simulateAttack = async () => {
    setLoading(true)
    setResult(null)
    // ⚠️ Simula una petición desde un sitio malicioso
    const res = await fetch('http://localhost:4000/csrf/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id || 1, newPassword: 'hacked123' })
    })
    const data = await res.json()
    setResult({ type: 'attack', newPassword: 'hacked123', ...data })
    setLoading(false)
  }

  return (
    <div className="page lab-page">
      <div className="noise" />
      <header className="dash-header">
        <div className="dash-logo">
          <div className="badge">LAB</div>
          <span>CSRF - Cross Site Request Forgery</span>
        </div>
        <button className="btn-logout" onClick={onBack}>← Volver</button>
      </header>

      <main className="lab-main">
        <div className="lab-info">
          <div className="lab-tag">🔄 CSRF</div>
          <h2>CSRF Lab</h2>
          <p>Este endpoint cambia la contraseña sin verificar el origen de la petición ni usar tokens CSRF. Un sitio malicioso puede hacer esta petición en nombre del usuario autenticado.</p>
        </div>

        <div className="lab-grid">
          {/* Panel izquierdo: cambio legítimo */}
          <div className="lab-panel">
            <h3>Petición legítima</h3>
            <div className="field">
              <label>Nueva contraseña</label>
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="nueva_password"
              />
            </div>
            <button className="btn-login" onClick={legitimateChange} disabled={loading}>
              {loading ? 'Enviando...' : 'Cambiar contraseña →'}
            </button>

            <div className="csrf-divider" />

            <h3>Simular ataque CSRF</h3>
            <div className="csrf-attack-box">
              <p>Un sitio malicioso envía esta petición automáticamente cuando visitas la página, sin que el usuario lo sepa:</p>
              <code className="block-code">{`fetch('http://localhost:4000/csrf/change-password', {
  method: 'POST',
  body: JSON.stringify({
    userId: ${user?.id || 1},
    newPassword: 'hacked123'
  })
})`}</code>
            </div>
            <button
              className="btn-exploit"
              style={{ width: '100%', padding: '0.85rem', fontSize: '0.95rem' }}
              onClick={simulateAttack}
              disabled={loading}
            >
              {loading ? 'Atacando...' : '⚠️ Simular ataque →'}
            </button>
          </div>

          {/* Panel derecho: resultado */}
          <div className="lab-panel">
            <h3>Resultado</h3>

            {!result && !loading && (
              <p className="no-results">Ejecuta una acción para ver el resultado</p>
            )}

            {result && (
              <div className={`csrf-result ${result.type}`}>
                {result.type === 'legitimate' ? (
                  <>
                    <div className="result-badge legitimate">✓ Petición legítima</div>
                    <p>Contraseña cambiada exitosamente por el usuario.</p>
                    <div className="query-box">
                      <label>Respuesta del servidor</label>
                      <code>{JSON.stringify(result, null, 2)}</code>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="result-badge attack">⚠ Ataque CSRF exitoso</div>
                    <p>El servidor aceptó la petición maliciosa. La contraseña fue cambiada a:</p>
                    <code className="block-code">{result.newPassword}</code>
                    <p style={{ marginTop: '0.5rem' }}>El usuario no fue notificado y perdió acceso a su cuenta.</p>
                    <div className="query-box" style={{ marginTop: '0.8rem' }}>
                      <label>Respuesta del servidor</label>
                      <code>{JSON.stringify({ success: result.success, message: result.message }, null, 2)}</code>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Writeup */}
        <div className="writeup">
          <h3>📝 Writeup</h3>
          <div className="writeup-grid">
            <div className="writeup-section">
              <h4>🔴 Cómo explotarlo</h4>
              <p>El atacante crea una página maliciosa que hace una petición POST al endpoint vulnerable cuando la víctima la visita. Como el navegador envía las cookies automáticamente, el servidor cree que es una petición legítima.</p>
              <code className="block-code">{`<!-- Página maliciosa -->
<img src="x" onload="
  fetch('http://victim.com/change-password', {
    method: 'POST',
    body: 'newPassword=hacked'
  })
">`}</code>
            </div>
            <div className="writeup-section">
              <h4>🟢 Cómo arreglarlo</h4>
              <p>Usar <strong>CSRF tokens</strong> — un valor aleatorio único por sesión que el servidor verifica en cada petición:</p>
              <code className="block-code">{`// Generar token al iniciar sesión
req.session.csrfToken = crypto.randomBytes(32).toString('hex')

// Verificar en cada POST
if (req.body.csrfToken !== req.session.csrfToken) {
  return res.status(403).json({ error: 'Invalid CSRF token' })
}`}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}