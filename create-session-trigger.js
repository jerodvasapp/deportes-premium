const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.run(`
CREATE TRIGGER IF NOT EXISTS limit_user_sessions
AFTER INSERT ON user_sessions
BEGIN
  DELETE FROM user_sessions
  WHERE id IN (
    SELECT id
    FROM user_sessions
    WHERE user_id = NEW.user_id
    ORDER BY last_seen DESC, created_at DESC
    LIMIT -1 OFFSET 2
  );
END;
`, (err) => {
  if (err) {
    console.error("Error creando trigger:", err);
  } else {
    console.log("Trigger de límite de sesiones creado correctamente");
  }

  db.close();
});