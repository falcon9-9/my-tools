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

### 2. Debug Mode

For detailed debugging of the plugin's operation:

```bash
npm run debug-plugin
```

This runs the plugin with detailed logging to help troubleshoot any issues.

### 3. Automated Tests with Jest

The plugin comes with a suite of automated tests using Jest:

```bash
npm test
```

This will run all tests in the `test` directory and report any failures.

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

### 6. Testing Edge Cases

To test the plugin's handling of various edge cases:

```bash
npm run test-edge-cases
```

This tests the plugin with:
- Comments with multiple markers
- Empty comment content
- Multi-line block comments
- Special characters
- Unicode content
- Very long comments
- HTML content in comments
- and more

This helps ensure the plugin is robust and handles unusual inputs correctly.

## Comment Types and Patterns

The plugin recognizes three types of comments:

1. **Test comments** (high priority):
   ```javascript
   // @check-my-code test This needs to be tested
   ```

2. **Check comments** (medium priority):
   ```javascript
   // @check-my-code check Verify this calculation
   ```

3. **Remove comments** (low priority):
   ```javascript
   // @check-my-code remove Remove in production
   ```

You can customize these patterns in the plugin configuration.

## Plugin Configuration

The plugin accepts the following configuration options:

- `outputDir`: Directory where reports will be saved
- `patterns`: Custom patterns for different comment types
  - `test`: Pattern for test comments (high priority)
  - `check`: Pattern for check comments (medium priority)
  - `remove`: Pattern for remove comments (low priority)
- `projectRoot`: Root directory of your project (defaults to `process.cwd()`)

Example configuration:

```javascript
{
  "plugins": [
    ["check-my-code", {
      "outputDir": "./custom-reports",
      "patterns": {
        "test": "@todo test",
        "check": "@todo check",
        "remove": "@todo remove"
      }
    }]
  ]
}
```

## License

MIT 