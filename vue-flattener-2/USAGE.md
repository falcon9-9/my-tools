# Vue Flattener 2 - 使用指南

## 🎯 项目结构

现在 `vue-flattener-2` 已经成功提取为独立的npm包，支持通过webpack插件的方式在其他项目中使用。

```
vue-flattener-2/
├── src/                    # 核心拍平工具
│   ├── index.js           # VueFlattener主类
│   ├── parser/            # Vue文件解析器
│   └── inliner/           # 组件内联器
├── webpack-plugin.js      # 🆕 Webpack插件
├── example/               # 示例项目（测试用）
│   ├── src/views/         # 监听目录
│   └── webpack.config.js  # 使用插件的配置
├── package.json           # 支持npm link
└── README.md              # 详细文档
```

## 🚀 快速开始

### 1. 设置npm link

在 `vue-flattener-2` 目录下：
```bash
npm link
```

### 2. 在其他项目中使用

在目标项目中：
```bash
npm link vue-flattener-2
```

### 3. 配置webpack

```javascript
// webpack.config.js
const VueFlattenPlugin = require('vue-flattener-2/webpack-plugin');

module.exports = {
  plugins: [
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/views')
    })
  ]
};
```

## 🔧 插件功能

### 智能依赖追踪
- 分析Vue文件的所有依赖关系
- 建立依赖文件到views文件的映射
- 当依赖文件变化时，自动重新拍平相关组件

### 性能优化
- 防抖机制避免频繁拍平
- 增量更新，只处理受影响的文件
- 详细的性能统计和日志

### 监听范围
- **直接监听**: `watchDir` 下的 `.vue` 文件
- **依赖监听**: 这些Vue文件import的所有依赖文件
- **文件类型**: `.vue`, `.js`, `.css`, `.scss`

## 📊 输出文件

拍平后的文件会以 `.flattened.vue` 后缀保存在原文件同目录下：

```
src/views/
├── Demo.vue              # 原始文件
└── Demo.flattened.vue    # 🆕 自动生成的拍平文件
```

## 🎮 测试验证

### 运行示例项目
```bash
cd vue-flattener-2
npm run install-all
npm run dev
```

访问 http://localhost:8081 查看效果

### 测试依赖追踪
1. 修改 `example/src/components/` 下的任意组件
2. 观察控制台输出，会看到相关的views文件被重新拍平
3. 检查生成的 `.flattened.vue` 文件内容

## 🛠️ 自定义配置

### 插件选项
```javascript
new VueFlattenPlugin({
  // 必需：监听的文件夹
  watchDir: path.resolve(__dirname, 'src/views'),
  
  // 可选：自定义VueFlattener路径
  flattenerPath: './custom/flattener/path'
})
```

### 编程式API
```javascript
const VueFlattener = require('vue-flattener-2');

const flattener = new VueFlattener();
await flattener.flatten(inputPath, outputPath);
```

## 📝 日志输出

### 启动时
```
[VueFlattenPlugin] 🔍 开始分析依赖关系...
[VueFlattenPlugin] 📁 发现1个views文件: Demo.vue
[VueFlattenPlugin] ✅ Demo.vue 依赖分析完成，共 6 个依赖
```

### 文件变化时
```
[VueFlattenPlugin] 🔗 检测到依赖文件变化: components/Counter.vue
[VueFlattenPlugin] 📋 依赖文件 components/Counter.vue 影响的views文件: Demo.vue
[VueFlattenPlugin] 🔄 准备重新拍平 1 个文件: Demo.vue
```

### 拍平完成时
```
📦 ========== 拍平汇总报告 ==========
📊 处理文件: 1 个
✅ 成功: 1 个
📈 成功率: 100.0%
```

## 🔗 与其他项目集成

### 步骤1: 链接包
```bash
# 在vue-flattener-2目录
npm link

# 在目标项目目录
npm link vue-flattener-2
```

### 步骤2: 配置webpack
```javascript
const VueFlattenPlugin = require('vue-flattener-2/webpack-plugin');

module.exports = {
  plugins: [
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/pages') // 或其他目录
    })
  ]
};
```

### 步骤3: 验证
运行webpack dev server，检查是否有拍平日志输出

## ⚠️ 注意事项

1. **文件路径**: `watchDir` 必须是绝对路径
2. **文件命名**: 拍平文件会覆盖同名的 `.flattened.vue` 文件
3. **依赖分析**: 只分析ES6 import语法，不支持require
4. **webpack版本**: 支持webpack 4.x 和 5.x

## 🧪 开发测试

### 本地测试
```bash
# 在vue-flattener-2目录
npm run dev  # 启动示例项目进行测试
```

### 修改测试
1. 编辑 `example/src/components/` 下的组件
2. 保存文件，观察控制台输出
3. 检查 `example/src/views/Demo.flattened.vue` 的变化

## 🎉 成功标志

当你看到类似以下输出时，说明插件工作正常：

```
=====================================
Vue组件拍平工具已启动！
访问地址: http://localhost:8081
组件会在修改时自动拍平
=====================================

[VueFlattenPlugin] 执行初始拍平和依赖分析...
[VueFlattenPlugin] 🔍 开始分析依赖关系...
📦 ============ 拍平记录开始 ============
✅ Demo.vue 拍平成功！耗时: 486ms
📦 ============ 拍平记录结束 ============
```

## 🎯 下一步

现在你可以：
1. 在任何Vue项目中使用这个webpack插件
2. 通过npm link快速测试和调试
3. 享受自动的组件拍平和依赖追踪功能

Happy coding! 🚀 