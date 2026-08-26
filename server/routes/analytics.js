import { Router } from 'express';
const router = Router();
const dateOnly = /^\d{4}-\d{2}-\d{2}$/;

function rangeFor(query) {
  const { start, end } = query;
  if (!start && !end) return null;
  if (!dateOnly.test(start) || !dateOnly.test(end) || start >= end) {
    const error = new Error('start and end must be valid YYYY-MM-DD dates, with end after start');
    error.status = 400;
    throw error;
  }
  return { start, end }; // All ranges are [start, end).
}

function fail(res, label, error) {
  console.error(`${label} error:`, error);
  res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Server error' });
}

export default function analyticsRoutes(pool) {
  router.get('/overview', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const projectRange = range ? ' AND p.start_date < ? AND p.end_date >= ?' : '';
      const taskRange = range ? ' AND t.deadline >= ? AND t.deadline < ?' : '';
      const projectParams = range ? [orgId, pmId, range.end, range.start] : [orgId, pmId];
      const taskParams = range ? [orgId, pmId, range.start, range.end] : [orgId, pmId];
      const [projectStats] = await pool.execute(`SELECT COUNT(*) AS total_projects, SUM(p.status = 'active') AS active_projects, SUM(p.status = 'completed') AS completed_projects, COALESCE(ROUND(AVG(p.progress), 1), 0) AS avg_progress FROM project p WHERE p.org_id = ? AND p.created_by = ?${projectRange}`, projectParams);
      const [taskStats] = await pool.execute(`SELECT COUNT(*) AS total_tasks, SUM(t.status = 'completed') AS completed_tasks, SUM(t.status <> 'completed' AND t.deadline < CURDATE()) AS overdue_tasks, COALESCE(ROUND(AVG(t.progress), 1), 0) AS avg_task_progress FROM task t JOIN project p ON p.id = t.project_id WHERE p.org_id = ? AND p.created_by = ?${taskRange}`, taskParams);
      const [teamStats] = await pool.execute(`SELECT COUNT(DISTINCT u.id) AS total_members FROM user u JOIN role r ON r.id = u.role_id JOIN task_assignment ta ON ta.user_id = u.id AND ta.is_active = 1 JOIN task t ON t.id = ta.task_id JOIN project p ON p.id = t.project_id WHERE u.org_id = ? AND u.is_active = 1 AND r.access_level = 'employee' AND p.created_by = ?`, [orgId, pmId]);
      const tasks = taskStats[0];
      res.json({ success: true, overview: { ...projectStats[0], ...tasks, ...teamStats[0], completion_rate: Number(tasks.total_tasks) ? Math.round(Number(tasks.completed_tasks) / Number(tasks.total_tasks) * 100) : 0 } });
    } catch (error) { fail(res, 'Analytics overview', error); }
  });

  router.get('/project-progress', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const taskRange = range ? ' AND t.deadline >= ? AND t.deadline < ?' : '';
      const projectRange = range ? ' AND p.start_date < ? AND p.end_date >= ?' : '';
      const params = range ? [range.start, range.end, range.start, range.end, orgId, pmId, range.end, range.start] : [orgId, pmId];
      const [projects] = await pool.execute(`SELECT p.id, p.name, p.color, p.progress, p.status, p.priority, (SELECT COUNT(*) FROM task t WHERE t.project_id = p.id${taskRange}) AS total_tasks, (SELECT COUNT(*) FROM task t WHERE t.project_id = p.id AND t.status = 'completed'${taskRange}) AS completed_tasks FROM project p WHERE p.org_id = ? AND p.created_by = ?${projectRange} ORDER BY p.progress DESC`, params);
      res.json({ success: true, projects });
    } catch (error) { fail(res, 'Project progress', error); }
  });

  router.get('/task-distribution', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const taskRange = range ? ' AND t.deadline >= ? AND t.deadline < ?' : '';
      const params = range ? [orgId, pmId, range.start, range.end] : [orgId, pmId];
      const [statusDistribution] = await pool.execute(`SELECT t.status, COUNT(*) AS count FROM task t JOIN project p ON p.id = t.project_id WHERE p.org_id = ? AND p.created_by = ?${taskRange} GROUP BY t.status`, params);
      const [priorityDistribution] = await pool.execute(`SELECT t.priority, COUNT(*) AS count FROM task t JOIN project p ON p.id = t.project_id WHERE p.org_id = ? AND p.created_by = ?${taskRange} GROUP BY t.priority`, params);
      const [total] = await pool.execute(`SELECT COUNT(*) AS count FROM task t JOIN project p ON p.id = t.project_id WHERE p.org_id = ? AND p.created_by = ?${taskRange}`, params);
      res.json({ success: true, statusDistribution, priorityDistribution, total: total[0].count });
    } catch (error) { fail(res, 'Task distribution', error); }
  });

  router.get('/resource-workload', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const taskRange = range ? ' AND COALESCE(t.start_date, t.deadline) < ? AND t.deadline >= ?' : '';
      const params = range ? [range.end, range.start, orgId, pmId] : [orgId, pmId];
      const [byProject] = await pool.execute(`SELECT p.id, p.name, p.color, COALESCE(SUM(CASE WHEN t.id IS NOT NULL AND ta2.cnt > 0 THEN ((t.expected_effort * (100 - t.progress) / 100) / ta2.cnt) / GREATEST(1, DATEDIFF(t.deadline, CURDATE()) / 7.0) ELSE 0 END), 0) AS total_hours FROM project p JOIN task t ON t.project_id = p.id AND t.status IN ('not-started', 'in-progress', 'blocked')${taskRange} LEFT JOIN (SELECT task_id, COUNT(*) AS cnt FROM task_assignment WHERE is_active = 1 GROUP BY task_id) ta2 ON ta2.task_id = t.id WHERE p.org_id = ? AND p.created_by = ? GROUP BY p.id, p.name, p.color ORDER BY total_hours DESC`, params);
      res.json({ success: true, byProject });
    } catch (error) { fail(res, 'Resource workload analytics', error); }
  });

  router.get('/deadline-risks', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const taskRange = range ? ' AND t.deadline >= ? AND t.deadline < ?' : '';
      const params = range ? [orgId, pmId, range.start, range.end] : [orgId, pmId];
      const [risks] = await pool.execute(`SELECT t.id, t.title, t.priority, t.deadline, t.progress, t.status, p.name AS project_name, p.color AS project_color, DATEDIFF(t.deadline, CURDATE()) AS days_until, CASE WHEN CURDATE() > t.deadline THEN 'overdue' WHEN DATEDIFF(t.deadline, CURDATE()) <= 3 AND t.progress < 80 THEN 'critical' WHEN DATEDIFF(t.deadline, CURDATE()) <= 7 AND t.progress < 60 THEN 'high' WHEN DATEDIFF(t.deadline, CURDATE()) <= 14 AND t.progress < 40 THEN 'medium' ELSE 'low' END AS risk_level FROM task t JOIN project p ON p.id = t.project_id WHERE p.org_id = ? AND p.created_by = ? AND t.status <> 'completed' AND t.deadline <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)${taskRange} ORDER BY t.deadline ASC`, params);
      res.json({ success: true, risks });
    } catch (error) { fail(res, 'Deadline risks', error); }
  });

  router.get('/project-performance', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const taskRange = range ? ' AND t.deadline >= ? AND t.deadline < ?' : '';
      const projectRange = range ? ' AND p.start_date < ? AND p.end_date >= ?' : '';
      const params = range ? [range.start, range.end, range.start, range.end, range.start, range.end, range.start, range.end, range.start, range.end, range.start, range.end, orgId, pmId, range.end, range.start] : [orgId, pmId];
      const [projects] = await pool.execute(`SELECT p.id, p.name, p.status, p.progress, p.priority, p.start_date, p.end_date, (SELECT COUNT(*) FROM task t WHERE t.project_id = p.id${taskRange}) AS total_tasks, (SELECT COUNT(*) FROM task t WHERE t.project_id = p.id AND t.status = 'completed'${taskRange}) AS completed_tasks, (SELECT COUNT(*) FROM task t WHERE t.project_id = p.id AND t.status <> 'completed' AND t.deadline < CURDATE()${taskRange}) AS overdue_tasks, (SELECT COUNT(DISTINCT ta.user_id) FROM task t JOIN task_assignment ta ON ta.task_id = t.id AND ta.is_active = 1 WHERE t.project_id = p.id${taskRange}) AS team_size, COALESCE((SELECT SUM(t.actual_effort) FROM task t WHERE t.project_id = p.id${taskRange}), 0) AS total_hours_logged, COALESCE((SELECT SUM(t.expected_effort) FROM task t WHERE t.project_id = p.id${taskRange}), 0) AS total_estimated_hours, DATEDIFF(p.end_date, CURDATE()) AS days_remaining FROM project p WHERE p.org_id = ? AND p.created_by = ?${projectRange} ORDER BY p.created_at DESC`, params);
      res.json({ success: true, projects: projects.map(project => ({ ...project, completion_rate: Number(project.total_tasks) ? Math.round(Number(project.completed_tasks) / Number(project.total_tasks) * 100) : 0, at_risk_tasks: project.overdue_tasks })) });
    } catch (error) { fail(res, 'Project performance', error); }
  });

  router.get('/daily-log-compliance', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const dateFilter = range ? ' AND dlc.log_date >= ? AND dlc.log_date < ?' : ' AND dlc.log_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
      const params = range ? [range.start, range.end, orgId, pmId] : [orgId, pmId];
      const [compliance] = await pool.execute(`SELECT u.id, u.first_name, u.last_name, u.avatar, u.employee_code, SUM(dlc.status = 'logged') AS logged_count, SUM(dlc.status = 'missed') AS missed_count, SUM(dlc.status = 'late') AS late_count, COUNT(dlc.id) AS total_working_days FROM user u JOIN role r ON r.id = u.role_id LEFT JOIN daily_log_compliance dlc ON dlc.user_id = u.id${dateFilter} WHERE u.org_id = ? AND u.is_active = 1 AND r.access_level = 'employee' AND EXISTS (SELECT 1 FROM task_assignment ta JOIN task t ON t.id = ta.task_id JOIN project p ON p.id = t.project_id WHERE ta.user_id = u.id AND ta.is_active = 1 AND p.created_by = ?) GROUP BY u.id, u.first_name, u.last_name, u.avatar, u.employee_code ORDER BY missed_count DESC`, params);
      res.json({ success: true, compliance });
    } catch (error) { fail(res, 'Log compliance', error); }
  });
  return router;
}
