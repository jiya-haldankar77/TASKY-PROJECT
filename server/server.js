import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { dbConfig } from './db.config.js';
import { generateToken, authenticateToken, requireRole } from './middleware/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import resourceRoutes from './routes/resources.js';
import analyticsRoutes from './routes/analytics.js';
import organisationRoutes from './routes/organisation.js';
import notificationRoutes from './routes/notifications.js';
import calendarRoutes from './routes/calendar.js';
import schedulingRoutes from './routes/scheduling.js';
const app = express();
const port = 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:9000', 'http://localhost:8080', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Mock user middleware for testing without auth - using PM who created projects
app.use((req, res, next) => {
  if (!req.user) {
    req.user = {
      id: 1, // PM user ID who created all projects
      email: 'pm@tasky.com',
      role: 'pm',
      org_id: 1
    };
  }
  next();
});

// Database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool
  .getConnection()
  .then(async (connection) => {
    console.log('Connected to MySQL database');
    try {
      await connection.query('ALTER TABLE user ADD COLUMN avatar VARCHAR(512) NULL;');
      console.log('Added avatar column to user table');
    } catch (e) {
      // Ignore error if column already exists
    }

    try {
      await connection.query(
        'ALTER TABLE task ADD COLUMN resources_needed INT NOT NULL DEFAULT 1;',
      );
      console.log('Added resources_needed column to task table');
    } catch (e) {
      // Ignore error if column already exists
    }

    try {
      await connection.query(
        "ALTER TABLE task MODIFY COLUMN status ENUM('not-started','in-progress','completed','blocked','on-hold','in-review') NOT NULL DEFAULT 'not-started';"
      );
      console.log('Modified task status enum to include in-review');
    } catch (e) {
      console.error('Failed to modify task status enum:', e.message);
    }

    try {
      await connection.query('ALTER TABLE user ADD COLUMN points INT NOT NULL DEFAULT 0;');
      console.log('Added points column to user table');
    } catch (e) {
      // Ignore error if column already exists
    }

    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS invite_code (
          id INT UNSIGNED NOT NULL AUTO_INCREMENT,
          org_id INT UNSIGNED NOT NULL,
          code VARCHAR(50) NOT NULL,
          created_by INT UNSIGNED NOT NULL,
          max_uses INT UNSIGNED NOT NULL DEFAULT 50,
          current_uses INT UNSIGNED NOT NULL DEFAULT 0,
          expires_at DATETIME NOT NULL,
          is_active TINYINT(1) NOT NULL DEFAULT 1,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (id),
          UNIQUE KEY uq_invite_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);
      console.log('Ensured invite_code table exists');
    } catch (e) {
      // Ignore error if already exists
    }
    connection.release();
  })
  .catch((err) => {
    console.error('Database connection failed:', err);
  });

// Helper to recalculate and update project progress based on tasks
const updateProjectProgress = async (connection, taskId) => {
  try {
    const [taskRows] = await connection.execute('SELECT project_id FROM task WHERE id = ?', [taskId]);
    if (taskRows.length > 0) {
      const projectId = taskRows[0].project_id;
      const [allTasks] = await connection.execute('SELECT progress FROM task WHERE project_id = ?', [projectId]);
      
      let avgProgress = 0;
      if (allTasks.length > 0) {
        const totalProgress = allTasks.reduce((sum, t) => sum + parseFloat(t.progress || 0), 0);
        avgProgress = Math.round(totalProgress / allTasks.length);
      }
      
      await connection.execute('UPDATE project SET progress = ? WHERE id = ?', [avgProgress, projectId]);
    }
  } catch (error) {
    console.error('Error updating project progress:', error);
  }
};

app.get('/api/pm/backfill-progress', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [projects] = await connection.execute('SELECT id, name, progress FROM project');
    let count = 0;
    for (const p of projects) {
      const [tasks] = await connection.execute('SELECT id, title, progress FROM task WHERE project_id = ?', [p.id]);
      let avg = 0;
      if (tasks.length > 0) {
        const sum = tasks.reduce((acc, t) => acc + parseFloat(t.progress || 0), 0);
        avg = Math.round(sum / tasks.length);
      }
      await connection.execute('UPDATE project SET progress = ? WHERE id = ?', [avg, p.id]);
      count++;
    }
    connection.release();
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Trigger reload
app.get('/api/pm/debug-progress', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [projects] = await connection.execute('SELECT id, name, progress FROM project');
    connection.release();
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get user by employee code or email
async function getUserByIdentifier(identifier) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT u.*, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id WHERE u.employee_code = ? OR u.email = ?',
      [identifier, identifier],
    );
    const user = rows[0];
    // Map database fields to response format
    if (user) {
      user.professional_role = user.professional_role;
      user.professional_role_other = user.professional_role_other;
      user.application_role = user.application_role;
    }
    return user;
  } finally {
    connection.release();
  }
}

