import Database from 'better-sqlite3';
import path from 'path';
import express from 'express';
import cors from 'cors';
import Groq from 'groq-sdk';

let _db: Database.Database | null = null;
function getDb() {
  if (_db) return _db;
  _db = new Database(process.env.VERCEL ? path.join('/tmp', 'mcars-finance.db') : path.join(process.cwd(), 'mcars-finance.db'));
  _db.pragma('foreign_keys = ON');

  _db.exec(`CREATE TABLE IF NOT EXISTS applications (id TEXT PRIMARY KEY, applicantName TEXT NOT NULL, applicantEmail TEXT NOT NULL, carMake TEXT NOT NULL, carModel TEXT NOT NULL, carYear INTEGER NOT NULL, loanAmount REAL NOT NULL, downPayment REAL NOT NULL, termMonths INTEGER NOT NULL, interestRate REAL NOT NULL, monthlyPayment REAL NOT NULL, creditScore INTEGER NOT NULL, acquisitionMode TEXT NOT NULL, status TEXT NOT NULL, statusUpdatedAt TEXT NOT NULL, createdAt TEXT NOT NULL)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS documents (id TEXT PRIMARY KEY, applicationId TEXT NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, size INTEGER NOT NULL, uploadedAt TEXT NOT NULL, FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, applicationId TEXT NOT NULL, status TEXT NOT NULL, timestamp TEXT NOT NULL, description TEXT NOT NULL, FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS emails (id TEXT PRIMARY KEY, toEmail TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, sentAt TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS job_queue (id TEXT PRIMARY KEY, type TEXT NOT NULL, payload TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', retries INTEGER NOT NULL DEFAULT 0, maxRetries INTEGER NOT NULL DEFAULT 3, error TEXT, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS webhooks (id TEXT PRIMARY KEY, url TEXT NOT NULL, events TEXT NOT NULL, createdAt TEXT NOT NULL)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, createdAt TEXT NOT NULL)`);
  _db.exec(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL DEFAULT 'customer', tenantId TEXT NOT NULL, token TEXT NOT NULL UNIQUE, createdAt TEXT NOT NULL, FOREIGN KEY (tenantId) REFERENCES tenants(id))`);

  const appCols = _db.prepare("PRAGMA table_info(applications)").all() as any[];
  if (!appCols.some((c: any) => c.name === 'tenantId')) _db.exec("ALTER TABLE applications ADD COLUMN tenantId TEXT REFERENCES tenants(id)");
  if (!appCols.some((c: any) => c.name === 'assignedUnderwriterId')) _db.exec("ALTER TABLE applications ADD COLUMN assignedUnderwriterId TEXT REFERENCES users(id)");

  const tc = _db.prepare('SELECT COUNT(*) as count FROM tenants').get() as any;
  if (tc.count === 0) {
    const n = new Date().toISOString();
    _db.prepare(`INSERT INTO tenants (id, name, createdAt) VALUES (?,?,?)`).run('tenant-mcars', 'MCARS Finance HQ', n);
    _db.prepare(`INSERT INTO tenants (id, name, createdAt) VALUES (?,?,?)`).run('tenant-prestige', 'Prestige Auto Dealers', n);
    _db.prepare(`INSERT INTO users (id,name,email,role,tenantId,token,createdAt) VALUES (?,?,?,?,?,?,?)`).run('user-admin','Admin Portal','admin@mcars.com','admin','tenant-mcars','admin-token',n);
    _db.prepare(`INSERT INTO users (id,name,email,role,tenantId,token,createdAt) VALUES (?,?,?,?,?,?,?)`).run('user-underwriter','James Underwood','james.underwood@mcars.com','underwriter','tenant-mcars','underwriter-token',n);
    _db.prepare(`INSERT INTO users (id,name,email,role,tenantId,token,createdAt) VALUES (?,?,?,?,?,?,?)`).run('user-sarah','Sarah Jenkins','sarah.j@example.com','customer','tenant-prestige','sarah-token',n);
    _db.prepare(`INSERT INTO users (id,name,email,role,tenantId,token,createdAt) VALUES (?,?,?,?,?,?,?)`).run('user-marcus','Marcus Bennett','m.bennett@example.com','customer','tenant-prestige','bennett-token',n);
  }

  const ac = _db.prepare('SELECT COUNT(*) as count FROM applications').get() as any;
  if (ac.count === 0) {
    const n = new Date().toISOString();
    const ins = _db.prepare(`INSERT INTO applications (id,applicantName,applicantEmail,carMake,carModel,carYear,loanAmount,downPayment,termMonths,interestRate,monthlyPayment,creditScore,acquisitionMode,status,statusUpdatedAt,createdAt,tenantId,assignedUnderwriterId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    ins.run('TXN-940182','Sarah Jenkins','sarah.j@example.com','Tesla','Model Y',2024,48000,10000,60,4.39,874.50,780,'FINANCING','UNDER_REVIEW',new Date(Date.now()-7200000).toISOString(),new Date(Date.now()-86400000).toISOString(),'tenant-prestige','user-underwriter');
    ins.run('TXN-882351','Marcus Bennett','m.bennett@example.com','BMW','M4 Competition',2023,72000,15000,48,6.15,1695.40,710,'RENT_TO_OWN','DOCUMENTS_PENDING',new Date(Date.now()-3600000).toISOString(),new Date(Date.now()-14400000).toISOString(),'tenant-prestige','user-underwriter');

    _db.prepare(`INSERT INTO documents (id,applicationId,name,type,size,uploadedAt) VALUES (?,?,?,?,?,?)`).run('doc-1','TXN-940182','Drivers_License_Sarah.png','ID',1420500,new Date(Date.now()-82800000).toISOString());
    _db.prepare(`INSERT INTO documents (id,applicationId,name,type,size,uploadedAt) VALUES (?,?,?,?,?,?)`).run('doc-2','TXN-940182','Paystub_May2026.pdf','INCOME',2310200,new Date(Date.now()-82800000).toISOString());

    const ih = _db.prepare(`INSERT INTO history (id,applicationId,status,timestamp,description) VALUES (?,?,?,?,?)`);
    ih.run('hist-1','TXN-940182','SUBMITTED',new Date(Date.now()-86400000).toISOString(),'Loan application submitted matching Tesla Model Y configuration.');
    ih.run('hist-2','TXN-940182','DOCUMENTS_PENDING',new Date(Date.now()-82800000).toISOString(),'Identity and income verification files requested by underwriter.');
    ih.run('hist-3','TXN-940182','UNDER_REVIEW',new Date(Date.now()-7200000).toISOString(),'Required papers cleared. Loan documentation passed to primary underwriter.');
    ih.run('hist-11','TXN-882351','SUBMITTED',new Date(Date.now()-14400000).toISOString(),'Loan application submitted for pre-owned BMW M4 Competition.');
    ih.run('hist-12','TXN-882351','DOCUMENTS_PENDING',new Date(Date.now()-3600000).toISOString(),'Waiting for identity documents (valid state Drivers License).');

    _db.prepare(`INSERT INTO emails (id,toEmail,subject,body,sentAt,read) VALUES (?,?,?,?,?,?)`).run('em-1','mcars.itdept@gmail.com','Car Financing Portal: App Activated','Welcome to your premium car financing dashboard. Biometrics and document uploads primed.',new Date(Date.now()-10800000).toISOString(),0);
  }
  return _db;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

// Helpers
function getUserByToken(token: string): any {
  const r = getDb().prepare('SELECT * FROM users WHERE token = ?').get(token) as any;
  return r ? { id: r.id, name: r.name, email: r.email, role: r.role, tenantId: r.tenantId, token: r.token, createdAt: r.createdAt } : null;
}
function getTenantById(id: string): any {
  const r = getDb().prepare('SELECT * FROM tenants WHERE id = ?').get(id) as any;
  return r ? { id: r.id, name: r.name, createdAt: r.createdAt } : null;
}
function getUsers(): any[] {
  return getDb().prepare('SELECT * FROM users ORDER BY name ASC').all() as any[];
}

// Auth middleware
function authenticate(req: any, res: any, next: any) {
  const token = req.headers['x-auth-token'] as string;
  if (!token) return res.status(401).json({ error: 'Authentication required.' });
  const user = getUserByToken(token);
  if (!user) return res.status(401).json({ error: 'Invalid authentication token.' });
  req.user = user;
  next();
}
function requireRole(...roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}.` });
    next();
  };
}

// Routes
app.post('/api/auth/login', (req: any, res: any) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const user = getUserByToken(email) || getUsers().find((u: any) => u.email === email) || null;
    const tenant = user ? getTenantById(user.tenantId) : null;
    res.json({ user, tenant });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', authenticate, (req: any, res: any) => {
  res.json({ user: req.user, tenant: getTenantById(req.user.tenantId) });
});

app.get('/api/applications', authenticate, (req: any, res: any) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const sortBy = ['createdAt','statusUpdatedAt','applicantName','loanAmount','creditScore','status','carMake','carYear'].includes(req.query.sortBy as string) ? req.query.sortBy as string : 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;
  const conds: string[] = []; const vals: any[] = [];

  if (req.query.status) { conds.push('status = ?'); vals.push(req.query.status); }
  if (req.query.acquisitionMode) { conds.push('acquisitionMode = ?'); vals.push(req.query.acquisitionMode); }
  if (req.query.search) { const t = `%${req.query.search}%`; conds.push('(applicantName LIKE ? OR applicantEmail LIKE ? OR carMake LIKE ? OR carModel LIKE ?)'); vals.push(t,t,t,t); }
  if (req.user.role !== 'admin') { conds.push('tenantId = ?'); vals.push(req.user.tenantId); }

  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const total = (db.prepare(`SELECT COUNT(*) as total FROM applications ${where}`).get(...vals) as any).total;
  const rows = db.prepare(`SELECT * FROM applications ${where} ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`).all(...vals, limit, offset) as any[];

  const docs = db.prepare('SELECT * FROM documents WHERE applicationId = ? ORDER BY uploadedAt DESC');
  const hist = db.prepare('SELECT * FROM history WHERE applicationId = ? ORDER BY timestamp ASC');
  const data = rows.map((r: any) => ({ ...r, documents: docs.all(r.id), history: hist.all(r.id) }));

  res.json({ data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
});

app.post('/api/applications', authenticate, (req: any, res: any) => {
  const b = req.body;
  if (!b.applicantName || !b.applicantEmail || !b.carMake || !b.carModel) return res.status(400).json({ error: 'Missing required fields.' });
  const db = getDb();
  const id = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
  const ts = new Date().toISOString();
  const mode = b.acquisitionMode || 'FINANCING';

  db.prepare(`INSERT INTO applications (id,applicantName,applicantEmail,carMake,carModel,carYear,loanAmount,downPayment,termMonths,interestRate,monthlyPayment,creditScore,acquisitionMode,status,statusUpdatedAt,createdAt,tenantId,assignedUnderwriterId) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(id,b.applicantName,b.applicantEmail,b.carMake,b.carModel,b.carYear||2025,Number(b.loanAmount),Number(b.downPayment),Number(b.termMonths),Number(b.interestRate),Number(b.monthlyPayment),Number(b.creditScore),mode,'DOCUMENTS_PENDING',ts,ts,req.user.tenantId,req.user.role==='underwriter'||req.user.role==='admin'?req.user.id:undefined);

  db.prepare(`INSERT INTO history (id,applicationId,status,timestamp,description) VALUES (?,?,?,?,?)`).run(`hist-${Math.floor(10000+Math.random()*90000)}`,id,'SUBMITTED',ts,`Application reservation for ${b.carMake} ${b.carModel} via [${mode}] submitted successfully by ${b.applicantName}.`);
  db.prepare(`INSERT INTO history (id,applicationId,status,timestamp,description) VALUES (?,?,?,?,?)`).run(`hist-${Math.floor(10000+Math.random()*90000)}`,id,'DOCUMENTS_PENDING',ts,'Underwriters require ID, Proof of Income, and vehicle insurance to begin review.');

  db.prepare(`INSERT INTO emails (id,toEmail,subject,body,sentAt,read) VALUES (?,?,?,?,?,?)`).run(`em-${Math.random().toString(36).substr(2,9)}`,b.applicantEmail,`Application Received: ${b.carMake} ${b.carModel} Loan [ID: ${id}]`,`Dear ${b.applicantName},\n\nThank you for applying for car financing. Your request for a loan on a ${b.carYear||2025} ${b.carMake} ${b.carModel} for $${Number(b.loanAmount).toLocaleString()} has been received.\n\nYour application ID is ${id}.\nYour initial status is: DOCUMENTS_PENDING.\nTo speed up approval, head to your dashboard and upload your required ID and proof of income documents.\n\nWarm regards,\nMCARS Finance Underwriters`,ts,0);

  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(id) as any;
  res.status(201).json({ ...row, documents: db.prepare('SELECT * FROM documents WHERE applicationId = ?').all(id), history: db.prepare('SELECT * FROM history WHERE applicationId = ? ORDER BY timestamp ASC').all(id) });
});

