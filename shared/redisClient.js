const redis = require("redis");

let client;

function getClient() {
  if (client) return client;
  const url = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || 6379}`;
  client = redis.createClient({ url });

  client.on("error", (err) => {
    console.error("Redis error:", err && err.message ? err.message : err);
  });

  client.connect().catch((err) => {
    console.error("Redis connect error:", err && err.message ? err.message : err);
  });

  return client;
}

async function get(key) {
  try {
    const c = getClient();
    if (!c) return null;
    const v = await c.get(key);
    return v ? JSON.parse(v) : null;
  } catch (err) {
    console.error("Redis GET error:", err && err.message ? err.message : err);
    return null;
  }
}

async function setEx(key, seconds, value) {
  try {
    const c = getClient();
    if (!c) return;
    await c.setEx(key, seconds, JSON.stringify(value));
  } catch (err) {
    console.error("Redis SETEX error:", err && err.message ? err.message : err);
  }
}

async function del(keyOrKeys) {
  try {
    const c = getClient();
    if (!c) return;
    if (Array.isArray(keyOrKeys)) {
      if (keyOrKeys.length === 0) return;
      await c.del(...keyOrKeys);
    } else {
      await c.del(keyOrKeys);
    }
  } catch (err) {
    console.error("Redis DEL error:", err && err.message ? err.message : err);
  }
}

module.exports = { get, setEx, del, getClient };
