const mysql = require('mysql2/promise');
const conf = require('./db.config.js');

async function run() {
  const pool = mysql.createPool(conf.dbConfig);
  try {
    await pool.query("ALTER TABLE daily_log_compliance MODIFY COLUMN status enum('logged','missed','late','not-required','submitted','reviewed') NOT NULL DEFAULT 'missed'");
    await pool.query("ALTER TABLE daily_log_compliance ADD COLUMN pm_comment TEXT");
    await pool.query("ALTER TABLE daily_log_compliance ADD COLUMN reviewed_by INT UNSIGNED");
    await pool.query("ALTER TABLE daily_log_compliance ADD COLUMN reviewed_at DATETIME");
    await pool.query("ALTER TABLE daily_log_compliance ADD CONSTRAINT fk_compliance_reviewer FOREIGN KEY (reviewed_by) REFERENCES user (id) ON DELETE SET NULL");
    console.log('ALTER done');
  } catch (err) {
    console.log('Error:', err.message);
  }
  process.exit(0);
}
run();
