const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'c346385ff36d8958',
  database: 'narratium',
  port: 3306
};

async function migrateUsernames() {
  let connection;
  
  try {
    console.log('开始迁移用户名...');
    
    // 连接数据库
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功');
    
    // 检查username字段是否存在
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'narratium' 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME = 'username'
    `);
    
    if (columns.length === 0) {
      console.log('添加username字段...');
      await connection.execute(`
        ALTER TABLE users ADD COLUMN username VARCHAR(255) DEFAULT 'user'
      `);
      console.log('✅ username字段添加成功');
    } else {
      console.log('✅ username字段已存在');
    }
    
    // 为现有用户设置默认用户名
    const [users] = await connection.execute(`
      SELECT id, email, username FROM users WHERE username IS NULL OR username = ''
    `);
    
    if (users.length > 0) {
      console.log(`发现 ${users.length} 个用户需要设置用户名...`);
      
      for (const user of users) {
        // 从邮箱生成默认用户名
        const emailPrefix = user.email.split('@')[0];
        const defaultUsername = emailPrefix || 'user';
        
        await connection.execute(`
          UPDATE users SET username = ? WHERE id = ?
        `, [defaultUsername, user.id]);
        
        console.log(`✅ 用户 ${user.email} 设置为: ${defaultUsername}`);
      }
    } else {
      console.log('✅ 所有用户已有用户名');
    }
    
    // 验证迁移结果
    const [allUsers] = await connection.execute(`
      SELECT email, username FROM users
    `);
    
    console.log('\n迁移结果:');
    allUsers.forEach(user => {
      console.log(`  ${user.email} -> ${user.username}`);
    });
    
    console.log('\n✅ 用户名迁移完成！');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行迁移
migrateUsernames(); 