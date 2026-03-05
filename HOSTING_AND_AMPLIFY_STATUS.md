# Hosting & Amplify – Where Things Stand

## Amplify Auth (Cognito) – **Configured in code**

- **User Pool ID** and **Client ID** are set in `amplify-auth.js` (and match what you used: `us-east-2_mE9j7A8G8`, `2hmt806ccp2i8hlqdgfhuqfm93`).
- So **Amplify Auth is configured**: sign-up, email verification (6-digit code), and sign-in all use that Cognito User Pool.
- You don’t need to “configure Amplify” again for auth unless you create a new User Pool or App Client.

## Your domain (GoDaddy)

- You own the domain (e.g. essaybros.com) on **GoDaddy**.
- The site is **not hosted online yet** from your perspective: the domain doesn’t show your course site until you (1) host the site somewhere, and (2) point the domain to that host.

## Full Node app – use Render or Railway, not Lambda

You need the **full Node app** (Express serving HTML, `/api/access`, etc.). For that:

- **Recommended: Render (free for now)**  
  - Render’s **free** Web Service tier runs your app at no cost. The service spins down after ~15 min of no traffic (first visit after that may be slow). See **RENDER_DEPLOY.md** for step-by-step deploy and custom domain.
- **Alternatively: Railway**  
  - They run `node server.js` as a long-lived process. You push your repo, set the start command and env vars, and get a URL. No code changes.  
  - **Render:** [render.com](https://render.com) → New → Web Service → connect GitHub repo, build command `npm install`, start command `npm start`. Add env vars (e.g. `ACCESS_TABLE_NAME`, `AWS_REGION`, etc.) in the dashboard.  
  - **Railway:** [railway.app](https://railway.app) → New Project → deploy from GitHub, same idea.  
  - Free tiers exist; paid tiers are cheap for a single app.

- **Lambda** is possible but a poor fit for this app:  
  - Lambda runs one short-lived function per request. You’d have to wrap Express (e.g. with `serverless-express` or Lambda Web Adapter), use API Gateway or Lambda function URLs, and deal with cold starts.  
  - Your app uses a **persistent SQLite file** and in-memory state; Lambda’s filesystem is ephemeral, so you’d have to move that data elsewhere or drop it.  
  - More refactoring and AWS setup for little benefit unless you specifically want serverless.

**Bottom line:** For “run my full Node app as-is,” use **Render** or **Railway**. Use Lambda only if you later decide to go fully serverless and are willing to refactor.

---

## What’s left to get the site live on your domain

You have two separate pieces:

1. **Host the app**  
   - **Recommended:** Deploy the repo to **Render** or **Railway** as a Web Service (start: `npm start`). You get a URL like `https://your-app.onrender.com`.  
   - Optionally: AWS **Elastic Beanstalk** or a small **EC2** instance if you want everything on AWS; both run the full Node app too.

2. **Point GoDaddy to the host**  
   - In **GoDaddy**: DNS for your domain → add a record that points to where the site is hosted:
     - **A record** or **ANAME/ALIAS**: point to the host’s IP or target (Amplify/Render/etc. will tell you the value).
     - Or **CNAME**: e.g. `www` → `your-app.amplifyapp.com` (or whatever your host gives you).
   - If you use **Amplify Hosting**, in Amplify you add the custom domain (e.g. essaybros.com) and Amplify shows you exactly which CNAME/A (or ANAME) to add in GoDaddy.

## Summary

| Item | Status |
|------|--------|
| Amplify Auth (Cognito) | Configured in code; sign-up and verification use your User Pool. |
| Domain (GoDaddy) | You own it; not yet pointing to a host. |
| Site hosted online | Not yet – need to deploy to Amplify Hosting or another host, then set DNS in GoDaddy. |

**Next step:** Deploy the full Node app to **Render** or **Railway** (see above), then in GoDaddy add the CNAME or A record your host gives you so your domain points to that URL.
