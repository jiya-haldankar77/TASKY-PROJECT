import { Router } from 'express';
import bcrypt from 'bcrypt';
const router = Router();

export default function settingsRoutes(pool) {

  // GET /api/pm/settings
  router.get('/', async (req, res) => {
    try {
      const userId = req.user.id;

      const [settings] = await pool.execute(`
        SELECT * FROM pm_settings WHERE user_id = ?
      `, [userId]);

      if (settings.length === 0) {
        // Create default settings if none exist
        const [result] = await pool.execute(`
          INSERT INTO pm_settings (user_id) VALUES (?)
        `, [userId]);
        const [newSettings] = await pool.execute('SELECT * FROM pm_settings WHERE id = ?', [result.insertId]);
        return res.json({ success: true, settings: newSettings[0] });
      }

      res.json({ success: true, settings: settings[0] });
    } catch (error) {
      console.error('Get settings error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // PUT /api/pm/settings
  router.put('/', async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        strict_resource_limits,
        dynamic_deadline_shifting,
        high_priority_interruption,
        alert_missing_logs,
        alert_conflicts,
        max_hours_threshold
      } = req.body;

      // Make sure the row exists first
      const [existing] = await pool.execute('SELECT id FROM pm_settings WHERE user_id = ?', [userId]);
      if (existing.length === 0) {
        await pool.execute('INSERT INTO pm_settings (user_id) VALUES (?)', [userId]);
      }

      await pool.execute(`
        UPDATE pm_settings SET
          strict_resource_limits = COALESCE(?, strict_resource_limits),
          dynamic_deadline_shifting = COALESCE(?, dynamic_deadline_shifting),
          high_priority_interruption = COALESCE(?, high_priority_interruption),
          alert_missing_logs = COALESCE(?, alert_missing_logs),
          alert_conflicts = COALESCE(?, alert_conflicts),
          max_hours_threshold = COALESCE(?, max_hours_threshold)
        WHERE user_id = ?
      `, [
        strict_resource_limits, dynamic_deadline_shifting, high_priority_interruption,
        alert_missing_logs, alert_conflicts, max_hours_threshold, userId
      ]);

      const [updated] = await pool.execute('SELECT * FROM pm_settings WHERE user_id = ?', [userId]);
      res.json({ success: true, settings: updated[0] });
    } catch (error) {
      console.error('Update settings error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  // PUT /api/pm/settings/password
  router.put('/password', async (req, res) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, error: 'Current and new password are required' });
      }

      // Verify current password
      const [users] = await pool.execute('SELECT password_hash FROM user WHERE id = ?', [userId]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const match = await bcrypt.compare(currentPassword, users[0].password_hash);
      if (!match) {
        return res.status(401).json({ success: false, error: 'Incorrect current password' });
      }

      // Hash and update new password
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE user SET password_hash = ? WHERE id = ?', [hash, userId]);

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, error: 'Server error' });
    }
  });

  return router;
}
