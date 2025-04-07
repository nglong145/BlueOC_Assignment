const express = require("express");
const { requireToken, requireAdmin } = require("./middleware");
const { body, validationResult } = require("express-validator");
const route = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

route.use("/users", requireToken);

const JWT_SECRET = process.env.JWT_SECRET;

// Login
route.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      message: "username or password empty",
    });
  }
  const loginUser = users.find((user) => user.email === email);
  if (!loginUser) {
    return res.status(400).json({
      message: "username or password invalid",
    });
  }
  const isValid = bcrypt.compareSync(password, loginUser.password);
  if (!isValid) {
    return res.status(400).json({
      message: "username or password invalid",
    });
  }

  const token = jwt.sign(
    {
      id: loginUser.id,
      email: loginUser.email,
      role: loginUser.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ message: "Login Successful!", token });
});

module.exports = route;
