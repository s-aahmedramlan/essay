const statusMessages = {
    "verify-sent": "Check your email for a 6-digit code, then enter it on the verify page.",
    "verify-required": "Please verify your email with the 6-digit code before logging in.",
    "verified": "Email verified. You can log in now.",
    "invalid-login": "Incorrect email or password.",
    "account-exists": "Account already exists. Log in instead.",
    "invalid": "Please enter a valid email and password (8+ chars).",
    "invalid-token": "That verification link is invalid or expired.",
    "already-verified": "Your email is already verified. Log in below.",
    "login-required": "Log in to access the course.",
    "server-error": "Something went wrong. Please try again.",
    "email-failed": "We couldn't send the verification email. Check that ZEPTOMAIL_TOKEN and ZEPTOMAIL_FROM_EMAIL are set in .env and your sender is verified in ZeptoMail.",
    "login-required": "Please log in to access the course dashboard."
};

const params = new URLSearchParams(window.location.search);
const status = params.get("status");
const message = status ? statusMessages[status] : null;

if (message) {
    const box = document.querySelector(".auth-message");
    if (box) {
        box.textContent = message;
        box.classList.add("visible");
    }
}
