import mysql from 'mysql2/promise';
import { Pool, PoolConnection } from 'mysql2/promise';

// MySQL数据库连接配置 - 使用本地数据库
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'c346385ff36d8958', // 已配置密码
  database: 'narratium', // 直接指定数据库，避免USE命令
  port: 3306,
  connectionLimit: 10,
  connectTimeout: 60000,
  // MySQL2连接池特定选项
  queueLimit: 0,
  waitForConnections: true
};

// 创建连接池
const pool = mysql.createPool(dbConfig);

// 初始化数据库表
async function initializeDatabase() {
  let connection: PoolConnection | null = null;
  
  try {
    console.log('正在初始化数据库...');
    connection = await pool.getConnection();
    
    // 检查数据库是否存在，如果不存在则创建
    await connection.execute(`CREATE DATABASE IF NOT EXISTS narratium`);
    console.log('✅ 数据库连接成功');
    
    // 用户表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        username VARCHAR(255) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // 为现有表添加username字段（如果不存在）
    try {
      await connection.execute(`
        ALTER TABLE users ADD COLUMN username VARCHAR(255) DEFAULT 'user'
      `);
      console.log('✅ 用户名字段添加成功');
    } catch (error: any) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ 用户名字段已存在');
      } else {
        console.log('用户名字段检查完成');
      }
    }
    console.log('✅ 用户表创建成功');
    
    // 验证码表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        email VARCHAR(255) PRIMARY KEY,
        code VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ 验证码表创建成功');
    
    // 创建索引
    try {
      await connection.execute(`CREATE INDEX idx_users_email ON users(email)`);
      console.log('✅ 用户邮箱索引创建成功');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ 用户邮箱索引已存在');
      } else {
        throw error;
      }
    }
    
    try {
      await connection.execute(`CREATE INDEX idx_verification_codes_email ON verification_codes(email)`);
      console.log('✅ 验证码邮箱索引创建成功');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ 验证码邮箱索引已存在');
      } else {
        throw error;
      }
    }
    
    console.log('✅ 索引创建完成');
    
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// 用户相关操作
export const userRepository = {
  create: async (user: { id: string; email: string; password: string; username?: string }) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const username = user.username || 'user';
      const [result] = await connection.execute(
        'INSERT INTO users (id, email, password, username) VALUES (?, ?, ?, ?)',
        [user.id, user.email, user.password, username]
      );
      
      return { ...user, username };
    } catch (error) {
      console.error('创建用户失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  findByEmail: async (email: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  findById: async (id: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );
      
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('查找用户失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  getAll: async () => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        'SELECT * FROM users ORDER BY created_at DESC'
      );
      
      return rows as any[];
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  delete: async (id: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('删除用户失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  update: async (id: string, updates: Partial<{ email: string; password: string; username: string }>) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
      const values = Object.values(updates);
      
      const [result] = await connection.execute(
        `UPDATE users SET ${fields} WHERE id = ?`,
        [...values, id]
      );
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('更新用户失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
};

// 验证码相关操作
export const verificationCodeRepository = {
  set: async (email: string, code: string, expiresIn: number = 5 * 60 * 1000) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const expiresAt = new Date(Date.now() + expiresIn);
      
      await connection.execute(
        'INSERT INTO verification_codes (email, code, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE code = ?, expires_at = ?',
        [email, code, expiresAt, code, expiresAt]
      );
    } catch (error) {
      console.error('设置验证码失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  get: async (email: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        'SELECT * FROM verification_codes WHERE email = ? AND expires_at > NOW()',
        [email]
      );
      
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('获取验证码失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  delete: async (email: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        'DELETE FROM verification_codes WHERE email = ?',
        [email]
      );
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('删除验证码失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  cleanup: async () => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [result] = await connection.execute(
        'DELETE FROM verification_codes WHERE expires_at <= NOW()'
      );
      
      return (result as any).affectedRows;
    } catch (error) {
      console.error('清理验证码失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
};

// 数据库统计信息
export const getDatabaseStats = async () => {
  let connection: PoolConnection | null = null;
  
  try {
    connection = await pool.getConnection();
    
    const [userRows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    const [codeRows] = await connection.execute('SELECT COUNT(*) as count FROM verification_codes');
    
    return {
      users: (userRows as any[])[0].count,
      verificationCodes: (codeRows as any[])[0].count,
      dbConfig: {
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port
      }
    };
  } catch (error) {
    console.error('获取数据库统计信息失败:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// 定期清理过期验证码
setInterval(async () => {
  try {
    const deleted = await verificationCodeRepository.cleanup();
    if (deleted > 0) {
      console.log(`清理了 ${deleted} 个过期验证码`);
    }
  } catch (error) {
    console.error('清理过期验证码失败:', error);
  }
}, 60000); // 每分钟清理一次

// 初始化数据库
initializeDatabase().catch(console.error);

export default pool; 