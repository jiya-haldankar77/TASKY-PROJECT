const mysql = require('mysql2/promise');
const { dbConfig } = require('./server/db.config.js');

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  const [columns] = await connection.execute('SHOW COLUMNS FROM subtask');
  console.log(columns);
  process.exit(0);
}

main();
