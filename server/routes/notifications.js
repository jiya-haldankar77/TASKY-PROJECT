import { Router } from 'express';
const router = Router();

function fail(res, error) {
  console.error('Notification API error:', error);
  res.status(500).json({ success: false, error: 'Server error' });
}

export default function notificationRoutes(pool) {
  router.get('/', async (req, res) => {
    try {
      const [notifications] = await pool.execute('SELECT id, user_id, type, title, message, reference_type, reference_id, is_read, created_at FROM notification WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
      res.json({ success: true, notifications });
    } catch (error) { fail(res, error); }
  });
  router.put('/read-all', async (req, res) => {
    try {
      const [result] = await pool.execute('UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
      res.json({ success: true, updated: result.affectedRows });
    } catch (error) { fail(res, error); }
  });
  router.put('/:id/read', async (req, res) => {
    try {
      if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ success: false, error: 'Notification not found' });
      const [result] = await pool.execute('UPDATE notification SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      if (result.affectedRows !== 1) return res.status(404).json({ success: false, error: 'Notification not found' });
      res.json({ success: true });
    } catch (error) { fail(res, error); }
  });
  router.delete('/:id', async (req, res) => {
    try {
      if (!/^\d+$/.test(req.params.id)) return res.status(404).json({ success: false, error: 'Notification not found' });
      const [result] = await pool.execute('DELETE FROM notification WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
      if (result.affectedRows !== 1) return res.status(404).json({ success: false, error: 'Notification not found' });
      res.json({ success: true });
    } catch (error) { fail(res, error); }
  });
  return router;
}
