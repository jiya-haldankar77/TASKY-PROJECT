-- Migration: Add daily_work_log table
-- This creates the daily_work_log table for tracking employee daily work logs

CREATE TABLE IF NOT EXISTS daily_work_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  log_date DATE NOT NULL,
  task_id INT,
  task_title VARCHAR(255) NOT NULL,
  project VARCHAR(255),
  progress DECIMAL(5,2) DEFAULT 0.00,
  hours_spent DECIMAL(5,2) DEFAULT 0.00,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_date (user_id, log_date),
  INDEX idx_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
