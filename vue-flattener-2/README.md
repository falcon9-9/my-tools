# Vue组件拍平工具 (Vue Flattener 2)

一个强大的Vue组件拍平工具，支持自动内联子组件、样式和脚本，提供Webpack插件支持。

## 功能特性

### 🔧 核心功能
- **组件拍平**: 将Vue组件及其依赖的子组件内联到单个文件中
- **样式内联**: 支持CSS、SCSS文件的内联
- **脚本内联**: 支持JavaScript模块的内联  
- **依赖追踪**: 智能分析组件依赖关系
- **增量更新**: 仅重新拍平受影响的文件

### 📦 Webpack插件
- **自动监听**: 监听文件变化，自动执行拍平
- **依赖感知**: 当依赖文件变化时，自动重新拍平相关组件
- **性能优化**: 防抖机制避免重复拍平
- **详细日志**: 提供详细的拍平过程和性能统计

## 安装与使用

### 方式一：npm link 方式（推荐用于开发）

1. **在vue-flattener-2目录下设置全局链接**
```bash
cd vue-flattener-2
npm link
```

2. **在其他项目中链接使用**
```bash
cd your-project
npm link vue-flattener-2
```

3. **在webpack.config.js中使用**
```javascript
const VueFlattenPlugin = require('vue-flattener-2/webpack-plugin');

module.exports = {
  // ... 其他配置
  plugins: [
    // ... 其他插件
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/views'),
      flattenerPath: path.resolve(__dirname, '../vue-flattener-2/src/index.js')
    })
  ]
};
```

### 方式二：直接引用（用于同一个项目内）

```javascript
const VueFlattenPlugin = require('./path/to/vue-flattener-2/webpack-plugin');

module.exports = {
  plugins: [
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/views')
    })
  ]
};
```

## 配置选项

### VueFlattenPlugin 配置

```javascript
new VueFlattenPlugin({
  // 必需：监听的文件夹路径
  watchDir: path.resolve(__dirname, 'src/views'),
  
  // 可选：VueFlattener的路径（默认使用内置的）
  flattenerPath: './custom/path/to/flattener'
})
```

## API 使用

### 编程式使用

```javascript
const VueFlattener = require('vue-flattener-2');

const flattener = new VueFlattener();

// 拍平单个文件
await flattener.flatten(
  './src/components/MyComponent.vue',  // 输入文件
  './dist/MyComponent.flattened.vue'  // 输出文件
);
```

## 示例项目

项目包含一个完整的示例，展示如何使用webpack插件：

```bash
cd vue-flattener-2
npm run install-all  # 安装所有依赖
npm run dev          # 启动开发服务器
```

### 示例文件结构
```
example/
├── src/
│   ├── views/           # 监听的目录
│   │   ├── Demo.vue     # 主组件
│   │   └── Demo.flattened.vue  # 自动生成的拍平文件
│   ├── components/      # 子组件
│   ├── styles/         # 样式文件
│   └── utils/          # 工具函数
└── webpack.config.js   # webpack配置
```

## 工作原理

### 1. 依赖分析
插件会分析每个Vue文件的依赖关系：
- 解析`import`语句
- 递归分析依赖文件
- 建立依赖映射关系

### 2. 智能监听
- 监听views文件夹中的直接文件变化
- 监听依赖文件的变化
- 根据依赖关系确定需要重新拍平的文件

### 3. 增量拍平
- 只拍平受影响的文件
- 防抖机制避免频繁拍平
- 提供详细的性能统计

## 输出示例

### 启动时的依赖分析
```
[VueFlattenPlugin] 🔍 开始分析依赖关系...
[VueFlattenPlugin] 📁 发现1个views文件: Demo.vue
[VueFlattenPlugin] 🔍 分析 Demo.vue 的依赖...
[VueFlattenPlugin] ✅ Demo.vue 依赖分析完成，共 6 个依赖

📊 依赖分析结果:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 Demo.vue:
   🔗 ../components/Counter.vue
   🔗 ../components/HelloWorld.vue
   🔗 ../utils/helpers.js
   🔗 ../styles/theme.css
   🔗 ../styles/animations.scss

🎯 依赖影响范围:
📎 components/Counter.vue → Demo.vue
📎 components/HelloWorld.vue → Demo.vue
📎 utils/helpers.js → Demo.vue
```

