import { useState, useEffect, useRef } from 'react'

export default function XSSLab({ onBack }) {
  const [comments, setComments] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const payloads = [
    { label: 'Alert básico', value: '<img src=x onerror="alert(\'XSS!\')">' },
    { label: 'Robar cookies', value: '<img src=x onerror="alert(document.cookie)">' },
    { label: 'Cambiar página', value: '<img src=x onerror="document.body.style.background=\'red\'">' },
    { label: 'Texto normal', value: 'Hola, este es un comentario normal' },
  ]

  const fetchComments = async () => {
    const res = await fetch('http://localhost:4000/xss/comments', { credentials: 'include' })
    const data = await res.json()
    setComments(data.comments || [])
  }

  useEffect(() => { fetchComments() }, [])

  const submit = async (val) => {
    const content = val !== undefined ? val : input
    if (!content.trim()) return
    setLoading(true)
    await fetch('http://localhost:4000/xss/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content })
    })
    setInput('')
    await fetchComments()
    setLoading(false)
  }

  const clearComments = async () => {
    setComments([])
  }

  return (
    <div className="page lab-page">
      <div className="noise" />
      <header className="dash-header">
        <div className="dash-logo">
          <div className="badge">LAB</div>
          <span>XSS - Cross Site Scripting</span>
        </div>
        <button className="btn-logout" onClick={onBack}>← Volver</button>
      </header>

      <main className="lab-main">
        <div className="lab-info">
          <div className="lab-tag">📜 XSS</div>
          <h2>XSS Lab</h2>
          <p>Esta sección de comentarios renderiza HTML directamente sin sanitizar. Inyecta scripts para ver cómo funciona un ataque XSS real.</p>
        </div>

        <div className="lab-grid">
          {/* Panel izquierdo */}
          <div className="lab-panel">
            <h3>Input</h3>
            <div className="field">
              <label>Escribir comentario</label>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder='<img src=x onerror="alert(1)">'
                rows={4}
                style={{
                  background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: '8px', padding: '0.75rem', color: 'var(--text)',
                  fontFamily: "'Space Mono', monospace", fontSize: '0.82rem',
                  resize: 'vertical', outline: 'none'
                }}
              />
            </div>
            <button className="btn-login" onClick={() => submit()} disabled={loading}>
              {loading ? 'Enviando...' : 'Publicar →'}
            </button>

            <div className="payloads">
              <label>Payloads de ejemplo</label>
              {payloads.map(p => (
                <button
                  key={p.label}
                  className="payload-btn"
                  onClick={() => { setInput(p.value); submit(p.value) }}
                >
                  <span className="payload-label">{p.label}</span>
                  <code>{p.value}</code>
                </button>
              ))}
            </div>
          </div>

          {/* Panel derecho: comentarios renderizados */}
          <div className="lab-panel">
            <h3>Comentarios — renderizado vulnerable</h3>
            <div className="xss-warning">
              ⚠️ El HTML se renderiza sin sanitizar — esto es intencional
            </div>
            {comments.length === 0 && (
              <p className="no-results">No hay comentarios aún</p>
            )}
            {comments.map((c, i) => (
              <div key={i} className="comment-card">
                <div className="comment-author">{c.username}</div>
                {/* ⚠️ VULNERABLE: dangerouslySetInnerHTML */}
                <div
                  className="comment-content"
                  dangerouslySetInnerHTML={{ __html: c.content }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Writeup */}
        <div className="writeup">
          <h3>📝 Writeup</h3>
          <div className="writeup-grid">
            <div className="writeup-section">
              <h4>🔴 Cómo explotarlo</h4>
              <p>Inyecta HTML con eventos JavaScript. El payload más simple:</p>
              <code className="block-code">{'<img src=x onerror="alert(\'XSS!\')">'}</code>
              <p>El navegador intenta cargar la imagen, falla, y ejecuta el <code>onerror</code>. Puede usarse para robar cookies de sesión o redirigir usuarios.</p>
            </div>
            <div className="writeup-section">
              <h4>🟢 Cómo arreglarlo</h4>
              <p>Sanitizar el HTML con una librería como <strong>DOMPurify</strong> antes de renderizar:</p>
              <code className="block-code">{'import DOMPurify from "dompurify"\nconst clean = DOMPurify.sanitize(userInput)\ndiv.innerHTML = clean'}</code>
              <p>O mejor aún, usar <code>textContent</code> en vez de <code>innerHTML</code> si no necesitas HTML.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}