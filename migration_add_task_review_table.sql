-- Migration: Add task_review table
-- This creates the task_review table for tracking task reviews

CREATE TABLE IF NOT EXISTS task_review (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  task_owner_id INT NOT NULL,
  reviewer_id INT NOT NULL,
  completion_comment TEXT,
  review_comment TEXT,
  pm_final_comment TEXT,
  status ENUM('pending', 'review-done', 'finalized', 'changes-requested') DEFAULT 'pending',
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME NULL,
  task_owner_points INT DEFAULT 0,
  reviewer_points INT DEFAULT 0,
  INDEX idx_task_id (task_id),
  INDEX idx_task_owner_id (task_owner_id),
  INDEX idx_reviewer_id (reviewer_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
