require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth"); // Import the auth route

const app = express();
app.use(express.json());

// Debugging: Check if MONGO_URI is loaded correctly
console.log("Mongo URI:", process.env.MONGO_URI);

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined! Check your .env file.");
  process.exit(1);
}

// Disable COOP Policy
app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
  })
);

// Enable CORS
const corsOptions = {
  origin: ["http://localhost:3000", "https://oauthfrt.vercel.app"], // Add allowed frontend domains
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // 30 sec wait before timeout
  socketTimeoutMS: 30000, // 30 sec wait before timeout
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ Error connecting to MongoDB:", err.message);
    process.exit(1);
  });

// Use authentication routes
app.use("/auth", authRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