### 拍平过程统计
```
📦 ========== 拍平汇总报告 ==========
⏰ 开始时间: 2024/6/28 下午4:15:32
⏱️ 结束时间: 2024/6/28 下午4:15:33  
🕒 总耗时: 486ms (0.49s)
📊 处理文件: 1 个
✅ 成功: 1 个
❌ 失败: 0 个
📈 成功率: 100.0%

📋 详细记录:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ✅ Demo.vue - 486ms (2.39 KB → 8.96 KB)
   📈 文件增大: +6.57 KB (+274.9%)
```

## 注意事项

1. **文件监听**: 只监听指定的`watchDir`目录下的`.vue`文件
2. **输出文件**: 拍平后的文件会以`.flattened.vue`为后缀
3. **依赖更新**: 当依赖文件改变时，会自动重新拍平相关的组件
4. **性能优化**: 内置防抖机制，1秒内的重复变化会被合并处理

## 开发指南

### 项目结构
```
vue-flattener-2/
├── src/                 # 核心代码
│   ├── index.js        # 主入口
│   ├── parser/         # Vue文件解析器
│   └── inliner/        # 内联器
├── webpack-plugin.js   # Webpack插件
├── example/            # 示例项目
└── package.json        # 包配置
```

### 脚本命令
```bash
npm run dev              # 启动示例开发服务器
npm run install-all      # 安装所有依赖
npm run link-global      # 设置全局链接
npm run unlink-global    # 取消全局链接
```

## 许可证

ISC License 

## 使用方法

### 方法一：作为webpack插件使用（推荐）

#### 通过npm link使用

1. **在本项目中创建全局链接**：
```bash
cd vue-flattener-2
npm link
```

2. **在目标项目中引用**：
```bash
cd your-project
npm link vue-flattener-2
```

3. **在webpack配置中使用**：
```javascript
const VueFlattenPlugin = require('vue-flattener-2/webpack-plugin');

module.exports = {
  // ... 其他配置
  plugins: [
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/views'),
      flattenerPath: path.resolve(__dirname, '../vue-flattener-2/src/index.js')
    })
  ]
};
```

#### 直接引用（同项目使用）

```javascript
const VueFlattenPlugin = require('./path/to/vue-flattener-2/webpack-plugin');

module.exports = {
  plugins: [
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/views')
    })
  ]
};
```

### 方法二：作为命令行工具使用

#### 基本用法

```bash
# 拍平单个文件
node src/cli.js input.vue

# 拍平单个文件并指定输出路径
node src/cli.js input.vue output.vue

# 拍平文件夹中的所有Vue文件
node src/cli.js src/views

# 递归拍平文件夹及子文件夹
node src/cli.js src --recursive

# 自定义输出后缀
node src/cli.js src/views --suffix .flat

# 详细输出模式
node src/cli.js src/views --verbose

# 排除特定文件
node src/cli.js src/views --exclude "**/*.test.vue"
```

#### 配置文件支持

**创建配置文件：**
```bash
# 创建 JavaScript 配置文件
vue-flatten --config

# 创建 JSON 配置文件  
vue-flatten --config-json
```

**使用配置文件（零配置模式）：**
```bash
# 直接使用配置文件中的设置
vue-flatten

# 结合命令行选项使用
vue-flatten --verbose
```

**配置文件示例：**
```javascript
// vue-flatten.config.js
module.exports = {
  inputPaths: ['src/views', 'src/pages'],
  suffix: '.flattened',
  recursive: true,
  exclude: ['**/*.test.vue', '**/*.spec.vue'],
  autoGitignore: true,
  gitignorePatterns: ['*.flattened.vue', '**/*.flattened.vue']
};
```

#### 通过npm脚本使用

