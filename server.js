const express = require("express");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

const router = require("./route");

app.use(express.json());
app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});

app.use("/api/v1", router);
