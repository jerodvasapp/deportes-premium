const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db");

db.all("PRAGMA table_info(user_sessions)", [], (err, rows) => {
  if (err) {
    console.error("Error con PRAGMA:", err);
    return;
  }

  console.log("COLUMNAS user_sessions:");
  console.table(rows);

  db.all(
    "SELECT sql FROM sqlite_master WHERE type='table' AND name='user_sessions'",
    [],
    (err2, rows2) => {
      if (err2) {
        console.error("Error leyendo sqlite_master:", err2);
        return;
      }

      console.log("\nCREATE TABLE:");
      console.log(rows2);

      db.all(
        "SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name='user_sessions'",
        [],
        (err3, rows3) => {
          if (err3) {
            console.error("Error leyendo índices:", err3);
            return;
          }

          console.log("\nINDICES:");
          console.log(rows3);
          db.close();
        }
      );
    }
  );
});