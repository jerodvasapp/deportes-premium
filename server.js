//Crear la base de datos de usuarios

const express = require("express");
const session = require("express-session");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const helmet = require("helmet");
const path = require("path");
const { Readable } = require("stream");

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || "./database.db";

const db = new sqlite3.Database(DB_PATH);

app.use(
  helmet({
    contentSecurityPolicy: false
  })
);
app.use(express.static(path.join(__dirname, "public")));
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login.html");
  });
});

app.get("/", (req, res) => {
  if (req.session.user) {
    return res.redirect("/index.html");
  }
  return res.redirect("/login.html");
});

app.get("/index.html", requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/admin.html", requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("trust proxy", 1);

app.use(
  session({
    secret: process.env.SESSION_SECRET || "cambia-esto-por-una-clave-larga-y-segura",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'activo',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      login_at TEXT DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      success INTEGER DEFAULT 1
    )
  `);
});

//Crear el usuario administrador inicial
async function createDefaultAdmin() {
  const username = "admin";
  const password = "123456";

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, row) => {
    if (err) {
      console.error("Error buscando admin:", err);
      return;
    }

    if (!row) {
      const hash = await bcrypt.hash(password, 10);

      db.run(
        `INSERT INTO users (username, password_hash, role, start_date, end_date, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          username,
          hash,
          "admin",
          "2026-01-01",
          "2099-12-31",
          "activo"
        ],
        (insertErr) => {
          if (insertErr) {
            console.error("Error creando admin:", insertErr);
          } else {
            console.log("Usuario admin creado");
          }
        }
      );
    }
  });
}

createDefaultAdmin();

//Validar login con fecha inicial y fecha final
function isUserExpired(user) {
  if (!user.end_date) return false;

  const today = new Date();
  const endDate = new Date(user.end_date + "T23:59:59");

  return today > endDate;
}

function isUserNotStarted(user) {
  if (!user.start_date) return false;

  const today = new Date();
  const startDate = new Date(user.start_date + "T00:00:00");

  return today < startDate;
}

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ ok: false, message: "Error del servidor" });
    }

    if (!user) {
      return res.status(401).json({ ok: false, message: "Usuario o contraseña incorrectos" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);

    if (!passwordOk) {
      db.run(
        `INSERT INTO access_logs (user_id, username, ip_address, user_agent, success)
         VALUES (?, ?, ?, ?, ?)`,
        [user.id, user.username, req.ip, req.get("user-agent"), 0]
      );

      return res.status(401).json({ ok: false, message: "Usuario o contraseña incorrectos" });
    }

    if (user.status !== "activo") {
      return res.status(403).json({ ok: false, message: "Usuario suspendido" });
    }

    if (isUserNotStarted(user)) {
      return res.status(403).json({ ok: false, message: "Tu acceso aún no ha iniciado" });
    }

    if (isUserExpired(user)) {
      return res.status(403).json({ ok: false, message: "Tu acceso ha vencido" });
    }

    req.session.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    db.run(
      `INSERT INTO access_logs (user_id, username, ip_address, user_agent, success)
       VALUES (?, ?, ?, ?, ?)`,
      [user.id, user.username, req.ip, req.get("user-agent"), 1]
    );

    return res.json({ ok: true, message: "Login correcto" });
  });
});

//Crear validación de sesión
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect("/login.html");
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "admin") {
    return res.status(403).json({ ok: false, message: "Acceso denegado" });
  }
  next();
}

app.get("/api/session", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ loggedIn: false });
  }

  return res.json({
    loggedIn: true,
    user: req.session.user
  });
});

//Crear rutas para administrar usuarios - listar usuarios
app.get("/admin/users", requireAdmin, (req, res) => {
  db.all(
    `SELECT id, username, role, start_date, end_date, status, created_at
     FROM users
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, message: "Error al listar usuarios" });
      }

      res.json({ ok: true, users: rows });
    }
  );
});

//Crear rutas para administrar usuarios - crear usuario
app.post("/admin/users", requireAdmin, async (req, res) => {
  const { username, password, role, start_date, end_date, status } = req.body;

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Usuario y contraseña son obligatorios" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO users (username, password_hash, role, start_date, end_date, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      username,
      hash,
      role || "user",
      start_date || null,
      end_date || null,
      status || "activo"
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ ok: false, message: "No se pudo crear el usuario" });
      }

      res.json({ ok: true, id: this.lastID, message: "Usuario creado" });
    }
  );
});

//Crear rutas para administrar usuarios - editar usuario
app.put("/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role, start_date, end_date, status } = req.body;

  db.run(
    `UPDATE users
     SET role = ?, start_date = ?, end_date = ?, status = ?
     WHERE id = ?`,
    [role, start_date, end_date, status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ ok: false, message: "No se pudo actualizar el usuario" });
      }

      res.json({ ok: true, message: "Usuario actualizado" });
    }
  );
});

//Crear rutas para administrar usuarios - cambiar contraseña
app.put("/admin/users/:id/password", requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ ok: false, message: "La contraseña es obligatoria" });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [hash, id],
    function (err) {
      if (err) {
        return res.status(500).json({ ok: false, message: "No se pudo cambiar la contraseña" });
      }

      res.json({ ok: true, message: "Contraseña actualizada" });
    }
  );
});

//Crear rutas para administrar usuarios - eliminar usuario
app.delete("/admin/users/:id", requireAdmin, (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM users WHERE id = ?`, [id], function (err) {
    if (err) {
      return res.status(500).json({ ok: false, message: "No se pudo eliminar el usuario" });
    }

    res.json({ ok: true, message: "Usuario eliminado" });
  });
});

//Crear rutas para administrar usuarios - ver logs de acceso
app.get("/admin/logs", requireAdmin, (req, res) => {
  db.all(
    `SELECT id, user_id, username, login_at, ip_address, user_agent, success
     FROM access_logs
     ORDER BY id DESC
     LIMIT 200`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ ok: false, message: "Error al obtener logs" });
      }

      res.json({ ok: true, logs: rows });
    }
  );
});

//finalizar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.use((err, req, res, next) => {
  console.error("ERROR NO CONTROLADO:", err);
  res.status(500).send("Internal Server Error");
});

