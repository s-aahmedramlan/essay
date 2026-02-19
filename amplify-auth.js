/**
 * Amplify Auth integration for Essay Bros
 * Uses AWS Cognito for sign-up, email verification (code), and sign-in.
 */
(function () {
  const config = window.AMPLIFY_CONFIG;
  if (!config || !config.Auth?.Cognito?.userPoolId || config.Auth.Cognito.userPoolId === "YOUR_USER_POOL_ID") {
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

  async function init() {
    if (amplifyConfigured) return true;
    const { Amplify } = await import("https://esm.run/aws-amplify");
    Amplify.configure(config);
    amplifyConfigured = true;
    return true;
  }

  window.amplifyAuthReady = init();

  window.AmplifyAuth = {
    isConfigured: () => !!config?.Auth?.Cognito?.userPoolId && config.Auth.Cognito.userPoolId !== "YOUR_USER_POOL_ID",

    async signUp(email, password) {
      await init();
      const { signUp } = await import("https://esm.run/aws-amplify/auth");
      const result = await signUp({
        username: email,
        password,
        options: { userAttributes: { email } },
      });
      return result;
    },

    async confirmSignUp(email, code) {
      await init();
      const { confirmSignUp } = await import("https://esm.run/aws-amplify/auth");
      return confirmSignUp({ username: email, confirmationCode: code });
    },

    async resendConfirmationCode(email) {
      await init();
      const { resendSignUpCode } = await import("https://esm.run/aws-amplify/auth");
      return resendSignUpCode({ username: email });
    },

    async signIn(email, password) {
      await init();
      const { signIn } = await import("https://esm.run/aws-amplify/auth");
      return signIn({ username: email, password });
    },

    async signOut() {
      if (!amplifyConfigured) return;
      const { signOut } = await import("https://esm.run/aws-amplify/auth");
      await signOut();
    },

    async getCurrentUser() {
      if (!amplifyConfigured) return null;
      try {
        const { getCurrentUser } = await import("https://esm.run/aws-amplify/auth");
        return await getCurrentUser();
      } catch {
        return null;
      }
    },
  };
})();
