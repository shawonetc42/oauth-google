require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth"); // Import the auth route

const app = express();
app.use(express.json());

// Allow all origins (can be restricted for production)
app.use(cors({ origin: "*", credentials: true }));

app.use(cors(corsOptions)); // Enable CORS with the specified options

const MONGO_URI = process.env.MONGO_URI; // MongoDB URI

// Connect to MongoDB
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("Error connecting to MongoDB:", err));

// Use the authentication routes
app.use("/auth", authRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));
