const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.run("DELETE FROM user_sessions", function (err) {
  if (err) {
    console.error("Error borrando sesiones:", err);
  } else {
    console.log("Sesiones eliminadas:", this.changes);
  }

  db.close();
});