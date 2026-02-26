const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const { SendMailClient } = require("zeptomail");

require("dotenv").config();

const zeptoToken = process.env.ZEPTOMAIL_TOKEN || "";
const zeptoFrom = {
    address: process.env.ZEPTOMAIL_FROM_EMAIL || "noreply@essaybros.com",
    name: process.env.ZEPTOMAIL_FROM_NAME || "Essay Bros"
};
const zeptoClient = zeptoToken
    ? new SendMailClient({ url: "https://api.zeptomail.com/v1.1", token: zeptoToken })
    : null;

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

const db = new sqlite3.Database(path.join(__dirname, "data.db"));

const run = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this);
        });
    });

const get = (sql, params = []) =>
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        });
    });

const setupDatabase = async () => {
    await run(
        `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )`
    );
    await run(
        `CREATE TABLE IF NOT EXISTS verification_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )`
    );
};

let mailerPromise = null;

const getMailer = async () => {
    if (mailerPromise) {
        return mailerPromise;
    }

    mailerPromise = (async () => {
        const service = process.env.SMTP_SERVICE;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const host = process.env.SMTP_HOST;

        if (service && user && pass) {
            return nodemailer.createTransport({
                service,
                auth: { user, pass }
            });
        }

        if (host) {
            return nodemailer.createTransport({
                host,
                port: Number(process.env.SMTP_PORT || 587),
                secure: false,
                auth: user
                    ? {
                          user,
                          pass
                      }
                    : undefined
            });
        }

        const testAccount = await nodemailer.createTestAccount();
        const transport = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });
        transport.isTest = true;
        return transport;
    })();

    return mailerPromise;
};

const sendVerificationEmail = async (email, token) => {
    const verifyUrl = `${BASE_URL}/verify?token=${token}`;
    const html = `<p>Welcome to Essay Bros!</p><p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`;

    if (zeptoClient) {
        await zeptoClient.sendMail({
            from: { address: zeptoFrom.address, name: zeptoFrom.name },
            to: [{ email_address: { address: email, name: "" } }],
            subject: "Verify your Essay Bros account",
            htmlbody: html
        });
        console.log("[verify] Sent via ZeptoMail to", email);
        return;
    }

    const mailer = await getMailer();
    const info = await mailer.sendMail({
        from: process.env.SMTP_FROM || "Essay Bros <no-reply@essaybros.com>",
        to: email,
        subject: "Verify your Essay Bros account",
        text: `Welcome to Essay Bros! Verify your email: ${verifyUrl}`,
        html: `<p>Welcome to Essay Bros!</p><p>Verify your email: <a href="${verifyUrl}">${verifyUrl}</a></p>`
    });

    if (mailer.isTest) {
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[verify-preview] ${email} -> ${previewUrl}`);
    }
};

const requireAuth = async (req, res, next) => {
    if (!req.session.userId) {
        res.redirect("/login?status=login-required");
        return;
    }

    const user = await get("SELECT id, is_verified FROM users WHERE id = ?", [
        req.session.userId
    ]);

    if (!user || user.is_verified !== 1) {
        res.redirect("/login?status=verify-required");
        return;
    }

    next();
};

app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        secret: process.env.SESSION_SECRET || "essay-bros-dev-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: "lax",
            secure: false
        }
    })
);

app.use("/assets", express.static(path.join(__dirname, "assets")));
app.get("/styles.css", (req, res) =>
    res.sendFile(path.join(__dirname, "styles.css"))
);
app.get("/script.js", (req, res) =>
    res.sendFile(path.join(__dirname, "script.js"))
);
app.get("/auth.js", (req, res) =>
    res.sendFile(path.join(__dirname, "auth.js"))
);
app.get("/amplify-config.js", (req, res) =>
    res.sendFile(path.join(__dirname, "amplify-config.js"))
);
app.get("/amplify-auth.js", (req, res) =>
    res.sendFile(path.join(__dirname, "amplify-auth.js"))
);

app.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "index.html"))
);
app.get(["/about", "/about.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "about.html"))
);
app.get(["/mentors", "/writers.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "writers.html"))
);
app.get(["/faq", "/faq.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "faq.html"))
);
app.get(["/loci", "/loci.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "loci.html"))
);
app.get(["/appeals", "/appeals.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "appeals.html"))
);

app.get(["/login", "/login.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "login.html"))
);
app.get(["/signup", "/signup.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "signup.html"))
);

// Auth is handled by Amplify (Cognito) only — no local DB signup/login
app.post("/signup", (req, res) => {
    res.redirect("/signup");
});
app.post("/login", (req, res) => {
    res.redirect("/login");
});

// Resend/verify handled by Amplify (Cognito) — no local DB
app.post("/resend", (req, res) => res.redirect("/confirm.html"));
app.get("/verify", (req, res) => res.redirect("/confirm.html"));

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

app.get("/course", (req, res) => {
    res.sendFile(path.join(__dirname, "protected-course.html"));
});
app.get(["/protected-course", "/protected-course.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "protected-course.html"))
);
app.get(["/confirm", "/confirm.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "confirm.html"))
);
app.get(["/logout-page", "/logout.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "logout.html"))
);

setupDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Essay Bros running at ${BASE_URL}`);
    });
});
