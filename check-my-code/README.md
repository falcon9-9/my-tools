# babel-plugin-check-my-code

一个用于管理个人代码检查注释的 Babel 插件。

## 特性

- 支持三种类型的检查注释：
  - `@check-my-code test`: 高优先级，用于标记需要测试的代码
  - `@check-my-code check`: 中优先级，用于标记需要检查的代码
  - `@check-my-code remove`: 低优先级，用于标记需要移除的代码

- 生成三种格式的报告：
  - JSON 格式（用于程序处理）
  - Markdown 格式（用于版本控制系统查看）
  - HTML 格式（用于可视化查看）

- 支持 VS Code 集成：
  - 点击链接直接跳转到代码位置
  - 支持按优先级过滤
  - 支持标记完成状态

## 安装

```bash
npm install --save-dev babel-plugin-check-my-code
```

## 配置

在 `.babelrc` 或 `babel.config.js` 中添加插件：

```json
{
  "plugins": [
    ["check-my-code", {
      "outputDir": "~/.tfy-config/reports",  // 可选，默认为用户目录
      "projectRoot": "/path/to/project"      // 可选，默认为当前工作目录
    }]
  ]
}
```

## 使用示例

```javascript
// @check-my-code test: 需要验证按钮点击行为
function handleClick() {
  // 实现代码
}

// @check-my-code check: 检查参数验证是否完整
function processData(data) {
  // 处理逻辑
}

// @check-my-code remove: 旧的实现方法，待移除
function oldImplementation() {
  // 废弃的代码
}
```

## 输出目录结构

```
~/.tfy-config/
  └── reports/
      └── [项目ID]/
          ├── todos.json    # JSON 格式报告
          ├── todos.md      # Markdown 格式报告
          └── todos.html    # HTML 格式报告
```

## 注意事项

1. 输出文件会保存在用户目录下，不会提交到 git
2. VS Code 链接格式支持直接跳转到代码位置
3. 可以通过环境变量自定义输出目录

## 开发

```bash
# 安装依赖
npm install

# 运行测试
npm test

# 构建
npm run build
```

## Testing the Plugin

There are multiple ways to test this Babel plugin:

### 1. Quick Test

For a quick test using a simple test file:

```bash
npm run test-plugin
```

This will:
1. Create a test file with various comment types
2. Process it with the plugin
3. Display the detected comments and generated report


### 4. Testing in Your Own Project

To test the plugin in your own project:

1. Install the plugin locally:
   ```bash
   npm install --save-dev /path/to/this/plugin
   ```

2. Configure Babel to use the plugin in your `.babelrc` or `babel.config.js`:
   ```json
   {
     "plugins": [
       ["check-my-code", {
         "outputDir": "./reports",
         "patterns": {
           "test": "@check-my-code test",
           "check": "@check-my-code check",
           "remove": "@check-my-code remove"
         }
       }]
     ]
   }
   ```

3. Run Babel on your code:
   ```bash
   npx babel src --out-dir lib
   ```

4. Check the `reports` directory for the generated report.

### 5. Using Babel CLI

You can also use the Babel CLI to test the plugin on a specific file:

```bash
# Install Babel CLI if needed
npm install -g @babel/cli

# Run Babel with the plugin on any JavaScript file
babel path/to/your/file.js --plugins=./src/index.js
```

This will transform the file using the plugin and generate the report in the `reports` directory.

## 使用方式

### 1. 使用 Webpack

如果你的项目使用 Webpack，推荐在 webpack 配置中集成插件：

1. 安装必要依赖：
```bash
npm install --save-dev babel-loader @babel/core
```

2. 在 webpack.config.js 中配置：
```javascript
module.exports = {
  // ... 其他配置
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              ['babel-plugin-check-my-code', {
                outputDir: './reports',
                patterns: {
                  high: ['test'],
                  medium: ['check'],
                  low: ['remove']
                },
                editorConfig: {
                  editor: 'cursor',
                  pathStyle: 'encoded'
                }
              }]
            ]
          }
        }
      }
    ]
  }
}
```

