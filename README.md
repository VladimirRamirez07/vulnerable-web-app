# 🔓 Vulnerable Web App

> An intentionally vulnerable web application built for learning and practicing web security concepts. Each vulnerability includes an interactive lab and a detailed writeup.

![Security](https://img.shields.io/badge/Security-Educational-red?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Express](https://img.shields.io/badge/Backend-Express-000000?style=flat-square&logo=express)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?style=flat-square&logo=sqlite)
![Vite](https://img.shields.io/badge/Bundler-Vite-646CFF?style=flat-square&logo=vite)
![OWASP](https://img.shields.io/badge/Based_on-OWASP_Top_10-000000?style=flat-square)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Vladimir_Ramírez-0077B5?style=flat-square&logo=linkedin)](https://www.linkedin.com/in/vladimir-ramírez-303a433ba)

---

## ⚠️ Disclaimer

This project is **intentionally vulnerable** and designed for **educational purposes only**. Do not deploy this application in a production environment or on a public server. The vulnerabilities demonstrated here are meant to help developers and security enthusiasts understand common web security flaws.

---

## 🧪 Vulnerabilities Covered

| # | Vulnerability | Description | Difficulty |
|---|--------------|-------------|------------|
| 1 | **SQL Injection** | Direct string concatenation in SQL queries allows data extraction | 🟡 Medium |
| 2 | **XSS** | Unsanitized HTML rendered via `dangerouslySetInnerHTML` | 🟡 Medium |
| 3 | **CSRF** | No CSRF token validation on state-changing endpoints | 🟡 Medium |
| 4 | **Broken Auth** | No rate limiting or account lockout on login endpoint | 🔴 High |
| 5 | **IDOR** | Direct object references without ownership validation | 🟡 Medium |

---

## 🚀 Features

- 🎯 **Interactive Labs** — Exploit each vulnerability in real time directly in the browser
- 📝 **Writeups** — Each lab includes how to exploit it, how to fix it, and lessons learned
- 🖥️ **Modern UI** — Clean dark interface built with React and Vite
- 🗄️ **In-memory Database** — Powered by sql.js, no external DB required
- 🔧 **REST API** — Node.js + Express backend with intentionally vulnerable endpoints

---

## 🛠️ Tech Stack

**Frontend**
- React 18 + Vite
- Custom CSS with CSS variables

**Backend**
- Node.js + Express
- sql.js (SQLite in-memory)
- express-session
- bcryptjs

---

## 📦 Installation & Setup

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the repository
```bash
git clone https://github.com/VladimirRamirez07/vulnerable-web-app.git
cd vulnerable-web-app
```

### 2. Install backend dependencies
```bash
cd app/backend
npm install
```

### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### 4. Run the backend
```bash
cd ../backend
node index.js
# Server running on http://localhost:4000
```

### 5. Run the frontend
```bash
cd ../frontend
npx vite
# App running on http://localhost:5173
```

### 6. Login
Username: admin
Password: admin123
---

## 🔬 Lab Writeups

### 1. SQL Injection
**Vulnerable code:**
```javascript
// Direct string concatenation — never do this
db.exec(`SELECT * FROM users WHERE username = '${username}'`)
```
**Exploit:** `' OR '1'='1` returns all users bypassing authentication.

**Fix:** Use prepared statements:
```javascript
db.prepare("SELECT * FROM users WHERE username = ?").get(username)
```

---

### 2. XSS (Cross-Site Scripting)
**Vulnerable code:**
```jsx
// Renders raw HTML without sanitization
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```
**Exploit:** `<img src=x onerror="alert('XSS!')">` executes JavaScript in the victim's browser.

**Fix:** Use DOMPurify to sanitize before rendering:
```javascript
import DOMPurify from 'dompurify'
const clean = DOMPurify.sanitize(userInput)
```

---

### 3. CSRF (Cross-Site Request Forgery)
**Vulnerable code:**
```javascript
// No CSRF token validation
app.post('/csrf/change-password', (req, res) => {
  db.run(`UPDATE users SET password = '${newPassword}' WHERE id = ${userId}`)
})
```
**Exploit:** A malicious site sends a POST request on behalf of the authenticated user.

**Fix:** Implement CSRF tokens:
```javascript
if (req.body.csrfToken !== req.session.csrfToken) {
  return res.status(403).json({ error: 'Invalid CSRF token' })
}
```

---

### 4. Broken Authentication
**Vulnerable code:**
```javascript
// No rate limiting, no account lockout
app.post('/broken-auth/login', (req, res) => {
  // Accepts unlimited login attempts
})
```
**Exploit:** Brute force attack discovers `admin123` in 4 attempts from a 15-word wordlist.

**Fix:** Implement rate limiting:
```javascript
const rateLimit = require('express-rate-limit')
app.use('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }))
```

---

### 5. IDOR (Insecure Direct Object Reference)
**Vulnerable code:**
```javascript
// No ownership validation
app.get('/idor/notes/:userId', (req, res) => {
  db.exec(`SELECT * FROM notes WHERE user_id = ${req.params.userId}`)
})
```
**Exploit:** Any authenticated user can access any other user's private notes by changing the ID in the URL.

**Fix:** Verify the requester owns the resource:
```javascript
if (req.session.user.id !== parseInt(req.params.userId)) {
  return res.status(403).json({ error: 'Forbidden' })
}
```

## 📁 Project Structure

```
vulnerable-web-app/
├── app/
│   ├── backend/
│   │   ├── index.js              # Express server + all vulnerable endpoints
│   │   └── package.json
│   └── frontend/
│       ├── src/
│       │   ├── App.jsx           # Main app + routing
│       │   ├── App.css           # Global styles
│       │   ├── SQLiLab.jsx       # SQL Injection interactive lab
│       │   ├── XSSLab.jsx        # XSS interactive lab
│       │   ├── CSRFLab.jsx       # CSRF interactive lab
│       │   ├── IDORLab.jsx       # IDOR interactive lab
│       │   └── BrokenAuthLab.jsx # Broken Auth brute force lab
│       └── package.json
├── vulnerabilities/
│   ├── sqli/                     # SQL Injection notes
│   ├── xss/                      # XSS notes
│   ├── csrf/                     # CSRF notes
│   ├── broken-auth/              # Broken Auth notes
│   └── idor/                     # IDOR notes
├── writeups/
│   ├── sqli/                     # SQL Injection writeup
│   ├── xss/                      # XSS writeup
│   ├── csrf/                     # CSRF writeup
│   ├── broken-auth/              # Broken Auth writeup
│   └── idor/                     # IDOR writeup
└── docs/
```


## 📚 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [PortSwigger Web Security Academy](https://portswigger.net/web-security)
- [HackTheBox](https://www.hackthebox.com/)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<p align="center">Built for learning. Break it, fix it, understand it.</p>