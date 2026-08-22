import { Router } from 'express';
const router = Router();

export default function calendarRoutes(pool) {

  // GET /api/pm/calendar/tasks
  router.get('/tasks', async (req, res) => {
    try {
      const orgId = req.user.org_id;
      const pmId = req.user.id;
      const { start, end } = req.query; // optional date range filtering

      // Fetch all non-completed tasks for projects created by this PM
      let query = `
        SELECT t.id, t.title, t.start_date, t.deadline, t.status, t.priority,
          p.name AS project_name, p.color AS project_color
        FROM task t
        JOIN project p ON p.id = t.project_id
        WHERE p.org_id = ? AND p.created_by = ?
      `;
      const params = [orgId, pmId];

      if (start && end) {
        query += ' AND ((t.start_date <= ? AND t.deadline >= ?) OR (t.deadline BETWEEN ? AND ?))';
        params.push(end, start, start, end);
      }

      const [tasks] = await pool.execute(query, params);

      // Map to calendar events format
      const events = tasks.map(t => ({
        id: `task_${t.id}`,
        title: t.title,
        start: t.start_date || t.deadline, // Fallback to deadline if no start date
        end: t.deadline,
        allDay: true,
        backgroundColor: t.project_color || '#1976D2',
        extendedProps: {
          type: 'task',
          status: t.status,
          priority: t.priority,
          projectName: t.project_name
        }
      }));

      res.json({ success: true, events });
    } catch (error) {
      console.error('Get calendar tasks error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // GET /api/pm/calendar/availability
  router.get('/availability', async (req, res) => {
    try {
      const orgId = req.user.org_id;

      // Get explicit availability overrides (e.g. weekends, manual off-days)
      const [availability] = await pool.execute(`
        SELECT ea.*, u.first_name, u.last_name
        FROM employee_availability ea
        JOIN user u ON u.id = ea.user_id
        WHERE u.org_id = ? AND ea.is_available = 0
      `, [orgId]);

      const events = availability.map(a => ({
        id: `avail_${a.user_id}_${a.date}`,
        title: `${a.first_name} - Unavailable`,
        start: a.date,
        allDay: true,
        backgroundColor: '#e0e0e0',
        textColor: '#333',
        extendedProps: {
          type: 'availability',
          employee: `${a.first_name} ${a.last_name}`
        }
      }));

      res.json({ success: true, events });
    } catch (error) {
      console.error('Get calendar availability error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // GET /api/pm/calendar/leave
  router.get('/leave', async (req, res) => {
    try {
      const orgId = req.user.org_id;

      const [leaves] = await pool.execute(`
        SELECT l.*, u.first_name, u.last_name
        FROM leave_request l
        JOIN user u ON u.id = l.user_id
        WHERE u.org_id = ? AND l.status IN ('approved', 'pending')
      `, [orgId]);

      const events = leaves.map(l => ({
        id: `leave_${l.id}`,
        title: `${l.first_name} - Leave (${l.status})`,
        start: l.start_date,
        end: l.end_date, // FullCalendar uses exclusive end dates natively, UI needs to handle this
        allDay: true,
        backgroundColor: l.status === 'approved' ? '#4CAF50' : '#FF9800',
        extendedProps: {
          type: 'leave',
          status: l.status,
          employee: `${l.first_name} ${l.last_name}`
        }
      }));

      res.json({ success: true, events });
    } catch (error) {
      console.error('Get calendar leave error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  return router;
}
