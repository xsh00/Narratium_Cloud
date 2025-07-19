# 环境变量配置示例

## 创建配置文件

在项目根目录创建 `.env.local` 文件：

```bash
cp .env.local.example .env.local
# 或者手动创建
touch .env.local
```

## 配置内容

将以下内容复制到 `.env.local` 文件中，并填入实际值：

```env
# Narratium 环境变量配置

# 基础配置
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 单邮箱配置（兼容模式）
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# 多邮箱池配置（推荐）
# 邮箱账户1
EMAIL_USER_1=your-email-1@gmail.com
EMAIL_PASS_1=your-app-password-1

# 邮箱账户2
EMAIL_USER_2=your-email-2@gmail.com
EMAIL_PASS_2=your-app-password-2

# 邮箱账户3
EMAIL_USER_3=your-email-3@gmail.com
EMAIL_PASS_3=your-app-password-3

# 可以继续添加更多账户...
# EMAIL_USER_4=your-email-4@gmail.com
# EMAIL_PASS_4=your-app-password-4
```

## Gmail 应用专用密码设置

### 1. 启用两步验证
1. 登录您的 Gmail 账户
2. 访问 [Google 账户安全设置](https://myaccount.google.com/security)
3. 找到"两步验证"并启用

### 2. 生成应用专用密码
1. 在两步验证页面，找到"应用专用密码"
2. 点击"生成新的应用专用密码"
3. 选择应用类型：其他（自定义名称）
4. 输入名称：Narratium Cloud
5. 点击"生成"
6. 复制生成的16位密码（不包含空格）

### 3. 配置环境变量
将您的 Gmail 邮箱和生成的密码填入 `.env.local` 文件：

```env
EMAIL_USER_1=your-email@gmail.com
EMAIL_PASS_1=abcd efgh ijkl mnop
```

## 配置验证

### 1. 运行测试脚本
```bash
npm run test-email-pool
```

### 2. 访问管理界面
- 启动开发服务器：`npm run dev`
- 访问：`http://localhost:3000/admin/email-pool`
- 查看邮箱池状态

### 3. 在线测试
- 访问：`http://localhost:3000/test-email`
- 测试邮件发送功能

## 注意事项

1. **不要提交 `.env.local` 文件到版本控制**
2. **使用应用专用密码，不是登录密码**
3. **确保密码格式正确（不包含空格）**
4. **定期更换应用专用密码**

## 故障排除

### 配置检查失败
- 确认 `.env.local` 文件存在
- 检查环境变量名称是否正确
- 确认密码已正确复制

### 邮件发送失败
- 检查应用专用密码是否正确
- 确认Gmail两步验证已启用
- 查看服务器日志错误信息

### 账户达到限制
- 添加更多邮箱账户
- 等待次日自动重置
- 手动重置账户状态 