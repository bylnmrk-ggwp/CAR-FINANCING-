import Database from 'better-sqlite3';
import path from 'path';
import { LoanApplication, SimulatedEmail, ApplicationFilters, PaginatedResponse, User, Tenant } from './src/types';
import { getCache } from './src/cache';

const dbPath = process.env.VERCEL
  ? path.join('/tmp', 'mcars-finance.db')
  : path.join(process.cwd(), 'mcars-finance.db');

function getOrCreateDb(): Database.Database {
  try {
    const d = new Database(dbPath);
    d.pragma('foreign_keys = ON');
    return d;
  } catch (err: any) {
    console.error("Failed to initialize SQLite database:", err);
    throw err;
  }
}

const db = getOrCreateDb();

const ALLOWED_APP_SORT = ['createdAt', 'statusUpdatedAt', 'applicantName', 'loanAmount', 'creditScore', 'status', 'carMake', 'carYear'];
const ALLOWED_EMAIL_SORT = ['sentAt', 'subject', 'toEmail', 'read'];

// Initialize database schema
export function initializeDatabase() {
  // Create applications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      applicantName TEXT NOT NULL,
      applicantEmail TEXT NOT NULL,
      carMake TEXT NOT NULL,
      carModel TEXT NOT NULL,
      carYear INTEGER NOT NULL,
      loanAmount REAL NOT NULL,
      downPayment REAL NOT NULL,
      termMonths INTEGER NOT NULL,
      interestRate REAL NOT NULL,
      monthlyPayment REAL NOT NULL,
      creditScore INTEGER NOT NULL,
      acquisitionMode TEXT NOT NULL,
      status TEXT NOT NULL,
      statusUpdatedAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create documents table
  db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      applicationId TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      size INTEGER NOT NULL,
      uploadedAt TEXT NOT NULL,
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
    )
  `);

  // Create history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS history (
      id TEXT PRIMARY KEY,
      applicationId TEXT NOT NULL,
      status TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      description TEXT NOT NULL,
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
    )
  `);

  // Create emails table
  db.exec(`
    CREATE TABLE IF NOT EXISTS emails (
      id TEXT PRIMARY KEY,
      toEmail TEXT NOT NULL,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      sentAt TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create job queue table
  db.exec(`
    CREATE TABLE IF NOT EXISTS job_queue (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retries INTEGER NOT NULL DEFAULT 0,
      maxRetries INTEGER NOT NULL DEFAULT 3,
      error TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `);

  // Create webhooks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      events TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create tenants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `);

  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL DEFAULT 'customer',
      tenantId TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (tenantId) REFERENCES tenants(id)
    )
  `);

  // Add tenantId column to applications if it doesn't exist (migration)
  const appCols = db.prepare("PRAGMA table_info(applications)").all() as any[];
  if (!appCols.some((c: any) => c.name === 'tenantId')) {
    db.exec("ALTER TABLE applications ADD COLUMN tenantId TEXT REFERENCES tenants(id)");
  }
  if (!appCols.some((c: any) => c.name === 'assignedUnderwriterId')) {
    db.exec("ALTER TABLE applications ADD COLUMN assignedUnderwriterId TEXT REFERENCES users(id)");
  }

  // Seed tenants if empty
  const tenantCount = db.prepare('SELECT COUNT(*) as count FROM tenants').get() as { count: number };
  if (tenantCount.count === 0) {
    seedTenantsAndUsers();
  }

  // Insert sample applications if empty
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  if (appCount.count === 0) {
    seedSampleApplications();
  }
}

function seedTenantsAndUsers() {
  const now = new Date().toISOString();

  const insertTenant = db.prepare(`INSERT INTO tenants (id, name, createdAt) VALUES (?, ?, ?)`);
  insertTenant.run('tenant-mcars', 'MCARS Finance HQ', now);
  insertTenant.run('tenant-prestige', 'Prestige Auto Dealers', now);

  const insertUser = db.prepare(`INSERT INTO users (id, name, email, role, tenantId, token, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  insertUser.run('user-admin', 'Admin Portal', 'admin@mcars.com', 'admin', 'tenant-mcars', 'admin-token', now);
  insertUser.run('user-underwriter', 'James Underwood', 'james.underwood@mcars.com', 'underwriter', 'tenant-mcars', 'underwriter-token', now);
  insertUser.run('user-sarah', 'Sarah Jenkins', 'sarah.j@example.com', 'customer', 'tenant-prestige', 'sarah-token', now);
  insertUser.run('user-marcus', 'Marcus Bennett', 'm.bennett@example.com', 'customer', 'tenant-prestige', 'bennett-token', now);
}

