import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import { getDb, ENTITY_MAP, createEntityId, normalizeRow } from './db.js';
import { requireAuth, requireAdmin, signToken } from './auth.js';

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'dev_only_change_me';
}

const app = express();
const PORT = Number(process.env.PORT || 8787);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'disaster-backend' });
});

const serializeAdminUser = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    role: row.role,
    created_date: row.created_date,
    updated_date: row.updated_date,
  };
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const db = await getDb();
    const { full_name, email, password, role } = req.body ?? {};

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const now = new Date().toISOString();
    const userId = createEntityId('user');
    const passwordHash = await bcrypt.hash(password, 10);
    const safeRole = role === 'admin' ? 'admin' : 'student';

    await db.run(
      `INSERT INTO users (id, full_name, email, password_hash, role, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, full_name, normalizedEmail, passwordHash, safeRole, now, now],
    );

    const user = { id: userId, full_name, email: normalizedEmail, role: safeRole };
    const token = signToken(user);

    return res.status(201).json({ token, user });
  } catch (error) {
    console.error('register error', error);
    return res.status(500).json({ message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const db = await getDb();
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const row = await db.get(
      'SELECT id, full_name, email, role, password_hash FROM users WHERE email = ?',
      [normalizedEmail],
    );

    if (!row) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, row.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = { id: row.id, full_name: row.full_name, email: row.email, role: row.role };
    const token = signToken(user);

    return res.json({ token, user });
  } catch (error) {
    console.error('login error', error);
    return res.status(500).json({ message: 'Login failed' });
  }
});

app.get('/api/auth/me', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const row = await db.get('SELECT id, full_name, email, role FROM users WHERE id = ?', [req.user.sub]);
    if (!row) {
      return res.status(401).json({ message: 'User not found' });
    }
    return res.json(row);
  } catch (error) {
    console.error('me error', error);
    return res.status(500).json({ message: 'Failed to get profile' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  return res.json({ success: true });
});

app.get('/api/admin/users', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const db = await getDb();
    const users = await db.all(
      'SELECT id, full_name, email, role, created_date, updated_date FROM users ORDER BY datetime(created_date) DESC, datetime(updated_date) DESC, id DESC',
    );

    return res.json(users.map(serializeAdminUser));
  } catch (error) {
    console.error('admin users list error', error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
});

app.patch('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const userId = String(req.params.id ?? '').trim();

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existingUser = await db.get(
      'SELECT id, full_name, email, role, created_date, updated_date FROM users WHERE id = ?',
      [userId],
    );

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = req.body ?? {};
    const updates = [];
    const values = [];

    if (Object.prototype.hasOwnProperty.call(payload, 'full_name')) {
      const nextFullName = String(payload.full_name ?? '').trim();

      if (!nextFullName) {
        return res.status(400).json({ message: 'full_name cannot be empty' });
      }

      updates.push('full_name = ?');
      values.push(nextFullName);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'email')) {
      const nextEmail = String(payload.email ?? '').trim().toLowerCase();

      if (!nextEmail) {
        return res.status(400).json({ message: 'email cannot be empty' });
      }

      updates.push('email = ?');
      values.push(nextEmail);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'role')) {
      const nextRole = String(payload.role ?? '').trim();

      if (!['admin', 'student'].includes(nextRole)) {
        return res.status(400).json({ message: 'Invalid role' });
      }

      const currentUserId = String(req.user?.sub ?? req.user?.id ?? req.user?.user_id ?? '').trim();
      const currentUserEmail = String(req.user?.email ?? req.user?.user_email ?? '').trim().toLowerCase();

      const isSelf =
        (currentUserId && String(existingUser.id) === currentUserId) ||
        (currentUserEmail && String(existingUser.email ?? '').trim().toLowerCase() === currentUserEmail);

      if (isSelf && nextRole !== 'admin') {
        return res.status(409).json({ message: 'You cannot demote your own admin account' });
      }

      if (existingUser.role === 'admin' && nextRole !== 'admin') {
        const adminCountRow = await db.get('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['admin']);
        const adminCount = Number(adminCountRow?.count ?? 0);

        if (adminCount <= 1) {
          return res.status(409).json({ message: 'At least one admin account must remain active' });
        }
      }

      updates.push('role = ?');
      values.push(nextRole);
    }

    if (updates.length === 0) {
      return res.json(serializeAdminUser(existingUser));
    }

    updates.push('updated_date = ?');
    values.push(new Date().toISOString());
    values.push(userId);

    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const updatedUser = await db.get(
      'SELECT id, full_name, email, role, created_date, updated_date FROM users WHERE id = ?',
      [userId],
    );

    return res.json(serializeAdminUser(updatedUser));
  } catch (error) {
    if (error?.code === 'SQLITE_CONSTRAINT') {
      return res.status(409).json({ message: 'A user with that email already exists' });
    }

    console.error('admin user update error', error);
    return res.status(500).json({ message: 'Failed to update user' });
  }
});

app.delete('/api/admin/users/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const userId = String(req.params.id ?? '').trim();

    if (!userId) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const existingUser = await db.get('SELECT id, email, role FROM users WHERE id = ?', [userId]);

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentUserId = String(req.user?.sub ?? req.user?.id ?? req.user?.user_id ?? '').trim();
    const currentUserEmail = String(req.user?.email ?? req.user?.user_email ?? '').trim().toLowerCase();

    const isSelf =
      (currentUserId && String(existingUser.id) === currentUserId) ||
      (currentUserEmail && String(existingUser.email ?? '').trim().toLowerCase() === currentUserEmail);

    if (isSelf) {
      return res.status(409).json({ message: 'You cannot remove your own admin account' });
    }

    if (existingUser.role === 'admin') {
      const adminCountRow = await db.get('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['admin']);
      const adminCount = Number(adminCountRow?.count ?? 0);

      if (adminCount <= 1) {
        return res.status(409).json({ message: 'At least one admin account must remain active' });
      }
    }

    await db.run('DELETE FROM users WHERE id = ?', [userId]);

    return res.json({ success: true });
  } catch (error) {
    console.error('admin user delete error', error);
    return res.status(500).json({ message: 'Failed to remove user' });
  }
});

app.get('/api/entities/:entity', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { entity } = req.params;
    const descriptor = ENTITY_MAP[entity];

    if (!descriptor) {
      return res.status(404).json({ message: 'Unknown entity' });
    }

    const { table, columns } = descriptor;
    const criteria = { ...req.query };

    const limit = criteria.limit ? Number(criteria.limit) : undefined;
    const sortBy = criteria.sortBy ? String(criteria.sortBy) : undefined;

    delete criteria.limit;
    delete criteria.sortBy;

    const whereParts = [];
    const values = [];

    for (const [key, value] of Object.entries(criteria)) {
      if (!columns.includes(key) && key !== 'id') continue;
      whereParts.push(`${key} = ?`);
      values.push(parseIncomingValue(value));
    }

    let query = `SELECT * FROM ${table}`;
    if (whereParts.length > 0) query += ` WHERE ${whereParts.join(' AND ')}`;

    if (sortBy) {
      const desc = sortBy.startsWith('-');
      const key = desc ? sortBy.slice(1) : sortBy;
      if (columns.includes(key) || key === 'id') {
        query += ` ORDER BY ${key} ${desc ? 'DESC' : 'ASC'}`;
      }
    }

    if (Number.isFinite(limit) && limit > 0) {
      query += ` LIMIT ${Math.min(limit, 500)}`;
    }

    const rows = await db.all(query, values);
    return res.json(rows.map((row) => normalizeRow(row, entity)));
  } catch (error) {
    console.error('entity list error', error);
    return res.status(500).json({ message: 'Failed to fetch records' });
  }
});

app.post('/api/entities/:entity', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { entity } = req.params;
    const descriptor = ENTITY_MAP[entity];

    if (!descriptor) {
      return res.status(404).json({ message: 'Unknown entity' });
    }

    const now = new Date().toISOString();
    const payload = req.body ?? {};

    const record = {
      id: payload.id || createEntityId(descriptor.idPrefix),
      created_date: payload.created_date || now,
      updated_date: now,
    };

    for (const col of descriptor.columns) {
      if (col === 'created_date' || col === 'updated_date') continue;
      if (Object.prototype.hasOwnProperty.call(payload, col)) {
        record[col] = prepareForStorage(col, payload[col], descriptor);
      }
    }

    const insertColumns = Object.keys(record);
    const placeholders = insertColumns.map(() => '?').join(', ');
    const insertValues = insertColumns.map((col) => record[col]);

    await db.run(
      `INSERT INTO ${descriptor.table} (${insertColumns.join(', ')}) VALUES (${placeholders})`,
      insertValues,
    );

    const row = await db.get(`SELECT * FROM ${descriptor.table} WHERE id = ?`, [record.id]);
    return res.status(201).json(normalizeRow(row, entity));
  } catch (error) {
    console.error('entity create error', error);
    return res.status(500).json({ message: 'Failed to create record' });
  }
});

app.put('/api/entities/:entity/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { entity, id } = req.params;
    const descriptor = ENTITY_MAP[entity];

    if (!descriptor) {
      return res.status(404).json({ message: 'Unknown entity' });
    }

    const payload = req.body ?? {};
    const updates = [];
    const values = [];

    for (const col of descriptor.columns) {
      if (col === 'created_date') continue;
      if (Object.prototype.hasOwnProperty.call(payload, col)) {
        updates.push(`${col} = ?`);
        values.push(prepareForStorage(col, payload[col], descriptor));
      }
    }

    updates.push('updated_date = ?');
    values.push(new Date().toISOString());

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    const result = await db.run(
      `UPDATE ${descriptor.table} SET ${updates.join(', ')} WHERE id = ?`,
      values,
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: `${entity} with id ${id} not found` });
    }

    const row = await db.get(`SELECT * FROM ${descriptor.table} WHERE id = ?`, [id]);
    return res.json(normalizeRow(row, entity));
  } catch (error) {
    console.error('entity update error', error);
    return res.status(500).json({ message: 'Failed to update record' });
  }
});

app.delete('/api/entities/:entity/:id', requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const { entity, id } = req.params;
    const descriptor = ENTITY_MAP[entity];

    if (!descriptor) {
      return res.status(404).json({ message: 'Unknown entity' });
    }

    const result = await db.run(`DELETE FROM ${descriptor.table} WHERE id = ?`, [id]);
    if (result.changes === 0) {
      return res.status(404).json({ message: `${entity} with id ${id} not found` });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('entity delete error', error);
    return res.status(500).json({ message: 'Failed to delete record' });
  }
});

const distPath = path.join(rootDir, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  return res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

function parseIncomingValue(value) {
  if (value === 'true') return 1;
  if (value === 'false') return 0;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return value;
}

function prepareForStorage(column, value, descriptor) {
  if ((descriptor.jsonColumns ?? []).includes(column)) {
    return JSON.stringify(value ?? []);
  }

  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}
