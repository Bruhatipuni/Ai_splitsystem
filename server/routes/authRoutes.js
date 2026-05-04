const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const users = []; // temp

router.post("/register", (req, res) => {
  users.push(req.body);
  res.json({ msg: "Registered" });
});

router.post("/login", (req, res) => {
  const user = users.find(
    (u) =>
      u.email === req.body.email &&
      u.password === req.body.password
  );

  if (!user) return res.status(400).json({ msg: "Invalid" });

  const token = jwt.sign(user, "secret");

  res.json({ token, user });
});

module.exports = router;