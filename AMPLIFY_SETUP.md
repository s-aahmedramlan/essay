# AWS Amplify Auth Setup

Amplify uses **Amazon Cognito** for sign-up, email verification (6-digit code), and sign-in. Cognito sends verification emails automatically—no ZeptoMail or SMTP needed.

## Step 1: Create an AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com) and sign up (free tier is sufficient).

## Step 2: Create a Cognito User Pool

1. In the AWS Console, open **Cognito**: [https://console.aws.amazon.com/cognito](https://console.aws.amazon.com/cognito).
2. You’ll see **two options**:
   - **User pools** – sign-up/sign-in for your app (this is the one you need).
   - **Identity pools** – for AWS resource access (skip this).
3. Click **User pools**, then click the orange **Create user pool** button (top right).
4. **Sign-in experience:**
   - Choose **Email** as the sign-in option.
   - Leave other options as default.
5. **Security requirements:**
   - Password policy: Minimum 8 characters (or your preference).
   - MFA: Optional (recommend **Off** for simplicity).
6. **Sign-up experience:**
   - Enable **Allow users to sign themselves up**.
   - Required attributes: **email**.
   - Leave verification as **Send email message, verify email address**.
7. **Message delivery:**
   - Choose **Send email with Cognito** (uses AWS SES in sandbox; sufficient for testing).
   - For production, configure [custom email in Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html) or use SES.
8. **User pool name:** e.g. `essaybros-users`.
9. Click through to **Create pool**.

## Step 3: Create an App Client

1. In your User Pool → **App integration** → **App client list**.
2. Click **Create app client**.
3. **App type:** Public client.
4. **App client name:** e.g. `essaybros-web`.
5. **Authentication flows:** Enable **ALLOW_USER_PASSWORD_AUTH** and **ALLOW_REFRESH_TOKEN_AUTH**.
6. **OpenID Connect scopes:** `email`, `openid`, `profile`.
7. Create the app client.
8. Copy the **Client ID**.

## Step 4: Configure Your Site

1. In your project, open `amplify-config.js`.
2. Set:
   - `userPoolId` – your User Pool ID (e.g. `us-east-1_XXXXXXXXX`).
   - `userPoolClientId` – your App Client ID.

```javascript
window.AMPLIFY_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: "us-east-1_XXXXXXXXX",
      userPoolClientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx",
      loginWith: { email: true },
      signUpVerificationMethod: "code",
      userAttributes: { email: { required: true } },
      passwordFormat: { minLength: 8 },
    },
  },
};
```

## Step 5: Test the Flow

1. Run `npm start`.
2. Go to **Create Account**.
3. Enter email and password → click **Create Account**.
4. Check your email for a 6-digit code.
5. Enter the code on the **Verify Email** page.
6. Log in and access the course dashboard.

## Where are users stored?

- **When you use Amplify (Cognito):** Users are stored only in **AWS Cognito** (your User Pool). You won’t see them in this project’s files.
- **If the form ever submitted to the Express server:** Users are stored in the local **SQLite** file `data.db` in the project folder. That’s why you can see “Account already exists” even when Cognito has no users.

## Delete users (start over)

**If “Account already exists” but Cognito has no users** – the email is in the **local SQLite** DB. Clear it:

1. In the project folder run: `node clear-local-users.js`
2. (If you get “database is locked”, stop the server with Ctrl+C, run the command again, then `npm start`.)

**To remove a user from Cognito** (so you can sign up again with that email):

1. Open [Cognito Console](https://console.aws.amazon.com/cognito) → **User pools**.
2. Click your user pool.
3. Left menu → **Users**.
4. Select the user(s) → **Delete** (top right) and confirm.

## Verification email not arriving

- **Verification page:** You can always open it directly: **[confirm.html](http://localhost:3000/confirm.html)** (or your site URL + `/confirm.html`). Enter your email and the 6-digit code when you get it.
- **Check spam/junk** for mail from AWS or Cognito.
- **Cognito email limits:** If you chose “Send email with Cognito”, there are low sending limits and emails can be delayed or blocked. For more reliable delivery:
  1. In your User Pool go to **Messaging** (or **Message delivery**).
  2. Switch to **Send email with Amazon SES** and set up SES in the same region (e.g. us-east-2).
  3. In [SES Console](https://console.aws.amazon.com/ses) → **Verified identities**, add and verify the **email address** you use for testing. In SES sandbox, only verified addresses receive mail.
- **Resend code:** On the verification page, enter your email and click **Resend Code** to get a new 6-digit code.

## Notes

- **Cognito SES sandbox:** If using SES, only verified recipient addresses receive email until you leave sandbox.
- **Custom domain:** For branded emails in production, configure [custom email in Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html).
- **Fallback:** If Amplify is not configured, the form falls back to the Express backend (ZeptoMail) when available.