// Helper function to get user by ID
async function getUserById(userId) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT u.*, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id WHERE u.id = ?',
      [userId],
    );
    const user = rows[0];
    // Map database fields to response format
    if (user) {
      user.professional_role = user.professional_role;
      user.professional_role_other = user.professional_role_other;
      user.application_role = user.application_role;
    }
    return user;
  } finally {
    connection.release();
  }
}

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res
        .status(400)
        .json({ success: false, error: 'Identifier and password are required' });
    }

    const user = await getUserByIdentifier(identifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Verify password (using bcrypt for hashed passwords, or plain text comparison for now)
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    // For testing with plain text passwords (remove in production)
    const plainTextMatch = password === user.password_hash;

    if (!passwordMatch && !plainTextMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user;
    const token = generateToken(userWithoutPassword);

    res.json({
      success: true,
      token,
      user: {
        id: userWithoutPassword.id.toString(),
        firstName: userWithoutPassword.first_name,
        surname: userWithoutPassword.last_name,
        email: userWithoutPassword.email,
        phone: userWithoutPassword.phone || '',
        role: userWithoutPassword.application_role === 'project_manager' ? 'pm' : 'employee',
        employeeCode: userWithoutPassword.employee_code,
        avatar:
          userWithoutPassword.avatar || `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Register Project Manager endpoint
app.post('/api/auth/register/pm', async (req, res) => {
  try {
    const { firstName, surname, email, phone, managerId, password, organisationName, inviteCode } =
      req.body;

    if (!firstName || !surname || !email || !managerId || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    try {
      // Check if email already exists
      const [existingEmail] = await connection.execute('SELECT id FROM user WHERE email = ?', [
        email,
      ]);

      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // Check if manager ID already exists
      const [existingId] = await connection.execute('SELECT id FROM user WHERE employee_code = ?', [
        managerId,
      ]);

      if (existingId.length > 0) {
        return res.status(400).json({ success: false, error: 'Manager ID already exists' });
      }

      let orgId;
      let roleId;

      if (inviteCode) {
        // Validate invite code against database
        const [codeRows] = await connection.execute(
          'SELECT id, org_id, current_uses, max_uses FROM invite_code WHERE code = ? AND is_active = 1 AND expires_at > NOW()',
          [inviteCode],
        );

        if (codeRows.length === 0) {
          return res.status(400).json({ success: false, error: 'Invalid or expired invite code' });
        }

        const inviteData = codeRows[0];
        if (inviteData.max_uses > 0 && inviteData.current_uses >= inviteData.max_uses) {
          return res.status(400).json({ success: false, error: 'Invite code usage limit reached' });
        }

        // Increment invite code usage
        await connection.execute(
          'UPDATE invite_code SET current_uses = current_uses + 1 WHERE id = ?',
          [inviteData.id],
        );

        orgId = inviteData.org_id;

        // Get manager role ID for this org
        const [roleRows] = await connection.execute(
          'SELECT id FROM role WHERE org_id = ? AND access_level = ? LIMIT 1',
          [orgId, 'manager'],
        );

        if (roleRows.length === 0) {
          return res
            .status(400)
            .json({ success: false, error: 'Manager role not found for this organization' });
        }
        roleId = roleRows[0].id;
      } else {
        // Create new organization
        const orgNameToUse =
          organisationName && organisationName.trim()
            ? organisationName.trim()
            : `${firstName}'s Organization`;

        let finalOrgName = orgNameToUse;
        let isUnique = false;
        let suffix = 0;

        while (!isUnique) {
          try {
            const [orgResult] = await connection.execute(
              'INSERT INTO organization (name) VALUES (?)',
              [finalOrgName],
            );
            orgId = orgResult.insertId;
            isUnique = true;
          } catch (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              suffix++;
              finalOrgName = `${orgNameToUse} ${suffix}`;
            } else {
              throw err;
            }
          }
        }

        // Create default roles for the new organization
        await connection.execute(
          'INSERT INTO role (org_id, name, description, access_level) VALUES (?, ?, ?, ?)',
          [orgId, 'Admin', 'System Administrator', 'admin'],
        );
        const [roleResult] = await connection.execute(
          'INSERT INTO role (org_id, name, description, access_level) VALUES (?, ?, ?, ?)',
          [orgId, 'Project Manager', 'Manages projects and resources', 'manager'],
        );
        roleId = roleResult.insertId;
        await connection.execute(
          'INSERT INTO role (org_id, name, description, access_level) VALUES (?, ?, ?, ?)',
          [orgId, 'Employee', 'Standard employee access', 'employee'],
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await connection.execute(
        'INSERT INTO user (org_id, role_id, employee_code, first_name, last_name, email, phone, password_hash, application_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          orgId,
          roleId,
          managerId,
          firstName,
          surname,
          email,
          phone,
          hashedPassword,
          'project_manager',
        ],
      );

      const newUser = await getUserById(result.insertId);

      const { password_hash, ...userWithoutPassword } = newUser;
      const token = generateToken(userWithoutPassword);

      res.json({
        success: true,
        token,
        user: {
          id: userWithoutPassword.id.toString(),
          firstName: userWithoutPassword.first_name,
          surname: userWithoutPassword.last_name,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone || '',
          role: userWithoutPassword.application_role === 'project_manager' ? 'pm' : 'employee',
          employeeCode: userWithoutPassword.employee_code,
          avatar:
            userWithoutPassword.avatar || `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register PM error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Register Employee endpoint
app.post('/api/auth/register/employee', async (req, res) => {
  try {
    const {
      firstName,
      surname,
      email,
      phone,
      employeeId,
      professionalRole,
      professionalRoleOther,
      inviteCode,
      password,
    } = req.body;

    console.log('Registration request received:', {
      firstName,
      surname,
      email,
      professionalRole,
      professionalRoleOther,
    });

    if (
      !firstName ||
      !surname ||
      !email ||
      !employeeId ||
      !professionalRole ||
      !inviteCode ||
      !password
    ) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate professional role
    const validProfessionalRoles = [
      'developer',
      'designer',
      'qa_engineer',
      'business_analyst',
      'other',
    ];
    console.log(
      'Validating professional role:',
      professionalRole,
      'against:',
      validProfessionalRoles,
    );
    if (!validProfessionalRoles.includes(professionalRole)) {
      return res.status(400).json({ success: false, error: 'Invalid professional role' });
    }

    // If professional role is 'other', validate that professionalRoleOther is provided
    if (professionalRole === 'other' && (!professionalRoleOther || !professionalRoleOther.trim())) {
      return res
        .status(400)
        .json({ success: false, error: 'Please specify your professional role' });
    }

    const connection = await pool.getConnection();
    try {
      // Validate invite code against database
      const [codeRows] = await connection.execute(
        'SELECT id, org_id, current_uses, max_uses FROM invite_code WHERE code = ? AND is_active = 1 AND expires_at > NOW()',
        [inviteCode],
      );

      if (codeRows.length === 0) {
        connection.release();
        return res.status(400).json({ success: false, error: 'Invalid or expired invite code' });
      }

      const inviteData = codeRows[0];
      const orgId = inviteData.org_id;

      if (inviteData.max_uses > 0 && inviteData.current_uses >= inviteData.max_uses) {
        connection.release();
        return res.status(400).json({ success: false, error: 'Invite code usage limit reached' });
      }

      // Increment invite code usage
      await connection.execute(
        'UPDATE invite_code SET current_uses = current_uses + 1 WHERE id = ?',
        [inviteData.id],
      );

      // Check if email already exists
      const [existingEmail] = await connection.execute('SELECT id FROM user WHERE email = ?', [
        email,
      ]);

      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // Check if employee ID already exists
      const [existingId] = await connection.execute('SELECT id FROM user WHERE employee_code = ?', [
        employeeId,
      ]);

      if (existingId.length > 0) {
        return res.status(400).json({ success: false, error: 'Employee ID already exists' });
      }

      // Get employee role ID (role_id for employee access level)
      const [roleRows] = await connection.execute(
        'SELECT id FROM role WHERE org_id = ? AND access_level = ? LIMIT 1',
        [orgId, 'employee'],
      );

      if (roleRows.length === 0) {
        return res.status(400).json({ success: false, error: 'Employee role not found' });
      }

      const roleId = roleRows[0].id;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user with professional role
      const [result] = await connection.execute(
        'INSERT INTO user (org_id, role_id, employee_code, first_name, last_name, email, phone, password_hash, professional_role, professional_role_other, application_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          orgId,
          roleId,
          employeeId,
          firstName,
          surname,
          email,
          phone,
          hashedPassword,
          professionalRole,
          professionalRoleOther || null,
          'employee',
        ],
      );

      const newUser = await getUserById(result.insertId);

      const { password_hash, ...userWithoutPassword } = newUser;
      const token = generateToken(userWithoutPassword);

      res.json({
        success: true,
        token,
        user: {
          id: userWithoutPassword.id.toString(),
          firstName: userWithoutPassword.first_name,
          surname: userWithoutPassword.last_name,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone || '',
          role: userWithoutPassword.application_role === 'project_manager' ? 'pm' : 'employee',
          professionalRole: userWithoutPassword.professional_role,
          professionalRoleOther: userWithoutPassword.professional_role_other,
          employeeCode: userWithoutPassword.employee_code,
          avatar:
            userWithoutPassword.avatar || `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`,
        },
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register Employee error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { role, identifier, email } = req.body;

    if (!identifier || !email) {
      return res.status(400).json({ success: false, error: 'Identifier and email are required' });
    }

    const user = await getUserByIdentifier(identifier);

    if (!user || user.email !== email) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // In production, send email with reset link
    res.json({ success: true, message: 'Reset link sent to your email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    // In production, verify token and update password
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update user profile endpoint
app.put('/api/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { firstName, surname, email, phone, avatar } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE user SET first_name = ?, last_name = ?, email = ?, phone = ?, avatar = ? WHERE id = ?',
        [firstName, surname, email, phone, avatar || null, userId],
      );

      // Fetch the updated user
      const [rows] = await connection.execute(
        'SELECT u.*, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id WHERE u.id = ?',
        [userId],
      );

      if (rows.length === 0) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const dbUser = rows[0];
      const updatedUser = {
        id: dbUser.id.toString(),
        employeeCode: dbUser.employee_code,
        firstName: dbUser.first_name,
        surname: dbUser.last_name,
        email: dbUser.email,
        phone: dbUser.phone,
        avatar: dbUser.avatar || `https://i.pravatar.cc/150?img=${dbUser.id}`,
        role: dbUser.application_role === 'project_manager' ? 'pm' : 'employee',
      };

      res.json({ success: true, user: updatedUser });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
// GET /api/employee/tasks/:id/subtasks - Get subtasks for a task
app.get('/api/employee/tasks/:id/subtasks', async (req, res) => {
  try {
    const taskId = req.params.id;

    const connection = await pool.getConnection();
    try {
      const [subtasks] = await connection.execute(
        'SELECT * FROM subtask WHERE task_id = ? ORDER BY created_at ASC',
        [taskId]
      );
      res.json({ success: true, subtasks });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get subtasks error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/employee/subtasks/:id - Update subtask completion status
app.put('/api/employee/subtasks/:id', async (req, res) => {
  try {
    const subtaskId = req.params.id;
    const { completed } = req.body;

    const connection = await pool.getConnection();
    try {
      // Update subtask completion status
      await connection.execute(
        'UPDATE subtask SET completed = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [completed ? 1 : 0, completed ? 'completed' : 'not-started', subtaskId]
      );

      // Get task_id to recalculate parent task progress
      const [subtask] = await connection.execute(
        'SELECT task_id FROM subtask WHERE id = ?',
        [subtaskId]
      );

      if (subtask && subtask.length > 0) {
        const taskId = subtask[0].task_id;

        // Get previous progress
        const [taskRows] = await connection.execute('SELECT progress FROM task WHERE id = ?', [taskId]);
        const previousProgress = taskRows.length > 0 ? taskRows[0].progress : 0;

        // Calculate new progress based on completed subtasks
        const [subtasks] = await connection.execute(
          'SELECT completed FROM subtask WHERE task_id = ?',
          [taskId]
        );

        const total = subtasks.length;
        const completedCount = subtasks.filter((s) => s.completed === 1).length;
        const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

        // Update parent task progress
        await connection.execute(
          'UPDATE task SET progress = ? WHERE id = ?',
          [progress, taskId]
        );
        
        await updateProjectProgress(connection, taskId);

        // Record progress update if changed
        if (progress !== previousProgress) {
          const userId = req.user?.id || 1;
          await connection.execute(
            'INSERT INTO progress_update (task_id, user_id, previous_progress, new_progress, notes) VALUES (?, ?, ?, ?, ?)',
            [taskId, userId, previousProgress, progress, 'Updated progress via subtask']
          );
        }

        res.json({
          success: true,
          subtask_id: subtaskId,
          task_progress: progress,
          completed_count: completedCount,
          total_count: total
        });
      } else {
        res.json({ success: true, subtask_id: subtaskId });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/employee/tasks/:id/subtasks - Create subtask for task
app.post('/api/employee/tasks/:id/subtasks', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title } = req.body;

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO subtask (task_id, title, status, completed, progress) VALUES (?, ?, ?, ?, ?)',
        [taskId, title, 'not-started', 0, 0]
      );

      // Get previous progress
      const [taskRows] = await connection.execute('SELECT progress FROM task WHERE id = ?', [taskId]);
      const previousProgress = taskRows.length > 0 ? taskRows[0].progress : 0;

      // Recalculate parent task progress
      const [subtasks] = await connection.execute(
        'SELECT completed FROM subtask WHERE task_id = ?',
        [taskId]
      );

      const total = subtasks.length;
      const completedCount = subtasks.filter((s) => s.completed === 1).length;
      const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      await connection.execute(
        'UPDATE task SET progress = ? WHERE id = ?',
        [progress, taskId]
      );
      
      await updateProjectProgress(connection, taskId);

      // Record progress update if changed
      if (progress !== previousProgress) {
        const userId = req.user?.id || 1;
        await connection.execute(
          'INSERT INTO progress_update (task_id, user_id, previous_progress, new_progress, notes) VALUES (?, ?, ?, ?, ?)',
          [taskId, userId, previousProgress, progress, 'Added new subtask']
        );
      }

      res.json({
        success: true,
        subtask_id: result.insertId,
        task_progress: progress
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/employee/subtasks/:id - Delete subtask
app.delete('/api/employee/subtasks/:id', async (req, res) => {
  try {
    const subtaskId = req.params.id;

    const connection = await pool.getConnection();
    try {
      // Get task_id before deleting
      const [subtask] = await connection.execute(
        'SELECT task_id FROM subtask WHERE id = ?',
        [subtaskId]
      );

      if (!subtask || subtask.length === 0) {
        return res.status(404).json({ success: false, error: 'Subtask not found' });
      }

      const taskId = subtask[0].task_id;

      // Delete the subtask
      await connection.execute('DELETE FROM subtask WHERE id = ?', [subtaskId]);

      // Recalculate parent task progress
      const [subtasks] = await connection.execute(
        'SELECT completed FROM subtask WHERE task_id = ?',
        [taskId]
      );

      const total = subtasks.length;
      const completedCount = subtasks.filter((s) => s.completed === 1).length;
      const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

      await connection.execute(
        'UPDATE task SET progress = ? WHERE id = ?',
        [progress, taskId]
      );
      
      await updateProjectProgress(connection, taskId);

      res.json({
        success: true,
        subtask_id: subtaskId,
        task_progress: progress
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Daily Tracker API Routes (Authentication removed for testing)
// GET /api/employee/daily-tracker/:userId - Get daily tracker entries for user
app.get('/api/employee/daily-tracker/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;

    const connection = await pool.getConnection();
    try {
      const [entries] = await connection.execute(
        'SELECT id, task_id, user_id, log_date, status, work_completed, comments, hours_spent, created_at, updated_at FROM daily_work_log WHERE user_id = ? ORDER BY log_date DESC',
        [userId]
      );
      res.json({ success: true, entries });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get daily tracker error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/employee/daily-tracker - Create daily tracker entry
app.post('/api/employee/daily-tracker', async (req, res) => {
  try {
    const { employee_id, title, description, date, progress, status, project_name, task_id } = req.body;

    const connection = await pool.getConnection();
    try {
      // Get a valid task_id if not provided
      let taskId = task_id;
      if (!taskId) {
        const [tasks] = await connection.execute(
          'SELECT id FROM task WHERE created_by = ? LIMIT 1',
          [employee_id]
        );
        taskId = tasks.length > 0 ? tasks[0].id : null;
      }
      
      let taskStatus = status || 'not-started';
      if (taskStatus === 'pending') taskStatus = 'not-started';
      
      let logStatus = taskStatus;
      if (logStatus === 'not-started' || logStatus === 'pending') logStatus = 'in-progress';
      else if (!['completed', 'partially-completed', 'in-progress', 'blocked'].includes(logStatus)) {
        logStatus = 'in-progress';
      }

      // If still no task_id, create a dummy task first
      if (!taskId) {
        // Find a valid project_id to associate the task with
        const [projects] = await connection.execute('SELECT id FROM project LIMIT 1');
        const projectId = projects.length > 0 ? projects[0].id : 1;

        const [dummyTask] = await connection.execute(
          'INSERT INTO task (created_by, project_id, title, description, status, priority, progress, deadline, is_self_assigned) VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), 1)',
          [employee_id, projectId, title, description, taskStatus, 'medium', progress || 0]
        );
        taskId = dummyTask.insertId;
      }

      const [result] = await connection.execute(
        'INSERT INTO daily_work_log (user_id, task_id, work_completed, comments, log_date, hours_spent, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [employee_id, taskId, title, description, date, progress, logStatus]
      );
      res.json({ success: true, id: result.insertId });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create daily tracker error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/employee/daily-tracker/:id - Update daily tracker entry
app.put('/api/employee/daily-tracker/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, date, progress, status, project_name } = req.body;

    const connection = await pool.getConnection();
    try {
      // Don't update log_date to avoid unique constraint conflicts
      await connection.execute(
        'UPDATE daily_work_log SET work_completed = ?, comments = ?, hours_spent = ?, status = ? WHERE id = ?',
        [title, description, progress, status, id]
      );
      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update daily tracker error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// DELETE /api/employee/daily-tracker/:id - Delete daily tracker entry
app.delete('/api/employee/daily-tracker/:id', async (req, res) => {
  try {
    const id = req.params.id;

    const connection = await pool.getConnection();
    try {
      await connection.execute('DELETE FROM daily_work_log WHERE id = ?', [id]);
      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Delete daily tracker error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get all users endpoint (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      let rows;
      try {
        [rows] = await connection.execute(
          'SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email, u.phone, u.points, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id',
        );
      } catch (colErr) {
        [rows] = await connection.execute(
          'SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email, u.phone, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id',
        );
        rows.forEach((r) => {
          r.points = 0;
        });
      }
      res.json({ success: true, users: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/pm/reviews/all - Get all completed reviewed tasks for PM (Authentication removed for testing)
app.get('/api/pm/reviews/all', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [reviews] = await connection.execute(
        `
        SELECT t.id, t.title, t.status as task_status, t.progress,
               p.name as project_name,
               tr.completion_comment, tr.submitted_at, tr.status as review_status,
               tr.review_comment, tr.pm_final_comment,
               u.first_name as reviewer_first_name, u.last_name as reviewer_last_name,
               u2.first_name as task_owner_first_name, u2.last_name as task_owner_last_name,
               tr.task_owner_points, tr.reviewer_points
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN task_review tr ON tr.task_id = t.id
        LEFT JOIN user u ON u.id = tr.reviewer_id
        LEFT JOIN user u2 ON u2.id = tr.task_owner_id
        WHERE tr.status = 'review-done' OR tr.status = 'finalized'
        ORDER BY tr.submitted_at DESC
        `
      );
      res.json({ success: true, reviews });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get PM reviews error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/pm/tasks/completed - Get all completed tasks for PM (Authentication removed for testing)
app.get('/api/pm/tasks/completed', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [tasks] = await connection.execute(
        `
        SELECT t.*, p.name AS project_name, p.color AS project_color,
          u.first_name as assigned_first_name, u.last_name as assigned_last_name, u.employee_code,
          DATEDIFF(t.deadline, CURDATE()) AS days_until_deadline
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN task_assignment ta ON ta.task_id = t.id AND ta.is_active = 1
        JOIN user u ON u.id = ta.user_id
        WHERE t.status = 'completed'
        ORDER BY t.completed_at DESC
        `
      );
      res.json({ success: true, tasks });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get PM completed tasks error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/pm/tasks/:id/review-status - Get review status for a specific task
app.get('/api/pm/tasks/:id/review-status', async (req, res) => {
  try {
    const taskId = req.params.id;
    const connection = await pool.getConnection();
    try {
      const [reviews] = await connection.execute(
        `SELECT tr.status, u.first_name, u.last_name 
         FROM task_review tr 
         LEFT JOIN user u ON u.id = tr.reviewer_id 
         WHERE tr.task_id = ? 
         ORDER BY tr.submitted_at DESC 
         LIMIT 1`,
        [taskId]
      );

      if (reviews && reviews.length > 0) {
        const review = reviews[0];
        res.json({
          success: true,
          review_status: review.status,
          reviewer_name: `${review.first_name} ${review.last_name}`
        });
      } else {
        res.json({
          success: true,
          review_status: null,
          reviewer_name: null
        });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get task review status error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/pm/employee-performance/:userId - Get performance data for a specific employee
app.get('/api/pm/employee-performance/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const connection = await pool.getConnection();
    
    try {
      // 1. Task Statistics (Status Breakdown)
      const [statusRows] = await connection.execute(
        `SELECT t.status, COUNT(*) as count 
         FROM task t 
         JOIN task_assignment ta ON t.id = ta.task_id 
         WHERE ta.user_id = ? AND ta.is_active = 1
         GROUP BY t.status`,
        [userId]
      );
      
      const taskStats = {
        'completed': 0,
        'in-progress': 0,
        'in-review': 0,
        'not-started': 0,
        'blocked': 0
      };
      
      statusRows.forEach(row => {
        taskStats[row.status] = row.count;
      });

      // 2. Total, Completed, and Overdue Tasks
      const [taskAggRows] = await connection.execute(
        `SELECT 
           COUNT(*) as totalTasks, 
           SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completedTasks, 
           SUM(CASE WHEN t.status != 'completed' AND t.deadline < CURDATE() THEN 1 ELSE 0 END) as overdueTasks
         FROM task t 
         JOIN task_assignment ta ON t.id = ta.task_id 
         WHERE ta.user_id = ? AND ta.is_active = 1`,
        [userId]
      );
      
      const totalTasks = taskAggRows[0].totalTasks || 0;
      const completedTasks = taskAggRows[0].completedTasks || 0;
      const overdueTasks = taskAggRows[0].overdueTasks || 0;

      // 3. Hours Logged & Utilization
      const [analyticsRows] = await connection.execute(
        `SELECT total_hours_logged, total_expected_effort
         FROM vw_employee_analytics
         WHERE user_id = ?`,
        [userId]
      );
      
      const hoursLogged = analyticsRows.length > 0 ? parseFloat(analyticsRows[0].total_hours_logged) : 0;
      const expectedEffort = analyticsRows.length > 0 ? parseFloat(analyticsRows[0].total_expected_effort) : 0;
      const utilization = expectedEffort > 0 ? Math.round((hoursLogged / expectedEffort) * 100) : 0;

      // 4. Weekly Progress (Last 8 Weeks)
      const [weeklyRows] = await connection.execute(
        `SELECT 
           YEARWEEK(log_date, 1) as week_num, 
           SUM(hours_spent) as hours 
         FROM daily_work_log 
         WHERE user_id = ? AND log_date >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK) 
         GROUP BY YEARWEEK(log_date, 1) 
         ORDER BY week_num ASC`,
        [userId]
      );
      
      const weeklyProgress = weeklyRows.map(r => ({
        week: 'W' + String(r.week_num).slice(-2),
        hours: parseFloat(r.hours)
      }));
      
      if (weeklyProgress.length === 0) {
         weeklyProgress.push({ week: 'Current', hours: 0 });
      }

      // 5. Recent Tasks
      const [recentTasksRows] = await connection.execute(
        `SELECT t.id, t.title, p.name as project_name, t.status 
         FROM task t 
         JOIN task_assignment ta ON t.id = ta.task_id 
         JOIN project p ON t.project_id = p.id 
         WHERE ta.user_id = ? AND ta.is_active = 1
         ORDER BY t.updated_at DESC 
         LIMIT 5`,
        [userId]
      );

      // 6. Overall Score
      let overallScore = 40;
      if (totalTasks > 0) {
        overallScore += (completedTasks / totalTasks) * 40;
        overallScore += Math.max(0, 20 - (overdueTasks / totalTasks) * 20);
      } else {
        overallScore = 75; 
      }
      overallScore = Math.round(overallScore);

      res.json({
        success: true,
        performance: {
          overallScore,
          taskStats,
          weeklyProgress,
          totalTasks,
          completedTasks,
          overdueTasks,
          hoursLogged,
          utilization,
          recentTasks: recentTasksRows
        }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/employee/tasks/:id - Update task (Authentication removed for testing)
app.put('/api/employee/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { progress, status, actual_effort, hours_spent } = req.body;

    const connection = await pool.getConnection();
    try {
      // Build dynamic update query to handle undefined values
      const updates = [];
      const params = [];

      if (progress !== undefined) {
        updates.push('progress = ?');
        params.push(progress);
      }
      if (status !== undefined) {
        let taskStatus = status;
        if (taskStatus === 'pending') taskStatus = 'not-started';
        updates.push('status = ?');
        params.push(taskStatus);
      }
      if (actual_effort !== undefined) {
        updates.push('actual_effort = ?');
        params.push(actual_effort);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, error: 'No fields to update' });
      }

      params.push(taskId);
      await connection.execute(
        `UPDATE task SET ${updates.join(', ')} WHERE id = ?`,
        params
      );

      // If hours_spent provided, log it
      if (hours_spent && hours_spent > 0) {
        const userId = req.body.user_id || 1; // Mock user ID for testing
        
        let logStatus = status || 'in-progress';
        if (logStatus === 'not-started' || logStatus === 'pending') logStatus = 'in-progress';
        else if (!['completed', 'partially-completed', 'in-progress', 'blocked'].includes(logStatus)) {
          logStatus = 'in-progress';
        }
        
        await connection.execute(
          `INSERT INTO daily_work_log (user_id, task_id, hours_spent, work_completed, status, log_date) VALUES (?, ?, ?, ?, ?, CURDATE())`,
          [userId, taskId, hours_spent, `Updated progress to ${progress}%`, logStatus]
        );
      }

      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update employee task error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Employee API Routes (Protected)
app.use('/api/employee', authenticateToken, requireRole('employee'));

// GET /api/tasks/employee/:id - Get tasks assigned to employee
app.get('/api/tasks/employee/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const connection = await pool.getConnection();
    try {
      const [tasks] = await connection.execute(
        `
        SELECT t.*, p.name AS project_name, p.color AS project_color,
          DATEDIFF(t.deadline, CURDATE()) AS days_until_deadline,
          CASE
            WHEN t.status = 'completed' THEN 'completed'
            WHEN CURDATE() > t.deadline THEN 'overdue'
            WHEN DATEDIFF(t.deadline, CURDATE()) <= 3 AND t.progress < 80 THEN 'critical-risk'
            WHEN DATEDIFF(t.deadline, CURDATE()) <= 7 AND t.progress < 60 THEN 'at-risk'
            ELSE 'on-track'
          END AS calculated_risk
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN task_assignment ta ON ta.task_id = t.id
        WHERE ta.user_id = ? AND ta.is_active = 1
        ORDER BY t.deadline ASC
        `,
        [employeeId]
      );

      // Get assignees for each task
      for (const task of tasks) {
        const [assignees] = await connection.execute(
          `
          SELECT u.id, u.first_name, u.last_name, u.avatar, u.employee_code
          FROM task_assignment ta
          JOIN user u ON u.id = ta.user_id
          WHERE ta.task_id = ? AND ta.is_active = 1
          `,
          [task.id]
        );
        task.assignees = assignees;
      }

      res.json({ success: true, tasks });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get employee tasks error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/pm/tasks/reassign - Reassign task from one employee to another
app.post('/api/pm/tasks/reassign', async (req, res) => {
  try {
    const { taskId, fromUserId, toUserId } = req.body;
    const connection = await pool.getConnection();
    try {
      // Delete old assignment
      await connection.execute(
        'DELETE FROM task_assignment WHERE task_id = ? AND user_id = ?',
        [taskId, fromUserId]
      );

      // Create new assignment
      await connection.execute(
        'INSERT INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES (?, ?, 1, 1)',
        [taskId, toUserId]
      );

      res.json({ success: true, message: 'Task reassigned successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Reassign task error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/employee/work-logs/:id - Get work logs for employee
app.get('/api/employee/work-logs/:id', async (req, res) => {
  try {
    const employeeId = req.params.id;
    const connection = await pool.getConnection();
    try {
      const [logs] = await connection.execute(
        `
        SELECT dwl.*, t.title AS task_title, p.name AS project_name, p.color AS project_color
        FROM daily_work_log dwl
        JOIN task t ON t.id = dwl.task_id
        JOIN project p ON p.id = t.project_id
        WHERE dwl.user_id = ?
        ORDER BY dwl.log_date DESC
        `,
        [employeeId]
      );
      res.json({ success: true, logs });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get employee work logs error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/employee/work-log - Create work log entry
app.post('/api/employee/work-log', async (req, res) => {
  try {
    const { task_id, hours_spent, work_completed, status, user_id } = req.body;
    const userId = user_id || 1; // Mock user ID for testing

    if (!task_id || !hours_spent) {
      return res.status(400).json({ success: false, error: 'task_id and hours_spent are required' });
    }

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO daily_work_log (user_id, task_id, hours_spent, work_completed, status, log_date) VALUES (?, ?, ?, ?, ?, CURDATE())`,
        [userId, task_id, hours_spent, work_completed || '', status || 'completed']
      );

      res.json({ success: true, logId: result.insertId });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create work log error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/employee/tasks - Create self-assigned task
app.post('/api/employee/tasks', async (req, res) => {
  try {
    const { title, description, project_id, priority, deadline, expected_effort, user_id } = req.body;
    const userId = user_id || 1; // Mock user ID for testing

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `INSERT INTO task (project_id, created_by, title, description, priority, deadline, expected_effort, status, is_self_assigned) VALUES (?, ?, ?, ?, ?, ?, ?, 'not-started', 1)`,
        [project_id, userId, title, description, priority, deadline, expected_effort]
      );

      // Auto-assign to the employee
      await connection.execute(
        `INSERT INTO task_assignment (task_id, user_id, assigned_by, is_active) VALUES (?, ?, ?, 1)`,
        [result.insertId, userId, userId]
      );

      res.json({ success: true, taskId: result.insertId });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Create employee task error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/employee/tasks/:id - Update task
app.put('/api/employee/tasks/:id', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { progress, status, actual_effort, hours_spent } = req.body;

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `UPDATE task SET progress = ?, status = ?, actual_effort = ? WHERE id = ?`,
        [progress, status, actual_effort, taskId]
      );
      
      await updateProjectProgress(connection, taskId);

      // If hours_spent provided, log it
      if (hours_spent && hours_spent > 0) {
        const userId = req.body.user_id || 1; // Mock user ID for testing
        await connection.execute(
          `INSERT INTO daily_work_log (user_id, task_id, hours_spent, work_completed, status, log_date) VALUES (?, ?, ?, ?, ?, CURDATE())`,
          [userId, taskId, hours_spent, `Updated progress to ${progress}%`, status || 'in-progress']
        );
      }

      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update employee task error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/employee/tasks/:id/comment - Add comment to task
app.post('/api/employee/tasks/:id/comment', async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'INSERT INTO task_comment (task_id, user_id, content, is_sticky) VALUES (?, ?, ?, 0)',
        [taskId, userId, content]
      );
      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Add employee comment error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// POST /api/employee/tasks/:id/submit-review - Submit task for review
app.post('/api/employee/tasks/:id/submit-review', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { completion_comment, reviewer_id } = req.body;
    const task_owner_id = req.body.task_owner_id || req.user?.id;

    const connection = await pool.getConnection();
    try {
      // Verify task exists
      const [tasks] = await connection.execute('SELECT id FROM task WHERE id = ?', [taskId]);
      if (tasks.length === 0) {
        return res.status(404).json({ success: false, error: 'Task not found' });
      }

      // Update task status
      await connection.execute(
        `UPDATE task SET status = 'in-review' WHERE id = ?`,
        [taskId]
      );

      // Create task review record with actual task owner ID from request (the assigned employee)
      await connection.execute(
        `INSERT INTO task_review (task_id, task_owner_id, reviewer_id, completion_comment, status) VALUES (?, ?, ?, ?, 'pending')`,
        [taskId, task_owner_id, reviewer_id, completion_comment]
      );

      res.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Submit task review error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PUT /api/employee/reviews/:id/complete - Complete review
app.put('/api/employee/reviews/:id/complete', async (req, res) => {
  try {
    const taskId = req.params.id;
    const { review_comment } = req.body;

    const connection = await pool.getConnection();
    try {
      // Get review details
      const [reviews] = await connection.execute(
        'SELECT reviewer_id, task_owner_id FROM task_review WHERE task_id = ? AND status = "pending"',
        [taskId]
      );

      if (reviews.length === 0) {
        return res.status(404).json({ success: false, error: 'Review not found' });
      }

      const review = reviews[0];

      // Update task status to completed
      await connection.execute(
        `UPDATE task SET status = 'completed', completed_at = NOW() WHERE id = ?`,
        [taskId]
      );

      // Update review status and add comment
      await connection.execute(
        `UPDATE task_review SET status = 'review-done', review_comment = ?, completed_at = NOW() WHERE task_id = ?`,
        [review_comment, taskId]
      );

      // Award points to reviewer (5 points)
      await connection.execute(
        `UPDATE user SET points = COALESCE(points, 0) + 5 WHERE id = ?`,
        [review.reviewer_id]
      );

      // Award points to task owner (10 points)
      await connection.execute(
        `UPDATE user SET points = COALESCE(points, 0) + 10 WHERE id = ?`,
        [review.task_owner_id]
      );

      // Update task_review with points awarded
      await connection.execute(
        `UPDATE task_review SET reviewer_points = 5, task_owner_points = 10 WHERE task_id = ?`,
        [taskId]
      );

      res.json({ success: true, reviewerPoints: 5, taskOwnerPoints: 10 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Complete review error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/employee/reviews/pending - Get pending reviews for user
app.get('/api/employee/reviews/pending', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const connection = await pool.getConnection();
    try {
      const [reviews] = await connection.execute(
        `
        SELECT t.id, t.title, t.description, t.expected_effort, t.status as task_status,
               p.name as project_name, p.color as project_color,
               u.id as task_owner_id, u.first_name as task_owner_first_name, u.last_name as task_owner_last_name, u.avatar as task_owner_avatar,
               tr.id as review_id, tr.completion_comment, tr.submitted_at
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN task_review tr ON tr.task_id = t.id
        JOIN user u ON u.id = tr.task_owner_id
        WHERE t.status = 'in-review'
        AND tr.reviewer_id = ?
        AND tr.status = 'pending'
        ORDER BY tr.submitted_at DESC
        `,
        [userId]
      );
      res.json({ success: true, reviews });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// GET /api/employee/reviews/history - Get review history for user
app.get('/api/employee/reviews/history', async (req, res) => {
  try {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const connection = await pool.getConnection();
    try {
      const [reviews] = await connection.execute(
        `
        SELECT t.id, t.title, t.status as task_status, t.progress,
               p.name as project_name,
               tr.status as review_status, tr.review_comment, tr.pm_final_comment, tr.submitted_at,
               tr.task_owner_points
        FROM task t
        JOIN project p ON p.id = t.project_id
        JOIN task_review tr ON tr.task_id = t.id
        WHERE tr.reviewer_id = ? OR tr.task_owner_id = ?
        ORDER BY tr.submitted_at DESC
        `,
        [userId, userId]
      );
      res.json({ success: true, reviews });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get review history error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PM API Routes (Authentication removed for testing)
app.use('/api/pm/dashboard', dashboardRoutes(pool));
app.use('/api/pm/projects', projectRoutes(pool));
app.use('/api/pm/tasks', taskRoutes(pool));
app.use('/api/pm/resources', resourceRoutes(pool));
app.use('/api/pm/analytics', analyticsRoutes(pool));
app.use('/api/pm/org', organisationRoutes(pool));
app.use('/api/pm/notifications', notificationRoutes(pool));
app.use('/api/pm/calendar', calendarRoutes(pool));
app.use('/api/pm/schedule', schedulingRoutes(pool));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
