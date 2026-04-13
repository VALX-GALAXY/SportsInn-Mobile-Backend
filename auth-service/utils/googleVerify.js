const { OAuth2Client } = require("google-auth-library");

function getGoogleClientIds() {
  const raw = process.env.GOOGLE_CLIENT_ID || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * verifyIdToken(idToken) — verifies Google id_token and returns payload.
 * GOOGLE_CLIENT_ID may be a comma-separated list so web (VITE_*) and other
 * OAuth clients can all verify tokens issued for their respective client IDs.
 */
async function verifyIdToken(idToken) {
  const clientIds = getGoogleClientIds();
  if (!clientIds.length) {
    throw new Error("GOOGLE_CLIENT_ID environment variable is not configured");
  }

  const client = new OAuth2Client();

  if (!idToken) {
    throw new Error("No idToken provided");
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientIds.length === 1 ? clientIds[0] : clientIds,
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
