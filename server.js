const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();
const { ExtractJwt, Strategy } = passportJWT;
const userService = require("./user-service.js");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());
app.use(passport.initialize());

passport.use(
  new Strategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("JWT"),
      secretOrKey: process.env.JWT_SECRET,
    },
    (jwtPayload, done) => {
      if (!jwtPayload) {
        return done(null, false);
      }
      return done(null, jwtPayload);
    }
  )
);

app.post("/api/user/register", async (req, res) => {
  try {
    await userService.registerUser(req.body).then((result) => {
      res.json({
        message: result,
      });
    });
  } catch (err) {
    res.status(422).json({
      message: err,
    });
  }
});

app.post("/api/user/login", async (req, res) => {
  try {
    await userService.checkUser(req.body).then((user) => {
      if (user) {
        const payload = {
          _id: user._id,
          username: user.userName,
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
          expiresIn: "3d",
        });
        res.json({
          message: "Login Successful",
          token: token,
        });
      }
    });
  } catch (err) {
    res.status(422).json({
      message: err,
    });
  }
});

app.get(
  "/api/user/favourites",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await userService.getFavourites(req.user._id).then((favourites) => {
        res.json(favourites);
      });
    } catch (err) {
      res.json({
        error: err,
      });
    }
  }
);

app.put(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await userService
        .addFavourite(req.user._id, req.params.id)
        .then((favourites) => {
          res.json(favourites);
        });
    } catch (err) {
      res.json({
        error: err,
      });
    }
  }
);

app.delete(
  "/api/user/favourites/:id",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    try {
      await userService
        .removeFavourite(req.user._id, req.params.id)
        .then((favourites) => {
          res.json(favourites);
        });
    } catch (err) {
      res.json({
        error: err,
      });
    }
  }
);

userService
  .connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
