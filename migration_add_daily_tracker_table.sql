-- Migration: Add daily_tracker table
-- This creates the daily_tracker table for employee daily task tracking

CREATE TABLE IF NOT EXISTS daily_tracker (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  progress DECIMAL(5,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Not Started',
  project_id INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_employee_date (employee_id, date),
  INDEX idx_project (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