3. 使用 webpack watch 模式：
```bash
webpack --watch
```

### 2. 使用 Babel CLI

如果你想独立使用 Babel 处理文件：

```bash
# 安装依赖
npm install --save-dev @babel/cli

# 编译单个文件
npx babel src/your-file.js

# 编译整个目录
npx babel src -d dist

# 使用 watch 模式
npx babel src -d dist --watch
```

## 开发模式使用（npm link）

如果你正在开发这个插件，或者想在本地项目中测试/使用这个插件，可以使用 npm link：

### 1. 在插件项目中创建链接

```bash
# 进入插件项目目录
cd check-my-code

# 创建全局链接
npm link
```

### 2. 在目标项目中使用插件

```bash
# 进入要使用该插件的项目目录
cd 你的项目路径

# 链接插件
npm link babel-plugin-check-my-code
```

### 3. 配置目标项目

在目标项目的 `.babelrc` 或 `babel.config.js` 中添加插件配置：

```json
{
  "plugins": [
    ["babel-plugin-check-my-code", {
      "outputDir": "./reports",
      "patterns": {
        "high": ["test"],
        "medium": ["check"],
        "low": ["remove"]
      },
      "editorConfig": {
        "editor": "cursor",
        "pathStyle": "encoded"
      }
    }]
  ]
}
```

### 4. 解除链接

当你不再需要本地开发版本时，可以解除链接：

```bash
# 在目标项目中解除链接
npm unlink babel-plugin-check-my-code

# 在插件项目中解除全局链接
npm unlink
```

### 开发调试提示

1. **检查链接状态**：
```bash
# 检查全局链接
npm ls -g --depth=0
# 检查本地链接
npm ls --link=true
```

2. **验证插件加载**：
```bash
# 查看 Babel 配置是否正确加载插件
npx babel --print-config-file src/your-file.js
```

3. **调试输出**：
插件中已包含基本的日志输出，如果需要更多调试信息，可以添加环境变量：
```bash
DEBUG=babel-plugin-check-my-code* npm run your-script
```


这些改动解决了覆盖问题。主要改进包括：
新增功能:
readExistingReport: 读取已存在的JSON报告
mergeTodos: 合并新旧todos，使用文件路径和行号作为唯一标识
改进的数据处理:
在生成新报告前先读取现有报告
合并现有和新的todos
添加更新时间戳
保持todo的唯一性（同一文件同一行只保留最新的）
元数据增强:
添加了lastUpdatedAt字段
统计数据现在基于合并后的todos
这样修改后，插件将：
保留所有文件中的@check-my-code注释
避免重复记录
在每次运行时更新而不是覆盖现有数据
使用建议：
建议定期运行插件以确保报告更新
如果需要完全重置报告，可以手动删除输出目录中的文件
可以通过检查metadata.lastUpdatedAt来追踪最近的更新时间
这样的改进使得插件更适合在大型项目中使用，可以持续累积和管理所有的代码检查注释。


我已经添加了对 Vue 文件的特殊处理。这个改进包括：
新增 calculateVueFileLine 函数:
检查文件是否为 .vue 文件
读取文件内容并按行分割
查找 <script> 标签的位置
计算实际行号（script标签位置 + Babel提供的行号）
修改行号处理逻辑:
在添加 todo 之前计算实际行号
在生成编辑器链接时使用实际行号
这个解决方案的工作原理：
对于普通文件（非 .vue）:
保持原有行号不变
直接使用 Babel 提供的行号
对于 Vue 文件:
找到 <script> 标签的位置
将 Babel 提供的行号（相对于 script 部分的行号）加上 script 标签的位置
得到在整个文件中的实际行号


研究什么命令能直接作用 babel-plugin-check-my-code