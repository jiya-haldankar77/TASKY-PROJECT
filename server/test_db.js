import mysql from 'mysql2/promise';
import { dbConfig } from './db.config.js';

async function check() {
  const connection = await mysql.createConnection(dbConfig);

  console.log('Database connection successful!');

  const [reviews] = await connection.execute('SELECT * FROM task_review');
  console.log('Task reviews:');
  console.log(JSON.stringify(reviews, null, 2));

  const [tasks] = await connection.execute(
    'SELECT id, status FROM task WHERE status = "in-review"'
  );
  console.log('In-review tasks:');
  console.log(JSON.stringify(tasks, null, 2));

  await connection.end();
}

check().catch((error) => {
  console.error('Database connection failed:');
  console.error(error);
});