app.post('/api/applications/:id/documents', authenticate, (req: any, res: any) => {
  const db = getDb();
  const appItem = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any;
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });
  if (req.user.role !== 'admin' && appItem.tenantId !== req.user.tenantId) return res.status(403).json({ error: 'Access denied.' });

  const docId = `doc-${Math.random().toString(36).substr(2,9)}`;
  db.prepare(`INSERT INTO documents (id,applicationId,name,type,size,uploadedAt) VALUES (?,?,?,?,?,?)`).run(docId,req.params.id,req.body.name||'document.pdf',req.body.type||'ID',req.body.size||1048576,new Date().toISOString());

  if (appItem.status === 'DOCUMENTS_PENDING') {
    db.prepare(`UPDATE applications SET status='UNDER_REVIEW',statusUpdatedAt=? WHERE id=?`).run(new Date().toISOString(),req.params.id);
    db.prepare(`INSERT INTO history (id,applicationId,status,timestamp,description) VALUES (?,?,?,?,?)`).run(`hist-${Math.floor(10000+Math.random()*90000)}`,req.params.id,'UNDER_REVIEW',new Date().toISOString(),`Documents uploaded. Status upgraded to Under Review.`);
  } else {
    db.prepare(`INSERT INTO history (id,applicationId,status,timestamp,description) VALUES (?,?,?,?,?)`).run(`hist-${Math.floor(10000+Math.random()*90000)}`,req.params.id,appItem.status,new Date().toISOString(),`Supplemental document '${req.body.name||'document.pdf'}' uploaded.`);
  }

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any;
  res.json({ ...updated, documents: db.prepare('SELECT * FROM documents WHERE applicationId = ?').all(req.params.id), history: db.prepare('SELECT * FROM history WHERE applicationId = ? ORDER BY timestamp ASC').all(req.params.id) });
});

