require("dotenv").config();
const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser"); // Cookie support
const User = require("./models/User");

const app = express();
app.use(express.json());
app.use(cookieParser());

// CORS setup with specific frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true, // Allow cookies
}));

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    let user = await User.findOne({ googleId: userId });

    if (!user) {
      user = new User({ googleId: userId, email, name, picture });
      await user.save();
    }

    // Generate JWT Token
    const jwtToken = jwt.sign(
      { id: user.id, email, name, picture },
      JWT_SECRET,
      { expiresIn: "7d" } // Extend expiration
    );

    // Set token in cookie (more secure)
    res.cookie("token", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: "User authenticated",
      user: { id: user.id, email, name, picture },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

app.get("/profile", async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: { id: user.id, email: user.email, name: user.name, picture: user.picture },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("token", { httpOnly: true, secure: process.env.NODE_ENV === "production" });
  res.json({ message: "Logged out" });
});

app.listen(5000, () => console.log("🚀 Server running on port 5000"));
