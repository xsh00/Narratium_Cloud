# API配置修复指南

## 问题描述

用户反馈新的模型设置-API配置似乎没有生效，目前依旧只有1组API配置。

## 问题原因

1. 现有的localStorage中可能已经存在旧的配置
2. DefaultConfigInitializer和ModelSidebar组件的初始化逻辑可能存在冲突
3. 旧的API Key配置没有被正确更新

## 解决方案

### 方法1: 使用测试页面强制更新

1. 访问 `/test-api-config` 页面
2. 点击"强制更新为三组配置"按钮
3. 系统会自动创建三组新的API配置

### 方法2: 手动清除配置

1. 打开浏览器开发者工具 (F12)
2. 进入Console标签页
3. 执行以下命令清除配置：
```javascript
localStorage.removeItem("apiConfigs");
localStorage.removeItem("activeConfigId");
```
4. 刷新页面，系统会自动创建新的三组配置

### 方法3: 使用API端点

```javascript
// 强制更新为三组配置
fetch("/api/reset-api-configs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "force-update" })
});

// 清除所有配置
fetch("/api/reset-api-configs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ action: "clear" })
});
```

## 修复内容

### 1. 更新了DefaultConfigInitializer组件

- 添加了检测旧配置的逻辑
- 如果发现只有一组配置且使用旧的API Key，会自动更新为三组配置
- 增加了更详细的日志输出

### 2. 修改了ModelSidebar组件

- 简化了默认配置创建逻辑
- 避免与DefaultConfigInitializer产生冲突
- 让DefaultConfigInitializer专门处理三组配置的创建

### 3. 新增了测试和修复工具

- `/test-api-config` 页面：用于测试和修复配置
- `/api/reset-api-configs` 端点：提供API级别的配置重置功能
- 强制更新功能：确保能够创建三组新的配置

## 验证方法

### 检查配置数量
访问 `/test-api-config` 页面，应该看到：
- 配置数量: 3
- 状态显示: "✅ 已成功创建三组API配置"

### 检查配置内容
三组配置应该包含：
1. `【1】默认API配置` - sk-5zi5ZuqP_GADx_IYQFhA3AMbFj2X3ucDOqLB01CLvyOpcCZh
2. `【2】备用API配置` - sk-WanZhBPybGFKaA183aUtdqJzxXxt9X95UjUeN0XrTQReE8fS
3. `【3】备用API配置` - sk-rbQFBU405CbCnJwniaMmr1FXEJjZpFl1gLuJbU7oMlAIEt6D

### 测试连接
在测试页面点击"测试所有配置"按钮，验证所有配置都能正常连接。

## 预防措施

1. **定期检查**: 建议定期访问测试页面检查配置状态
2. **备份配置**: 用户可以导出自己的配置作为备份
3. **监控日志**: 关注浏览器控制台的配置初始化日志
4. **版本控制**: 在更新API配置时，确保版本兼容性

## 故障排除

### 如果强制更新后仍然只有一组配置
1. 检查浏览器控制台是否有错误信息
2. 确认localStorage是否被正确清除
3. 尝试使用不同的浏览器或隐私模式
4. 检查是否有浏览器扩展干扰

### 如果配置测试失败
1. 检查网络连接
2. 验证API Key是否有效
3. 确认Base URL是否可访问
4. 查看测试结果的详细信息

## 技术细节

### 配置存储结构
```javascript
// localStorage中的配置格式
{
  "apiConfigs": [
    {
      "id": "api_timestamp_1",
      "name": "【1】默认API配置",
      "type": "openai",
      "baseUrl": "https://api.sillytarven.top/v1",
      "model": "gemini-2.5-pro",
      "apiKey": "sk-5zi5ZuqP_GADx_IYQFhA3AMbFj2X3ucDOqLB01CLvyOpcCZh"
    },
    // ... 其他两个配置
  ],
  "activeConfigId": "api_timestamp_1"
}
```

### 更新检测逻辑
```javascript
const needsUpdate = existingConfigs.length === 1 && 
  existingConfigs[0].apiKey === "sk-terxMbHAT7lEAKZIs7UDFp_FvScR_3p9hzwJREjgbWM9IgeN";
```

这个逻辑会检测是否只有一组配置且使用旧的API Key，如果是则触发更新。 