const STATUS_FLOW: Record<string, string> = { SUBMITTED: 'DOCUMENTS_PENDING', DOCUMENTS_PENDING: 'UNDER_REVIEW', UNDER_REVIEW: 'APPROVED', APPROVED: 'UNDER_REVIEW', REJECTED: 'UNDER_REVIEW' };
app.post('/api/applications/:id/advance', authenticate, requireRole('admin','underwriter'), (req: any, res: any) => {
  const db = getDb();
  const appItem = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any;
  if (!appItem) return res.status(404).json({ error: 'Application not found.' });
  if (req.user.role !== 'admin' && appItem.tenantId !== req.user.tenantId) return res.status(403).json({ error: 'Access denied.' });

  const nextStatus = STATUS_FLOW[appItem.status] || 'UNDER_REVIEW';
  let desc = '';
  if (nextStatus === 'DOCUMENTS_PENDING') desc = 'Required files missed. Waiting for identity proofs.';
  else if (nextStatus === 'UNDER_REVIEW' && appItem.status !== 'APPROVED' && appItem.status !== 'REJECTED') desc = 'Identity papers uploaded. Passed to credit underwriters.';
  else if (nextStatus === 'APPROVED') desc = `Credit score of ${appItem.creditScore} verifies prime capabilities. Loan pre-authorized at ${appItem.interestRate}% APR!`;
  else if (nextStatus === 'UNDER_REVIEW') desc = 'Application reopened for premium recalculation.';
  else desc = 'Status advanced.';

  db.prepare(`UPDATE applications SET status=?,statusUpdatedAt=? WHERE id=?`).run(nextStatus,new Date().toISOString(),req.params.id);
  db.prepare(`INSERT INTO history (id,applicationId,status,timestamp,description) VALUES (?,?,?,?,?)`).run(`hist-${Math.floor(10000+Math.random()*90000)}`,req.params.id,nextStatus,new Date().toISOString(),desc);

  const updated = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id) as any;
  res.json({ ...updated, documents: db.prepare('SELECT * FROM documents WHERE applicationId = ?').all(req.params.id), history: db.prepare('SELECT * FROM history WHERE applicationId = ? ORDER BY timestamp ASC').all(req.params.id) });
});

