module.exports = function (pgPool) {
  if (!pgPool || !pgPool.pool) {
    throw Error("Missing DB connection!");
  }
  const pool = pgPool.pool;

  function addUser(userData, callback) {
    const { name, email, password, role } = userData;
    const sql = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role
    `;
    const params = [name, email, password, role];

    pool.query(sql, params, function (error, result) {
      if (error) {
        return callback(error, null);
      }
      return callback(null, result.rows[0]);
    });
  }

  function updateUser(userId, userData, callback) {
    const { name, email, password, role } = userData;
    const sql = `
      UPDATE users
      SET name = $1, email = $2, password = $3, role = $4
      WHERE user_id = $5
      RETURNING user_id, name, email, role
    `;
    const params = [name, email, password, role, userId];

    pool.query(sql, params, function (error, result) {
      if (error) {
        return callback(error, null);
      }
      if (result.rows.length === 0) {
        return callback(new Error("User not found"), null);
      }
      return callback(null, result.rows[0]);
    });
  }

  function deleteUser(userId, callback) {
    const sql = `
      DELETE FROM users
      WHERE user_id = $1
      RETURNING user_id
    `;
    const params = [userId];

    pool.query(sql, params, function (error, result) {
      if (error) {
        return callback(error, null);
      }
      if (result.rows.length === 0) {
        return callback(new Error("User not found"), null);
      }
      return callback(null, result.rows[0]);
    });
  }

  function getUserById(userId, callback) {
    const sql = `
      SELECT user_id, name, email, role
      FROM users
      WHERE user_id = $1
    `;
    const params = [userId];

    pool.query(sql, params, function (error, result) {
      if (error) {
        return callback(error, null);
      }
      if (result.rows.length === 0) {
        return callback(new Error("User not found"), null);
      }
      return callback(null, result.rows[0]);
    });
  }

  function getUserByEmail(email, callback) {
    const sql = `
      SELECT user_id, name, email, password, role
      FROM users
      WHERE email = $1
    `;
    const params = [email];

    pool.query(sql, params, function (error, result) {
      if (error) {
        return callback(error, null);
      }
      if (result.rows.length === 0) {
        return callback(new Error("User not found"), null);
      }
      return callback(null, result.rows[0]);
    });
  }

  return { addUser, updateUser, deleteUser, getUserById, getUserByEmail };
};
