import mysql from 'mysql2/promise';
import { dbConfig } from './db.config.js';

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  const [columns] = await connection.execute('SHOW COLUMNS FROM subtask');
  console.log(columns);
  process.exit(0);
}

main();
