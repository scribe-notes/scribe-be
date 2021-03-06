const express = require("express");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protected = require("./protected");

const checkFields = require("../util/checkFields");

const router = express.Router();

// Create user
router.post("/users/", (req, res) => {
  const requiredFields = ["username", "email", "password"];

  const error = checkFields(requiredFields, req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  if (!req.body.password || req.body.password.length < 8) {
    return res
      .status(400)
      .json({
        message: "Password is required and must be at least 8 characters long"
      });
  }

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 12)
  });

  // Check if user already exists
  User.findOne({ username: user.username })
    .then(res => {
      if (res) throw new Error("A user with that username already exists!");
      else return User.findOne({email: user.email});
    })
    .then(res => {
      if (res) throw new Error("A user with that email address already exists!");
      else return user.save();
    })
    .then(user => {
      // Authenticate user on sign up for immediate login
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
      // Formulate response
      const response = { ...user._doc, _id: user.id, token };
      delete response.password;

      return res.status(201).json(response);
    })
    .catch(err => {
      return res.status(500).json({ message: err.message });
    });
});

// Authenticate user
router.post("/login", (req, res) => {
  if (!req.body.username || !req.body.username.trim()) {
    return res
      .status(400)
      .json({ message: "Please provide a valid username to log in!" });
  }
  if (!req.body.password) {
    return res
      .status(400)
      .json({ message: "Please provide a valid password to log in!" });
  }

  User.findOne({ username: req.body.username })
    .then(doc => {
      if (!doc) throw new Error("A user with that username does not exist");
      else {
        const user = doc._doc;
        if (bcrypt.compareSync(req.body.password, user.password)) {
          const response = {
            ...user,
            _id: doc.id,
            token: jwt.sign({ id: doc.id }, process.env.JWT_SECRET)
          };
          delete response.password;
          return res.status(200).json(response);
        } else throw new Error("Incorrect password");
      }
    })
    .catch(err => {
      return res.status(500).json({ message: err.message });
    });
});

// Refresh user
router.get("/refresh", protected, async (req, res) => {
  try {
    const response = await User.findById(req.user.id);

    delete response.password;

    if (!response) throw new Error("User not found!");

    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
