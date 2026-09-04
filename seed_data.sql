-- Seed data for Tasky application
-- This script creates realistic test data for projects, tasks, and assignments

-- Clear existing data (be careful in production!)
DELETE FROM daily_work_log WHERE id > 0;
DELETE FROM task_assignment WHERE id > 0;
DELETE FROM task WHERE id > 0;
-- Keep existing projects, just add tasks to them

-- Insert Tasks for E-Commerce Platform (Project 1)
INSERT INTO task (project_id, created_by, title, description, status, priority, deadline, start_date, expected_effort, actual_effort, progress) VALUES
(1, 1, 'Database Schema Design', 'Design and implement database schema', 'completed', 'high', '2026-08-15', '2026-08-01', 16.00, 16.00, 100.00),
(1, 1, 'User Authentication Module', 'Implement login, registration, and password reset', 'in-progress', 'critical', '2026-08-30', '2026-08-10', 24.00, 12.00, 50.00),
(1, 1, 'Product Catalog API', 'REST API for product CRUD operations', 'in-progress', 'high', '2026-09-15', '2026-08-20', 20.00, 8.00, 40.00),
(1, 1, 'Shopping Cart Feature', 'Client-side shopping cart functionality', 'not-started', 'high', '2026-09-30', '2026-09-01', 16.00, 0.00, 0.00),
(1, 1, 'Payment Integration', 'Integrate Stripe payment gateway', 'not-started', 'critical', '2026-10-15', '2026-09-15', 32.00, 0.00, 0.00),
(1, 1, 'Order Management System', 'Backend order processing and tracking', 'not-started', 'high', '2026-10-30', '2026-10-01', 24.00, 0.00, 0.00);

-- Insert Tasks for Mobile App Development (Project 2)
INSERT INTO task (project_id, created_by, title, description, status, priority, deadline, start_date, expected_effort, actual_effort, progress) VALUES
(2, 1, 'UI/UX Design', 'Design mobile app screens and user flows', 'completed', 'high', '2026-09-01', '2026-08-15', 24.00, 24.00, 100.00),
(2, 1, 'iOS Development', 'Native iOS app development', 'in-progress', 'critical', '2026-12-15', '2026-09-01', 80.00, 32.00, 40.00),
(2, 1, 'Android Development', 'Native Android app development', 'in-progress', 'critical', '2026-12-15', '2026-09-01', 80.00, 24.00, 30.00),
(2, 1, 'API Integration', 'Connect mobile apps to backend APIs', 'not-started', 'high', '2027-01-15', '2026-11-01', 32.00, 0.00, 0.00),
(2, 1, 'Testing & QA', 'Mobile app testing and bug fixes', 'not-started', 'medium', '2027-02-15', '2027-01-01', 24.00, 0.00, 0.00);

-- Insert Tasks for Data Analytics Dashboard (Project 3)
INSERT INTO task (project_id, created_by, title, description, status, priority, deadline, start_date, expected_effort, actual_effort, progress) VALUES
(3, 1, 'Data Warehouse Setup', 'Configure data warehouse and ETL pipelines', 'completed', 'high', '2026-09-15', '2026-09-01', 24.00, 24.00, 100.00),
(3, 1, 'Dashboard UI Development', 'Build responsive dashboard interface', 'in-progress', 'high', '2026-10-15', '2026-09-10', 32.00, 20.00, 62.50),
(3, 1, 'Chart Components', 'Implement D3.js chart components', 'in-progress', 'medium', '2026-10-30', '2026-10-01', 20.00, 12.00, 60.00),
(3, 1, 'Real-time Data Updates', 'WebSocket integration for live updates', 'not-started', 'medium', '2026-11-15', '2026-11-01', 16.00, 0.00, 0.00);

-- Insert Tasks for Marketing Campaign Platform (Project 4)
INSERT INTO task (project_id, created_by, title, description, status, priority, deadline, start_date, expected_effort, actual_effort, progress) VALUES
(4, 1, 'Gateway Architecture', 'Design API gateway architecture', 'completed', 'high', '2026-09-01', '2026-08-20', 16.00, 16.00, 100.00),
(4, 1, 'Authentication Service', 'Implement JWT authentication', 'completed', 'critical', '2026-09-15', '2026-08-25', 20.00, 20.00, 100.00),
(4, 1, 'Rate Limiting', 'Implement rate limiting middleware', 'in-progress', 'high', '2026-09-30', '2026-09-10', 12.00, 8.00, 66.67),
(4, 1, 'Load Balancing', 'Configure load balancing', 'not-started', 'medium', '2026-10-15', '2026-10-01', 16.00, 0.00, 0.00);
