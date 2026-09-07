-- Migration: Add daily_log_compliance table
-- Tracks the submission and PM review state of daily work logs

CREATE TABLE IF NOT EXISTS daily_log_compliance (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  log_date DATE NOT NULL,
  status ENUM('submitted', 'reviewed') NOT NULL DEFAULT 'submitted',
  pm_comment TEXT,
  reviewed_by INT UNSIGNED,
  reviewed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_compliance (user_id, log_date),
  CONSTRAINT fk_compliance_user FOREIGN KEY (user_id) REFERENCES user (id) ON DELETE CASCADE,
  CONSTRAINT fk_compliance_reviewer FOREIGN KEY (reviewed_by) REFERENCES user (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
