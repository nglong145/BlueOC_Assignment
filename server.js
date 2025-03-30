const express = require("express");
const app = express();

const router = require("./route");
app.use(express.json());
app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});

app.use("/api/v1", router);
