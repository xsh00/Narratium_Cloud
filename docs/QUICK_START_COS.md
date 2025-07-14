# COS角色卡快速开始指南

## 概述

本指南帮助您将角色卡PNG图片从GitHub迁移到腾讯云COS，以获得更快的国内访问速度。

## 快速设置

### 1. 配置COS存储桶

1. 登录腾讯云控制台
2. 创建或选择一个COS存储桶
3. 将存储桶配置为公开读取权限
4. 记录存储桶的访问地址

### 2. 更新配置文件

编辑 `lib/config/cos-config.ts` 文件：

```typescript
export const COS_CONFIG = {
  // 更新为您的COS存储桶地址
  BUCKET_URL: "https://your-bucket.cos.your-region.myqcloud.com",
  CHARACTER_CARDS_PATH: "", // 如果文件在子目录中，请指定路径
};
```

### 3. 上传角色卡文件

将您的角色卡PNG文件上传到COS存储桶。

### 4. 管理角色卡列表

使用管理工具更新角色卡配置：

```bash
node scripts/simple-cos-sync.js
```

选择操作：
- 查看当前角色卡列表
- 添加新角色卡
- 批量导入文件名

### 5. 测试功能

1. 重启应用程序
2. 访问角色卡页面
3. 测试角色卡下载功能

## 文件命名规范

建议使用以下命名格式：
```
角色名--标签1，标签2，标签3.png
```

例如：
- `斗罗大陆1--小说，玄幻.png`
- `辉夜大小姐想让我告白--同人二创，纯文字.png`

## 优势

- ✅ 国内访问速度更快
- ✅ 无需GitHub API限制
- ✅ 更稳定的服务
- ✅ 支持CDN加速

## 注意事项

- 需要手动维护文件列表
- 确保COS存储桶的访问权限设置正确
- 建议启用CDN加速以获得更好的访问体验

## 故障排除

### 文件无法访问
- 检查存储桶是否配置为公开访问
- 验证文件路径是否正确
- 确认文件名与配置中的名称完全匹配

### 配置更新失败
- 检查配置文件语法
- 确保文件有写入权限
- 重启应用程序应用新配置

## 更多信息

- 角色卡页面：`app/character-cards/page.tsx`
- 下载组件：`components/DownloadCharacterModal.tsx`
- COS配置：`lib/config/cos-config.ts` 