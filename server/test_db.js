import mysql from 'mysql2/promise';

async function check() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'tasky'
  });
  
  const [reviews] = await connection.execute('SELECT * FROM task_review');
  console.log(JSON.stringify(reviews, null, 2));
  
  const [tasks] = await connection.execute('SELECT id, status FROM task WHERE status = "in-review"');
  console.log(JSON.stringify(tasks, null, 2));

  connection.end();
}
check();
