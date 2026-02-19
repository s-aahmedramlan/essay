/**
 * Amplify Auth Configuration (Cognito)
 *
 * SETUP: Edit the values below after creating a Cognito User Pool in AWS Console.
 * See AMPLIFY_SETUP.md for step-by-step instructions.
 */
window.AMPLIFY_CONFIG = {
  Auth: {
    Cognito: {
      userPoolId: "YOUR_USER_POOL_ID",
      userPoolClientId: "YOUR_CLIENT_ID",
      loginWith: { email: true },
      signUpVerificationMethod: "code",
      userAttributes: { email: { required: true } },
      passwordFormat: { minLength: 8 },
    },
  },
};
