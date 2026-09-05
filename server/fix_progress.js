const mysql = require('mysql2/promise');

async function fixProgress() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'tasky',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  try {
    const connection = await pool.getConnection();
    const [projects] = await connection.execute('SELECT id, name, progress FROM project');
    let count = 0;
    
    for (const p of projects) {
      const [tasks] = await connection.execute('SELECT id, title, progress FROM task WHERE project_id = ?', [p.id]);
      let avg = 0;
      if (tasks.length > 0) {
        const sum = tasks.reduce((acc, t) => acc + parseFloat(t.progress || 0), 0);
        avg = Math.round(sum / tasks.length);
      }
      console.log(`Project ${p.id} (${p.name}): tasks=${tasks.length}, calculated avg=${avg}`);
      await connection.execute('UPDATE project SET progress = ? WHERE id = ?', [avg, p.id]);
      count++;
    }
    connection.release();
    console.log(`Successfully updated ${count} projects.`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    pool.end();
  }
}

fixProgress();