app.get('/api/emails', authenticate, (req: any, res: any) => {
  const db = getDb();
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 100));
  const sortBy = ['sentAt','subject','toEmail','read'].includes(req.query.sortBy as string) ? req.query.sortBy as string : 'sentAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  const offset = (page - 1) * limit;
  const total = (db.prepare('SELECT COUNT(*) as total FROM emails').get() as any).total;
  const rows = db.prepare(`SELECT * FROM emails ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`).all(limit, offset) as any[];
  res.json({ data: rows.map((r: any) => ({ id: r.id, to: r.toEmail, subject: r.subject, body: r.body, sentAt: r.sentAt, read: r.read === 1 })), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } });
});

app.post('/api/emails/clear', authenticate, requireRole('admin'), (_req: any, res: any) => {
  getDb().prepare('DELETE FROM emails').run();
  res.json({ success: true });
});

function generateSimulatedResponse(messages: any[], systemContext: any) {
  const last = messages[messages.length - 1]?.text || '';
  const ctx = systemContext || {};
  const ctxCar = ctx.carMake && ctx.carModel ? `${ctx.carMake} ${ctx.carModel}` : 'Premium Vehicle';
  const ctxPrice = Number(ctx.price || 45000);
  const ctxDown = Number(ctx.downPayment || 9000);
  const ctxTerm = Number(ctx.term || 60);
  const ctxRate = Number(ctx.rate || 5.89);
  const ctxMonthly = Number(ctx.monthlyPayment || 745);

  const q = last.toLowerCase();
  let reply = '', thinking = '';

  if (q.includes('lease') || q.includes('buy')) {
    thinking = 'User wants to compare Leasing vs. Buying.';
    reply = `### Leasing vs. Financing: Professional Analysis\n\nA strategic comparison between leasing and financing options based on your financial objectives:\n\n| **Financial Metric** | **Leasing Structure** | **Financing Structure** |\n| :--- | :--- | :--- |\n| **Monthly Payment** | 30% - 40% reduction in obligation | Higher payments (building equity position) |\n| **Asset Ownership** | Vehicle returned at lease term conclusion | Full ownership transfer upon loan completion |\n| **Mileage Parameters** | Contractual limits (typically 10k-15k miles annually) | Unlimited mileage with no penalty assessments |\n| **Long-Term Cost** | Continuous payment cycle with no equity accumulation | Cost-effective after loan retirement with retained asset value |\n\n**Strategic Recommendation:** For clients who prioritize vehicle rotation every 2-3 years with minimal monthly cash flow impact, **Leasing** provides optimal flexibility. For clients with high annual mileage requirements seeking to establish long-term asset equity, **Financing** with a minimum 20% down payment represents the superior financial strategy.`;
  } else if (q.includes('rent') || q.includes('own') || q.includes('cash') || q.includes('acquisition') || q.includes('compare') || q.includes('rate')) {
    thinking = `Analyzing acquisition methods for ${ctxCar} at ₱${ctxPrice.toLocaleString()}.`;
    reply = `### Premium Acquisition Rate Comparison\n\n**${ctxCar}** (Retail: **₱${ctxPrice.toLocaleString()}**)\n\n---\n\n### 1. 💰 Cash Buyout\n*   **Discount:** 5.0% → **₱${(ctxPrice*0.95).toLocaleString()}** (save ₱${(ctxPrice*0.05).toLocaleString()})\n*   **Monthly:** ₱0.00 | **Interest:** ₱0.00\n*   **Verdict:** Most cost-efficient if you have liquid assets.\n\n### 2. 🚘 Traditional Financing\n*   **APR:** ${ctxRate}% | **Down:** ₱${ctxDown.toLocaleString()} (${Math.round(ctxDown/ctxPrice*100)}%)\n*   **Monthly:** ₱${ctxMonthly.toFixed(2)}/mo × ${ctxTerm} months\n*   **Total Interest:** ₱${Math.round((ctxMonthly*ctxTerm)-(ctxPrice-ctxDown)).toLocaleString()}\n*   **Verdict:** Great for building credit while retaining capital.\n\n### 3. 🔑 Rent-to-Own\n*   **Surcharge:** ${(ctxRate+3).toFixed(2)}% equivalent | **Deposit:** ₱${Math.round(ctxDown*0.6).toLocaleString()}\n*   **Monthly:** ₱${Math.round(((ctxPrice-ctxDown)/ctxTerm)*1.15).toLocaleString()}/mo\n*   **Credit Check:** Not required\n*   **Verdict:** Best for low credit or flexible exit options.`;
  } else if (q.includes('score') || q.includes('credit') || q.includes('apr')) {
    thinking = 'Analyzing credit score impact on APR.';
    reply = `### How Your Credit Score Determines APR\n\n1. **Excellent (750+):** ~4.89%-5.15% APR\n2. **Very Good (700-749):** ~5.95%-6.50% APR\n3. **Good (660-699):** ~7.49%-8.25% APR\n4. **Subprime (<660):** 10.25%-14.99% APR\n\n*Tip:* Moving from Good to Very Good saves ~₱45/month, over ₱2,700 in 5 years.`;
  } else {
    thinking = `Analyzing customer question: "${last}".`;
    reply = `### Personalized Financial Assessment\n\n*   **DTI Ratio:** Keep auto expenses below **10%-15%** of net income.\n*   **20/4/10 Rule:** 20% down, finance ≤4 years, spend ≤10% of income on auto expenses.\n*   **Rate Calibration:** Extra ₱5,000 down reduces monthly by ~₱95 and lowers total interest.\n\nWould you like me to construct a custom amortization schedule for a specific vehicle?`;
  }

  return { text: reply, thinking };
}

