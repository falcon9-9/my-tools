# check-my-code 使用指南

## 简介

`check-my-code` 是一个代码检查工具，用于在代码中标记和追踪需要关注的内容。它支持两种运行模式：

1. **watch模式**：集成在开发流程中，实时监控代码变化
2. **check模式**：手动运行检查，生成报告

## 特性

- 支持 JavaScript 和 Vue 文件检查
- 多级优先级标记（high、medium、low）
- 生成可交互的 Markdown 报告
- 支持 VSCode 和 Cursor 编辑器的文件链接
- 自动清理已删除文件的报告（watch模式）

## 安装

1. 克隆项目后，在插件目录中运行：
```bash
npm install
npm link
```

2. 在要使用插件的项目中运行：
```bash
npm link babel-plugin-check-my-code
```

## 使用方法

### 1. 在代码中添加标记

在代码中使用 `@check-my-code` 标记来添加检查项：

```javascript
// @check-my-code test 这是一个高优先级检查项
function example() {
  // @check-my-code check 这是一个中优先级检查项
  // @check-my-code remove 这是一个低优先级检查项
}
```

在 Vue 文件中，可以在 template、script 和 style 块中使用：

```vue
<template>
  <!-- @check-my-code test 模板中的检查项 -->
</template>

<script>
// @check-my-code check 脚本中的检查项
</script>

<style>
/* @check-my-code remove 样式中的检查项 */
</style>
```

### 2. Watch 模式

Watch 模式会在开发过程中实时监控文件变化并更新报告。

1. 在项目的 `babel.config.js` 中添加插件：

```javascript
module.exports = {
  plugins: ['babel-plugin-check-my-code']
}
```

2. 配置会自动集成到开发流程中，当文件变化时自动更新报告。

### 3. Check 模式

Check 模式用于手动运行检查并生成报告。

1. 在项目中创建 `babel-check.js` 脚本（参考示例文件）

2. 运行检查：
```bash
node babel-check.js
```

### 4. 配置选项

可以通过配置文件自定义检查行为：

```javascript
{
  outputDir: './reports',  // 报告输出目录, 默认在 `check-my-code/reports` 下
  flag: '@check-my-code',  // 标记关键字
  patterns: {             // 优先级关键字
    high: ['test'],
    medium: ['check'],
    low: ['remove']
  },
  editorConfig: {
    editor: 'vscode'      // 编辑器类型：'vscode' 或 'cursor'
  },
  runMode: 'watch'        // 运行模式：'watch' 或 'check'
}
```

### 5. 查看报告

1. 报告位置：
   - JSON 报告：`reports/<project-name>/todos.json`
   - Markdown 报告：`reports/<project-name>/todos.md`

2. 报告内容：
   - 总体统计信息
   - 按文件分组的检查项
   - 可点击的文件链接（跳转到代码位置）
   - 优先级标记
   - 可勾选的任务列表

注意: 使用 VSCode 自带的 Markdown 插件打开 report.md 以确保链接跳转功能正常工作。Markdown Preview Enhanced 插件可能无法正确处理文件链接。

## 最佳实践

1. **合理使用优先级**：
   - high (test)：需要立即处理的问题
   - medium (check)：需要review或优化的代码
   - low (remove)：将来可能需要删除或修改的代码

2. **添加清晰的描述**：
   - 说明问题或待办事项的具体内容
   - 添加相关上下文信息
   - 标注预期的修改方向

3. **定期检查报告**：
   - 在代码审查时查看检查项
   - 处理完成后删除对应标记
   - 定期清理过期的检查项

## 常见问题

1. **报告不更新**
   - Watch 模式：确认 babel 配置正确; 删除文件不会触发报告的更新
   - Check 模式：重新运行 babel-check.js

2. **链接跳转失败**
   - 确认使用了正确的编辑器配置
   - 使用 VSCode 自带的 Markdown 插件

3. **找不到检查项**
   - 确认使用了正确的标记格式
   - Check 模式：检查文件是否在排除目录中
