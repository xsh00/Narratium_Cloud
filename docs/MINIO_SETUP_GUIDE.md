# MinIO角色卡设置指南

本指南帮助您配置MinIO存储作为角色卡的唯一下载源，以获得更好的访问速度和自主控制。

## 概述

MinIO是一个高性能的对象存储服务，兼容Amazon S3 API。通过使用MinIO，您可以：
- 自主控制存储服务
- 获得更快的访问速度
- 降低存储成本
- 更好的隐私保护

## 配置信息

当前MinIO配置：
- **S3 API地址**: `https://characterapi.sillytarven.top`
- **存储桶名称**: `narratium`
- **文件目录**: 根目录

## 设置步骤

### 1. 准备MinIO服务

确保您的MinIO服务已经正确配置并运行：
- MinIO服务器已启动
- 存储桶 `narratium` 已创建
- 访问权限已正确配置

### 2. 上传角色卡文件

将您的角色卡PNG文件上传到MinIO存储桶：

```bash
# 使用MinIO客户端上传文件
mc cp /path/to/character-cards/*.png myminio/narratium/
```

或者通过MinIO控制台上传文件。

### 3. 更新配置文件

编辑 `lib/config/minio-config.ts` 文件，确保配置正确：

```typescript
export const MINIO_CONFIG = {
  // MinIO S3 API地址
  S3_API_URL: "https://characterapi.sillytarven.top",
  
  // 存储桶名称
  BUCKET_NAME: "narratium",
  
  // 角色卡文件目录（可选）
  CHARACTER_CARDS_PATH: "",
  
  // 获取完整的角色卡文件URL
  getCharacterCardUrl(fileName: string): string {
    const path = this.CHARACTER_CARDS_PATH ? `${this.CHARACTER_CARDS_PATH}/` : "";
    return `${this.S3_API_URL}/${this.BUCKET_NAME}/${path}${fileName}`;
  },
};
```

### 4. 文件命名规范

为了更好的标签自动提取，建议使用以下文件命名格式：

```
角色名--标签1,标签2.png
```

例如：
- `知更鸟--同人二创.png`
- `《致炽焰以战歌》——露帕--古风,同人.png`
- `刀剑神域--同人二创,战斗.png`

系统会自动从文件名中提取角色名和标签信息。

### 5. 测试配置

运行测试脚本验证配置是否正确：

```bash
node scripts/test-minio-api.js
```

## 使用说明

### 在应用程序中使用

1. **访问角色卡页面**
2. **点击"社区下载角色"按钮**
3. **选择MinIO模式**（默认模式）
4. **浏览和下载角色卡**

### 下载模式

应用程序现在只支持MinIO下载模式：
- **MinIO**: 从您的MinIO服务器下载（唯一模式）

系统会自动从MinIO存储桶获取所有PNG文件，无需手动切换。

## 文件管理

### 添加新角色卡

1. 将PNG文件上传到MinIO存储桶
2. 刷新页面即可看到新文件（无需重启应用）

### 删除角色卡

1. 从MinIO存储桶中删除文件
2. 刷新页面即可看到更新（无需重启应用）

### 批量管理

现在系统支持动态获取文件列表，您可以：
- 批量上传PNG文件到MinIO存储桶
- 系统会自动扫描并显示所有PNG文件
- 支持自动标签提取和分类
- 无需手动维护文件列表

## 故障排除

### 常见问题

1. **文件无法访问**
   - 检查MinIO服务是否正常运行
   - 验证存储桶名称是否正确
   - 确认文件权限设置

2. **网络连接问题**
   - 检查S3 API地址是否正确
   - 验证网络连接是否正常
   - 检查防火墙设置

3. **文件列表不显示**
   - 确认 `MINIO_CHARACTER_FILES` 配置正确
   - 检查文件名是否匹配
   - 验证文件是否已上传

### 调试步骤

1. 运行测试脚本：`node scripts/test-minio-api.js`
2. 检查浏览器开发者工具的网络请求
3. 查看MinIO服务器日志
4. 验证文件URL是否可以正常访问

## 性能优化

### 建议配置

1. **CDN加速**: 在MinIO前面配置CDN
2. **缓存策略**: 设置适当的缓存头
3. **压缩**: 启用文件压缩
4. **监控**: 配置性能监控

### 安全考虑

1. **访问控制**: 配置适当的访问权限
2. **HTTPS**: 确保使用HTTPS协议
3. **备份**: 定期备份重要文件
4. **监控**: 监控异常访问

## 优势

### 统一管理

- 所有角色卡文件统一存储在MinIO中
- 无需维护多个下载源
- 简化了系统架构和配置

### 自主控制

- 完全控制存储服务
- 无需依赖第三方服务
- 更好的隐私保护

## 支持

如果您在使用过程中遇到问题，请：
1. 查看本文档的故障排除部分
2. 运行测试脚本检查配置
3. 查看应用程序日志
4. 联系技术支持

---

**注意**: 请确保您的MinIO服务配置正确，并且所有角色卡文件都已正确上传到存储桶中。 