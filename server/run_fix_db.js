require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function run() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tasky',
    multipleStatements: true
  });

  try {
    const sql = fs.readFileSync(path.join(__dirname, '../fix_daily_work_log.sql'), 'utf8');
    await pool.query(sql);
    console.log('Successfully applied database fixes.');
  } catch (err) {
    console.error('Error applying fixes:', err);
  } finally {
    await pool.end();
  }
}

run();
