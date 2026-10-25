
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Serve the existing multi-page HTML/CSS/JavaScript frontend.
// The small Create React App dashboard runs separately on port 3000.
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'), (err) => {
    if (err) next(err);
  });
});


const CATEGORIES = [
  'Garbage Dumping',
  'Water Leakage',
  'Air Pollution',
  'Open Waste Burning',
  'Tree Damage/Cutting',
  'Water Pollution',
  'Other',
];

const STATUSES = [
  'Pending Review',
  'Approved',
  'In Progress',
  'Resolved',
  'Rejected',
];

// ---------- Photo upload ----------

const upload = multer({
  storage: multer.diskStorage({
    destination: path.join(__dirname, 'uploads'),
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const filename =
        Date.now() + '-' + Math.round(Math.random() * 1e6) + extension;

      cb(null, filename);
    },
  }),
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG or WEBP images are allowed'));
    }
  },
});

// ---------- Authentication middleware ----------

function optionalAdmin(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '');

  req.admin = null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Never allow a user token to act as an admin.
    if (decoded.type !== 'user') {
      req.admin = decoded;
    }
  } catch (error) {
    req.admin = null;
  }

  next();
}

function requireAdmin(req, res, next) {
  optionalAdmin(req, res, () => {
    if (!req.admin) {
      return res.status(401).json({
        error: 'Admin login required',
      });
    }

    next();
  });
}

function requireUser(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '');

  if (!token) {
    return res.status(401).json({
      error: 'User login required',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'user' || !decoded.id) {
      return res.status(401).json({
        error: 'User login required',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Invalid or expired user session',
    });
  }
}

function optionalUser(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.replace(/^Bearer\s+/i, '');

  req.user = null;

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type === 'user' && decoded.id) {
      req.user = decoded;
    }
  } catch (error) {
    // Anonymous reporting remains available.
  }

  next();
}

// ---------- User registration ----------

app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        error: 'Enter your name (maximum 100 characters)',
      });
    }

    if (
      typeof email !== 'string' ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res.status(400).json({
        error: 'Enter a valid email address',
      });
    }

    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({
        error: 'Password must contain at least 8 characters',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name.trim(), normalizedEmail, passwordHash]
    );

    const token = jwt.sign(
      {
        id: result.insertId,
        email: normalizedEmail,
        type: 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      user: {
        id: result.insertId,
        name: name.trim(),
        email: normalizedEmail,
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: 'An account with this email already exists',
      });
    }

    console.error('User registration error:', error);

    res.status(500).json({
      error: 'Registration failed',
    });
  }
});

// ---------- User login ----------

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Enter your email and password',
      });
    }

    const [rows] = await db.query(
      `SELECT id, name, email, password_hash
       FROM users
       WHERE email = ?`,
      [email.trim().toLowerCase()]
    );

    const user = rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        error: 'Incorrect email or password',
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: 'user',
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('User login error:', error);

    res.status(500).json({
      error: 'Login failed',
    });
  }
});

// ---------- Get current user ----------

app.get('/api/users/me', requireUser, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, name, email, created_at
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        error: 'User not found',
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Get user error:', error);

    res.status(500).json({
      error: 'Could not load user',
    });
  }
});

// ---------- Get reports belonging to current user ----------

app.get('/api/users/me/reports', requireUser, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT *
       FROM reports
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error('User reports error:', error);

    res.status(500).json({
      error: 'Could not load your reports',
    });
  }
});

// ---------- List reports with filters ----------

