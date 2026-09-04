-- Insert Task Assignments (assuming user IDs 2, 3, 4, 5 exist as employees)
-- Task IDs are 32-50 based on auto-increment

-- E-Commerce Platform assignments (tasks 32-37)
INSERT INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(33, 2, 1, 1), -- User Authentication Module
(34, 3, 1, 1), -- Product Catalog API
(35, 4, 1, 1), -- Shopping Cart Feature
(36, 2, 1, 1), -- Payment Integration
(37, 3, 1, 1); -- Order Management System

-- Mobile App Development assignments (tasks 38-42)
INSERT INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(39, 4, 1, 1), -- iOS Development
(40, 5, 1, 1), -- Android Development
(41, 2, 1, 1), -- API Integration
(42, 3, 1, 1); -- Testing & QA

-- Data Analytics Dashboard assignments (tasks 43-46)
INSERT INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(44, 2, 1, 1), -- Dashboard UI Development
(45, 4, 1, 1), -- Chart Components
(46, 5, 1, 1); -- Real-time Data Updates

-- Marketing Campaign Platform assignments (tasks 47-50)
INSERT INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES
(49, 3, 1, 1), -- Rate Limiting
(50, 4, 1, 1); -- Load Balancing

-- Insert some work logs for realistic data
INSERT INTO daily_work_log (task_id, user_id, log_date, status, work_completed, remaining_work, comments, hours_spent) VALUES
(33, 2, CURDATE() - INTERVAL 2 DAY, 'in-progress', 'Implemented login form', 'Need to add password reset', 'Working on authentication', 4.00),
(33, 2, CURDATE() - INTERVAL 1 DAY, 'in-progress', 'Added registration flow', 'Need to add email verification', 'Progress good', 4.00),
(34, 3, CURDATE() - INTERVAL 1 DAY, 'in-progress', 'Started API endpoints', 'Need to add validation', 'Initial setup done', 3.00),
(39, 4, CURDATE(), 'in-progress', 'Setup Xcode project', 'Need to implement screens', 'iOS development started', 6.00),
(44, 2, CURDATE() - INTERVAL 3 DAY, 'in-progress', 'Created layout', 'Need to add charts', 'UI framework ready', 5.00),
(44, 2, CURDATE() - INTERVAL 2 DAY, 'in-progress', 'Added navigation', 'Need to connect to API', 'Making progress', 4.00),
(44, 2, CURDATE() - INTERVAL 1 DAY, 'in-progress', 'Connected to backend', 'Need to add real-time updates', 'Almost done', 5.00);
