import Database from 'better-sqlite3';
import path from 'path';
import express from 'express';
import cors from 'cors';

let _db: Database.Database | null = null;
function getDb() {
  if (!_db) {
    _db = new Database(path.join('/tmp', 'mcars-finance.db'));
    _db.pragma('foreign_keys = ON');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, createdAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'customer', tenantId TEXT NOT NULL, token TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL);
    `);
    const tcount = _db.prepare('SELECT COUNT(*) as count FROM tenants').get() as any;
    if (tcount.count === 0) {
      const n = new Date().toISOString();
      _db.prepare(`INSERT INTO tenants (id, name, createdAt) VALUES (?, ?, ?)`).run('tenant-mcars', 'MCARS Finance HQ', n);
      _db.prepare(`INSERT INTO tenants (id, name, createdAt) VALUES (?, ?, ?)`).run('tenant-prestige', 'Prestige Auto Dealers', n);
      _db.prepare(`INSERT INTO users (id, name, email, role, tenantId, token, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('user-admin', 'Admin Portal', 'admin@mcars.com', 'admin', 'tenant-mcars', 'admin-token', n);
      _db.prepare(`INSERT INTO users (id, name, email, role, tenantId, token, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`).run('user-underwriter', 'James Underwood', 'james.underwood@mcars.com', 'underwriter', 'tenant-mcars', 'underwriter-token', n);
    }
  }
  return _db;
}

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/auth/login', (req: any, res: any) => {
  try {
    const db = getDb();
    const { email } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    const tenant = user ? db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenantId) as any : null;
    res.json({ user: user || null, tenant });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/applications', (_req: any, res: any) => {
  const db = getDb();
  const apps = db.prepare('SELECT * FROM applications LIMIT 10').all();
  res.json({ data: apps, pagination: { page: 1, limit: 10, total: apps.length, totalPages: 1 } });
});

export default function handler(req: any, res: any) {
  app(req, res);
}
