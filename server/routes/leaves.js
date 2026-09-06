import { Router } from 'express';
import { handleLeaveApproval } from '../services/schedulingEngine.js';

const router = Router();

export default function leavesRoutes(pool) {
  // GET /api/leaves
  router.get('/', async (req, res) => {
    try {
      const orgId = req.user.org_id;
      const [leaves] = await pool.execute(
        `SELECT lr.*, u.first_name, u.last_name 
         FROM leave_request lr
         JOIN user u ON lr.user_id = u.id
         WHERE u.org_id = ?
         ORDER BY lr.created_at DESC`,
        [orgId]
      );
      res.json({ success: true, leaves });
    } catch (error) {
      console.error('Get leaves error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // POST /api/leaves
  router.post('/', async (req, res) => {
    try {
      const userId = req.user.id;
      const { start_date, end_date, type, reason } = req.body;
      
      const [result] = await pool.execute(
        `INSERT INTO leave_request (user_id, start_date, end_date, type, reason, status)
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [userId, start_date, end_date, type, reason]
      );
      
      res.json({ success: true, leave_id: result.insertId });
    } catch (error) {
      console.error('Create leave error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // PUT /api/pm/leaves/:id/approve (Assuming mounted at /api/pm/leaves in server.js)
  router.put('/:id/approve', async (req, res) => {
    try {
      const leaveId = req.params.id;
      const pmId = req.user.id;
      
      await pool.execute(
        `UPDATE leave_request SET status = 'approved', approved_by = ?, updated_at = NOW() WHERE id = ?`,
        [pmId, leaveId]
      );
      
      await handleLeaveApproval(pool, leaveId);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Approve leave error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  return router;
}
