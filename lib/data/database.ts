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
    
    // 社交帖子表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS posts (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        image_url VARCHAR(1024),
        likes_count INT DEFAULT 0,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        is_pinned BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ 社交帖子表创建成功');
    
    // 检查并添加帖子表中的status字段（如果不存在）
    try {
      // 检查字段是否存在
      const [statusColumns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'posts'
        AND COLUMN_NAME = 'status'
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if ((statusColumns as any[]).length === 0) {
        await connection.execute(`
          ALTER TABLE posts
          ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
        `);
        console.log('✅ posts表status字段添加成功');
        
        // 将现有帖子设为已批准状态
        await connection.execute(`
          UPDATE posts
          SET status = 'approved'
          WHERE status IS NULL
        `);
        console.log('✅ 现有帖子状态已更新为已批准');
      }
    } catch (error) {
      console.error('检查posts表status字段时出错:', error);
    }
    
    // 检查并添加帖子表中的is_pinned字段（如果不存在）
    try {
      // 检查字段是否存在
      const [pinnedColumns] = await connection.execute(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = 'posts'
        AND COLUMN_NAME = 'is_pinned'
        AND TABLE_SCHEMA = DATABASE()
      `);
      
      if ((pinnedColumns as any[]).length === 0) {
        await connection.execute(`
          ALTER TABLE posts
          ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE
        `);
        console.log('✅ posts表is_pinned字段添加成功');
      }
    } catch (error) {
      console.error('检查posts表is_pinned字段时出错:', error);
    }
    
    // 帖子点赞表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS post_likes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_like (post_id, user_id),
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ 帖子点赞表创建成功');
    
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
    
    // 创建帖子索引
    try {
      await connection.execute(`CREATE INDEX idx_posts_user_id ON posts(user_id)`);
      await connection.execute(`CREATE INDEX idx_posts_created_at ON posts(created_at)`);
      console.log('✅ 帖子索引创建成功');
    } catch (error: any) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('✅ 帖子索引已存在');
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

// 帖子相关操作
export const postRepository = {
  create: async (post: { id: string; userId: string; content: string; imageUrl?: string }) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      // 创建帖子，支持imageUrl，默认状态为pending
      const [result] = await connection.execute(
        'INSERT INTO posts (id, user_id, content, image_url, status) VALUES (?, ?, ?, ?, ?)',
        [post.id, post.userId, post.content, post.imageUrl || null, 'pending']
      );
      
      return { ...post, createdAt: new Date().toISOString(), likesCount: 0, status: 'pending', isPinned: false };
    } catch (error) {
      console.error('创建帖子失败:', error);
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
        `SELECT p.*, u.username 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.id = ?`,
        [id]
      );
      
      return (rows as any[])[0] || null;
    } catch (error) {
      console.error('查找帖子失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  findAll: async (limit: number = 20, offset: number = 0, searchTerm?: string, showPending: boolean = false) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      let query = `
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id
      `;
      
      const params: any[] = [];
      
      // 基础条件：只显示已批准的帖子或者根据showPending参数决定是否显示待审核帖子
      if (!showPending) {
        query += ` WHERE p.status = 'approved'`;
      }
      
      // 搜索条件
      if (searchTerm) {
        query += showPending ? ` WHERE p.content LIKE ?` : ` AND p.content LIKE ?`;
        params.push(`%${searchTerm}%`);
      }
      
      // 先按置顶状态排序，再按创建时间排序
      query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ${parseInt(limit.toString())} OFFSET ${parseInt(offset.toString())}`;
      
      console.log("Search query:", query, params); // 添加日志以便调试
      const [rows] = await connection.execute(query, params);
      
      return rows as any[];
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // 管理员获取所有帖子，包括待审核、已批准和被拒绝的
  findAllForAdmin: async (limit: number = 20, offset: number = 0, searchTerm?: string, status?: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      let query = `
        SELECT p.*, u.username 
        FROM posts p 
        JOIN users u ON p.user_id = u.id
      `;
      
      const params: any[] = [];
      
      // 构建WHERE子句
      const conditions: string[] = [];
      
      if (searchTerm) {
        conditions.push(`p.content LIKE ?`);
        params.push(`%${searchTerm}%`);
      }
      
      if (status && ['pending', 'approved', 'rejected'].includes(status)) {
        conditions.push(`p.status = ?`);
        params.push(status);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      // 先按置顶状态排序，再按创建时间排序
      query += ` ORDER BY p.is_pinned DESC, p.created_at DESC LIMIT ${parseInt(limit.toString())} OFFSET ${parseInt(offset.toString())}`;
      
      const [rows] = await connection.execute(query, params);
      
      return rows as any[];
    } catch (error) {
      console.error('获取管理员帖子列表失败:', error);
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
        'DELETE FROM posts WHERE id = ?',
        [id]
      );
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('删除帖子失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  update: async (id: string, updates: Partial<{ content: string; imageUrl: string; status: string; isPinned: boolean }>) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const updateFields: string[] = [];
      const values: any[] = [];
      
      if (updates.content !== undefined) {
        updateFields.push('content = ?');
        values.push(updates.content);
      }
      
      if (updates.imageUrl !== undefined) {
        updateFields.push('image_url = ?');
        values.push(updates.imageUrl);
      }
      
      if (updates.status !== undefined && ['pending', 'approved', 'rejected'].includes(updates.status)) {
        updateFields.push('status = ?');
        values.push(updates.status);
      }
      
      if (updates.isPinned !== undefined) {
        updateFields.push('is_pinned = ?');
        values.push(updates.isPinned ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        return false;
      }
      
      const [result] = await connection.execute(
        `UPDATE posts SET ${updateFields.join(', ')} WHERE id = ?`,
        [...values, id]
      );
      
      return (result as any).affectedRows > 0;
    } catch (error) {
      console.error('更新帖子失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  // 审核帖子
  approvePost: async (id: string) => {
    return postRepository.update(id, { status: 'approved' });
  },
  
  rejectPost: async (id: string) => {
    return postRepository.update(id, { status: 'rejected' });
  },
  
  // 置顶/取消置顶帖子
  togglePinned: async (id: string, isPinned: boolean) => {
    return postRepository.update(id, { isPinned });
  },

  // 获取用户发布的帖子
  findByUserId: async (userId: string, limit: number = 20, offset: number = 0) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      // 使用具体数字而不是参数占位符，避免类型问题
      const query = `SELECT p.*, u.username 
         FROM posts p 
         JOIN users u ON p.user_id = u.id 
         WHERE p.user_id = ? 
         ORDER BY p.created_at DESC 
         LIMIT ${parseInt(limit.toString())} OFFSET ${parseInt(offset.toString())}`;
      
      const [rows] = await connection.execute(query, [userId]);
      
      return rows as any[];
    } catch (error) {
      console.error('获取用户帖子失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }
};

// 点赞相关操作
export const likeRepository = {
  like: async (postId: string, userId: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      // 开始事务
      await connection.beginTransaction();
      
      try {
        // 添加点赞记录
        await connection.execute(
          'INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)',
          [postId, userId]
        );
        
        // 更新帖子点赞数量
        await connection.execute(
          'UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?',
          [postId]
        );
        
        // 提交事务
        await connection.commit();
        
        return true;
      } catch (error: any) {
        // 如果是唯一键冲突，说明用户已经点赞过
        if (error.code === 'ER_DUP_ENTRY') {
          return false;
        }
        
        // 其他错误，回滚事务
        await connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('点赞失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  unlike: async (postId: string, userId: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      // 开始事务
      await connection.beginTransaction();
      
      try {
        // 删除点赞记录
        const [deleteResult] = await connection.execute(
          'DELETE FROM post_likes WHERE post_id = ? AND user_id = ?',
          [postId, userId]
        );
        
        // 如果删除了点赞记录，更新帖子点赞数量
        if ((deleteResult as any).affectedRows > 0) {
          await connection.execute(
            'UPDATE posts SET likes_count = likes_count - 1 WHERE id = ?',
            [postId]
          );
        }
        
        // 提交事务
        await connection.commit();
        
        return (deleteResult as any).affectedRows > 0;
      } catch (error) {
        // 回滚事务
        await connection.rollback();
        throw error;
      }
    } catch (error) {
      console.error('取消点赞失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  isLiked: async (postId: string, userId: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        'SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?',
        [postId, userId]
      );
      
      return (rows as any[]).length > 0;
    } catch (error) {
      console.error('检查点赞状态失败:', error);
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  },

  getLikes: async (postId: string) => {
    let connection: PoolConnection | null = null;
    
    try {
      connection = await pool.getConnection();
      
      const [rows] = await connection.execute(
        `SELECT pl.*, u.username 
         FROM post_likes pl 
         JOIN users u ON pl.user_id = u.id 
         WHERE pl.post_id = ?`,
        [postId]
      );
      
      return rows as any[];
    } catch (error) {
      console.error('获取帖子点赞列表失败:', error);
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
    const [postRows] = await connection.execute('SELECT COUNT(*) as count FROM posts');
    const [likeRows] = await connection.execute('SELECT COUNT(*) as count FROM post_likes');
    
    return {
      users: (userRows as any[])[0].count,
      verificationCodes: (codeRows as any[])[0].count,
      posts: (postRows as any[])[0].count,
      postLikes: (likeRows as any[])[0].count,
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