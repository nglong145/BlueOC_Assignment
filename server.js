const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello, I'm Long");
});

app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});
