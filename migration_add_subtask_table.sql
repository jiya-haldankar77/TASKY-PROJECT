-- Migration: Add subtask table
-- This creates the subtask table for tracking task subtasks

CREATE TABLE IF NOT EXISTS subtask (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  status ENUM('not-started', 'in-progress', 'completed') DEFAULT 'not-started',
  completed TINYINT(1) DEFAULT 0,
  progress DECIMAL(5,2) DEFAULT 0.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_task_id (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
