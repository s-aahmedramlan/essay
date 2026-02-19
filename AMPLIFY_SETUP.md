# AWS Amplify Auth Setup

Amplify uses **Amazon Cognito** for sign-up, email verification (6-digit code), and sign-in. Cognito sends verification emails automatically—no ZeptoMail or SMTP needed.

## Step 1: Create an AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com) and sign up (free tier is sufficient).

## Step 2: Create a Cognito User Pool

1. In the AWS Console, go to **Cognito** → **User Pools** → **Create user pool**.
2. **Sign-in experience:**
   - Choose **Email** as the sign-in option.
   - Leave other options as default.
3. **Security requirements:**
   - Password policy: Minimum 8 characters (or your preference).
   - MFA: Optional (recommend **Off** for simplicity).
4. **Sign-up experience:**
   - Enable **Allow users to sign themselves up**.
   - Required attributes: **email**.
   - Leave verification as **Send email message, verify email address**.
5. **Message delivery:**
   - Choose **Send email with Cognito** (uses AWS SES in sandbox; sufficient for testing).
   - For production, configure [custom email in Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html) or use SES.
6. **User pool name:** e.g. `essaybros-users`.
7. Create the pool.

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

## Notes

- **Cognito SES sandbox:** AWS sends verification emails from a default address. Recipients must be verified in SES for testing, or move out of sandbox for production.
- **Custom domain:** For branded emails in production, configure [custom email in Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html).
- **Fallback:** If Amplify is not configured, the form falls back to the Express backend (ZeptoMail) when available.
