const mysql = require('mysql2/promise');

async function check() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tasky'
  });
  try {
    const [rows] = await pool.query('SHOW CREATE TABLE daily_work_log');
    console.log(rows[0]['Create Table']);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
check();
