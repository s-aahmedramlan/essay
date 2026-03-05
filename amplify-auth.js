/**
 * Amplify Auth integration for Essay Bros
 * Uses AWS Cognito for sign-up, email verification (code), and sign-in.
 * Config is inline so it always loads; also respects window.AMPLIFY_CONFIG if set.
 */
(function () {
  var inlineConfig = {
    Auth: {
      Cognito: {
        userPoolId: "us-east-2_mE9j7A8G8",
        userPoolClientId: "2hmt806ccp2i8hlqdgfhuqfm93",
        loginWith: { email: true },
        signUpVerificationMethod: "code",
        userAttributes: { email: { required: true } },
        passwordFormat: { minLength: 8 },
      },
    },
  };
  var fromWindow = window.AMPLIFY_CONFIG && window.AMPLIFY_CONFIG.Auth && window.AMPLIFY_CONFIG.Auth.Cognito && window.AMPLIFY_CONFIG.Auth.Cognito.userPoolId && window.AMPLIFY_CONFIG.Auth.Cognito.userPoolId !== "YOUR_USER_POOL_ID";
  var config = fromWindow ? window.AMPLIFY_CONFIG : inlineConfig;
  if (!config.Auth.Cognito.userPoolId || config.Auth.Cognito.userPoolId === "YOUR_USER_POOL_ID") {
    window.amplifyAuthReady = Promise.resolve(false);
    window.AmplifyAuth = {
      isConfigured: () => false,
      signUp: () => Promise.reject(new Error("Amplify not configured. Edit amplify-config.js with your Cognito credentials.")),
      confirmSignUp: () => Promise.reject(new Error("Amplify not configured.")),
      signIn: () => Promise.reject(new Error("Amplify not configured.")),
      signOut: () => Promise.resolve(),
      getCurrentUser: () => Promise.resolve(null),
    };
    return;
  }

  let amplifyConfigured = false;

  var AMPLIFY_CDN = "https://esm.run/aws-amplify@6.15.10";

  async function init() {
    if (amplifyConfigured) return true;
    const { Amplify } = await import(AMPLIFY_CDN);
    Amplify.configure(config);
    amplifyConfigured = true;
    return true;
  }

  window.amplifyAuthReady = init();

  window.AmplifyAuth = {
    isConfigured: function () { return !!(config && config.Auth && config.Auth.Cognito && config.Auth.Cognito.userPoolId && config.Auth.Cognito.userPoolId !== "YOUR_USER_POOL_ID"); },

    async signUp(email, password) {
      await init();
      const auth = await import(AMPLIFY_CDN + "/auth");
      const signUpFn = auth.signUp || (auth.default && auth.default.signUp);
      if (typeof signUpFn !== "function") throw new Error("Sign-up not available.");
      return signUpFn({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
    },

    async confirmSignUp(email, code) {
      await init();
      const auth = await import(AMPLIFY_CDN + "/auth");
      const fn = auth.confirmSignUp || (auth.default && auth.default.confirmSignUp);
      if (typeof fn !== "function") throw new Error("Verification not available. Try again or contact support.");
      return fn({ username: email, confirmationCode: code });
    },

    async resendConfirmationCode(email) {
      await init();
      const auth = await import(AMPLIFY_CDN + "/auth");
      const fn = auth.resendSignUpCode || (auth.default && auth.default.resendSignUpCode);
      if (typeof fn !== "function") throw new Error("Resend not available. Try again in a minute.");
      return fn({ username: email });
    },

    async signIn(email, password) {
      await init();
      const auth = await import(AMPLIFY_CDN + "/auth");
      const fn = auth.signIn || (auth.default && auth.default.signIn);
      if (typeof fn !== "function") throw new Error("Sign-in not available.");
      return fn({ username: email, password });
    },

    async signOut() {
      if (!amplifyConfigured) return;
      const auth = await import(AMPLIFY_CDN + "/auth");
      const fn = auth.signOut || (auth.default && auth.default.signOut);
      if (typeof fn === "function") await fn();
    },

    async getCurrentUser() {
      if (!amplifyConfigured) return null;
      try {
        const auth = await import(AMPLIFY_CDN + "/auth");
        const fn = auth.getCurrentUser || (auth.default && auth.default.getCurrentUser);
        return typeof fn === "function" ? await fn() : null;
      } catch {
        return null;
      }
    },

    /** Returns the Cognito ID token for calling /api/access (paid-status check). */
    async getIdToken() {
      if (!amplifyConfigured) return null;
      try {
        const auth = await import(AMPLIFY_CDN + "/auth");
        const fn = auth.fetchAuthSession || (auth.default && auth.default.fetchAuthSession);
        if (typeof fn !== "function") return null;
        const session = await fn();
        const token = session?.tokens?.idToken?.toString();
        return token || null;
      } catch {
        return null;
      }
    },
  };
})();
