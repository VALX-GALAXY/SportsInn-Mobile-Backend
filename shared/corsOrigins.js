/** Always allowed (union with ALLOWED_ORIGINS) so prod .env that only lists localhost still allows the live site. */
const DEFAULT_ALLOWED_ORIGINS =
  "http://localhost:5173,http://localhost:3000,https://sportsinn.co,https://www.sportsinn.co";

function splitOrigins(s) {
  if (!s || typeof s !== "string") return [];
  return s.split(",").map((x) => x.trim()).filter(Boolean);
}

function parseAllowedOrigins(raw) {
  const fromEnv = splitOrigins(raw);
  const defaults = splitOrigins(DEFAULT_ALLOWED_ORIGINS);
  return [...new Set([...defaults, ...fromEnv])];
}

module.exports = { parseAllowedOrigins, DEFAULT_ALLOWED_ORIGINS };
