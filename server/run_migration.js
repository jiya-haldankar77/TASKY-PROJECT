import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import { dbConfig } from './db.config.js';
import path from 'path';

async function run() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const sqlPath = path.resolve('../migration_add_daily_log_compliance.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');
    await connection.query(sql);
    console.log('Migration executed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}

run();
