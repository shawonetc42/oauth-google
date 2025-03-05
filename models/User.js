const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true }, // For Google OAuth
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePicture: { type: String }, // Optional: Profile Picture URL
});

module.exports = mongoose.model("User", userSchema);
