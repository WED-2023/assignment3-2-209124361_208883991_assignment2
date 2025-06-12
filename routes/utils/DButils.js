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

const execQuery = async function (sql, params = []) {
  const connection = await promisePool.getConnection();
  const isSelect = sql.trim().toLowerCase().startsWith("select");
  try {
    if (!isSelect) await connection.query("START TRANSACTION");

    const [results] = await connection.query(sql, params);

    if (!isSelect) await connection.query("COMMIT");
    return results;
  } catch (err) {
    if (!isSelect) await connection.query("ROLLBACK");
    throw err;
  } finally {
    await connection.release();
  }
};

module.exports = {
  execQuery
};