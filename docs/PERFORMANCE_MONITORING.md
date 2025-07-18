# 性能监控使用指南

本文档介绍了如何在Narratium Cloud项目中添加和使用性能监控功能，以便分析角色卡界面发送消息时各个阶段的耗时。

## 概述

我们已经在前端和后端的关键位置添加了详细的性能监控，包括：

1. **前端监控**：角色页面消息发送和编辑过程
2. **API监控**：聊天请求处理过程
3. **工作流监控**：DialogueWorkflow执行过程
4. **节点监控**：各个工作流节点的执行时间
5. **LLM监控**：大语言模型调用过程

## 监控位置

### 1. 前端监控 (`app/character/page.tsx`)

#### 消息发送监控 (`handleSendMessage`)
- 阶段1: 添加用户消息到列表
- 阶段2: 加载配置
- 阶段3: 发送消息到API
- 阶段4: 解析响应
- 阶段5: 更新UI状态

#### 消息编辑监控 (`handleEditMessage`)
- 阶段1: 消息查找
- 阶段2: 内容构建
- 阶段3: 节点删除
- 阶段4: 列表更新
- 阶段5: 回复生成
- 阶段6: 响应处理

### 2. API监控 (`function/dialogue/chat.ts`)

#### 聊天请求处理监控 (`handleCharacterChatRequest`)
- 阶段1: 工作流实例创建
- 阶段2: 工作流参数准备
- 阶段3: 工作流执行
- 阶段4: 结果提取
- 阶段5: 后处理
- 阶段6: 响应构建

### 3. 工作流监控 (`lib/nodeflow/WorkflowEngine.ts`)

#### 工作流执行监控
- 输入设置
- 主工作流执行
- AFTER节点执行

#### 主工作流监控 (`executeMainWorkflow`)
- 入口节点执行
- 批次节点执行
- 节点并行执行

#### 并行执行监控 (`executeParallel`)
- 节点级别执行时间
- 并行执行统计

### 4. LLM监控 (`lib/nodeflow/LLMNode/LLMNodeTools.ts`)

#### LLM调用监控 (`invokeLLM`)
- 阶段1: LLM实例创建
- 阶段2: 对话链创建
- 阶段3: LLM调用

## 日志输出格式

所有性能监控日志都使用统一的格式：

```
🚀 [监控类型] 开始操作 - 时间: ISO时间戳
📝 [监控类型] 详细信息
🔄 [监控类型] 阶段名称 - 开始执行
✅ [监控类型] 阶段名称 - 执行完成 - 耗时: XXXms
❌ [监控类型] 错误信息 - 耗时: XXXms
🎉 [监控类型] 操作完成 - 总耗时: XXXms
📊 [监控类型] 各阶段耗时统计:
   - 阶段1: XXXms (XX.X%)
   - 阶段2: XXXms (XX.X%)
   - 总耗时: XXXms
```

## 监控类型标识

- `[性能监控]`: 前端页面操作
- `[API性能监控]`: API请求处理
- `[工作流性能监控]`: 工作流执行
- `[主工作流性能监控]`: 主工作流执行
- `[并行执行性能监控]`: 并行节点执行
- `[节点性能监控]`: 单个节点执行
- `[LLM性能监控]`: LLM调用

## 性能监控工具 (`utils/performance-monitor.ts`)

我们还提供了一个通用的性能监控工具，可以用于其他需要监控的地方：

### 基本用法

```typescript
import { createStageMonitor } from '@/utils/performance-monitor';

// 创建监控器
const monitor = createStageMonitor('my-operation', '我的操作');

// 开始阶段
monitor.startStage('阶段1');

// 执行操作
await someOperation();

// 结束阶段
monitor.endStage('阶段1');

// 开始下一个阶段
monitor.startStage('阶段2');
await anotherOperation();
monitor.endStage('阶段2');

// 结束监控
monitor.end();
```

### 错误处理

```typescript
try {
  await riskyOperation();
} catch (error) {
  monitor.error(error);
  throw error;
}
```

### 高阶函数用法

```typescript
import { withPerformanceMonitoring } from '@/utils/performance-monitor';

const monitoredFunction = withPerformanceMonitoring(
  'my-function',
  async (param1: string, param2: number) => {
    // 你的函数逻辑
    return result;
  },
  '我的函数描述'
);

// 使用
const result = await monitoredFunction('hello', 42);
```

## 如何分析性能问题

### 1. 查看控制台日志

在浏览器开发者工具的控制台中，你可以看到详细的性能监控日志。重点关注：

- 总耗时超过预期的操作
- 某个阶段耗时异常长
- 错误信息

### 2. 常见性能瓶颈

#### 前端瓶颈
- **阶段3 (API调用)**: 通常是最耗时的阶段
- **阶段5 (UI更新)**: 如果消息很长，可能影响性能

#### 后端瓶颈
- **阶段3 (工作流执行)**: 包含所有业务逻辑
- **LLM调用**: 外部API调用，网络延迟影响大

#### 工作流瓶颈
- **LLM节点**: 通常是最耗时的节点
- **WorldBook节点**: 如果世界书很大，可能影响性能
- **Regex节点**: 复杂的正则处理可能耗时

### 3. 优化建议

#### 前端优化
- 使用防抖处理用户输入
- 优化UI更新逻辑
- 考虑使用虚拟滚动处理长对话

#### 后端优化
- 缓存LLM响应
- 优化数据库查询
- 使用更快的模型（fastModel模式）

#### 工作流优化
- 并行执行独立节点
- 优化提示词长度
- 使用更高效的模型

## 禁用性能监控

如果需要禁用性能监控（生产环境），可以：

1. 删除或注释掉相关的监控代码
2. 使用环境变量控制
3. 创建条件编译版本

## 扩展监控

如果需要监控其他功能，可以参考现有的监控代码模式：

1. 在函数开始处添加开始时间记录
2. 在每个关键阶段添加耗时统计
3. 在函数结束处输出完整报告
4. 使用统一的日志格式

## 注意事项

1. 性能监控会增加少量开销，但通常可以忽略
2. 监控日志会占用控制台空间，建议在生产环境中禁用
3. 敏感信息（如API密钥）不会在监控日志中输出
4. 监控数据仅用于调试，不会持久化存储 