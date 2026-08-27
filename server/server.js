import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
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
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool(dbConfig);

const PASSWORD_RESET_TTL_MINUTES = 30;
const normalizeEmail = (value) => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const validPassword = (value) => typeof value === 'string' && value.length >= 8;
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const requestError = (status, message) => Object.assign(new Error(message), { status });
const duplicateMessage = (error) => error?.code === 'ER_DUP_ENTRY';

// Test database connection
pool.getConnection()
  .then(async (connection) => {
    console.log('Connected to MySQL database');
    try {
      await connection.query('ALTER TABLE user ADD COLUMN avatar VARCHAR(512) NULL;');
      console.log('Added avatar column to user table');
    } catch (e) {
      // Ignore error if column already exists
    }
    
    try {
      await connection.query('ALTER TABLE task ADD COLUMN resources_needed INT NOT NULL DEFAULT 1;');
      console.log('Added resources_needed column to task table');
    } catch (e) {
      // Ignore error if column already exists
    }
    try {
      await connection.query('ALTER TABLE user ADD COLUMN password_reset_token_hash CHAR(64) NULL;');
    } catch (e) {
      // Column already exists on upgraded databases.
    }
    try {
      await connection.query('ALTER TABLE user ADD COLUMN password_reset_expires_at DATETIME NULL;');
    } catch (e) {
      // Columns already exist on upgraded databases.
    }
    connection.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err);
  });

