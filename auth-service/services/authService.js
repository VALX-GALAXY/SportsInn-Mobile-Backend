const bcrypt = require("bcrypt");
const path = require("path");
const User = require("../models/userModel");
const { generateTokens, verifyRefreshToken } = require(path.join(__dirname, "../../shared/jwtUtils"));
const { validateSignup } = require(path.join(__dirname, "../../shared/validation"));

const refreshQueue = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [userId, promise] of refreshQueue.entries()) {
    if (promise._timestamp && now - promise._timestamp > 300000) {
      refreshQueue.delete(userId);
    }
  }
}, 300000);

async function signup(body) {
  const error = validateSignup(body);
  if (error) return { error };

  const existing = await User.findOne({ email: body.email });
  if (existing) return { error: "Email already exists" };

  const { gender = "Prefer not to say", sport, cricketRole } = body;
  const passwordHash = await bcrypt.hash(body.password, 10);

  const userData = { ...body, passwordHash, gender, sport, cricketRole: sport === "Cricket" ? cricketRole : undefined };
  const user = new User(userData);
  await user.save();

  return { user: { id: user._id, _id: user._id, email: user.email, role: user.role, name: user.name } };
}

async function login(body) {
  const { email, password } = body;
  const user = await User.findOne({ email });
  if (!user) return { error: "Invalid email or password" };
  if (!user.passwordHash) return { error: "Account registered via social login. Use Google sign-in or set a password." };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { error: "Invalid email or password" };

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokens.push(refreshToken);
  await user.save();

  return { accessToken, refreshToken, user: { id: user._id, _id: user._id, email: user.email, role: user.role, name: user.name } };
}

async function adminSignup(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) return { error: "Admin already exists" };

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const userData = {
    name: data.name,
    email: data.email,
    passwordHash: hashedPassword,
    role: "admin",
    isAdmin: true,
    adminType: data.adminType,
  };
  const user = await User.create(userData);
  const tokens = generateTokens(user);
  return {
    user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin, adminType: user.adminType || null },
    ...tokens,
  };
}

async function adminLogin({ email, password }) {
  const user = await User.findOne({ email, isAdmin: true });
  if (!user) return { error: "Invalid admin credentials" };
  if (!user.passwordHash) return { error: "Admin account has no password set." };

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) return { error: "Invalid admin credentials" };

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  return {
    user: { id: user._id, _id: user._id, name: user.name, email: user.email, role: user.role, isAdmin: user.isAdmin, adminType: user.adminType || null },
    accessToken,
    refreshToken,
  };
}

async function refresh(refreshToken) {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) return { error: "Invalid refresh token" };

  const userId = payload.id;
  if (refreshQueue.has(userId)) {
    try {
      return await refreshQueue.get(userId);
    } catch (error) {
      refreshQueue.delete(userId);
    }
  }

  const refreshPromise = performTokenRefresh(refreshToken, userId);
  refreshPromise._timestamp = Date.now();
  refreshQueue.set(userId, refreshPromise);

  try {
    return await refreshPromise;
  } finally {
    refreshQueue.delete(userId);
  }
}

async function performTokenRefresh(refreshToken, userId) {
  const user = await User.findById(userId);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new Error("Invalid refresh token");
  }

  const { accessToken, refreshToken: newRefresh } = generateTokens(user);
  user.refreshTokens = user.refreshTokens.filter((rt) => rt !== refreshToken);
  user.refreshTokens.push(newRefresh);
  await user.save();

  return { accessToken, refreshToken: newRefresh };
}

async function logout(refreshToken) {
  if (!refreshToken || typeof refreshToken !== "string" || !refreshToken.trim()) {
    return { success: true };
  }

  const user = await User.findOne({ refreshTokens: refreshToken });
  if (user) {
    user.refreshTokens = user.refreshTokens.filter((rt) => rt !== refreshToken);
    await user.save();
  }
  return { success: true };
}

async function loginWithGoogle({ googleId, email, name, picture, role, gender, sport, cricketRole }) {
  if (!email) return { error: "Email missing from Google profile" };

  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (!user) {
    if (!sport) return { error: "Sport is required for registration" };
    if (sport === "Cricket" && !cricketRole) return { error: "Cricket role is required when sport is Cricket" };
    if (cricketRole && !["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"].includes(cricketRole)) {
      return { error: "Invalid cricket role" };
    }

    const newUser = {
      name: name || email.split("@")[0],
      email,
      role: role || "player",
      profilePic: picture || "",
      googleId,
      gender: gender || "Prefer not to say",
      sport,
      cricketRole: sport === "Cricket" ? cricketRole : undefined,
      age: 18,
      playingRole: sport === "Cricket" ? cricketRole : "Player",
    };

    try {
      user = await User.create(newUser);
    } catch (error) {
      return { error: "Failed to create user. Please try again." };
    }
  } else {
    if (!user.googleId) {
      user.googleId = googleId;
      if (!user.profilePic && picture) user.profilePic = picture;
      if (gender) user.gender = gender;
      if (sport) {
        user.sport = sport;
        user.cricketRole = sport === "Cricket" ? cricketRole : undefined;
      }
      await user.save();
    }
  }

  const { accessToken, refreshToken } = generateTokens(user);
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push(refreshToken);
  await user.save();

  return {
    accessToken,
    refreshToken,
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profilePic: user.profilePic,
      gender: user.gender,
      sport: user.sport,
      cricketRole: user.cricketRole,
      age: user.age,
      playingRole: user.playingRole,
      bio: user.bio || "",
      stats: user.stats || { matches: 0, runs: 0, wickets: 0 },
    },
  };
}

module.exports = { signup, login, adminSignup, adminLogin, refresh, logout, loginWithGoogle };