在package.json中可以添加脚本：

```json
{
  "scripts": {
    "flatten": "vue-flatten",
    "flatten:config": "vue-flatten --config",
    "flatten:views": "node src/cli.js src/views",
    "flatten:all": "node src/cli.js src --recursive --verbose"
  }
}
```

然后使用：
```bash
npm run flatten           # 使用配置文件
npm run flatten:config    # 创建配置文件
npm run flatten:views     # 处理指定文件夹
npm run flatten:all       # 递归处理所有文件
```

#### CLI选项说明

| 选项 | 简写 | 说明 | 示例 |
|------|------|------|------|
| `--output` | `-o` | 指定输出路径 | `--output dist/Demo.vue` |
| `--recursive` | `-r` | 递归处理子文件夹 | `--recursive` |
| `--suffix` | | 自定义输出后缀 | `--suffix .flat` |
| `--exclude` | | 排除文件模式 | `--exclude "**/*.test.vue"` |
| `--verbose` | `-v` | 详细输出模式 | `--verbose` |
| `--help` | `-h` | 显示帮助信息 | `--help` |
| `--config` | | 创建JS配置文件 | `--config` |
| `--config-json` | | 创建JSON配置文件 | `--config-json` |
| `--no-gitignore` | | 禁用自动gitignore处理 | `--no-gitignore` |

#### 自动GitIgnore处理

CLI工具会自动将拍平后的文件添加到`.gitignore`中，避免提交生成的文件：

```bash
# 默认行为：自动添加gitignore规则
vue-flatten src/views

# 禁用自动gitignore
vue-flatten src/views --no-gitignore

# 自定义后缀也会自动添加对应规则
vue-flatten src/views --suffix .inline  # 会添加 *.inline.vue 规则
```

#### CLI输出示例

**简洁模式（默认）**：
```
🚀 Vue组件拍平工具启动
📁 输入路径: src/views
📁 文件夹模式: src/views
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📁 发现 3 个Vue文件需要拍平
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Demo.vue -> Demo.flattened.vue
✅ Home.vue -> Home.flattened.vue
✅ About.vue -> About.flattened.vue

📊 ========== 拍平完成统计 ==========
📂 总文件数: 3
✅ 成功: 3
❌ 失败: 0
📈 成功率: 100.0%
⏱️  总耗时: 45ms (0.04s)
📊 ====================================
```

**详细模式（--verbose）**：
```
🚀 Vue组件拍平工具启动
📁 输入路径: src/views/Demo.vue
🔧 配置选项: {
  "inputPath": "src/views/Demo.vue",
  "outputPath": null,
  "recursive": false,
  "suffix": ".flattened",
  "exclude": null,
  "verbose": true,
  "help": false
}
📄 单文件模式: Demo.vue
📁 输出路径: src/views/Demo.flattened.vue
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 正在拍平: src/views/Demo.vue
开始拍平组件: src/views/Demo.vue
🔧 创建ComponentInliner...
🔍 执行内联...
🔍 分析import语句...
✅ 发现 2 个import:
  - default: HelloWorld from ../components/HelloWorld.vue
  - default: Counter from ../components/Counter.vue
🔧 开始内联处理..
📦 处理Vue组件: ../components/HelloWorld.vue
✅ 成功内联Vue组件: HelloWorld
📦 处理Vue组件: ../components/Counter.vue
✅ 成功内联Vue组件: Counter
📝 更新主组件script...
✅ Script更新完成，长度: 3133
🎨 合并样式...
✅ 样式合并完成，共 5 个样式块
🎉 内联完成!
✅ Demo.vue -> Demo.flattened.vue
   📄 大小: 510 Bytes -> 8.18 KB
   ⏱️  耗时: 17ms
   📈 增长: +7.68 KB (+1542.0%)

📊 ========== 拍平完成统计 ==========
📂 总文件数: 1
✅ 成功: 1
❌ 失败: 0
📈 成功率: 100.0%
⏱️  总耗时: 26ms (0.03s)
📊 ====================================
``` 