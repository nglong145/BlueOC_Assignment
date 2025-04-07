module.exports = function (pgPool) {
  if (!pgPool || !pgPool.pool) {
    throw Error("Missing DB connection!");
  }
  const pool = pgPool.pool;

  function getBooks(options, limit = 10, offset = 0, callback) {
    console.log("options: ", options);
    const { title, author, genre } = options;

    let sql = `
          select 	b.book_id,
                  b.title,
                  b.author,
                  b.genre,
                  b.published_year
          from	books b
          where 	1 = 1
      `;

    const params = [];
    if (title) {
      sql += ` and b."title" ilike $${params.length + 1}`;
      params.push(`%${title}%`);
    }
    if (author) {
      sql += ` and b."author" = $${params.length + 1}`;
      params.push(`%${author}%`);
    }
    if (genre) {
      sql += ` and b.genre = $${params.length + 1}`;
      params.push(genre);
    }

    sql += `
          limit ${limit}
          offset ${offset}
      `;

    pool.query(sql, params, function (error, books) {
      if (error) {
        throw error;
      }

      if (books.rows.length === 0) {
        return callback(null, []);
      }

      return callback(null, books.rows);
    });
  }

  function addBook(bookData, callback) {
    const { title, author, genre, published_year } = bookData;
    const sql = `
      INSERT INTO books (title, author, genre, published_year)
      VALUES ($1, $2, $3, $4) RETURNING book_id, title, author, genre, published_year
    `;
    const params = [title, author, genre, published_year];

    pool.query(sql, params, function (error, result) {
      if (error) {
        throw error;
      }

      return callback(null, result.rows[0]);
    });
  }

  function getBookById(bookId, callback) {
    const sql = `
      SELECT book_id, title, author, genre, published_year
      FROM books
      WHERE book_id = $1
    `;
    const params = [bookId];

    pool.query(sql, params, function (error, result) {
      if (error) {
        throw error;
      }

      if (result.rows.length === 0) {
        return callback(new Error("Book not found"), null);
      }

      return callback(null, result.rows[0]);
    });
  }

  function getMostBorrowedBooks(callback) {
    const sql = `
      SELECT 
          bt.book_id,
          b.title,
          COUNT(bt.book_id) AS borrow_count
      FROM 
          borrow_transactions bt
      JOIN 
          books b ON bt.book_id = b.book_id
      WHERE 
          bt.borrow_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY 
          bt.book_id, b.title
      ORDER BY 
          borrow_count DESC
      LIMIT 5;
    `;

    pool.query(sql, function (error, result) {
      if (error) {
        return callback(error, null);
      }
      return callback(null, result.rows);
    });
  }

  return { getBooks, addBook, getBookById, getMostBorrowedBooks };
};
