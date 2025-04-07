const express = require("express");
const pgPool = require("../db/initDB");
const dalBook = require("../DAL/book")(pgPool);

const route = express.Router();

route.get("/books/most-borrowed", function (req, res) {
  dalBook.getMostBorrowedBooks(function (error, books) {
    if (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(200).json(books);
  });
});

module.exports = route;
