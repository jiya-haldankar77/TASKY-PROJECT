-- Add visibility field to task table
ALTER TABLE `task` 
ADD COLUMN `is_visible` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Task visibility to employees' AFTER `is_self_assigned`,
ADD INDEX `idx_task_visibility` (`is_visible`);
