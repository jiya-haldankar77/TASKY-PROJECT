import express from 'express';
import mysql from 'mysql2/promise';
import { dbConfig } from '../db.config.js';

const router = express.Router();
const pool = mysql.createPool(dbConfig);

// 1. Fetch daily logs and compliance status for a user & date
router.get('/:userId/:date', async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    // Get compliance status
    const [complianceRows] = await pool.query(
      'SELECT * FROM daily_log_compliance WHERE user_id = ? AND log_date = ?',
      [userId, date]
    );
    
    // Get actual logs
    const [logRows] = await pool.query(
      'SELECT d.*, t.title as task_title FROM daily_work_log d LEFT JOIN task t ON d.task_id = t.id WHERE d.user_id = ? AND d.log_date = ?',
      [userId, date]
    );
    
    res.json({
      success: true,
      compliance: complianceRows.length > 0 ? complianceRows[0] : null,
      logs: logRows
    });
  } catch (error) {
    console.error('Error fetching daily logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 2. Add or update manual/automatic work log
router.post('/work-log', async (req, res) => {
  try {
    const { task_id, user_id, log_date, work_completed, hours_spent, status } = req.body;
    // Use NULL for task_id if not provided (manual entries not tied to a task)
    const taskIdValue = task_id || null;
    
    // Using ON DUPLICATE KEY UPDATE to append work_completed and add hours
    await pool.query(
      `INSERT INTO daily_work_log (task_id, user_id, log_date, work_completed, hours_spent, status)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       work_completed = CONCAT(COALESCE(work_completed, ''), IF(work_completed IS NULL OR work_completed = '', '', '\n'), VALUES(work_completed)),
       hours_spent = hours_spent + VALUES(hours_spent),
       status = VALUES(status)`,
      [taskIdValue, user_id, log_date, work_completed, hours_spent || 0, status || 'in-progress']
    );
    
    res.json({ success: true, message: 'Log added successfully' });
  } catch (error) {
    console.error('Error adding work log:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 3. Submit day to PM
router.post('/submit', async (req, res) => {
  try {
    const { user_id, log_date } = req.body;
    const [existing] = await pool.query(
      'SELECT status FROM daily_log_compliance WHERE user_id = ? AND log_date = ?',
      [user_id, log_date]
    );
    if (existing.length > 0 && (existing[0].status === 'submitted' || existing[0].status === 'reviewed')) {
      return res.status(400).json({ success: false, message: 'Day already submitted' });
    }
    await pool.query(
      `INSERT INTO daily_log_compliance (user_id, log_date, status)
       VALUES (?, ?, 'submitted')
       ON DUPLICATE KEY UPDATE status = 'submitted'`,
      [user_id, log_date]
    );
    res.json({ success: true, message: 'Day submitted for review' });
  } catch (error) {
    console.error('Error submitting day:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 4. Get pending reviews for PM
router.get('/pm/pending', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, u.first_name, u.last_name, u.avatar
       FROM daily_log_compliance c
       JOIN user u ON c.user_id = u.id
       WHERE c.status = 'submitted'
       ORDER BY c.log_date DESC`
    );
    
    // Fetch the logs for these submissions
    const submissions = [];
    for (let row of rows) {
      const [logs] = await pool.query(
        'SELECT d.*, t.title as task_title FROM daily_work_log d LEFT JOIN task t ON d.task_id = t.id WHERE d.user_id = ? AND d.log_date = ?',
        [row.user_id, row.log_date]
      );
      submissions.push({
        ...row,
        logs
      });
    }
    
    res.json({ success: true, pending: submissions });
  } catch (error) {
    console.error('Error fetching pending logs:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// 5. PM reviews the day
router.post('/review', async (req, res) => {
  try {
    const { compliance_id, pm_comment, reviewer_id, user_id, log_date } = req.body;
    
    await pool.query(
      `UPDATE daily_log_compliance
       SET status = 'reviewed', pm_comment = ?, reviewed_by = ?, reviewed_at = NOW()
       WHERE id = ?`,
      [pm_comment, reviewer_id, compliance_id]
    );
    
    // Insert Notification
    await pool.query(
      `INSERT INTO notification (user_id, type, title, message)
       VALUES (?, 'general', 'Daily Log Reviewed', ?)`,
      [user_id, `Your daily log for ${log_date} has been reviewed by the PM: "${pm_comment}"`]
    );
    
    res.json({ success: true, message: 'Review submitted' });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
