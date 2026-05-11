import { useState } from 'react'

export default function IDORLab({ onBack, user }) {
  const [userId, setUserId] = useState('')
  const [notes, setNotes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newNote, setNewNote] = useState('')

  const fetchNotes = async (id) => {
    const targetId = id !== undefined ? id : userId
    setLoading(true)
    setNotes(null)
    const res = await fetch(`http://localhost:4000/idor/notes/${targetId}`, {
      credentials: 'include'
    })
    const data = await res.json()
    setNotes(data)
    setLoading(false)
  }

  const addNote = async () => {
    if (!newNote.trim()) return
    await fetch('http://localhost:4000/idor/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content: newNote })
    })
    setNewNote('')
    fetchNotes(user?.id || 1)
  }

  const users = [
    { id: 1, label: 'admin (ID: 1)', color: '#ff6b6b' },
    { id: 2, label: 'user1 (ID: 2)', color: '#4d96ff' },
    { id: 3, label: 'user2 (ID: 3)', color: '#c77dff' },
  ]

  return (
    <div className="page lab-page">
      <div className="noise" />
      <header className="dash-header">
        <div className="dash-logo">
          <div className="badge">LAB</div>
          <span>IDOR - Insecure Direct Object Reference</span>
        </div>
        <button className="btn-logout" onClick={onBack}>← Volver</button>
      </header>

      <main className="lab-main">
        <div className="lab-info">
          <div className="lab-tag">👁️ IDOR</div>
          <h2>IDOR Lab</h2>
          <p>El endpoint de notas acepta cualquier user ID sin verificar si eres el dueño. Cambia el ID en la URL para ver las notas privadas de otros usuarios.</p>
        </div>

        <div className="lab-grid">
          {/* Panel izquierdo */}
          <div className="lab-panel">
            <h3>Acceder a notas por User ID</h3>

            <div className="field">
              <label>User ID objetivo</label>
              <input
                type="number"
                value={userId}
                onChange={e => setUserId(e.target.value)}
                placeholder="1, 2, 3..."
                min="1"
              />
            </div>

            <button className="btn-login" onClick={() => fetchNotes()} disabled={loading}>
              {loading ? 'Cargando...' : 'Ver notas →'}
            </button>

            <div className="payloads">
              <label>Acceso rápido por usuario</label>
              {users.map(u => (
                <button
                  key={u.id}
                  className="payload-btn"
                  onClick={() => { setUserId(String(u.id)); fetchNotes(u.id) }}
                >
                  <span className="payload-label">Usuario {u.id}</span>
                  <code style={{ color: u.color }}>{u.label}</code>
                </button>
              ))}
            </div>

            <div className="csrf-divider" />

            <h3>Agregar nota (como usuario actual)</h3>
            <div className="field">
              <label>Contenido</label>
              <input
                type="text"
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Mi nota privada..."
              />
            </div>
            <button className="btn-exploit"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={addNote}>
              Agregar nota →
            </button>
          </div>

          {/* Panel derecho */}
          <div className="lab-panel">
            <h3>Resultado</h3>

            {!notes && !loading && (
              <p className="no-results">Selecciona un usuario para ver sus notas</p>
            )}

            {notes && (
              <>
                <div className="query-box">
                  <label>URL ejecutada</label>
                  <code>GET /idor/notes/{notes.requestedUserId}</code>
                </div>

                {notes.notes?.length === 0 ? (
                  <p className="no-results">Este usuario no tiene notas</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    <label style={{
                      fontSize: '0.7rem', textTransform: 'uppercase',
                      letterSpacing: '0.08em', color: 'var(--muted)',
                      fontFamily: "'Space Mono', monospace"
                    }}>
                      Notas encontradas ({notes.notes?.length})
                    </label>
                    {notes.notes?.map((n, i) => (
                      <div key={i} className="comment-card">
                        <div className="comment-author">👤 {n.username} — nota #{n.id}</div>
                        <div className="comment-content">{n.content}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Writeup */}
        <div className="writeup">
          <h3>📝 Writeup</h3>
          <div className="writeup-grid">
            <div className="writeup-section">
              <h4>🔴 Cómo explotarlo</h4>
              <p>El endpoint acepta cualquier ID directamente en la URL sin verificar si pertenece al usuario autenticado. Simplemente cambia el número:</p>
              <code className="block-code">{`GET /idor/notes/1  → notas de admin
GET /idor/notes/2  → notas de user1
GET /idor/notes/3  → notas de user2`}</code>
              <p>Cualquier usuario autenticado puede ver las notas privadas de cualquier otro usuario.</p>
            </div>
            <div className="writeup-section">
              <h4>🟢 Cómo arreglarlo</h4>
              <p>Verificar que el ID solicitado corresponde al usuario en sesión:</p>
              <code className="block-code">{`app.get('/notes/:userId', (req, res) => {
  // Verificar que el usuario solo accede a sus propios datos
  if (req.session.user.id !== parseInt(req.params.userId)) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  // ... resto del código
})`}</code>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}