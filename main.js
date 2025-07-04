require("dotenv").config();
//#region express configures
var express = require("express");
var path = require("path");
var logger = require("morgan");
const session = require("client-sessions");
const DButils = require("./routes/utils/DButils");
var cors = require('cors')

var app = express();
app.use(logger("dev")); //logger
app.use(express.json()); // parse application/json
app.use(
  session({
    cookieName: "session", // the cookie key name
    secret: process.env.COOKIE_SECRET, // the encryption key
    duration: parseInt(process.env.SESSION_DURATION), // expired after session duration
    activeDuration: parseInt(process.env.ACTIVE_DURATION), // if expiresIn < activeDuration,
    cookie: {
      httpOnly: true, // Prevent JavaScript access to the cookie
      secure: process.env.NODE_ENV === 'production', // Only send cookie over HTTPS in production
      sameSite: 'strict', // Protect against CSRF
      maxAge: parseInt(process.env.SESSION_DURATION) // Explicitly set max age
    }
  })
);
app.use(express.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, "public"))); //To serve static files such as images, CSS files, and JavaScript files
//local:
//app.use(express.static(path.join(__dirname, "dist")));
//remote:
app.use(express.static(path.join(__dirname, '../assignment3-3-209124361_208883991_assignment2/dist')));
app.get("/",function(req,res)
{ 
  //remote: 
  res.sendFile(path.join(__dirname, '../assignment3-2-209124361_208883991_assignment2/index.html'));
  //local:
  //res.sendFile(__dirname+"/index.html");
});

// Configure CORS
const corsConfig = {
  origin: 'http://localhost:8080', // Frontend URL
  credentials: true
};

app.use(cors(corsConfig));
app.options("*", cors(corsConfig));

var port = process.env.PORT || "3000"; //local=3000 remote=80
//#endregion
const user = require("./routes/user");
const recipes = require("./routes/recipes");
const auth = require("./routes/auth");
const userRecipes = require("./routes/userRecipes");


//#region cookie middleware
app.use(function (req, res, next) {
  if (req.session && req.session.user_id) {
    DButils.execQuery("SELECT user_id FROM users")
      .then((users) => {
        if (users.find((x) => x.user_id === req.session.user_id)) {
          req.user_id = req.session.user_id;
        }
        next();
      })
      .catch((error) => next());
  } else {
    next();
  }
});
//#endregion

// ----> For cheking that our server is alive
app.get("/alive", (req, res) => res.send("I'm alive"));

// Routings
app.use("/users", user);
app.use("/recipes", recipes);
app.use("/", auth);
app.use("/userRecipes", userRecipes);






// Default router
app.use(function (err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).send({ message: err.message, success: false });
});

// const server = app.listen(port, () => {
//   console.log(`Server listening on port ${port}`);
// });

// process.on("SIGINT", function () {
//   if (server) {
//     server.close(() => console.log("server closed"));
//   }
//   process.exit();
// });

module.exports = app;
