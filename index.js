// require("dotenv").config();
// const express = require("express");
// const passport = require("passport");
// const session = require("express-session");
// const mongoose = require("mongoose");
// const cors = require("cors");

// const passportConfig = require("./config/passportConfig");
// const mongoConfig = require("./config/mongoConfig");
// const authRoutes = require("./routes/authRoutes");

// const app = express();

// // Add CORS middleware
// app.use(
//   cors({
//     origin: ["http://localhost:3001", "http://localhost:3000"], // Replace with your allowed origins
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true, // Allow cookies to be sent with requests
//   })
// );

// app.use(
//   session({
//     secret: "secret",
//     resave: false,
//     saveUninitialized: true,
//   })
// );

// app.use(passport.initialize());
// app.use(passport.session());

// app.use("/", authRoutes); // Use the auth routes

// app.listen(3000, () => {
//   console.log("Server running at http://localhost:3000");
// });
