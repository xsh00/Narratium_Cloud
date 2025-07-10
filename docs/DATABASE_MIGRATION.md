# 数据库迁移说明

## 概述

Narratium 已从内存存储迁移到 SQLite 数据库存储，提供更好的数据持久化和管理功能。

## 迁移内容

### 1. 存储方式变更
- **之前**: 内存存储（重启后数据丢失）
- **现在**: SQLite 数据库存储（数据持久化）

### 2. 数据库结构

#### 用户表 (users)
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 验证码表 (verification_codes)
```sql
CREATE TABLE verification_codes (
  email TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3. 数据库文件位置
- **路径**: `data/narratium.db`
- **类型**: SQLite 3 数据库文件
- **大小**: 轻量级，通常几 KB 到几 MB

## 新功能

### 1. 数据库管理页面
- **访问地址**: `/admin/database`
- **功能**: 查看用户列表、数据库统计、删除用户

### 2. 数据库管理 API
- **GET /api/admin/database**: 获取数据库统计和用户列表
- **DELETE /api/admin/database**: 删除指定用户

### 3. 自动清理机制
- 验证码自动过期清理（每分钟执行）
- 数据库连接自动管理
- 索引优化查询性能

## 文件变更

### 新增文件
```
lib/data/database.ts              # 数据库管理模块
app/api/admin/database/route.ts   # 数据库管理API
app/admin/database/page.tsx       # 数据库管理页面
```

### 删除文件
```
lib/data/auth-store.ts            # 旧的内存存储模块
```

### 修改文件
```
app/api/auth/register/route.ts    # 使用数据库存储
app/api/auth/login/route.ts       # 使用数据库存储
.gitignore                        # 添加数据库文件忽略规则
```

## 使用说明

### 1. 数据库文件管理
- 数据库文件会自动创建在 `data/` 目录下
- 文件名: `narratium.db`
- 建议定期备份数据库文件

### 2. 数据库管理
- 访问 `/admin/database` 查看用户数据
- 可以删除不需要的用户账户
- 查看数据库统计信息

### 3. 数据备份
```bash
# 备份数据库
cp data/narratium.db data/narratium_backup_$(date +%Y%m%d).db

# 恢复数据库
cp data/narratium_backup_20231201.db data/narratium.db
```

## 性能优化

### 1. 索引优化
- 用户邮箱索引：快速查找用户
- 验证码邮箱索引：快速查找验证码
- 验证码过期时间索引：快速清理过期数据

### 2. 查询优化
- 使用预处理语句防止 SQL 注入
- 参数化查询提高安全性
- 连接池管理减少资源消耗

## 安全考虑

### 1. 数据安全
- 密码使用 bcryptjs 加密存储
- 数据库文件权限控制
- 定期备份重要数据

### 2. 访问控制
- 数据库管理页面需要手动访问
- API 接口无额外认证（开发环境）
- 生产环境建议添加管理员认证

## 故障排除

### 1. 数据库文件权限问题
```bash
# 确保数据库目录可写
chmod 755 data/
chmod 644 data/narratium.db
```

### 2. 数据库损坏
```bash
# 检查数据库完整性
sqlite3 data/narratium.db "PRAGMA integrity_check;"
```

### 3. 数据迁移
如果需要从其他数据库迁移数据，可以编写迁移脚本：

```javascript
// 示例：从 JSON 文件迁移
const fs = require('fs');
const { userRepository } = require('./lib/data/database');

const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
users.forEach(user => {
  userRepository.create(user);
});
```

## 生产环境部署

### 1. 数据库配置
- 确保数据库文件目录有写入权限
- 配置数据库文件备份策略
- 监控数据库文件大小

### 2. 性能监控
- 监控数据库查询性能
- 定期清理过期验证码
- 监控数据库文件增长

### 3. 安全加固
- 添加数据库管理页面访问控制
- 配置数据库文件加密
- 实施定期数据备份

## 版本兼容性

- ✅ 新用户注册功能完全兼容
- ✅ 现有用户登录功能完全兼容
- ✅ 验证码功能完全兼容
- ✅ 所有 API 接口保持兼容

## 后续计划

1. **数据迁移工具**: 提供从内存存储到数据库的迁移工具
2. **数据库监控**: 添加数据库性能监控
3. **数据导出**: 支持用户数据导出功能
4. **备份自动化**: 自动数据库备份功能 