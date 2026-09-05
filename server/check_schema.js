import { dbConfig } from './db.config.js';
import mysql from 'mysql2/promise';

async function checkSchema() {
  const pool = mysql.createPool(dbConfig);
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("DESCRIBE task_comment");
    console.log(rows);
    connection.release();
  } catch(e) {
    console.error(e);
  } finally {
    pool.end();
  }
}
checkSchema();