// Helper function to get user by employee code or email
async function getUserByIdentifier(identifier) {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT u.*, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id WHERE u.employee_code = ? OR u.email = ?',
      [identifier, identifier]
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
      [userId]
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
      return res.status(400).json({ success: false, error: 'Identifier and password are required' });
    }

    const user = await getUserByIdentifier(identifier);

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
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
        avatar: userWithoutPassword.avatar || `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Register Project Manager endpoint
app.post('/api/auth/register/pm', async (req, res) => {
  try {
    const { firstName, surname, email, phone, managerId, password, organisationName, inviteCode } = req.body;

    if (!firstName || !surname || !email || !managerId || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Check if email already exists
      const [existingEmail] = await connection.execute(
        'SELECT id FROM user WHERE email = ?',
        [email]
      );

      if (existingEmail.length > 0) {
        throw requestError(400, 'Email already registered');
      }

      // Check if manager ID already exists
      const [existingId] = await connection.execute(
        'SELECT id FROM user WHERE employee_code = ?',
        [managerId]
      );

      if (existingId.length > 0) {
        throw requestError(400, 'Manager ID already exists');
      }

      let orgId;
      let roleId;
      let inviteId = null;

      if (inviteCode) {
        // Validate invite code against database
        const [codeRows] = await connection.execute(
          'SELECT id, org_id, current_uses, max_uses FROM invite_code WHERE code = ? AND is_active = 1 AND expires_at > NOW() FOR UPDATE',
          [inviteCode]
        );

        if (codeRows.length === 0) {
          throw requestError(400, 'Invalid or expired invite code');
        }
        
        const inviteData = codeRows[0];
        inviteId = inviteData.id;
        if (inviteData.max_uses > 0 && inviteData.current_uses >= inviteData.max_uses) {
          throw requestError(400, 'Invite code usage limit reached');
        }

        // Increment invite code usage
        orgId = inviteData.org_id;

        // Get manager role ID for this org
        const [roleRows] = await connection.execute(
          'SELECT id FROM role WHERE org_id = ? AND access_level = ? LIMIT 1',
          [orgId, 'manager']
        );

        if (roleRows.length === 0) {
          throw requestError(400, 'Manager role not found for this organization');
        }
        roleId = roleRows[0].id;
      } else {
        // Create new organization
        const orgNameToUse = organisationName && organisationName.trim() ? organisationName.trim() : `${firstName}'s Organization`;
        
        let finalOrgName = orgNameToUse;
        let isUnique = false;
        let suffix = 0;
        
        while (!isUnique) {
          try {
            const [orgResult] = await connection.execute(
              'INSERT INTO organization (name) VALUES (?)',
              [finalOrgName]
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
          [orgId, 'Admin', 'System Administrator', 'admin']
        );
        const [roleResult] = await connection.execute(
          'INSERT INTO role (org_id, name, description, access_level) VALUES (?, ?, ?, ?)',
          [orgId, 'Project Manager', 'Manages projects and resources', 'manager']
        );
        roleId = roleResult.insertId;
        await connection.execute(
          'INSERT INTO role (org_id, name, description, access_level) VALUES (?, ?, ?, ?)',
          [orgId, 'Employee', 'Standard employee access', 'employee']
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      const [result] = await connection.execute(
        'INSERT INTO user (org_id, role_id, employee_code, first_name, last_name, email, phone, password_hash, application_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [orgId, roleId, managerId, firstName, surname, email, phone, hashedPassword, 'project_manager']
      );

      if (inviteId) {
        const [usage] = await connection.execute('UPDATE invite_code SET current_uses = current_uses + 1 WHERE id = ? AND (max_uses = 0 OR current_uses < max_uses)', [inviteId]);
        if (usage.affectedRows !== 1) throw requestError(400, 'Invite code usage limit reached');
      }
      await connection.commit();

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
          avatar: userWithoutPassword.avatar || `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register PM error:', error);
    res.status(error.status || (duplicateMessage(error) ? 409 : 500)).json({ success: false, error: error.status ? error.message : duplicateMessage(error) ? 'Email or manager ID already exists' : 'Server error' });
  }
});

// Register Employee endpoint
app.post('/api/auth/register/employee', async (req, res) => {
  try {
    const { firstName, surname, email, phone, employeeId, professionalRole, professionalRoleOther, inviteCode, password } = req.body;

    if (!firstName || !surname || !email || !employeeId || !professionalRole || !inviteCode || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate professional role
    const validProfessionalRoles = ['developer', 'designer', 'qa_engineer', 'business_analyst', 'other'];
    if (!validProfessionalRoles.includes(professionalRole)) {
      return res.status(400).json({ success: false, error: 'Invalid professional role' });
    }

    // If professional role is 'other', validate that professionalRoleOther is provided
    if (professionalRole === 'other' && (!professionalRoleOther || !professionalRoleOther.trim())) {
      return res.status(400).json({ success: false, error: 'Please specify your professional role' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      // Validate invite code against database
      const [codeRows] = await connection.execute(
        'SELECT id, org_id, current_uses, max_uses FROM invite_code WHERE code = ? AND is_active = 1 AND expires_at > NOW() FOR UPDATE',
        [inviteCode]
      );

      if (codeRows.length === 0) {
        throw requestError(400, 'Invalid or expired invite code');
      }
      
      const inviteData = codeRows[0];
      const orgId = inviteData.org_id;

      if (inviteData.max_uses > 0 && inviteData.current_uses >= inviteData.max_uses) {
        throw requestError(400, 'Invite code usage limit reached');
      }

      // Check if email already exists
      const [existingEmail] = await connection.execute(
        'SELECT id FROM user WHERE email = ?',
        [email]
      );

      if (existingEmail.length > 0) {
        throw requestError(400, 'Email already registered');
      }

      // Check if employee ID already exists
      const [existingId] = await connection.execute(
        'SELECT id FROM user WHERE employee_code = ?',
        [employeeId]
      );

      if (existingId.length > 0) {
        throw requestError(400, 'Employee ID already exists');
      }

      // Get employee role ID (role_id for employee access level)
      const [roleRows] = await connection.execute(
        'SELECT id FROM role WHERE org_id = ? AND access_level = ? LIMIT 1',
        [orgId, 'employee']
      );

      if (roleRows.length === 0) {
        throw requestError(400, 'Employee role not found');
      }

      const roleId = roleRows[0].id;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user with professional role
      const [result] = await connection.execute(
        'INSERT INTO user (org_id, role_id, employee_code, first_name, last_name, email, phone, password_hash, professional_role, professional_role_other, application_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [orgId, roleId, employeeId, firstName, surname, email, phone, hashedPassword, professionalRole, professionalRoleOther || null, 'employee']
      );

      const [usage] = await connection.execute('UPDATE invite_code SET current_uses = current_uses + 1 WHERE id = ? AND (max_uses = 0 OR current_uses < max_uses)', [inviteData.id]);
      if (usage.affectedRows !== 1) throw requestError(400, 'Invite code usage limit reached');
      await connection.commit();

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
          avatar: userWithoutPassword.avatar || `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`
        }
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Register Employee error:', error);
    res.status(error.status || (duplicateMessage(error) ? 409 : 500)).json({ success: false, error: error.status ? error.message : duplicateMessage(error) ? 'Email or employee ID already exists' : 'Server error' });
  }
});

// Forgot password endpoint
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier, email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!identifier || !validEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Identifier and email are required' });
    }

    const user = await getUserByIdentifier(identifier);

    if (user && normalizeEmail(user.email) === normalizedEmail) {
      const resetToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = hashResetToken(resetToken);
      const connection = await pool.getConnection();
      try {
        await connection.execute(`UPDATE user SET password_reset_token_hash = ?, password_reset_expires_at = DATE_ADD(NOW(), INTERVAL ${PASSWORD_RESET_TTL_MINUTES} MINUTE) WHERE id = ?`, [tokenHash, user.id]);
      } finally {
        connection.release();
      }
      // Email delivery is intentionally not attempted: no mail service exists in this project.
    }

    res.json({ success: true, message: 'If the account exists, a reset link will be sent shortly' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Reset password endpoint
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !validPassword(newPassword)) {
      return res.status(400).json({ success: false, error: 'New password is required' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [users] = await connection.execute('SELECT id FROM user WHERE password_reset_token_hash = ? AND password_reset_expires_at > NOW() FOR UPDATE', [hashResetToken(token)]);
      if (users.length !== 1) {
        await connection.rollback();
        return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
      }
      const passwordHash = await bcrypt.hash(newPassword, 12);
      const [result] = await connection.execute('UPDATE user SET password_hash = ?, password_reset_token_hash = NULL, password_reset_expires_at = NULL WHERE id = ?', [passwordHash, users[0].id]);
      if (result.affectedRows !== 1) {
        await connection.rollback();
        return res.status(500).json({ success: false, error: 'Password reset failed' });
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Update user profile endpoint
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    if (!/^\d+$/.test(userId) || Number(userId) !== Number(req.user.id)) {
      return res.status(403).json({ success: false, error: 'You may only update your own profile' });
    }
    const { firstName, surname, email, phone, avatar } = req.body;
    const normalizedEmail = normalizeEmail(email);
    if (!firstName?.trim() || !surname?.trim() || !validEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, error: 'Valid first name, surname, and email are required' });
    }
    if (phone != null && (typeof phone !== 'string' || phone.length > 20) || avatar != null && (typeof avatar !== 'string' || avatar.length > 512)) {
      return res.status(400).json({ success: false, error: 'Invalid profile field' });
    }
    
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        'UPDATE user SET first_name = ?, last_name = ?, email = ?, phone = ?, avatar = ? WHERE id = ?',
        [firstName.trim(), surname.trim(), normalizedEmail, phone?.trim() || null, avatar || null, userId]
      );
      
      // Fetch the updated user
      const [rows] = await connection.execute(
        'SELECT u.*, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id WHERE u.id = ?',
        [userId]
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
        role: dbUser.application_role === 'project_manager' ? 'pm' : 'employee'
      };
      
      res.json({ success: true, user: updatedUser });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Update user error:', error);
    res.status(duplicateMessage(error) ? 409 : 500).json({ success: false, error: duplicateMessage(error) ? 'Email already registered' : 'Server error' });
  }
});
// Get all users endpoint (for testing)
app.get('/api/users', authenticateToken, requireRole('pm'), async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email, u.phone, u.avatar, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id WHERE u.org_id = ?',
        [req.user.org_id]
      );
      res.json({ success: true, users: rows });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// PM API Routes (Protected)
app.use('/api/pm', authenticateToken, requireRole('pm'));
app.use('/api/pm/dashboard', dashboardRoutes(pool));
app.use('/api/pm/projects', projectRoutes(pool));
app.use('/api/pm/tasks', taskRoutes(pool));
app.use('/api/pm/resources', resourceRoutes(pool));
app.use('/api/pm/analytics', analyticsRoutes(pool));
app.use('/api/pm/org', organisationRoutes(pool));
app.use('/api/pm/notifications', notificationRoutes(pool));
app.use('/api/notifications', authenticateToken, notificationRoutes(pool));
app.use('/api/pm/calendar', calendarRoutes(pool));
app.use('/api/pm/schedule', schedulingRoutes(pool));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
