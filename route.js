const express = require("express");
const { requireToken, requireAdmin } = require("./middleware");
const { body, validationResult } = require("express-validator");
const route = express.Router();
const bcrypt = require("bcrypt");
const JWT_SECRET = "Hello";
const jwt = require("jsonwebtoken");

route.use("/users", requireToken);

let users = [
  {
    id: 1,
    name: "david",
    email: "david12@gmail.com",
    password: "$2a$12$oiPP0LNE6Uln2yYK7Nskl.PpF2BCMM3fBHrvHQMcJZSUT5sKEkhPm",
    role: "admin",
  },
  {
    id: 2,
    name: "john",
    email: "john1@gmail.com",
    password: "$2a$12$oWf4VYJ185ovamLvO0Piyu.hWORUsSDnLNJffeHMeRHTsp5THysXe",
    role: "user",
  },
];

// Add new user
route.post(
  "/users",
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

    if (users.some((user) => user.email === email)) {
      return res.status(400).json({ message: "Email already exists" });
    }

    let userId = users.length + 1;
    const hashedPassword = bcrypt.hashSync(password, 12);
    const newUser = {
      id: userId,
      name,
      email,
      password: hashedPassword,
      role: "user",
    };
    users.push(newUser);
    return res.status(200).json(users);
  }
);

// Get list users
route.get("/users", (req, res) => {
  if (!users || !users.length) {
    return res.status(404).json({ message: "No users found" });
  }
  return res.status(200).json(users);
});

// Get user by Id
route.get("/users/:id", (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid user ID. ID must be a number." });
  }
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found. Please try again!" });
  }

  return res.status(200).json(user);
});

// Update user
route.put(
  "/users/:id",
  requireAdmin,
  [
    body("name").optional({ checkFalsy: true }),
    body("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Email must be valid")
      .custom((value, { req }) => {
        const existingUser = users.find(
          (user) => user.email === value && user.id !== parseInt(req.params.id)
        );
        if (existingUser) {
          throw new Error("Email already in use");
        }
        return true;
      }),
    body("password")
      .optional({ checkFalsy: true })
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
    body("role")
      .optional({ checkFalsy: true })
      .isIn(["user", "admin"])
      .withMessage('Role must be either "user" or "admin"'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid user ID. ID must be a number." });
    }

    const { name, email, password, role } = req.body;

    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({
        message: "user not found. PleaseTry again!",
      });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    const updatedUser = {
      id: userId,
      name: name || users[userIndex].name,
      email: email || users[userIndex].email,
      password: hashedPassword || users[userIndex].password,
      role: role || users[userIndex].role,
    };

    users[userIndex] = updatedUser;
    return res.status(200).json(updatedUser);
  }
);

// Delete user
route.delete("/users/:id", requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id, 10);
  if (isNaN(userId)) {
    return res
      .status(400)
      .json({ message: "Invalid user ID. ID must be a number." });
  }

  const userIndex = users.findIndex((u) => u.id === userId);
  if (userIndex === -1) {
    return res.status(404).json({
      message: "user not found. Please Try again!",
    });
  }

  users.splice(userIndex, 1);
  return res.status(200).json({ message: "Delete successful" });
});

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
      password: loginUser.password,
      role: loginUser.role,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  return res.status(200).json({ message: "Login Successful!", token });
});

module.exports = route;
