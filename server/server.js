import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import bcrypt from 'bcrypt';
import { dbConfig } from './db.config.js';

const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Connected to MySQL database');
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

    // Verify password (using bcrypt for hashed passwords, or plain text comparison for now)
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    // For testing with plain text passwords (remove in production)
    const plainTextMatch = password === user.password_hash;

    if (!passwordMatch && !plainTextMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Return user data without password
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      user: {
        id: userWithoutPassword.id.toString(),
        firstName: userWithoutPassword.first_name,
        surname: userWithoutPassword.last_name,
        email: userWithoutPassword.email,
        phone: userWithoutPassword.phone || '',
        role: userWithoutPassword.application_role === 'project_manager' ? 'pm' : 'employee',
        employeeCode: userWithoutPassword.employee_code,
        avatar: `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`
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
    const { firstName, surname, email, phone, managerId, password } = req.body;

    if (!firstName || !surname || !email || !managerId || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const connection = await pool.getConnection();
    try {
      // Check if email already exists
      const [existingEmail] = await connection.execute(
        'SELECT id FROM user WHERE email = ?',
        [email]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // Check if manager ID already exists
      const [existingId] = await connection.execute(
        'SELECT id FROM user WHERE employee_code = ?',
        [managerId]
      );

      if (existingId.length > 0) {
        return res.status(400).json({ success: false, error: 'Manager ID already exists' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user (assuming role_id 2 is Project Manager based on schema)
      const [result] = await connection.execute(
        'INSERT INTO user (org_id, role_id, employee_code, first_name, last_name, email, phone, password_hash, application_role) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [1, 2, managerId, firstName, surname, email, phone, hashedPassword, 'project_manager']
      );

      const newUser = await getUserById(result.insertId);

      const { password_hash, ...userWithoutPassword } = newUser;

      res.json({
        success: true,
        user: {
          id: userWithoutPassword.id.toString(),
          firstName: userWithoutPassword.first_name,
          surname: userWithoutPassword.last_name,
          email: userWithoutPassword.email,
          phone: userWithoutPassword.phone || '',
          role: userWithoutPassword.application_role === 'project_manager' ? 'pm' : 'employee',
          employeeCode: userWithoutPassword.employee_code,
          avatar: `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`
        }
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
    const { firstName, surname, email, phone, employeeId, professionalRole, professionalRoleOther, inviteCode, password } = req.body;

    console.log('Registration request received:', { firstName, surname, email, professionalRole, professionalRoleOther });

    if (!firstName || !surname || !email || !employeeId || !professionalRole || !inviteCode || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate professional role
    const validProfessionalRoles = ['developer', 'designer', 'qa_engineer', 'business_analyst', 'other'];
    console.log('Validating professional role:', professionalRole, 'against:', validProfessionalRoles);
    if (!validProfessionalRoles.includes(professionalRole)) {
      return res.status(400).json({ success: false, error: 'Invalid professional role' });
    }

    // If professional role is 'other', validate that professionalRoleOther is provided
    if (professionalRole === 'other' && (!professionalRoleOther || !professionalRoleOther.trim())) {
      return res.status(400).json({ success: false, error: 'Please specify your professional role' });
    }

    // Validate invite code (in production, check against database)
    const validInviteCodes = ['TASKY2024', 'WELCOME2024', 'TEAM2024', 'JOIN2024'];
    if (!validInviteCodes.includes(inviteCode)) {
      return res.status(400).json({ success: false, error: 'Invalid or expired invite code' });
    }

    const connection = await pool.getConnection();
    try {
      // Check if email already exists
      const [existingEmail] = await connection.execute(
        'SELECT id FROM user WHERE email = ?',
        [email]
      );

      if (existingEmail.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already registered' });
      }

      // Check if employee ID already exists
      const [existingId] = await connection.execute(
        'SELECT id FROM user WHERE employee_code = ?',
        [employeeId]
      );

      if (existingId.length > 0) {
        return res.status(400).json({ success: false, error: 'Employee ID already exists' });
      }

      // Get employee role ID (role_id for employee access level)
      const [roleRows] = await connection.execute(
        'SELECT id FROM role WHERE access_level = ? LIMIT 1',
        ['employee']
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
        [1, roleId, employeeId, firstName, surname, email, phone, hashedPassword, professionalRole, professionalRoleOther || null, 'employee']
      );

      const newUser = await getUserById(result.insertId);

      const { password_hash, ...userWithoutPassword } = newUser;

      res.json({
        success: true,
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
          avatar: `https://i.pravatar.cc/150?img=${userWithoutPassword.id}`
        }
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

// Get all users endpoint (for testing)
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT u.id, u.employee_code, u.first_name, u.last_name, u.email, u.phone, r.name as role_name, r.access_level FROM user u JOIN role r ON u.role_id = r.id'
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