app.get('/api/reports', optionalAdmin, async (req, res) => {
  try {
    const { category, status, search, from, to } = req.query;

    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params = [];

    if (category) {
      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: 'Invalid category',
        });
      }

      sql += ' AND category = ?';
      params.push(category);
    }

    if (status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
        });
      }

      sql += ' AND status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      sql += `
        AND (
          title LIKE ?
          OR description LIKE ?
          OR location_name LIKE ?
        )
      `;

      const searchTerm = '%' + search.trim() + '%';
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (from) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(from)) {
        return res.status(400).json({
          error: 'Invalid start date',
        });
      }

      sql += ' AND DATE(created_at) >= ?';
      params.push(from);
    }

    if (to) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(to)) {
        return res.status(400).json({
          error: 'Invalid end date',
        });
      }

      sql += ' AND DATE(created_at) <= ?';
      params.push(to);
    }

    if (from && to && from > to) {
      return res.status(400).json({
        error: 'Start date cannot be after end date',
      });
    }

    // Rejected reports remain hidden from public visitors.
    if (!req.admin) {
      sql += " AND status != 'Rejected'";
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('List reports error:', error);

    res.status(500).json({
      error: 'Could not load reports',
    });
  }
});

// ---------- Dashboard statistics ----------

app.get('/api/stats', async (req, res) => {
  try {
    const [byStatus] = await db.query(
      `SELECT status, COUNT(*) AS count
       FROM reports
       WHERE status != 'Rejected'
       GROUP BY status`
    );

    const [byCategory] = await db.query(
      `SELECT category, COUNT(*) AS count
       FROM reports
       WHERE status != 'Rejected'
       GROUP BY category`
    );

    const [recent] = await db.query(
      `SELECT id, title, category, status, created_at
       FROM reports
       WHERE status != 'Rejected'
       ORDER BY created_at DESC
       LIMIT 5`
    );

    const getCount = (wantedStatus) => {
      const row = byStatus.find(
        (item) => item.status === wantedStatus
      );

      return row ? Number(row.count) : 0;
    };

    const total = byStatus.reduce(
      (sum, row) => sum + Number(row.count),
      0
    );

    res.json({
      total,
      pending: getCount('Pending Review'),
      inProgress: getCount('In Progress'),
      resolved: getCount('Resolved'),
      byCategory,
      recent,
    });
  } catch (error) {
    console.error('Statistics error:', error);

    res.status(500).json({
      error: 'Could not load statistics',
    });
  }
});

// ---------- Get one report ----------

app.get('/api/reports/:id', optionalAdmin, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM reports WHERE id = ?',
      [req.params.id]
    );

    const report = rows[0];

    if (!report || (report.status === 'Rejected' && !req.admin)) {
      return res.status(404).json({
        error: 'Report not found',
      });
    }

    res.json(report);
  } catch (error) {
    console.error('Get report error:', error);

    res.status(500).json({
      error: 'Could not load report',
    });
  }
});

// ---------- Create report ----------

app.post('/api/reports', optionalUser, (req, res) => {
  upload.single('image')(req, res, async (uploadError) => {
    if (uploadError) {
      return res.status(400).json({
        error: uploadError.message,
      });
    }

    try {
      const {
        title,
        category,
        description,
        location_name,
      } = req.body;

      const latitude = Number(req.body.latitude);
      const longitude = Number(req.body.longitude);

      if (
        typeof title !== 'string' ||
        !title.trim() ||
        title.trim().length > 150
      ) {
        return res.status(400).json({
          error: 'Title is required (max 150 characters)',
        });
      }

      if (!CATEGORIES.includes(category)) {
        return res.status(400).json({
          error: 'Please choose a valid category',
        });
      }

      if (
        typeof description !== 'string' ||
        !description.trim()
      ) {
        return res.status(400).json({
          error: 'Description is required',
        });
      }

      if (
        req.body.latitude === undefined ||
        req.body.latitude === '' ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return res.status(400).json({
          error: 'Latitude must be between -90 and 90',
        });
      }

      if (
        req.body.longitude === undefined ||
        req.body.longitude === '' ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          error: 'Longitude must be between -180 and 180',
        });
      }

      const imagePath = req.file ? req.file.filename : null;

      const [result] = await db.query(
        `INSERT INTO reports
         (
           title,
           description,
           category,
           latitude,
           longitude,
           location_name,
           image_path,
           status,
           user_id
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending Review', ?)`,
        [
          title.trim(),
          description.trim(),
          category,
          latitude,
          longitude,
          location_name || null,
          imagePath,
          req.user ? req.user.id : null,
        ]
      );

      res.status(201).json({
        id: result.insertId,
        message: 'Report submitted for review',
      });
    } catch (error) {
      console.error('Create report error:', error);

      res.status(500).json({
        error: 'Could not save the report',
      });
    }
  });
});

// ---------- Update report status ----------

app.patch(
  '/api/reports/:id/status',
  requireAdmin,
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!STATUSES.includes(status)) {
        return res.status(400).json({
          error: 'Invalid status',
        });
      }

      const [result] = await db.query(
        'UPDATE reports SET status = ? WHERE id = ?',
        [status, req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: 'Report not found',
        });
      }

      res.json({
        message: 'Status updated',
      });
    } catch (error) {
      console.error('Update status error:', error);

      res.status(500).json({
        error: 'Could not update status',
      });
    }
  }
);

// ---------- Delete report ----------

app.delete(
  '/api/reports/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const [result] = await db.query(
        'DELETE FROM reports WHERE id = ?',
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error: 'Report not found',
        });
      }

      res.json({
        message: 'Report deleted',
      });
    } catch (error) {
      console.error('Delete report error:', error);

      res.status(500).json({
        error: 'Could not delete report',
      });
    }
  }
);

// ---------- Admin login ----------

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (
      typeof username !== 'string' ||
      typeof password !== 'string' ||
      !username.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: 'Enter username and password',
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM admins WHERE username = ?',
      [username.trim()]
    );

    const admin = rows[0];

    const passwordMatches =
      admin &&
      (await bcrypt.compare(password, admin.password_hash));

    if (!passwordMatches) {
      return res.status(401).json({
        error: 'Wrong username or password',
      });
    }

    // Keep existing admin token format for compatibility.
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);

    res.status(500).json({
      error: 'Login failed',
    });
  }
});

// ---------- Serve the static multi-page frontend ----------
// HTML pages and assets are served from ../frontend; API routes above take precedence.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- Start server ----------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    'EcoMap API running on http://localhost:' + PORT
  );
});
