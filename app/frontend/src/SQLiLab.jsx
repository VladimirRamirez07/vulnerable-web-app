import { useState } from 'react'

export default function SQLiLab({ onBack }) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const payloads = [
    { label: 'Normal', value: 'admin' },
    { label: 'Bypass login', value: "' OR '1'='1" },
    { label: 'Dump all', value: "' OR 1=1--" },
    { label: 'Error based', value: "' AND 1=CAST((SELECT username FROM users LIMIT 1) AS INT)--" },
  ]

  const search = async (val) => {
    const query = val !== undefined ? val : input
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`http://localhost:4000/sqli/search?username=${encodeURIComponent(query)}`, {
        credentials: 'include'
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ success: false, error: 'Error conectando al servidor', users: [] })
    }
    setLoading(false)
  }

  return (
    <div className="page lab-page">
      <div className="noise" />

      <header className="dash-header">
        <div className="dash-logo">
          <div className="badge">LAB</div>
          <span>SQL Injection</span>
        </div>
        <button className="btn-logout" onClick={onBack}>← Volver</button>
      </header>

      <main className="lab-main">

        <div className="lab-info">
          <div className="lab-tag">🗄️ SQLi</div>
          <h2>SQL Injection Lab</h2>
          <p>Este buscador concatena tu input directamente en la query SQL sin sanitización. Úsalo para extraer datos que no deberías ver.</p>
        </div>

        <div className="lab-grid">

          {/* Panel izquierdo: input */}
          <div className="lab-panel">
            <h3>Input</h3>
            <div className="field">
              <label>Buscar usuario</label>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && search()}
                placeholder="admin"
              />
            </div>

            <button className="btn-login" onClick={() => search()} disabled={loading}>
              {loading ? 'Buscando...' : 'Buscar →'}
            </button>

            <div className="payloads">
              <label>Payloads de ejemplo</label>
              {payloads.map(p => (
                <button
                  key={p.label}
                  className="payload-btn"
                  onClick={() => { setInput(p.value); search(p.value) }}
                >
                  <span className="payload-label">{p.label}</span>
                  <code>{p.value}</code>
                </button>
              ))}
            </div>
          </div>

          {/* Panel derecho: resultado */}
          <div className="lab-panel">
            <h3>Resultado</h3>

            {result && (
              <>
                <div className="query-box">
                  <label>Query ejecutada</label>
                  <code>{result.query}</code>
                </div>

                {result.error && (
                  <div className="error-msg">⚠ {result.error}</div>
                )}

                <div className="results-box">
                  <label>Usuarios retornados ({result.users?.length || 0})</label>
                  {result.users?.length > 0 ? (
                    <table className="results-table">
                      <thead>
                        <tr><th>ID</th><th>Username</th><th>Role</th></tr>
                      </thead>
                      <tbody>
                        {result.users.map((u, i) => (
                          <tr key={i}>
                            <td>{u.id}</td>
                            <td>{u.username}</td>
                            <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-results">Sin resultados</p>
                  )}
                </div>
              </>
            )}

            {!result && !loading && (
              <p className="no-results">Ejecuta una búsqueda para ver resultados</p>
            )}
          </div>
        </div>

        {/* Writeup */}
        <div className="writeup">
          <h3>📝 Writeup</h3>
          <div className="writeup-grid">
            <div className="writeup-section">
              <h4>🔴 Cómo explotarlo</h4>
              <p>Ingresa <code>' OR '1'='1</code> para bypassear el WHERE y retornar todos los usuarios. La query resultante es:</p>
              <code className="block-code">SELECT * FROM users WHERE username = '' OR '1'='1'</code>
              <p>Como <code>'1'='1'</code> siempre es verdadero, retorna toda la tabla.</p>
            </div>
            <div className="writeup-section">
              <h4>🟢 Cómo arreglarlo</h4>
              <p>Usar <strong>prepared statements</strong> en vez de concatenación:</p>
              <code className="block-code">db.prepare("SELECT * FROM users WHERE username = ?").get(username)</code>
              <p>El parámetro nunca se interpreta como SQL, solo como datos.</p>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}