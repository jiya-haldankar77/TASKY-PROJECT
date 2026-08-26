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
  return { start, end }; // [start, end), including FullCalendar's convention.
}

function addDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function fail(res, label, error) {
  console.error(`${label} error:`, error);
  res.status(error.status || 500).json({ success: false, error: error.status ? error.message : 'Server error' });
}

export default function calendarRoutes(pool) {
  router.get('/tasks', async (req, res) => {
    try {
      const { org_id: orgId, id: pmId } = req.user; const range = rangeFor(req.query);
      const dateFilter = range ? ' AND COALESCE(t.start_date, t.deadline) < ? AND t.deadline >= ?' : '';
      const params = range ? [orgId, pmId, range.end, range.start] : [orgId, pmId];
      const [tasks] = await pool.execute(`SELECT t.id, t.title, t.start_date, t.deadline, t.status, t.priority, t.progress, p.name AS project_name, p.color AS project_color FROM task t JOIN project p ON p.id = t.project_id WHERE p.org_id = ? AND p.created_by = ?${dateFilter}`, params);
      const events = await Promise.all(tasks.map(async task => {
        const [assignees] = await pool.execute(`SELECT u.id, u.first_name, u.last_name, u.avatar FROM task_assignment ta JOIN user u ON u.id = ta.user_id WHERE ta.task_id = ? AND ta.is_active = 1 AND u.org_id = ?`, [task.id, orgId]);
        return { id: `task_${task.id}`, title: task.title, start: task.start_date || task.deadline, end: addDays(task.deadline, 1), allDay: true, backgroundColor: task.project_color || '#1976D2', extendedProps: { type: 'task', status: task.status, priority: task.priority, projectName: task.project_name, progress: Number(task.progress || 0), assignees: assignees.map(assignee => ({ id: assignee.id, name: `${assignee.first_name} ${assignee.last_name}`, avatar: assignee.avatar })) } };
      }));
      res.json({ success: true, events });
    } catch (error) { fail(res, 'Get calendar tasks', error); }
  });

  router.get('/availability', async (req, res) => {
    try {
      const { org_id: orgId } = req.user; const range = rangeFor(req.query);
      const dateFilter = range ? ' AND ea.date >= ? AND ea.date < ?' : '';
      const params = range ? [orgId, range.start, range.end] : [orgId];
      const [availability] = await pool.execute(`SELECT ea.*, u.first_name, u.last_name, u.avatar FROM employee_availability ea JOIN user u ON u.id = ea.user_id WHERE u.org_id = ? AND ea.is_available = 0${dateFilter}`, params);
      res.json({ success: true, events: availability.map(item => ({ id: `avail_${item.user_id}_${item.date}`, title: `${item.first_name} - Unavailable`, start: item.date, end: addDays(item.date, 1), allDay: true, backgroundColor: '#e0e0e0', textColor: '#333', extendedProps: { type: 'availability', employeeId: item.user_id, employee: `${item.first_name} ${item.last_name}`, avatar: item.avatar } })) });
    } catch (error) { fail(res, 'Get calendar availability', error); }
  });

  router.get('/leave', async (req, res) => {
    try {
      const { org_id: orgId } = req.user; const range = rangeFor(req.query);
      const dateFilter = range ? ' AND l.start_date < ? AND l.end_date >= ?' : '';
      const params = range ? [orgId, range.end, range.start] : [orgId];
      const [leaves] = await pool.execute(`SELECT l.*, u.first_name, u.last_name, u.avatar FROM leave_request l JOIN user u ON u.id = l.user_id WHERE u.org_id = ? AND l.status IN ('approved', 'pending')${dateFilter}`, params);
      res.json({ success: true, events: leaves.map(item => ({ id: `leave_${item.id}`, title: `${item.first_name} - Leave (${item.status})`, start: item.start_date, end: addDays(item.end_date, 1), allDay: true, backgroundColor: item.status === 'approved' ? '#4CAF50' : '#FF9800', extendedProps: { type: 'leave', status: item.status, employeeId: item.user_id, employee: `${item.first_name} ${item.last_name}`, avatar: item.avatar } })) });
    } catch (error) { fail(res, 'Get calendar leave', error); }
  });
  return router;
}
