/**
 * Clears all users from the local SQLite database (Express backend).
 * Run with: node clear-local-users.js
 * Stop the server first if you get "database is locked".
 */
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run("DELETE FROM verification_tokens", function (err) {
        if (err) {
            console.error("Error clearing tokens:", err.message);
            db.close();
            return;
        }
        console.log("Cleared verification_tokens");
    });
    db.run("DELETE FROM users", function (err) {
        if (err) {
            console.error("Error clearing users:", err.message);
            db.close();
            return;
        }
        console.log("Cleared users. Local signup accounts are removed.");
        db.close();
    });
});
