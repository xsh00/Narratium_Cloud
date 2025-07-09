# GitHub仓库设置指南

## 概述

本指南将帮助您设置自己的GitHub仓库来托管角色卡，并配置应用程序以使用您的仓库。

## 步骤1：创建GitHub仓库

### 1.1 创建新仓库

1. 登录您的GitHub账户
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - **Repository name**: `my-character-cards` (或您喜欢的名称)
   - **Description**: `Character cards for Narratium Cloud`
   - **Visibility**: 选择 "Public" (公开)
   - **不要**勾选 "Add a README file"
4. 点击 "Create repository"

### 1.2 仓库结构

您的仓库应该有以下结构：

```
my-character-cards/
├── README.md
├── 角色名--作者名1.png
├── 角色名--作者名2.png
└── 角色名--作者名3.png
```

## 步骤2：配置应用程序

### 2.1 修改配置文件

编辑 `lib/config/github-config.ts` 文件：

```typescript
export const GITHUB_CONFIG = {
  // 将 YOUR_USERNAME 替换为您的GitHub用户名
  USERNAME: "your-github-username",

  // 将 YOUR_REPO_NAME 替换为您的仓库名
  REPO_NAME: "my-character-cards",

  // 其他配置保持不变
  get API_URL() {
    return `https://api.github.com/repos/${this.USERNAME}/${this.REPO_NAME}/contents`;
  },

  get RAW_BASE_URL() {
    return `https://raw.githubusercontent.com/${this.USERNAME}/${this.REPO_NAME}/main/`;
  },
};
```

### 2.2 示例配置

如果您是GitHub用户 "john-doe"，仓库名为 "my-character-cards"：

```typescript
export const GITHUB_CONFIG = {
  USERNAME: "john-doe",
  REPO_NAME: "my-character-cards",
  // ... 其他配置
};
```

## 步骤3：上传角色卡

### 3.1 准备角色卡文件

1. 确保您的角色卡是SillyTavern格式的PNG文件
2. 文件名格式：`角色名--作者名.png`
   - 例如：`艾莉娅--魔法师.png`
   - 例如：`钢铁侠--漫威.png`

### 3.2 上传到GitHub

1. 在您的GitHub仓库页面，点击 "Add file" → "Upload files"
2. 拖拽或选择您的PNG角色卡文件
3. 在提交信息中填写：`Add character cards`
4. 点击 "Commit changes"

### 3.3 批量上传（可选）

如果您有多个角色卡文件：

1. 将所有PNG文件放在一个文件夹中
2. 在GitHub仓库页面点击 "Add file" → "Upload files"
3. 拖拽整个文件夹到上传区域
4. 提交更改

## 步骤4：测试配置

### 4.1 验证仓库访问

1. 启动您的应用程序
2. 导航到角色卡页面
3. 点击 "社区下载角色" 按钮
4. 检查是否能正确显示您的角色卡

### 4.2 测试下载功能

1. 在下载模态框中点击任意角色卡
2. 验证是否能成功下载和导入角色

## 步骤5：自定义预设角色

### 5.1 修改预设角色列表

编辑 `app/character-cards/page.tsx` 文件中的预设角色列表：

```typescript
const presetCharacterNames = [
  "您的角色名1--作者名1.png",
  "您的角色名2--作者名2.png",
  "您的角色名3--作者名3.png",
];
```

### 5.2 更新预设角色

将 `presetCharacterNames` 数组中的文件名替换为您实际上传的角色卡文件名。

## 故障排除

### 问题1：无法获取角色列表

**可能原因**：

- GitHub仓库URL配置错误
- 仓库不是公开的
- 网络连接问题

**解决方案**：

1. 检查 `github-config.ts` 中的用户名和仓库名是否正确
2. 确保仓库设置为公开
3. 检查网络连接

### 问题2：角色卡无法下载

**可能原因**：

- 文件名格式不正确
- 文件不是有效的PNG格式
- 文件不包含有效的角色数据

**解决方案**：

1. 确保文件名格式为：`角色名--作者名.png`
2. 验证PNG文件是否包含SillyTavern格式的角色数据
3. 使用SillyTavern创建的角色卡文件

### 问题3：导入失败

**可能原因**：

- 角色卡数据格式不正确
- 文件损坏

**解决方案**：

1. 重新导出角色卡文件
2. 检查角色卡是否包含完整的角色信息

## 高级配置

### 使用私有仓库（需要GitHub Token）

如果您想使用私有仓库，需要：

1. 创建GitHub Personal Access Token
2. 修改API调用以包含认证头
3. 注意：这需要额外的代码修改

### 自定义分支

默认使用 `main` 分支，如果您使用其他分支：

1. 修改 `RAW_BASE_URL` 中的分支名
2. 确保所有文件都上传到正确的分支

## 最佳实践

1. **文件命名**：使用清晰的命名约定
2. **角色质量**：确保上传高质量的角色卡
3. **定期更新**：定期添加新的角色卡
4. **文档维护**：在仓库README中说明角色卡的使用方法

## 支持格式

应用程序支持以下角色卡格式：

- SillyTavern PNG格式
- 包含角色信息、世界书、正则脚本的完整角色卡

## 联系支持

如果您遇到问题，请：

1. 检查GitHub仓库设置
2. 验证文件格式
3. 查看浏览器控制台错误信息
4. 确保所有配置都正确
