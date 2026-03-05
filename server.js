const path = require("path");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const { SendMailClient } = require("zeptomail");
const { CognitoJwtVerifier } = require("aws-jwt-verify");
const { DynamoDBClient, GetItemCommand } = require("@aws-sdk/client-dynamodb");

require("dotenv").config();

// Paid access: Cognito (auth) + DynamoDB (admin marks paid). Table key = email.
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID || "us-east-2_mE9j7A8G8";
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID || "2hmt806ccp2i8hlqdgfhuqfm93";
const ACCESS_TABLE_NAME = process.env.ACCESS_TABLE_NAME || ""; // e.g. essaybros-access
const dynamo = ACCESS_TABLE_NAME ? new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-2" }) : null;
const idVerifier = CognitoJwtVerifier.create({
    userPoolId: COGNITO_USER_POOL_ID,
    tokenUse: "id",
    clientId: COGNITO_CLIENT_ID,
});

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
app.get("/builder.js", (req, res) =>
    res.sendFile(path.join(__dirname, "builder.js"))
);
app.get("/explorer.js", (req, res) =>
    res.sendFile(path.join(__dirname, "explorer.js"))
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
app.get("/explorer.js", (req, res) =>
    res.sendFile(path.join(__dirname, "explorer.js"))
);
app.get("/colleges-scraped.json", (req, res) =>
    res.sendFile(path.join(__dirname, "colleges-scraped.json"))
);

app.get(["/", "/index.html"], (req, res) =>
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
app.get(["/essay-builder", "/essay-builder.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "essay-builder.html"))
);
app.get(["/planner", "/planner.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "planner.html"))
);
app.get(["/college-explorer", "/college-explorer.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "college-explorer.html"))
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
app.get(["/pending-access", "/pending-access.html"], (req, res) =>
    res.sendFile(path.join(__dirname, "pending-access.html"))
);

// Paid access: verify Cognito ID token, then check DynamoDB for status = "paid".
app.get("/api/access", express.json(), async (req, res) => {
    const auth = req.headers.authorization;
    const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) {
        return res.status(401).json({ error: "Missing token", paid: false });
    }
    let email = null;
    try {
        const payload = await idVerifier.verify(token);
        email = payload.email || payload["cognito:username"] || payload.sub;
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token", paid: false });
    }
    if (!ACCESS_TABLE_NAME || !dynamo) {
        return res.json({ paid: false, message: "Access table not configured" });
    }
    try {
        const { Item } = await dynamo.send(new GetItemCommand({
            TableName: ACCESS_TABLE_NAME,
            Key: {
                email: { S: String(email).trim().toLowerCase() },
            },
        }));
        const status = Item?.status?.S || Item?.paid?.BOOL;
        const paid = status === "paid" || status === true;
        return res.json({ paid, email: email });
    } catch (err) {
        console.error("DynamoDB GetItem error:", err.message);
        return res.json({ paid: false });
    }
});

setupDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Essay Bros running at ${BASE_URL}`);
    });
});
