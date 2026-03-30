const { OAuth2Client } = require("google-auth-library");

/**
 * verifyIdToken(idToken) — verifies Google id_token and returns payload.
 */
async function verifyIdToken(idToken) {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not configured");
  }

  const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  if (!idToken) {
    throw new Error("No idToken provided");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new Error("Failed to extract payload from Google token");
    }

    return payload;
  } catch (error) {
    if (error.message.includes("Token used too late")) {
      throw new Error("Google token has expired. Please try signing in again.");
    }
    if (error.message.includes("Invalid token")) {
      throw new Error("Invalid Google token format. Please try signing in again.");
    }
    if (error.message.includes("audience")) {
      throw new Error(
        "Token validation failed: Invalid application. Please ensure you're using the correct Google Sign-In button."
      );
    }
    throw error;
  }
}

module.exports = { verifyIdToken };
