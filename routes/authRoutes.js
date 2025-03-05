const express = require("express");
const router = express.Router();
const passport = require("passport");

// Protected route to get user profile
router.get("/profile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  res.json({
    message: "User profile retrieved successfully",
    user: req.user, // User data from session
  });
});

// Google OAuth login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:3001/profile"); // Redirect to profile after login
  }
);

// Logout route
router.get("/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/"); // Redirect to homepage after logout
  });
});

module.exports = router;
