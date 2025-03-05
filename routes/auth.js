require('dotenv').config();  // This loads environment variables from .env file

const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User"); // Ensure the User model path is correct

const router = express.Router();
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// MongoDB connection
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 30000, // Increase socket timeout
})
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process if MongoDB connection fails
  });

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
      // Register new user if not found
      user = new User({
        googleId: userId,
        email,
        name,
        picture,
      });

      await user.save();
      console.log("New user registered:", user);
    } else {
      console.log("User already exists:", user);
    }

    // Generate JWT Token
    const jwtToken = jwt.sign(
      { id: user.id, email, name, picture },
      JWT_SECRET,
      {
        expiresIn: "1h", // Token expiration duration
      }
    );

    console.log("JWT Token generated:", jwtToken);

    res.json({
      message: "User authenticated",
      jwt_token: jwtToken,
      user: { id: user.id, email, name, picture },
    });
  } catch (error) {
    console.error("Error in Google Login:", error);
    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

// Profile route - Protected route for user profile
router.get("/profile", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Get JWT token from authorization header

  if (!token) {
    console.error("Token not provided");
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify the token and extract user information
    const decoded = jwt.verify(token, JWT_SECRET);

    console.log("Decoded token:", decoded);

    // Fetch the user from MongoDB using the decoded user ID
    const user = await User.findById(decoded.id);

    if (!user) {
      console.error("User not found in database");
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user profile data
    console.log("User profile data:", user);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    });
  } catch (error) {
    console.error("Error in Profile route:", error);
    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

// Hello World API route
router.get("/hello-world", (req, res) => {
  res.json({ message: "Hello, World!" });
});

module.exports = router;
