const express = require("express");
const pgPool = require("../db/initDB");
const dalBook = require("../DAL/book")(pgPool);

const route = express.Router();

route.get("/", function (req, res) {
  // get books from DAL layer and DB
  dalBook.getBooks(
    req.query,
    req.query.limit,
    req.query.offset,
    function (error, books) {
      if (error) {
        res.status(500).json({ message: "Internal Server Error" });
      }

      res.json(books);
      return;
    }
  );
});

// Add new book
route.post("/", function (req, res) {
  const { title, author, genre, published_year } = req.body;

  if (!title || !author || !genre || !published_year) {
    return res.status(400).json({ message: "All fields are required!" });
  }

  dalBook.addBook(
    { title, author, genre, published_year },
    function (error, newBook) {
      if (error) {
        return res.status(500).json({ message: "Internal Server Error" });
      }

      return res.status(201).json(newBook);
    }
  );
});

// Get book by Id
route.get("/:id", function (req, res) {
  const bookId = parseInt(req.params.id, 10);

  if (isNaN(bookId)) {
    return res
      .status(400)
      .json({ message: "Invalid book ID. ID must be a number." });
  }

  dalBook.getBookById(bookId, function (error, book) {
    if (error) {
      return res.status(404).json({ message: "Book not found" });
    }

    return res.status(200).json(book);
  });
});

route.get("/analytics/books/most-borrowed", function (req, res) {
  dalBook.getMostBorrowedBooks(function (error, books) {
    if (error) {
      return res.status(500).json({ message: "Internal Server Error" });
    }
    return res.status(200).json(books);
  });
});

module.exports = route;
