import Database from 'better-sqlite3';
import path from 'path';
import { LoanApplication, SimulatedEmail } from './src/types';

const dbPath = process.env.VERCEL
  ? path.join('/tmp', 'mcars-finance.db')
  : path.join(process.cwd(), 'mcars-finance.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

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
      createdAt TEXT NOT NULL,
      biometricSecured INTEGER NOT NULL DEFAULT 0
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

  // Insert sample data if applications table is empty
  const appCount = db.prepare('SELECT COUNT(*) as count FROM applications').get() as { count: number };
  if (appCount.count === 0) {
    insertSampleData();
  }
}

function insertSampleData() {
  // Insert sample applications
  const insertApp = db.prepare(`
    INSERT INTO applications (id, applicantName, applicantEmail, carMake, carModel, carYear, loanAmount, downPayment, termMonths, interestRate, monthlyPayment, creditScore, acquisitionMode, status, statusUpdatedAt, createdAt, biometricSecured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    biometricSecured: true,
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
    biometricSecured: false,
    documents: [],
    history: []
  };

  insertApp.run(
    app1.id, app1.applicantName, app1.applicantEmail, app1.carMake, app1.carModel,
    app1.carYear, app1.loanAmount, app1.downPayment, app1.termMonths, app1.interestRate,
    app1.monthlyPayment, app1.creditScore, app1.acquisitionMode, app1.status,
    app1.statusUpdatedAt, app1.createdAt, app1.biometricSecured ? 1 : 0
  );

  insertApp.run(
    app2.id, app2.applicantName, app2.applicantEmail, app2.carMake, app2.carModel,
    app2.carYear, app2.loanAmount, app2.downPayment, app2.termMonths, app2.interestRate,
    app2.monthlyPayment, app2.creditScore, app2.acquisitionMode, app2.status,
    app2.statusUpdatedAt, app2.createdAt, app2.biometricSecured ? 1 : 0
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

export function getApplications(): LoanApplication[] {
  const rows = db.prepare(`
    SELECT * FROM applications ORDER BY createdAt DESC
  `).all() as any[];

  return rows.map(row => ({
    ...row,
    biometricSecured: row.biometricSecured === 1,
    documents: getDocuments(row.id),
    history: getHistory(row.id)
  }));
}

export function getApplicationById(id: string): LoanApplication | null {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  if (!row) return null;

  return {
    ...row,
    biometricSecured: row.biometricSecured === 1,
    documents: getDocuments(row.id),
    history: getHistory(row.id)
  };
}

export function createApplication(data: Omit<LoanApplication, 'documents' | 'history'>): LoanApplication {
  const stmt = db.prepare(`
    INSERT INTO applications (id, applicantName, applicantEmail, carMake, carModel, carYear, loanAmount, downPayment, termMonths, interestRate, monthlyPayment, creditScore, acquisitionMode, status, statusUpdatedAt, createdAt, biometricSecured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    data.id, data.applicantName, data.applicantEmail, data.carMake, data.carModel,
    data.carYear, data.loanAmount, data.downPayment, data.termMonths, data.interestRate,
    data.monthlyPayment, data.creditScore, data.acquisitionMode, data.status,
    data.statusUpdatedAt, data.createdAt, data.biometricSecured ? 1 : 0
  );

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
  if (updates.biometricSecured !== undefined) {
    fields.push('biometricSecured = ?');
    values.push(updates.biometricSecured ? 1 : 0);
  }

  if (fields.length > 0) {
    values.push(id);
    db.prepare(`UPDATE applications SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }
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

export function getEmails(): SimulatedEmail[] {
  const rows = db.prepare('SELECT * FROM emails ORDER BY sentAt DESC').all() as any[];
  return rows.map(row => ({
    ...row,
    read: row.read === 1
  }));
}

export function createEmail(data: SimulatedEmail): void {
  const stmt = db.prepare(`
    INSERT INTO emails (id, toEmail, subject, body, sentAt, read)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(data.id, data.to, data.subject, data.body, data.sentAt, data.read ? 1 : 0);
}

export function clearEmails(): void {
  db.prepare('DELETE FROM emails').run();
}

export default db;
