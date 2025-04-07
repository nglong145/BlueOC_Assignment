const express = require("express");
const { requireToken, requireAdmin } = require("../middleware");
const { body, validationResult } = require("express-validator");
const route = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pgPool = require("../db/initDB");
const dalUser = require("../DAL/user")(pgPool);

const JWT_SECRET = process.env.JWT_SECRET;

route.post(
  "/",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").notEmpty().isEmail().withMessage("Email must be valid"),
    body("password")
      .notEmpty()
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  (req, res) => {
    const { name, email, password, role } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    bcrypt.hash(password, 12, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: "Error hashing password" });
      }

      dalUser.addUser(
        { name, email, password: hashedPassword, role },
        function (error, newUser) {
          if (error) {
            return res.status(500).json({ message: "Internal Server Error" });
          }
          return res.status(201).json(newUser);
        }
      );
    });
  }
);

route.put(
  "/:id",
  requireAdmin,
  [
    body("name").optional({ checkFalsy: true }),
    body("email").optional({ checkFalsy: true }).isEmail(),
    body("password")
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role").optional({ checkFalsy: true }).isIn(["user", "admin"]),
  ],
  (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const { name, email, password, role } = req.body;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    bcrypt.hash(password, 12, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: "Error hashing password" });
      }

      dalUser.updateUser(
        userId,
        { name, email, password: hashedPassword, role },
        function (error, updatedUser) {
          if (error) {
            return res.status(500).json({ message: "Internal Server Error" });
          }
          return res.status(200).json(updatedUser);
        }
      );
    });
  }
);

route.delete("/:id", requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  dalUser.deleteUser(userId, function (error, deletedUser) {
    if (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(200).json({
      message: "User deleted successfully",
      userId: deletedUser.user_id,
    });
  });
});

route.get("/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  dalUser.getUserById(userId, function (error, user) {
    if (error) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json(user);
  });
});

route.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email or password is missing.",
    });
  }

  dalUser.getUserByEmail(email, function (error, user) {
    if (error) {
      // Nếu lỗi, trả về thông báo tài khoản không tồn tại
      return res.status(400).json({ message: "Invalid email or password" });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(400).json({
          message: "Invalid email or password",
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      return res.status(200).json({ message: "Login Successful", token });
    });
  });
});

module.exports = route;
