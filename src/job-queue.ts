import Database from 'better-sqlite3';

export interface Job {
  id: string;
  type: string;
  payload: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  retries: number;
  maxRetries: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

type JobHandler = (job: Job) => Promise<void>;

export class JobQueue {
  private db: Database.Database;
  private polling = false;
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(db: Database.Database) {
    this.db = db;
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(`
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
  }

  enqueue(type: string, payload: Record<string, unknown>, maxRetries = 3): Job {
    const id = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO job_queue (id, type, payload, status, retries, maxRetries, error, createdAt, updatedAt)
      VALUES (?, ?, ?, 'pending', 0, ?, NULL, ?, ?)
    `);
    stmt.run(id, type, JSON.stringify(payload), maxRetries, now, now);
    return this.db.prepare('SELECT * FROM job_queue WHERE id = ?').get(id) as Job;
  }

  dequeue(): Job | null {
    const job = this.db.prepare(`
      SELECT * FROM job_queue
      WHERE status = 'pending'
      ORDER BY createdAt ASC
      LIMIT 1
    `).get() as Job | undefined;

    if (!job) return null;

    this.db.prepare("UPDATE job_queue SET status = 'running', updatedAt = ? WHERE id = ?")
      .run(new Date().toISOString(), job.id);

    return { ...job, status: 'running' };
  }

  complete(id: string): void {
    this.db.prepare("UPDATE job_queue SET status = 'completed', updatedAt = ? WHERE id = ?")
      .run(new Date().toISOString(), id);
  }

  fail(id: string, error: string): void {
    const job = this.db.prepare('SELECT * FROM job_queue WHERE id = ?').get(id) as Job | undefined;
    if (!job) return;

    const now = new Date().toISOString();
    if (job.retries < job.maxRetries) {
      this.db.prepare("UPDATE job_queue SET status = 'pending', retries = retries + 1, error = ?, updatedAt = ? WHERE id = ?")
        .run(error, now, id);
    } else {
      this.db.prepare("UPDATE job_queue SET status = 'failed', retries = retries + 1, error = ?, updatedAt = ? WHERE id = ?")
        .run(error, now, id);
    }
  }

  getPendingCount(type?: string): number {
    if (type) {
      const row = this.db.prepare("SELECT COUNT(*) as count FROM job_queue WHERE status = 'pending' AND type = ?").get(type) as { count: number };
      return row.count;
    }
    const row = this.db.prepare("SELECT COUNT(*) as count FROM job_queue WHERE status = 'pending'").get() as { count: number };
    return row.count;
  }

  getFailedJobs(): Job[] {
    return this.db.prepare("SELECT * FROM job_queue WHERE status = 'failed' ORDER BY updatedAt DESC").all() as Job[];
  }

  getRecentJobs(limit = 20): Job[] {
    return this.db.prepare('SELECT * FROM job_queue ORDER BY createdAt DESC LIMIT ?').all(limit) as Job[];
  }

  processJobs(type: string, handler: JobHandler, intervalMs = 1000): void {
    if (this.polling) return;
    this.polling = true;

    const poll = async () => {
      const job = this.db.prepare(
        "SELECT * FROM job_queue WHERE status = 'pending' AND type = ? ORDER BY createdAt ASC LIMIT 1"
      ).get(type) as Job | undefined;

      if (!job) return;

      this.db.prepare("UPDATE job_queue SET status = 'running', updatedAt = ? WHERE id = ?")
        .run(new Date().toISOString(), job.id);

      try {
        await handler({ ...job, status: 'running' });
        this.db.prepare("UPDATE job_queue SET status = 'completed', updatedAt = ? WHERE id = ?")
          .run(new Date().toISOString(), job.id);
      } catch (err: any) {
        const now = new Date().toISOString();
        const current = this.db.prepare('SELECT * FROM job_queue WHERE id = ?').get(job.id) as Job | undefined;
        if (current && current.retries < current.maxRetries) {
          this.db.prepare("UPDATE job_queue SET status = 'pending', retries = retries + 1, error = ?, updatedAt = ? WHERE id = ?")
            .run(err.message || String(err), now, job.id);
        } else if (current) {
          this.db.prepare("UPDATE job_queue SET status = 'failed', retries = retries + 1, error = ?, updatedAt = ? WHERE id = ?")
            .run(err.message || String(err), now, job.id);
        }
      }
    };

    this.timers.set(type, setInterval(poll, intervalMs));
  }

  stop(): void {
    this.polling = false;
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}

let globalJobQueue: JobQueue | null = null;

export function getJobQueue(db: Database.Database): JobQueue {
  if (!globalJobQueue) {
    globalJobQueue = new JobQueue(db);
  }
  return globalJobQueue;
}
