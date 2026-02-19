# The Essay Bros

Course website with secure student login and email verification.

## Run locally
- Install: `npm install`
- Start: `npm start`
- Open: `http://localhost:3000`

## Auth: AWS Amplify (recommended for email verification)

Amplify uses **Cognito** for sign-up, 6-digit email verification, and sign-in. Cognito sends verification emails automatically—no SMTP setup needed.

1. See **[AMPLIFY_SETUP.md](AMPLIFY_SETUP.md)** for step-by-step Cognito setup.
2. Edit `amplify-config.js` with your User Pool ID and Client ID.
3. Sign up → receive 6-digit code in email → verify → log in → access course.

When Amplify is configured, it handles all auth. When not configured, the site falls back to the Express/ZeptoMail flow below.

## Email verification (ZeptoMail – fallback)

**One-time setup (no domain required):**

1. Sign up at **https://www.zoho.com/zeptomail/** (free – 10,000 emails/month).
2. **Add your sender email:** In the dashboard go to **Senders** → **Add**. Enter the email you want to send from (e.g. `essayempire2026@gmail.com`). Check that inbox and click the verification link.
3. **Get your token:** Go to **Agents** → open your agent → **SMTP/API** tab → find **Send Mail Token** → **Copy**.
4. In your project, open `.env` and set:
   ```
   ZEPTOMAIL_TOKEN=paste_the_token_here
   ZEPTOMAIL_FROM_EMAIL=essayempire2026@gmail.com
   ZEPTOMAIL_FROM_NAME=Essay Bros
   ```
   (Use the same email you verified as sender.)
5. Restart the server: `npm start`.

Verification emails will be sent to **any student address** (Gmail, Outlook, etc.) with no domain or extra API keys.

## Deploy to Render (free hosting)

Follow these steps to get essaybros.com live:

### Step 1: Push to GitHub
1. Create a GitHub account at [github.com](https://github.com) if you don’t have one.
2. Create a new repo (e.g. `essaybros`), leave it empty.
3. In your project folder, run:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/essaybros.git
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` with your GitHub username.

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com) and sign up (free).
2. Click **New** → **Web Service**.
3. Connect your GitHub account and select your `essaybros` repo.
4. Render should detect Node.js. Use:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Click **Advanced** and add Environment Variables:
   - `SESSION_SECRET` – paste a long random string (e.g. generate at [randomkeygen.com](https://randomkeygen.com))
   - `BASE_URL` – set to `https://essaybros.onrender.com` (you’ll get the exact URL after deploy)
   - If using ZeptoMail: `ZEPTOMAIL_TOKEN`, `ZEPTOMAIL_FROM_EMAIL`, `ZEPTOMAIL_FROM_NAME`
6. Click **Create Web Service**.
7. Wait 2–5 minutes for the first deploy. Your site will be at `https://essaybros.onrender.com` (or similar).

### Step 3: Connect essaybros.com (GoDaddy)
1. In Render, open your service → **Settings** → **Custom Domains**.
2. Click **Add Custom Domain** and enter `essaybros.com` and `www.essaybros.com`.
3. In **GoDaddy** → Your domain → **DNS**:
   - Add **CNAME** for `www` → value: `essaybros.onrender.com` (or the hostname Render shows).
   - For the root domain `essaybros.com`, Render will show the exact record to add (usually an A record). Follow Render’s instructions.

DNS can take up to an hour to update. After that, essaybros.com will serve your site.

---

## Other hosting options

| Service | Free tier | Notes |
|--------|-----------|-------|
| [Railway](https://railway.app) | $5 credit/month | Simple deploy |
| [Cyclic](https://cyclic.sh) | Yes | Node.js focused |
| [Fly.io](https://fly.io) | Yes | More flexible |

### Pointing your domain (DNS)

In your domain registrar’s control panel (where you bought the domain):

1. Go to **DNS** or **Manage DNS**.
2. Add a record:

   - **A record** (for apex `yourdomain.com`):
     - Name: `@` or leave blank  
     - Value: the host’s IP (see host docs)
   
   - **CNAME record** (for `www`):
     - Name: `www`  
     - Value: `your-app.onrender.com` (or whatever host URL you got)

3. Save changes. DNS can take up to 48 hours to update, often much quicker.


