const express = require("express");
const session = require("client-sessions");
const cookieParser = require("cookie-parser");

const cors = require('cors');
const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth     = require("./routes/auth");

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(cookieParser());

app.use((req, _res, next) => {
      if ((!req.session || !req.session.user_id) && req.cookies && req.cookies.session) {
        try { req.session = JSON.parse(req.cookies.session); } catch (_) { /* ignore */ }
      }
      next();
    });

// Session configuration
app.use(
  session({
    cookieName: "session",
    secret: "template",
    duration: 24 * 60 * 60 * 1000,
    activeDuration: 1000 * 60 * 5,
    cookie: {
      httpOnly: false,
    }
  })
);

// Routes
app.use("/", auth);
app.use("/users", user);
app.use("/recipes", recipes);

module.exports = app; 