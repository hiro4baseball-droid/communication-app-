import { createClient, Client, InStatement } from '@libsql/client';
import bcrypt from 'bcryptjs';

let dbClient: Client | null = null;
let initialized = false;

export async function getDb(): Promise<Client> {
  if (!dbClient) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error('TURSO_DATABASE_URL が設定されていません');
    dbClient = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  if (!initialized) {
    await initSchema();
    await seedAdmin();
    initialized = true;
  }
  return dbClient;
}

async function initSchema(): Promise<void> {
  const db = dbClient!;
  const stmts: InStatement[] = [
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )`,
    `CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      grade TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS communication_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      shift_date TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS student_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL UNIQUE,
      likes TEXT DEFAULT '',
      efforts TEXT DEFAULT '',
      talk_history TEXT DEFAULT '',
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS login_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      login_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
  ];
  await db.batch(stmts, 'write');
}

async function seedAdmin(): Promise<void> {
  const db = dbClient!;
  const rs = await db.execute("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
  if (rs.rows.length === 0) {
    const hash = bcrypt.hashSync('admin1234', 10);
    await db.execute({ sql: 'INSERT INTO users (name, password_hash, role) VALUES (?, ?, ?)', args: ['管理者', hash, 'admin'] });
    console.log('管理者アカウントを作成: 名前=管理者, パスワード=admin1234');
  }
}
