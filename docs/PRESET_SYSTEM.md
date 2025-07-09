# 预设系统使用指南

## 概述

预设系统允许您为角色对话预设JSON配置文件，用户首次访问应用时会自动导入这些预设，提供更好的用户体验。

## 系统架构

### 文件结构

```
public/presets/                    # 预设JSON文件目录
├── 【Dreammini】1.4-ultra-0627.json
└── (其他预设文件)

lib/
├── config/
│   └── preset-characters.ts      # 预设配置文件
├── core/
│   └── preset-initializer.ts     # 预设初始化器
└── data/roleplay/
    └── preset-operation.ts        # 预设数据操作

components/
├── PresetInitializer.tsx         # 预设初始化组件
└── PresetEditor.tsx              # 预设编辑器

app/
├── preset-management/             # 预设管理页面
│   └── page.tsx
├── test-preset/                  # 预设测试页面
│   └── page.tsx
└── api/preset/auto-import/       # 预设API
    └── route.ts
```

## 配置预设

### 1. 添加预设JSON文件

将预设JSON文件放置在 `public/presets/` 目录下：

```bash
cp your-preset.json public/presets/
```

### 2. 配置预设信息

在 `lib/config/preset-characters.ts` 中添加预设配置：

```typescript
export const DEFAULT_PRESET_CONFIGS = [
  {
    name: "your-preset-name",
    displayName: {
      zh: "你的预设名称",
      en: "Your Preset Name"
    },
    description: {
      zh: "预设描述",
      en: "Preset Description"
    },
    filename: "your-preset.json",
    enabled: true,        // 是否默认启用
    autoImport: true      // 是否自动导入
  }
];
```

### 3. 预设JSON文件格式

预设JSON文件应包含以下结构：

```json
{
  "temperature": 0.8,
  "frequency_penalty": 0,
  "presence_penalty": 0,
  "top_p": 0.98,
  "top_k": 40,
  "prompts": [
    {
      "name": "提示词名称",
      "system_prompt": true,
      "role": "system",
      "content": "提示词内容",
      "identifier": "unique_identifier",
      "injection_position": 0,
      "injection_depth": 4,
      "forbid_overrides": false
    }
  ]
}
```

## 使用方法

### 自动导入

用户首次访问应用时，系统会自动导入配置为 `autoImport: true` 的预设文件。

### 手动管理

1. **访问预设管理页面**：`/preset-management`
2. **查看初始化状态**：检查预设是否已成功导入
3. **手动初始化**：点击"初始化预设"按钮
4. **重置状态**：点击"重置初始化状态"按钮

### API调用

```typescript
// 自动导入预设
const response = await fetch('/api/preset/auto-import', {
  method: 'POST'
});

// 获取预设状态
const status = await fetch('/api/preset/auto-import?action=status');

// 重置初始化状态
const reset = await fetch('/api/preset/auto-import?action=reset');

// 获取预设配置
const configs = await fetch('/api/preset/auto-import?action=configs');
```

## 测试功能

访问 `/test-preset` 页面可以测试预设功能：

- 查看初始化状态
- 测试预设导入
- 重置初始化状态
- 查看预设配置

## 开发指南

### 添加新的预设

1. 将预设JSON文件放入 `public/presets/` 目录
2. 在 `DEFAULT_PRESET_CONFIGS` 中添加配置
3. 重启开发服务器
4. 访问测试页面验证功能

### 调试预设导入

1. 打开浏览器开发者工具
2. 查看控制台日志
3. 检查网络请求
4. 验证本地存储

### 常见问题

**Q: 预设文件无法加载**
A: 检查文件路径是否正确，确保文件在 `public/presets/` 目录下

**Q: 预设导入失败**
A: 检查JSON格式是否正确，确保包含必要的字段

**Q: 初始化状态不更新**
A: 清除浏览器本地存储，重新访问页面

## 高级功能

### 自定义预设加载逻辑

可以修改 `PresetInitializer.loadPresetFile()` 方法来自定义预设文件加载逻辑：

```typescript
private static async loadPresetFile(filename: string): Promise<any> {
  // 自定义加载逻辑
  const response = await fetch(`/custom-path/${filename}`);
  return response.json();
}
```

### 条件导入

可以根据用户设置或其他条件决定是否导入预设：

```typescript
static async initializePresets(): Promise<void> {
  // 检查用户设置
  const userSettings = getUserSettings();
  if (!userSettings.autoImportPresets) {
    return;
  }
  
  // 继续导入逻辑
}
```

## 注意事项

1. **文件大小**：预设JSON文件不应过大，建议小于1MB
2. **格式验证**：确保JSON格式正确，避免语法错误
3. **权限控制**：考虑添加用户权限控制
4. **错误处理**：妥善处理导入失败的情况
5. **性能优化**：避免在初始化时阻塞主线程

## 更新日志

- v1.0.0: 初始版本，支持基本的预设导入功能
- v1.1.0: 添加了预设管理页面和API端点
- v1.2.0: 改进了错误处理和用户反馈 