app.post('/api/counselor', async (req: any, res: any) => {
  const { messages, systemContext } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages format.' });

  const hasRealKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'MY_GROQ_API_KEY' && process.env.GROQ_API_KEY !== '';
  if (!hasRealKey) {
    await new Promise(r => setTimeout(r, 1200));
    return res.json(generateSimulatedResponse(messages, systemContext));
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const systemMsg = { role: 'system' as const, content: `You are a premier AI Car Finance Counselor for MCARS FINANCE. Provide analytical advice on loans, leasing vs buying, APRs, credit tiers, and down payment optimization. Be professional, analytical, and helpful.\n\nIMPORTANT: When comparing Leasing vs. Buying/Financing, use formal, professional language:\n- Title: "Leasing vs. Financing: Professional Analysis"\n- Table headers: "Financial Metric", "Leasing Structure", "Financing Structure"\n- Use terms like: "reduction in obligation", "equity position", "contractual limits", "asset ownership", "strategic recommendation"\n- Avoid casual phrases like "lower", "higher", "no limits" - use formal equivalents\n\nUser context: ${JSON.stringify(systemContext || {})}` };
    const chatMsgs = messages.map((m: any) => ({ role: m.sender === 'user' ? 'user' as const : 'assistant' as const, content: m.text }));

    const completion = await groq.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [systemMsg, ...chatMsgs], temperature: 0.7, max_tokens: 4096 });
    const reply = completion.choices[0]?.message?.content || '';
    if (reply) {
      return res.json({ text: reply, thinking: 'Groq inference completed.' });
    }
  } catch (err: any) {
    console.error('Groq error:', err.message);
  }

  await new Promise(r => setTimeout(r, 1200));
  res.json(generateSimulatedResponse(messages, systemContext));
});

export default function handler(req: any, res: any) {
  app(req, res);
}
