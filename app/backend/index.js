const express = require('express');
const cors = require('cors');
const session = require('express-session');
const initSql = require('sql.js');

const app = express();
const PORT = 4000;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'supersecret123',
  resave: false,
  saveUninitialized: true
}));

let db;

async function initDB() {
  const SQL = await initSql();
  db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      password TEXT,
      role TEXT DEFAULT 'user'
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      content TEXT
    );
  `);

  db.run(`INSERT INTO users (username, password, role) VALUES 
    ('admin', 'admin123', 'admin'),
    ('user1', 'password1', 'user'),
    ('user2', 'password2', 'user');
  `);

  console.log('✅ Base de datos inicializada');
}

// ===== RUTA: LOGIN (Vulnerable a Broken Auth) =====
app.post('/auth/login', (req, res) => {
  const { username, password } = req.body;

  // ⚠️ VULNERABLE: sin rate limiting, sin bloqueo por intentos fallidos
  const result = db.exec(
    `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`
  );

  if (result.length > 0) {
    const row = result[0].values[0];
    const user = {
      id: row[0],
      username: row[1],
      role: row[3]
    };
    req.session.user = user;
    res.json({ success: true, user });
  } else {
    res.status(401).json({ success: false, error: 'Credenciales incorrectas' });
  }
});

// ===== RUTA: LOGOUT =====
app.get('/auth/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// ===== RUTA: SQLi - Búsqueda vulnerable =====
app.get('/sqli/search', (req, res) => {
  const { username } = req.query;

  // ⚠️ VULNERABLE: concatenación directa sin sanitización
  const query = `SELECT id, username, role FROM users WHERE username = '${username}'`;

  try {
    const result = db.exec(query);
    const users = result.length > 0
      ? result[0].values.map(row => ({ id: row[0], username: row[1], role: row[2] }))
      : [];
    res.json({ success: true, query, users });
  } catch (err) {
    res.json({ success: false, query, error: err.message, users: [] });
  }
});

app.get('/', (req, res) => {
  res.json({ message: '🔓 Vulnerable Web App API running' });
});

// ===== RUTA: XSS - Comentarios vulnerables =====
app.get('/xss/comments', (req, res) => {
  const result = db.exec(`SELECT n.id, u.username, n.content FROM notes n JOIN users u ON n.user_id = u.id`)
  const comments = result.length > 0
    ? result[0].values.map(row => ({ id: row[0], username: row[1], content: row[2] }))
    : []
  res.json({ success: true, comments })
})

app.post('/xss/comments', (req, res) => {
  const { content } = req.body
  const userId = 1

  // ⚠️ VULNERABLE: guarda HTML sin sanitizar
  const escaped = content.replace(/'/g, "''")
  db.run(`INSERT INTO notes (user_id, content) VALUES (${userId}, '${escaped}')`)
  res.json({ success: true })
})

// ===== RUTA: CSRF - Cambiar email vulnerable =====
app.get('/csrf/profile/:id', (req, res) => {
  const { id } = req.params
  const result = db.exec(`SELECT id, username, role FROM users WHERE id = ${id}`)
  if (result.length > 0) {
    const row = result[0].values[0]
    res.json({ success: true, user: { id: row[0], username: row[1], role: row[2] } })
  } else {
    res.status(404).json({ success: false, error: 'User not found' })
  }
})

app.post('/csrf/change-password', (req, res) => {
  const { userId, newPassword } = req.body

  // ⚠️ VULNERABLE: no verifica CSRF token, no verifica sesión
  db.run(`UPDATE users SET password = '${newPassword}' WHERE id = ${userId}`)
  res.json({ success: true, message: 'Password changed successfully' })
})

// ===== RUTA: IDOR - Acceso a notas de otros usuarios =====
app.get('/idor/notes/:userId', (req, res) => {
  const { userId } = req.params

  // ⚠️ VULNERABLE: no verifica si el usuario autenticado es el dueño
  const result = db.exec(`SELECT n.id, n.content, u.username FROM notes n JOIN users u ON n.user_id = u.id WHERE n.user_id = ${userId}`)
  const notes = result.length > 0
    ? result[0].values.map(row => ({ id: row[0], content: row[1], username: row[2] }))
    : []
  res.json({ success: true, notes, requestedUserId: userId })
})

app.post('/idor/notes', (req, res) => {
  const { content } = req.body
  const userId = req.session.user?.id || 1

  db.run(`INSERT INTO notes (user_id, content) VALUES (${userId}, '${content}')`)
  res.json({ success: true })
})

// ===== RUTA: Broken Auth - Sin rate limiting =====
app.post('/broken-auth/login', (req, res) => {
  const { username, password } = req.body

  // ⚠️ VULNERABLE: sin rate limiting, sin bloqueo, sin captcha
  const result = db.exec(
    `SELECT id, username, role FROM users WHERE username = '${username}' AND password = '${password}'`
  )

  if (result.length > 0) {
    const row = result[0].values[0]
    res.json({ success: true, user: { id: row[0], username: row[1], role: row[2] } })
  } else {
    res.status(401).json({ success: false, error: 'Invalid credentials' })
  }
})

app.get('/broken-auth/attempts', (req, res) => {
  // Endpoint para mostrar que no hay bloqueo después de muchos intentos
  res.json({ success: true, message: 'No rate limiting applied', attempts: 'unlimited' })
})

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

module.exports = { app, getDB: () => db };