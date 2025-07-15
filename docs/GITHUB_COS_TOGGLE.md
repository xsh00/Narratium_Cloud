# GitHub/COS切换功能说明

## 功能概述

为了解决部分R18角色卡不方便存储在COS上的问题，我们在角色卡下载页面添加了切换按钮，支持在GitHub和COS之间切换数据源。

## 实现细节

### 1. 切换按钮位置

在"从社区仓库下载角色"标题后方添加了切换按钮：
- 默认显示"海外版（需VPN）"
- 点击后切换为"国内版"
- 按钮样式与页面整体风格保持一致

### 2. 数据源切换

#### 国内版（COS存储）
- 使用腾讯云COS存储的角色卡
- 国内访问速度快
- 部分R18内容已过滤
- 使用预设的文件列表

#### 海外版（需VPN）
- 使用GitHub仓库的角色卡
- 包含完整角色卡内容
- 需要VPN访问
- 实时从GitHub API获取文件列表

### 3. 状态持久化

用户的选择会保存在localStorage中：
- 键名：`characterDownloadMode`
- 值：`"github"` 或 `"cos"`
- 下次打开时会自动恢复上次的选择

### 4. 信息提示

切换时会显示当前数据源的信息：
- 数据源名称和地址
- 访问要求（是否需要VPN）
- 内容说明（是否包含完整内容）

## 技术实现

### 修改的文件

1. **`components/DownloadCharacterModal.tsx`**
   - 添加切换按钮UI
   - 实现GitHub API调用
   - 添加状态管理
   - 显示数据源信息

2. **`scripts/test-github-api.js`**
   - 新增GitHub API测试脚本
   - 验证API访问是否正常
   - 显示可用的角色卡文件

3. **`scripts/README.md`**
   - 更新文档说明
   - 添加GitHub测试脚本说明
   - 说明两种模式的区别

### 核心功能

```typescript
// 切换数据源
const toggleSource = () => {
  const newMode = !useGitHubMode;
  setUseGitHubMode(newMode);
  localStorage.setItem("characterDownloadMode", newMode ? "github" : "cos");
  setSelectedTag("all"); // 重置标签筛选
};

// GitHub API调用
const fetchGitHubFiles = async () => {
  const response = await fetch(GITHUB_CONFIG.API_URL);
  const files = await response.json();
  const pngFiles = files.filter(file => 
    file.type === 'file' && file.name.toLowerCase().endsWith('.png')
  );
  // 转换为统一格式
};
```

## 使用流程

1. **打开角色卡下载页面**
2. **查看当前模式**：默认显示"海外版（需VPN）"
3. **点击切换按钮**：切换到"国内版"
4. **查看数据源信息**：了解当前使用的数据源
5. **下载角色卡**：正常使用下载功能

## 测试验证

### COS模式测试
```bash
node scripts/test-cos-config.js
```

### GitHub模式测试
```bash
node scripts/test-github-api.js
```

## 优势

- ✅ 解决了R18内容存储问题
- ✅ 提供了灵活的访问方式
- ✅ 保持了用户体验的一致性
- ✅ 支持状态持久化
- ✅ 提供了清晰的信息提示

## 注意事项

1. **网络要求**：GitHub模式需要能够访问GitHub API
2. **VPN需求**：海外版需要VPN才能正常访问
3. **内容差异**：两种模式的角色卡内容可能不同
4. **性能差异**：COS模式访问速度更快

## 故障排除

### GitHub API无法访问
- 检查网络连接
- 确认是否需要VPN
- 运行 `node scripts/test-github-api.js` 测试

### COS文件无法访问
- 检查COS配置
- 确认存储桶权限
- 运行 `node scripts/test-cos-config.js` 测试

### 切换按钮不工作
- 检查浏览器控制台错误
- 确认localStorage权限
- 刷新页面重试 