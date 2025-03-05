const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User"); // Ensure the User model path is correct

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 40000, // Increase timeout to 30 seconds
  socketTimeoutMS: 40000, // Increase socket timeout
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Google login route
router.post("/google", async (req, res) => {
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

    // Check if user already exists in the database
    let user = await User.findOne({ googleId: userId });

    if (!user) {
      // Register new user
      user = new User({
        googleId: userId,
        email,
        name,
        picture,
      });

      await user.save();
    }

    // Generate JWT Token
    const jwtToken = jwt.sign({ id: user.id, email, name, picture }, JWT_SECRET, {
      expiresIn: "1h", // Modify the duration if needed
    });

    res.json({
      message: "User authenticated",
      jwt_token: jwtToken,
      user: { id: user.id, email, name, picture },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

// Profile route
router.get("/profile", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Get the JWT token from the authorization header

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify the token and extract user information
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch the user from MongoDB using the decoded user ID
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user profile data
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

// Hello World API route
router.get("/hello-world", (req, res) => {
  res.json({ message: "Hello, World!" });
});

module.exports = router;
