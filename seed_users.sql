-- Seed additional users/employees for testing complete workflow
-- These users will help test the complete data flow across all dashboards

-- Insert additional employees with different roles and capacities
-- Password for all accounts: password123
INSERT IGNORE INTO user (org_id, role_id, employee_code, first_name, last_name, email, password_hash, application_role, max_hours_per_week, is_active) VALUES
-- Developers
(1, 3, 'DEV001', 'Rahul', 'Sharma', 'rahul.sharma@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),
(1, 3, 'DEV002', 'Priya', 'Patel', 'priya.patel@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),
(1, 3, 'DEV003', 'Amit', 'Kumar', 'amit.kumar@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 35.00, 1),
(1, 3, 'DEV004', 'Sneha', 'Reddy', 'sneha.reddy@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),
(1, 3, 'DEV005', 'Vikram', 'Singh', 'vikram.singh@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 45.00, 1),

-- Designers
(1, 4, 'DES001', 'Anjali', 'Mehta', 'anjali.mehta@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),
(1, 4, 'DES002', 'Rajesh', 'Kapoor', 'rajesh.kapoor@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),

-- QA Engineers
(1, 5, 'QA001', 'Kavita', 'Nair', 'kavita.nair@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),
(1, 5, 'QA002', 'Suresh', 'Iyer', 'suresh.iyer@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),

-- Additional Project Managers
(1, 2, 'PM006', 'Neha', 'Gupta', 'neha.gupta@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'project_manager', 40.00, 1),
(1, 2, 'PM007', 'Ravi', 'Verma', 'ravi.verma@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'project_manager', 40.00, 1),

-- DevOps Engineers
(1, 6, 'OPS001', 'Deepak', 'Joshi', 'deepak.joshi@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1),
(1, 6, 'OPS002', 'Meera', 'Das', 'meera.das@tasky.com', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'employee', 40.00, 1);

-- Assign some tasks to new employees to create realistic workload distribution
-- Get current task IDs first (assuming tasks 51-69 exist from previous seed)
-- We'll reassign some tasks to the new employees

-- Assign tasks to Rahul Sharma (DEV001 - user_id 6)
INSERT IGNORE INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(54, 6, 1, 1), -- Shopping Cart Feature
(55, 6, 1, 1); -- Payment Integration

-- Assign tasks to Priya Patel (DEV002 - user_id 7)
INSERT IGNORE INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(58, 7, 1, 1), -- iOS Development
(59, 7, 1, 1); -- Android Development

-- Assign tasks to Amit Kumar (DEV003 - user_id 8)
INSERT IGNORE INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(63, 8, 1, 1), -- Dashboard UI Development
(64, 8, 1, 1); -- Chart Components

-- Assign tasks to Sneha Reddy (DEV004 - user_id 9)
INSERT IGNORE INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(66, 9, 1, 1), -- API Gateway Setup
(67, 9, 1, 1); -- Authentication Service

-- Assign tasks to Vikram Singh (DEV005 - user_id 10)
INSERT IGNORE INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(68, 10, 1, 1), -- Rate Limiting
(69, 10, 1, 1); -- Load Balancing

-- Add some work logs for the new employees
INSERT IGNORE INTO daily_work_log (task_id, user_id, log_date, status, work_completed, remaining_work, comments, hours_spent) VALUES
(54, 6, CURDATE() - INTERVAL 1 DAY, 'in-progress', 'Started cart UI components', 'Need to add state management', 'Initial setup done', 4.00),
(63, 8, CURDATE() - INTERVAL 2 DAY, 'in-progress', 'Created dashboard layout', 'Need to add charts', 'UI framework ready', 5.00),
(63, 8, CURDATE() - INTERVAL 1 DAY, 'in-progress', 'Added navigation', 'Need to connect to API', 'Making progress', 4.00),
(66, 9, CURDATE(), 'in-progress', 'Setup gateway infrastructure', 'Need to add middleware', 'Infrastructure ready', 6.00);

-- Add mock completed tasks for testing employee dashboard and performance metrics
-- These tasks have different projects, priorities, deadlines, effort values, and completion dates

-- Completed tasks for Rahul Sharma (DEV001 - user_id 6)
INSERT INTO task (project_id, title, description, priority, status, progress, deadline, start_date, expected_effort, actual_effort, completed_at, created_at, created_by) VALUES
(1, 'User Authentication Module', 'Implemented JWT-based authentication with refresh tokens', 'high', 'completed', 100, '2024-08-20', '2024-08-10', 16, 15, '2024-08-19', '2024-08-10', 1),
(1, 'Database Schema Design', 'Designed and optimized database schema for user and project tables', 'critical', 'completed', 100, '2024-08-15', '2024-08-05', 12, 11, '2024-08-14', '2024-08-05', 1);

-- Completed tasks for Priya Patel (DEV002 - user_id 7)
INSERT INTO task (project_id, title, description, priority, status, progress, deadline, start_date, expected_effort, actual_effort, completed_at, created_at, created_by) VALUES
(2, 'Mobile App Navigation', 'Implemented bottom navigation and routing for mobile app', 'medium', 'completed', 100, '2024-08-22', '2024-08-12', 20, 18, '2024-08-21', '2024-08-12', 1),
(2, 'Push Notification System', 'Integrated Firebase push notifications for mobile app', 'high', 'completed', 100, '2024-08-25', '2024-08-15', 14, 16, '2024-08-24', '2024-08-15', 1);

-- Completed tasks for Amit Kumar (DEV003 - user_id 8)
INSERT INTO task (project_id, title, description, priority, status, progress, deadline, start_date, expected_effort, actual_effort, completed_at, created_at, created_by) VALUES
(3, 'Analytics Dashboard', 'Built comprehensive analytics dashboard with charts and filters', 'critical', 'completed', 100, '2024-08-18', '2024-08-08', 24, 22, '2024-08-17', '2024-08-08', 1),
(3, 'Data Export Feature', 'Implemented CSV and PDF export functionality for reports', 'medium', 'completed', 100, '2024-08-23', '2024-08-13', 8, 7, '2024-08-22', '2024-08-13', 1);

-- Completed tasks for Sneha Reddy (DEV004 - user_id 9)
INSERT INTO task (project_id, title, description, priority, status, progress, deadline, start_date, expected_effort, actual_effort, completed_at, created_at, created_by) VALUES
(4, 'API Documentation', 'Created comprehensive API documentation using Swagger', 'low', 'completed', 100, '2024-08-21', '2024-08-11', 10, 9, '2024-08-20', '2024-08-11', 1),
(4, 'Rate Limiting Middleware', 'Implemented rate limiting to prevent API abuse', 'high', 'completed', 100, '2024-08-24', '2024-08-14', 12, 13, '2024-08-23', '2024-08-14', 1);

-- Completed tasks for Vikram Singh (DEV005 - user_id 10)
INSERT INTO task (project_id, title, description, priority, status, progress, deadline, start_date, expected_effort, actual_effort, completed_at, created_at, created_by) VALUES
(4, 'Load Balancer Configuration', 'Configured Nginx load balancer for high availability', 'critical', 'completed', 100, '2024-08-19', '2024-08-09', 16, 14, '2024-08-18', '2024-08-09', 1),
(4, 'SSL Certificate Setup', 'Implemented SSL/TLS certificates for all services', 'high', 'completed', 100, '2024-08-22', '2024-08-12', 6, 5, '2024-08-21', '2024-08-12', 1);

-- Assign completed tasks to employees
INSERT IGNORE INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
-- Rahul Sharma's completed tasks (assuming tasks 70-71)
(70, 6, 1, 1),
(71, 6, 1, 1),
-- Priya Patel's completed tasks (assuming tasks 72-73)
(72, 7, 1, 1),
(73, 7, 1, 1),
-- Amit Kumar's completed tasks (assuming tasks 74-75)
(74, 8, 1, 1),
(75, 8, 1, 1),
-- Sneha Reddy's completed tasks (assuming tasks 76-77)
(76, 9, 1, 1),
(77, 9, 1, 1),
-- Vikram Singh's completed tasks (assuming tasks 78-79)
(78, 10, 1, 1),
(79, 10, 1, 1);

-- Add work logs for completed tasks
INSERT IGNORE INTO daily_work_log (task_id, user_id, log_date, status, work_completed, remaining_work, comments, hours_spent) VALUES
-- Rahul Sharma's work logs
(70, 6, '2024-08-10', 'in-progress', 'Started authentication module setup', 'Need to implement JWT', 'Initial setup', 4.00),
(70, 6, '2024-08-14', 'in-progress', 'Implemented login and logout', 'Need refresh tokens', 'Progress good', 5.00),
(70, 6, '2024-08-19', 'completed', 'Completed JWT authentication with refresh tokens', '', 'Task completed', 6.00),
(71, 6, '2024-08-05', 'in-progress', 'Analyzed requirements for database schema', 'Need to design tables', 'Requirements clear', 4.00),
(71, 6, '2024-08-10', 'in-progress', 'Created user and project tables', 'Need optimization', 'Schema ready', 5.00),
(71, 6, '2024-08-14', 'completed', 'Optimized database schema with indexes', '', 'Task completed', 2.00),
-- Priya Patel's work logs
(72, 7, '2024-08-12', 'in-progress', 'Started mobile navigation implementation', 'Need routing', 'Framework ready', 4.00),
(72, 7, '2024-08-18', 'in-progress', 'Implemented bottom navigation', 'Need icons', 'Navigation working', 6.00),
(72, 7, '2024-08-21', 'completed', 'Completed mobile app navigation with routing', '', 'Task completed', 4.00),
(73, 7, '2024-08-15', 'in-progress', 'Setup Firebase project', 'Need integration', 'Firebase ready', 5.00),
(73, 7, '2024-08-20', 'in-progress', 'Integrated push notifications', 'Need testing', 'Integration done', 6.00),
(73, 7, '2024-08-24', 'completed', 'Completed push notification system with testing', '', 'Task completed', 5.00),
-- Amit Kumar's work logs
(74, 8, '2024-08-08', 'in-progress', 'Started analytics dashboard design', 'Need charts', 'Design ready', 5.00),
(74, 8, '2024-08-13', 'in-progress', 'Implemented chart components', 'Need filters', 'Charts working', 6.00),
(74, 8, '2024-08-17', 'completed', 'Completed analytics dashboard with filters', '', 'Task completed', 5.00),
(75, 8, '2024-08-13', 'in-progress', 'Started data export feature', 'Need CSV', 'CSV done', 4.00),
(75, 8, '2024-08-18', 'in-progress', 'Added PDF export', 'Need formatting', 'PDF done', 3.00),
(75, 8, '2024-08-22', 'completed', 'Completed data export feature with formatting', '', 'Task completed', 4.00),
-- Sneha Reddy's work logs
(76, 9, '2024-08-11', 'in-progress', 'Started API documentation', 'Need endpoints', 'Swagger setup', 4.00),
(76, 9, '2024-08-16', 'in-progress', 'Documented all endpoints', 'Need examples', 'Endpoints documented', 5.00),
(76, 9, '2024-08-20', 'completed', 'Completed API documentation with examples', '', 'Task completed', 4.00),
(77, 9, '2024-08-14', 'in-progress', 'Started rate limiting implementation', 'Need middleware', 'Research done', 5.00),
(77, 9, '2024-08-19', 'in-progress', 'Implemented rate limiting middleware', 'Need testing', 'Middleware ready', 6.00),
(77, 9, '2024-08-23', 'completed', 'Completed rate limiting with testing', '', 'Task completed', 5.00),
-- Vikram Singh's work logs
(78, 10, '2024-08-09', 'in-progress', 'Started load balancer setup', 'Need configuration', 'Nginx installed', 5.00),
(78, 10, '2024-08-14', 'in-progress', 'Configured load balancing rules', 'Need testing', 'Configuration done', 6.00),
(78, 10, '2024-08-18', 'completed', 'Completed load balancer configuration with testing', '', 'Task completed', 5.00),
(79, 10, '2024-08-12', 'in-progress', 'Started SSL certificate setup', 'Need certificates', 'Domain ready', 4.00),
(79, 10, '2024-08-17', 'in-progress', 'Installed SSL certificates', 'Need renewal setup', 'Certificates installed', 5.00),
(79, 10, '2024-08-21', 'completed', 'Completed SSL certificate setup with auto-renewal', '', 'Task completed', 4.00);
