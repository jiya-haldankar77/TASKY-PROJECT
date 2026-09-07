-- Migration: Add day_status to daily_log_compliance
ALTER TABLE daily_log_compliance 
ADD COLUMN day_status ENUM('worked', 'leave', 'holiday', 'weekend', 'no-entry') DEFAULT 'worked';
