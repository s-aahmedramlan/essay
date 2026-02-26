/**
 * Amplify Auth Configuration (Cognito)
 *
 * SETUP: Edit the values below after creating a Cognito User Pool in AWS Console.
 * See AMPLIFY_SETUP.md for step-by-step instructions.
 */
window.AMPLIFY_CONFIG = {
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
