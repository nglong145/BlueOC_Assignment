const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const userRoutes = require("./routes/user.route");
const bookRoutes = require("./routes/book.route");
const borrowingHistoryRoutes = require("./routes/borrowingHistory.route");
const { requireToken } = require("./middleware");

const app = express();

app.use(express.json());
app.use("/api/users", requireToken, userRoutes);
app.use("/api/books", requireToken, bookRoutes);
app.use("/api/analytics", requireToken, borrowingHistoryRoutes);

app.listen(3000, () => {
  console.log("Server chạy tại http://localhost:3000");
});
