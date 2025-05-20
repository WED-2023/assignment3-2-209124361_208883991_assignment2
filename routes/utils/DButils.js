const mysql = require("mysql2");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

const execQuery = async (sql, params = []) => {
  const connection = await promisePool.getConnection();
  try {
    // Only start transaction for write operations
    if (sql.trim().toLowerCase().startsWith('select')) {
      const [results] = await connection.query(sql, params);
      return results;
    } else {
      await connection.beginTransaction();
      const [results] = await connection.query(sql, params);
      await connection.commit();
      return results;
    }
  } catch (error) {
    if (!sql.trim().toLowerCase().startsWith('select')) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  execQuery
};