function seedSampleApplications() {
  const now = new Date().toISOString();

  // Insert sample applications
  const insertApp = db.prepare(`
    INSERT INTO applications (id, applicantName, applicantEmail, carMake, carModel, carYear, loanAmount, downPayment, termMonths, interestRate, monthlyPayment, creditScore, acquisitionMode, status, statusUpdatedAt, createdAt, tenantId, assignedUnderwriterId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const app1: LoanApplication = {
    id: 'TXN-940182',
    applicantName: 'Sarah Jenkins',
    applicantEmail: 'sarah.j@example.com',
    carMake: 'Tesla',
    carModel: 'Model Y',
    carYear: 2024,
    loanAmount: 48000,
    downPayment: 10000,
    termMonths: 60,
    interestRate: 4.39,
    monthlyPayment: 874.50,
    creditScore: 780,
    acquisitionMode: 'FINANCING',
    status: 'UNDER_REVIEW',
    statusUpdatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    documents: [],
    history: []
  };

  const app2: LoanApplication = {
    id: 'TXN-882351',
    applicantName: 'Marcus Bennett',
    applicantEmail: 'm.bennett@example.com',
    carMake: 'BMW',
    carModel: 'M4 Competition',
    carYear: 2023,
    loanAmount: 72000,
    downPayment: 15000,
    termMonths: 48,
    interestRate: 6.15,
    monthlyPayment: 1695.40,
    creditScore: 710,
    acquisitionMode: 'RENT_TO_OWN',
    status: 'DOCUMENTS_PENDING',
    statusUpdatedAt: new Date(Date.now() - 3600000 * 1).toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    documents: [],
    history: []
  };

  insertApp.run(
    app1.id, app1.applicantName, app1.applicantEmail, app1.carMake, app1.carModel,
    app1.carYear, app1.loanAmount, app1.downPayment, app1.termMonths, app1.interestRate,
    app1.monthlyPayment, app1.creditScore, app1.acquisitionMode, app1.status,
    app1.statusUpdatedAt, app1.createdAt, 'tenant-prestige', 'user-underwriter'
  );

  insertApp.run(
    app2.id, app2.applicantName, app2.applicantEmail, app2.carMake, app2.carModel,
    app2.carYear, app2.loanAmount, app2.downPayment, app2.termMonths, app2.interestRate,
    app2.monthlyPayment, app2.creditScore, app2.acquisitionMode, app2.status,
    app2.statusUpdatedAt, app2.createdAt, 'tenant-prestige', 'user-underwriter'
  );

  // Insert sample documents for app1
  const insertDoc = db.prepare(`
    INSERT INTO documents (id, applicationId, name, type, size, uploadedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertDoc.run('doc-1', 'TXN-940182', 'Drivers_License_Sarah.png', 'ID', 1420500, new Date(Date.now() - 3600000 * 23).toISOString());
  insertDoc.run('doc-2', 'TXN-940182', 'Paystub_May2026.pdf', 'INCOME', 2310200, new Date(Date.now() - 3600000 * 23).toISOString());

  // Insert sample history for app1
  const insertHistory = db.prepare(`
    INSERT INTO history (id, applicationId, status, timestamp, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertHistory.run('hist-1', 'TXN-940182', 'SUBMITTED', new Date(Date.now() - 3600000 * 24).toISOString(), 'Loan application submitted matching Tesla Model Y configuration.');
  insertHistory.run('hist-2', 'TXN-940182', 'DOCUMENTS_PENDING', new Date(Date.now() - 3600000 * 23).toISOString(), 'Identity and income verification files requested by underwriter.');
  insertHistory.run('hist-3', 'TXN-940182', 'UNDER_REVIEW', new Date(Date.now() - 3600000 * 2).toISOString(), 'Required papers cleared. Loan documentation passed to primary underwriter.');

  // Insert sample history for app2
  insertHistory.run('hist-11', 'TXN-882351', 'SUBMITTED', new Date(Date.now() - 3600000 * 4).toISOString(), 'Loan application submitted for pre-owned BMW M4 Competition.');
  insertHistory.run('hist-12', 'TXN-882351', 'DOCUMENTS_PENDING', new Date(Date.now() - 3600000 * 1).toISOString(), 'Waiting for identity documents (valid state Drivers License).');

  // Insert sample email
  const insertEmail = db.prepare(`
    INSERT INTO emails (id, toEmail, subject, body, sentAt, read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertEmail.run(
    'em-1',
    'mcars.itdept@gmail.com',
    'Car Financing Portal: App Activated',
    'Welcome to your premium car financing dashboard. Secure biometrics and document uploads are now primed and active.',
    new Date(Date.now() - 3600000 * 3).toISOString(),
    0
  );
}

export function getApplications(
  page = 1,
  limit = 50,
  sortBy = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  filters: ApplicationFilters = {}
): PaginatedResponse<LoanApplication> {
  const cache = getCache();
  const cacheKey = `apps:${page}:${limit}:${sortBy}:${sortOrder}:${JSON.stringify(filters)}`;
  const cached = cache.get<PaginatedResponse<LoanApplication>>(cacheKey);
  if (cached) return cached;

  const conditions: string[] = [];
  const values: any[] = [];

  if (filters.status) {
    conditions.push('status = ?');
    values.push(filters.status);
  }
  if (filters.acquisitionMode) {
    conditions.push('acquisitionMode = ?');
    values.push(filters.acquisitionMode);
  }
  if (filters.tenantId) {
    conditions.push('tenantId = ?');
    values.push(filters.tenantId);
  }
  if (filters.search) {
    conditions.push('(applicantName LIKE ? OR applicantEmail LIKE ? OR carMake LIKE ? OR carModel LIKE ?)');
    const term = `%${filters.search}%`;
    values.push(term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = ALLOWED_APP_SORT.includes(sortBy) ? sortBy : 'createdAt';
  const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const countRow = db.prepare(`SELECT COUNT(*) as total FROM applications ${whereClause}`).get(...values) as { total: number };
  const total = countRow.total;

  const rows = db.prepare(`SELECT * FROM applications ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`).all(...values, limit, offset) as any[];

  const result: PaginatedResponse<LoanApplication> = {
    data: rows.map(row => ({
      ...row,
      documents: getDocuments(row.id),
      history: getHistory(row.id)
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };

  cache.set(cacheKey, result, 5000);
  return result;
}

export function getApplicationById(id: string): LoanApplication | null {
  const cache = getCache();
  const cacheKey = `app:${id}`;
  const cached = cache.get<LoanApplication>(cacheKey);
  if (cached) return cached;

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  if (!row) return null;

  const result = {
    ...row,
    documents: getDocuments(row.id),
    history: getHistory(row.id)
  } as LoanApplication;

  cache.set(cacheKey, result, 5000);
  return result;
}

export function createApplication(data: Omit<LoanApplication, 'documents' | 'history'> & { tenantId?: string; assignedUnderwriterId?: string }): LoanApplication {
  const stmt = db.prepare(`
    INSERT INTO applications (id, applicantName, applicantEmail, carMake, carModel, carYear, loanAmount, downPayment, termMonths, interestRate, monthlyPayment, creditScore, acquisitionMode, status, statusUpdatedAt, createdAt, tenantId, assignedUnderwriterId)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    data.id, data.applicantName, data.applicantEmail, data.carMake, data.carModel,
    data.carYear, data.loanAmount, data.downPayment, data.termMonths, data.interestRate,
    data.monthlyPayment, data.creditScore, data.acquisitionMode, data.status,
    data.statusUpdatedAt, data.createdAt, data.tenantId || null, data.assignedUnderwriterId || null
  );

  getCache().clearByPrefix('apps:');
  return getApplicationById(data.id)!;
}

export function updateApplication(id: string, updates: Partial<LoanApplication>): void {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.status !== undefined) {
    fields.push('status = ?');
    values.push(updates.status);
  }
  if (updates.statusUpdatedAt !== undefined) {
    fields.push('statusUpdatedAt = ?');
    values.push(updates.statusUpdatedAt);
  }
  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  const cache = getCache();
  cache.delete(`app:${id}`);
  cache.clearByPrefix('apps:');
}

export function getDocuments(applicationId: string) {
  return db.prepare('SELECT * FROM documents WHERE applicationId = ? ORDER BY uploadedAt DESC').all(applicationId);
}

export function createDocument(data: any): void {
  const stmt = db.prepare(`
    INSERT INTO documents (id, applicationId, name, type, size, uploadedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.applicationId, data.name, data.type, data.size, data.uploadedAt);

  const cache = getCache();
  cache.delete(`app:${data.applicationId}`);
  cache.clearByPrefix('apps:');
}

export function getHistory(applicationId: string) {
  return db.prepare('SELECT * FROM history WHERE applicationId = ? ORDER BY timestamp ASC').all(applicationId);
}

export function createHistoryItem(data: any): void {
  const stmt = db.prepare(`
    INSERT INTO history (id, applicationId, status, timestamp, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.applicationId, data.status, data.timestamp, data.description);
}

export function getEmails(
  page = 1,
  limit = 100,
  sortBy = 'sentAt',
  sortOrder: 'asc' | 'desc' = 'desc'
): PaginatedResponse<SimulatedEmail> {
  const cache = getCache();
  const cacheKey = `emails:${page}:${limit}:${sortBy}:${sortOrder}`;
  const cached = cache.get<PaginatedResponse<SimulatedEmail>>(cacheKey);
  if (cached) return cached;

  const sortCol = ALLOWED_EMAIL_SORT.includes(sortBy) ? sortBy : 'sentAt';
  const sortDir = sortOrder === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;

  const countRow = db.prepare('SELECT COUNT(*) as total FROM emails').get() as { total: number };
  const total = countRow.total;

  const rows = db.prepare(`SELECT * FROM emails ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`).all(limit, offset) as any[];

  const result: PaginatedResponse<SimulatedEmail> = {
    data: rows.map(row => ({
      id: row.id,
      to: row.toEmail,
      subject: row.subject,
      body: row.body,
      sentAt: row.sentAt,
      read: row.read === 1
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 }
  };

  cache.set(cacheKey, result, 5000);
  return result;
}

export function createEmail(data: SimulatedEmail): void {
  const stmt = db.prepare(`
    INSERT INTO emails (id, toEmail, subject, body, sentAt, read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.to, data.subject, data.body, data.sentAt, data.read ? 1 : 0);

  getCache().clearByPrefix('emails:');
}

export function clearEmails(): void {
  db.prepare('DELETE FROM emails').run();

  getCache().clearByPrefix('emails:');
}

// RBAC / Multi-tenant helpers
export function getUserByToken(token: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE token = ?').get(token) as any;
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, tenantId: row.tenantId, token: row.token, createdAt: row.createdAt };
}

export function getUserById(id: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!row) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role, tenantId: row.tenantId, token: row.token, createdAt: row.createdAt };
}

export function getTenantById(id: string): Tenant | null {
  const row = db.prepare('SELECT * FROM tenants WHERE id = ?').get(id) as any;
  if (!row) return null;
  return { id: row.id, name: row.name, createdAt: row.createdAt };
}

export function getUsers(): User[] {
  return db.prepare('SELECT * FROM users ORDER BY name ASC').all() as User[];
}

export default db;
