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

  console.log("Received token:", token);  // Log the received token for debugging

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const userId = payload.sub;
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    console.log("User Info:", { userId, email, name, picture });  // Log the user info from Google

    // Check if user already exists in the database
    let user = await User.findOne({ googleId: userId });

    if (!user) {
      console.log("User not found, creating new user...");

      // Register new user
      user = new User({
        googleId: userId,
        email,
        name,
        picture,
      });

      await user.save();
      console.log("New user created:", user);
    }

    // Generate JWT Token
    const jwtToken = jwt.sign({ id: user.id, email, name, picture }, JWT_SECRET, {
      expiresIn: "1h", // Modify the duration if needed
    });

    console.log("JWT Token generated:", jwtToken);  // Log the JWT Token

    res.json({
      message: "User authenticated",
      jwt_token: jwtToken,
      user: { id: user.id, email, name, picture },
    });
  } catch (error) {
    console.error("Error during Google authentication:", error);  // Log the error

    if (error.response) {
      // If there's a response from Google API
      console.error("Google API Error:", error.response.data);
    }

    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

// Profile route
router.get("/profile", async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Get the JWT token from the authorization header

  console.log("Received token in profile route:", token);  // Log the token for debugging

  if (!token) {
    console.log("No token provided");  // Log if token is missing
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // Verify the token and extract user information
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Decoded JWT Token:", decoded);  // Log the decoded token for debugging

    // Fetch the user from MongoDB using the decoded user ID
    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("User not found");  // Log if user is not found in DB
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
    console.error("Error during profile retrieval:", error);  // Log the error

    if (error instanceof jwt.JsonWebTokenError) {
      console.error("JWT Error:", error.message);
    }

    res.status(400).json({ error: "Invalid token", message: error.message });
  }
});

// Hello World API route
router.get("/hello-world", (req, res) => {
  res.json({ message: "Hello, World!" });
});

module.exports = router;
