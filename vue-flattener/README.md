# 🚀 Vue组件拍平工具

将包含子组件、工具函数、样式文件的Vue组件"拍平"为单个内联的Vue文件，保持原始结构。

## ✨ 功能特性

- 📦 **子组件内联**: 将引用的子组件内联到主组件中
- ⚙️ **函数内联**: 内联JavaScript工具函数和方法  
- 🎨 **样式内联**: 内联CSS文件并处理作用域冲突
- 🔒 **作用域隔离**: 自动添加命名空间避免样式冲突
- 💾 **保持结构**: 保留原始代码结构和注释
- 🛡️ **错误处理**: 友好的错误提示和回退机制

## 🛠️ 安装依赖

### 主项目依赖
```bash
cd vue-flattener
npm install
```

### 测试环境依赖
```bash
cd vue-flattener/example
npm install
```

## 🎯 快速开始

### 1. 启动测试环境
```bash
cd vue-flattener/example
npm run serve
```
访问 http://localhost:8080 查看原始组件效果

### 2. 运行拍平工具
```bash
cd vue-flattener/example
npm run test-flatten
```

这将会：
- 读取 `src/components/MainComponent.vue`
- 分析所有依赖（子组件、工具函数、样式文件）
- 生成拍平后的文件到 `dist/FlattenedComponent.vue`

### 3. 查看结果
生成的拍平文件包含：
- 内联的子组件模板和逻辑
- 内联的工具函数
- 内联的样式文件（带作用域隔离）
- 详细的生成注释

## 📁 项目结构

```
vue-flattener/
├── src/
│   ├── index.js              # 主入口
│   ├── core/
│   │   └── VueFlattener.js   # 核心拍平器
│   ├── parser/
│   │   └── VueParser.js      # Vue文件解析器
│   ├── inliner/
│   │   ├── ComponentInliner.js # 组件内联器
│   │   ├── FunctionInliner.js  # 函数内联器
│   │   └── StyleInliner.js     # 样式内联器
│   └── generator/
│       └── VueGenerator.js     # Vue文件生成器
├── example/                   # 测试环境
│   ├── src/
│   │   ├── components/       # 测试组件
│   │   ├── utils/           # 工具函数
│   │   └── styles/          # 样式文件
│   └── dist/                # 生成文件目录
└── README.md
```

## 🔧 API 使用

### 编程式API
```javascript
const { flatten } = require('./src/index.js');

// 基础使用
await flatten('input.vue', 'output.vue');

// 自定义配置
await flatten('input.vue', 'output.vue', {
  preserveComments: true,        // 保留注释
  scopeStyles: true,            // 样式作用域
  namespacePrefix: 'inline_',   // 命名空间前缀
  minifyInlined: false          // 是否压缩内联代码
});
```

### 命令行使用
```bash
node src/index.js input.vue output.vue
```

## ⚙️ 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `preserveComments` | boolean | `true` | 是否保留注释 |
| `minifyInlined` | boolean | `false` | 是否压缩内联代码 |
| `scopeStyles` | boolean | `true` | 是否添加样式作用域 |
| `namespacePrefix` | string | `'inline_'` | 命名空间前缀 |
| `excludePatterns` | array | `['*.test.js']` | 排除文件模式 |
| `maxDepth` | number | `10` | 最大递归深度 |

## 📋 实现阶段

### ✅ 第一阶段：基础Vue文件解析和简单组件内联
- Vue单文件组件解析
- 依赖关系分析  
- 简单的组件内联合并

### ✅ 第二阶段：JavaScript工具函数内联
- ES6 import/export分析
- 函数依赖树构建
- 代码合并和去重

### ✅ 第三阶段：CSS样式文件内联和作用域处理
- CSS @import处理
- 样式作用域隔离
- 样式优先级处理

## 🧪 测试用例

测试环境包含：

**主组件**: `MainComponent.vue`
- 引入2个子组件
- 使用多个工具函数
- 引入外部样式文件

**子组件**:
- `UserCard.vue` - 用户卡片组件
- `CounterButton.vue` - 计数器按钮组件

**工具函数**:
- `helpers.js` - 通用工具函数
- `math.js` - 数学计算函数

**样式文件**:
- `components.css` - 组件通用样式
- `buttons.css` - 按钮样式

## 🔍 工作原理

1. **解析阶段**: 使用 `@vue/compiler-sfc` 解析Vue单文件组件
2. **依赖分析**: 使用 `@babel/parser` 分析JavaScript依赖
3. **内联处理**: 递归处理所有依赖文件
4. **作用域处理**: 使用 `postcss` 处理CSS作用域
5. **代码生成**: 生成最终的拍平Vue文件

## 🐛 已知限制

- 暂不支持动态import
- 复杂的CSS预处理器支持有限
- 循环依赖检测需要完善
- 第三方库依赖不会被内联

## 🤝 贡献

欢迎提交Issue和Pull Request！

## �� 许可证

MIT License 