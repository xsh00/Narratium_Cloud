/**
 * 更新帖子表结构，添加审核和置顶功能
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function updatePostsTable() {
  console.log('开始更新帖子表结构...');
  
  // 创建数据库连接池，使用与主应用相同的配置
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'c346385ff36d8958',
    database: 'narratium',
    port: 3306,
    connectionLimit: 10,
    connectTimeout: 60000,
    queueLimit: 0,
    waitForConnections: true
  });

  let connection;
  try {
    connection = await pool.getConnection();
    console.log('✅ 数据库连接成功');

    // 检查status列是否存在
    const [statusColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'posts'
      AND COLUMN_NAME = 'status'
      AND TABLE_SCHEMA = DATABASE()
    `);

    // 如果status列不存在，则添加
    if (statusColumns.length === 0) {
      console.log('添加status列...');
      await connection.execute(`
        ALTER TABLE posts
        ADD COLUMN status ENUM('pending', 'approved', 'rejected') DEFAULT 'approved'
      `);
      console.log('✅ status列添加成功');
    } else {
      console.log('✅ status列已存在');
    }

    // 检查is_pinned列是否存在
    const [pinnedColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'posts'
      AND COLUMN_NAME = 'is_pinned'
      AND TABLE_SCHEMA = DATABASE()
    `);

    // 如果is_pinned列不存在，则添加
    if (pinnedColumns.length === 0) {
      console.log('添加is_pinned列...');
      await connection.execute(`
        ALTER TABLE posts
        ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE
      `);
      console.log('✅ is_pinned列添加成功');
    } else {
      console.log('✅ is_pinned列已存在');
    }

    // 将现有帖子状态设为已批准
    console.log('将现有帖子状态更新为已批准...');
    await connection.execute(`
      UPDATE posts
      SET status = 'approved'
      WHERE status IS NULL
    `);
    console.log('✅ 现有帖子状态更新完成');

    console.log('✅ 帖子表结构更新成功');
  } catch (error) {
    console.error('更新帖子表结构失败:', error);
  } finally {
    if (connection) {
      connection.release();
    }
    await pool.end();
  }
}

// 执行更新
updatePostsTable(); 