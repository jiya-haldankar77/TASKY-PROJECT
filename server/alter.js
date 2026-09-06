import mysql from 'mysql2/promise';
import { dbConfig } from './db.config.js';

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    await connection.execute('ALTER TABLE subtask ADD COLUMN estimated_hours INT NOT NULL DEFAULT 0');
    console.log('Added estimated_hours to subtask');
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error(error);
    }
  }
  process.exit(0);
}

main();
