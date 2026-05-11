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

app.get('/', (req, res) => {
  res.json({ message: '🔓 Vulnerable Web App API running' });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});

module.exports = { app, getDB: () => db };