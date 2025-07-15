# Scripts 工具说明

本目录包含用于管理Narratium Cloud项目的各种脚本工具。

## COS角色卡管理

### 测试COS配置
```bash
node scripts/test-cos-config.js
```
测试COS存储桶配置是否正确，显示当前配置的角色卡列表。

### 管理角色卡
```bash
node scripts/simple-cos-sync.js
```
交互式管理工具，支持：
- 查看当前角色卡列表
- 添加新角色卡
- 批量导入文件名

### 更新角色卡配置
```bash
node scripts/update-cos-characters.js
```
手动更新角色卡配置文件的工具。

## GitHub集成测试

### 测试GitHub API
```bash
node scripts/test-github-api.js
```
测试GitHub API是否可以正常访问，验证"海外版（需VPN）"模式是否可用。

## 数据库管理

### 初始化数据库
```bash
node scripts/init-database.js
```
初始化项目数据库。

## GitHub仓库管理

### 设置GitHub仓库
```bash
node scripts/setup-github-repo.js
```
设置GitHub仓库配置。

## 预设系统

### 更新预设角色
```bash
node scripts/update-preset-characters.js
```
更新预设角色配置。

## 使用建议

1. **首次使用**：先运行 `test-cos-config.js` 检查COS配置
2. **测试GitHub**：运行 `test-github-api.js` 验证GitHub集成
3. **添加角色卡**：使用 `simple-cos-sync.js` 交互式添加
4. **批量操作**：使用 `update-cos-characters.js` 批量更新
5. **故障排除**：使用相应的测试脚本验证配置

## 角色卡下载模式

项目支持两种角色卡下载模式：

### 国内版（COS存储）
- ✅ 国内访问速度快
- ✅ 无需VPN
- ⚠️ 部分R18内容已过滤
- 📁 数据源：腾讯云COS

### 海外版（需VPN）
- ✅ 包含完整角色卡内容
- ✅ 实时从GitHub获取
- ⚠️ 需要VPN访问
- 📁 数据源：GitHub仓库

用户可以在角色卡下载页面通过切换按钮选择模式。

## 注意事项

- 所有脚本都需要在项目根目录下运行
- 确保有相应的文件读写权限
- COS相关脚本需要正确配置存储桶信息
- GitHub模式需要网络能够访问GitHub API 