import mysql from 'mysql2/promise';

async function check() {
  const connection = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: 'root',
    database: 'tasky'
  });
  
  console.log('--- fetchAssignedReviews (for reviewer) ---');
  const [pending] = await connection.execute(`
        SELECT t.id, t.title, t.description, t.expected_effort, p.name as project_name,
               u.first_name as task_owner_first_name, u.last_name as task_owner_last_name,
               tr.id as review_id, tr.completion_comment, tr.submitted_at
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN user u ON u.id = t.created_by
        LEFT JOIN task_review tr ON tr.task_id = t.id
        WHERE t.status = 'in-review'
        AND tr.reviewer_id = 10
        AND tr.status = 'pending'
        ORDER BY tr.submitted_at DESC
  `);
  console.log(JSON.stringify(pending, null, 2));

  console.log('--- fetchReviewHistory (for assigner and reviewer) ---');
  const [history] = await connection.execute(`
        SELECT t.id, t.title, t.status as task_status, t.progress,
               p.name as project_name,
               tr.status as review_status, tr.review_comment, tr.pm_final_comment, tr.submitted_at,
               tr.task_owner_points
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN task_review tr ON tr.task_id = t.id
        WHERE tr.reviewer_id = 2 OR tr.task_owner_id = 2
        ORDER BY tr.submitted_at DESC
  `);
  console.log(JSON.stringify(history, null, 2));

  connection.end();
}
check();
