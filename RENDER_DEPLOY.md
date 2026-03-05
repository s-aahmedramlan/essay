# Deploy to Render (free tier)

**Yes, it’s free for now.** Render’s free Web Service tier runs your app at no cost. The only catch: the service **spins down after ~15 minutes of no traffic**, so the first visit after that may take 30–60 seconds to respond (cold start). When you’re ready for always-on, you can switch to a paid plan (~$7/month).

---

## What you need to do

### 1. Push your code to GitHub (if you haven’t already)

- Your repo should contain your project (e.g. `server.js`, `package.json`, HTML, etc.).
- Render will deploy from this repo.

### 2. Create a Render account and Web Service

1. Go to **[render.com](https://render.com)** and sign up (GitHub login is easiest).
2. **Dashboard** → **New +** → **Web Service**.
3. **Connect a repository:** choose your essay/repo. If it’s not listed, click “Configure account” and grant Render access to the right GitHub account/repo.
4. Use these settings:
   - **Name:** e.g. `essaybros`
   - **Region:** pick one close to you (e.g. Oregon).
   - **Branch:** `main` (or whatever branch you use).
   - **Runtime:** `Node`.
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance type:** **Free** (to keep it free for now).

5. Click **Advanced** and add **Environment Variables** (key/value). Add at least:

   | Key | Value (example) |
   |-----|------------------|
   | `BASE_URL` | `https://essaybros.onrender.com` *(replace with your Render URL after first deploy)* |
   | `SESSION_SECRET` | Any long random string (e.g. generate one at [randomkeygen.com](https://randomkeygen.com)) |

   If you use **paid access (DynamoDB)** and **Cognito** from the server, also add:

   | Key | Value |
   |-----|--------|
   | `ACCESS_TABLE_NAME` | `essaybros-access` |
   | `AWS_REGION` | `us-east-2` |
   | `COGNITO_USER_POOL_ID` | Your User Pool ID (e.g. `us-east-2_mE9j7A8G8`) |
   | `COGNITO_CLIENT_ID` | Your App Client ID |

   If you use the **paid access** feature (DynamoDB), add your AWS credentials so the server can read from DynamoDB: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` (from an IAM user with DynamoDB read access). Without these, `/api/access` will return “not paid” for everyone.

6. Click **Create Web Service**. Render will build and deploy. When it’s done, you’ll get a URL like `https://essaybros.onrender.com`.

7. **Update `BASE_URL`** in the same Environment tab to that URL (e.g. `https://essaybros.onrender.com`), then **Save Changes**. Render will redeploy. This keeps email/redirect links correct.

### 3. (Optional) Use your GoDaddy domain

1. In Render: your Web Service → **Settings** → **Custom Domains** → **Add Custom Domain**. Enter e.g. `essaybros.com` (and optionally `www.essaybros.com`).
2. Render will show you what to add in your DNS (usually a **CNAME** for `www` and an **A record** or redirect for the root).
3. In **GoDaddy**: go to your domain → **DNS** (or **Manage DNS**) and add the CNAME/A record Render tells you. Save.
4. Wait a few minutes (up to 48 hours in rare cases). Render will issue SSL automatically.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Code on GitHub |
| 2 | Render → New Web Service → connect repo, Build: `npm install`, Start: `npm start`, Instance: **Free** |
| 3 | Add env vars: `BASE_URL` (your Render URL), `SESSION_SECRET`, and any AWS/Cognito/DynamoDB vars you use |
| 4 | After first deploy, set `BASE_URL` to your real Render URL |
| 5 | (Optional) Add custom domain in Render and point GoDaddy DNS to Render |

That’s it. Your full Node app runs on Render’s free tier; you can upgrade to a paid instance later if you want no spin-down.
