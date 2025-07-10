#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ 创建数据目录:', dataDir);
}

// 检查数据库文件
const dbPath = path.join(dataDir, 'narratium.db');
if (fs.existsSync(dbPath)) {
  console.log('✅ 数据库文件已存在:', dbPath);
  
  // 获取文件大小
  const stats = fs.statSync(dbPath);
  const fileSizeInBytes = stats.size;
  const fileSizeInKB = fileSizeInBytes / 1024;
  
  console.log(`📊 数据库文件大小: ${fileSizeInKB.toFixed(2)} KB`);
} else {
  console.log('📝 数据库文件将在首次运行时自动创建');
}

console.log('\n🎉 数据库初始化完成！');
console.log('💡 提示: 数据库文件将自动创建在 data/narratium.db');
console.log('🔧 管理: 访问 /admin/database 查看数据库管理页面'); 