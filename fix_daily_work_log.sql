ALTER TABLE daily_work_log MODIFY task_title VARCHAR(255) NULL;
ALTER TABLE daily_work_log MODIFY project VARCHAR(255) NULL;

-- Drop duplicates before adding unique index (keep the latest updated_at)
DELETE t1 FROM daily_work_log t1
INNER JOIN daily_work_log t2 
WHERE t1.id < t2.id AND t1.user_id = t2.user_id AND t1.task_id = t2.task_id AND t1.log_date = t2.log_date;

-- Add unique constraint for ON DUPLICATE KEY UPDATE to work
-- For task_id IS NULL, this won't enforce uniqueness (which is fine, or we can use a dummy task_id = 0 for manual logs)
ALTER TABLE daily_work_log ADD UNIQUE INDEX idx_user_task_date_unique (user_id, task_id, log_date);
