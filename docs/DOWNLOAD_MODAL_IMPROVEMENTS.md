# 下载角色模态框改进功能

## 概述

本次更新对社区下载角色功能进行了重大改进，包括：

1. **界面放大** - 更大的模态框界面，更好的用户体验
2. **标签分类** - 支持按标签对角色卡进行分类
3. **标签筛选** - 用户可以通过标签筛选角色卡
4. **响应式设计** - 适配不同屏幕尺寸的网格布局

## 新功能特性

### 1. 界面改进
- **更大的模态框**：从 `max-w-2xl` 升级到 `max-w-6xl`
- **响应式网格**：支持 2-5 列的响应式布局
- **更好的滚动**：使用 `fantasy-scrollbar` 样式
- **改进的布局**：使用 flexbox 布局，更好的空间利用

### 2. 标签系统
- **自动标签提取**：从文件名中自动提取标签信息
- **标签显示**：在角色卡上显示标签
- **标签筛选**：支持按标签筛选角色
- **数量统计**：显示每个标签下的角色数量

### 3. 文件命名规范

#### 新格式
```
角色名--标签1,标签2,标签3.png
```

#### 示例
- `艾莉娅--奇幻,女性,魔法师.png`
- `钢铁侠--科幻,男性,超级英雄.png`
- `哈利波特--奇幻,男性,魔法师.png`
- `孙悟空--神话,男性,猴子.png`

#### 标签规则
- 标签用逗号（`,`）分隔
- 支持中文和英文标签
- 建议使用 2-4 个标签
- 标签类型：性别、职业、类型、性格特征等

### 4. 用户界面改进

#### 标签筛选区域
- 显示"全部"标签和所有可用标签
- 每个标签显示对应的角色数量
- 选中状态的高亮显示
- 响应式按钮布局

#### 角色卡展示
- 更大的角色头像
- 标签显示（最多显示2个，超出显示"+N"）
- 改进的按钮样式
- 悬停效果

#### 统计信息
- 底部显示筛选结果数量
- 实时更新筛选统计

## 技术实现

### 标签提取逻辑
```typescript
const extractCharacterInfo = (fileName: string): CharacterInfo => {
  const nameWithoutExt = fileName.replace(/\.png$/, "");
  const parts = nameWithoutExt.split(/--/);
  
  let displayName = nameWithoutExt;
  let tags: string[] = [];
  
  if (parts.length >= 1) {
    displayName = parts[0].trim();
    
    // 提取标签
    if (parts.length > 1) {
      const tagPart = parts.slice(1).join("--");
      tags = tagPart.split(/[,，、]/).map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
  }
  
  return { displayName, tags };
};
```

### 标签筛选逻辑
```typescript
const filteredCharacters = useMemo(() => {
  if (selectedTag === "all") {
    return characterFiles;
  }
  return characterFiles.filter(file => {
    const { tags } = extractCharacterInfo(file.name);
    return tags.includes(selectedTag);
  });
}, [characterFiles, selectedTag]);
```

## 国际化支持

### 新增文本
- `downloadModal.filterByTags` - "按标签筛选"
- `downloadModal.allTags` - "全部"
- `downloadModal.charactersFound` - "个角色"

### 支持语言
- 中文 (zh.json)
- 英文 (en.json)

## 测试

### 测试页面
访问 `/test-download-modal` 可以测试新功能

### 测试要点
1. 模态框大小和响应式布局
2. 标签提取和显示
3. 标签筛选功能
4. 角色数量统计
5. 下载和导入功能

## 兼容性

### 向后兼容
- 支持旧格式的文件名（无标签）
- 自动处理缺少标签的情况
- 保持原有的下载和导入功能

### 浏览器支持
- 支持所有现代浏览器
- 响应式设计适配移动端
- 使用 CSS Grid 和 Flexbox

## 部署说明

1. 更新组件文件
2. 更新国际化文件
3. 测试功能正常
4. 更新文档

## 未来改进

1. **搜索功能** - 添加角色名称搜索
2. **排序功能** - 按名称、作者、标签排序
3. **批量操作** - 支持批量下载
4. **收藏功能** - 用户收藏喜欢的角色
5. **评分系统** - 用户对角色进行评分 