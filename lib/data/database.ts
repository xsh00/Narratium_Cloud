import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// 数据库文件路径
const dbPath = path.join(process.cwd(), 'data', 'narratium.db');

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 创建数据库连接
const db = new Database(dbPath);

// 初始化数据库表
function initializeDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 验证码表
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_codes (
      email TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 创建索引
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email)');
  db.exec('CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at)');
}

// 初始化数据库
initializeDatabase();

// 用户相关操作
export const userRepository = {
  create: (user: { id: string; email: string; password: string }) => {
    const stmt = db.prepare(`
      INSERT INTO users (id, email, password)
      VALUES (?, ?, ?)
    `);
    
    const result = stmt.run(user.id, user.email, user.password);
    return { ...user, id: result.lastInsertRowid?.toString() || user.id };
  },

  findByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email) as any;
  },

  findById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id) as any;
  },

  getAll: () => {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all() as any[];
  },

  delete: (id: string) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  update: (id: string, updates: Partial<{ email: string; password: string }>) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    
    const stmt = db.prepare(`
      UPDATE users 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = stmt.run(...values, id);
    return result.changes > 0;
  }
};

// 验证码相关操作
export const verificationCodeRepository = {
  set: (email: string, code: string, expiresIn: number = 5 * 60 * 1000) => {
    const expiresAt = new Date(Date.now() + expiresIn).toISOString();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO verification_codes (email, code, expires_at)
      VALUES (?, ?, ?)
    `);
    
    stmt.run(email, code, expiresAt);
  },

  get: (email: string) => {
    const stmt = db.prepare(`
      SELECT * FROM verification_codes 
      WHERE email = ? AND expires_at > datetime('now', 'localtime')
    `);
    
    return stmt.get(email) as any;
  },

  delete: (email: string) => {
    const stmt = db.prepare('DELETE FROM verification_codes WHERE email = ?');
    const result = stmt.run(email);
    return result.changes > 0;
  },

  cleanup: () => {
    const stmt = db.prepare("DELETE FROM verification_codes WHERE expires_at <= datetime('now', 'localtime')");
    const result = stmt.run();
    return result.changes;
  }
};

// 数据库统计信息
export const getDatabaseStats = () => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
  const codeCount = db.prepare('SELECT COUNT(*) as count FROM verification_codes').get() as any;
  
  return {
    users: userCount.count,
    verificationCodes: codeCount.count,
    dbPath
  };
};

// 定期清理过期验证码
setInterval(() => {
  const deleted = verificationCodeRepository.cleanup();
  if (deleted > 0) {
    console.log(`清理了 ${deleted} 个过期验证码`);
  }
}, 60000); // 每分钟清理一次

export default db; 