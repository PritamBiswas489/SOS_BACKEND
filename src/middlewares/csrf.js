import { doubleCsrf } from "csrf-csrf";

const { generateCsrfToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || "your-secret-32-chars-minimum!!",

  getSessionIdentifier: (req) => req.session.id,  // required in v4

  cookieName: "csrf-token",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },

  // removed getTokenFromRequest — v4 reads header automatically
  // default header it looks for is "x-csrf-token"
});

export { generateCsrfToken, doubleCsrfProtection };