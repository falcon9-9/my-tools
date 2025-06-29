# Vue Flattener 2 - 命令行工具完整使用指南

## 🎯 概述

Vue组件拍平工具提供两种使用方式：
1. **webpack插件方式**：集成到构建流程，自动监听和拍平
2. **命令行工具方式**：手动控制，支持批量处理 ⭐

本指南重点介绍命令行工具的完整使用流程。

## 🚀 完整使用流程

### 第一步：安装与链接

```bash
# 1. 在vue-flattener-2目录中创建全局链接
cd vue-flattener-2
npm link

# 2. 在目标项目中使用
cd your-project
npm link vue-flattener-2
```

### 第二步：创建配置文件（推荐）

```bash
# 在你的项目根目录创建配置文件
vue-flatten --config

# 或创建JSON格式配置文件
vue-flatten --config-json
```

这会生成 `vue-flatten.config.js` 文件，包含以下默认配置：

```javascript
module.exports = {
  // 📁 输入路径配置（数组支持多个路径）
  inputPaths: [
    'src/views',           // 主要的视图文件夹
    'src/pages',           // 页面文件夹
    // 'src/components'    // 组件文件夹（按需开启）
  ],
  
  // 📝 输出文件后缀
  suffix: '.flattened',
  
  // 🔄 是否递归处理子文件夹
  recursive: true,
  
  // ⚡ 排除文件模式（支持glob语法）
  exclude: [
    '**/*.test.vue',       // 测试文件
    '**/*.spec.vue',       // 规范文件
    '**/node_modules/**'   // 依赖文件夹
  ],
  
  // 🎯 自动添加到gitignore
  autoGitignore: true,
  
  // 📋 gitignore模式
  gitignorePatterns: [
    '*.flattened.vue',
    '**/*.flattened.vue'
  ]
};
```

### 第三步：使用命令行工具

#### 💡 零配置使用（推荐）

```bash
# 使用配置文件中的设置，一键批量拍平
vue-flatten

# 带详细输出
vue-flatten --verbose
```

#### 🎯 精确控制使用

```bash
# 拍平单个文件
vue-flatten src/views/Demo.vue

# 拍平指定文件夹
vue-flatten src/views

# 递归拍平文件夹及子文件夹
vue-flatten src/views --recursive

# 使用自定义后缀
vue-flatten src/views --suffix .flat

# 排除特定文件
vue-flatten src/views --exclude "**/*.test.vue"

# 详细输出模式（显示文件大小、处理时间等）
vue-flatten src/views --verbose

# 禁用自动gitignore处理
vue-flatten src/views --no-gitignore
```

### 第四步：集成到项目脚本

在你的 `package.json` 中添加脚本：

```json
{
  "scripts": {
    "flatten": "vue-flatten",
    "flatten:verbose": "vue-flatten --verbose",
    "flatten:views": "vue-flatten src/views",
    "flatten:config": "vue-flatten --config",
    "dev": "webpack serve && npm run flatten"
  }
}
```

然后可以用npm脚本运行：

```bash
npm run flatten          # 零配置批量拍平
npm run flatten:verbose  # 详细输出模式
npm run flatten:views    # 只拍平views文件夹
npm run flatten:config   # 创建配置文件
```

## 📋 命令行选项详解

| 选项 | 简写 | 类型 | 说明 | 默认值 |
|------|------|------|------|--------|
| `--output` | `-o` | string | 指定输出路径 | 自动生成 |
| `--recursive` | `-r` | boolean | 递归处理子文件夹 | 配置文件决定 |
| `--suffix` | | string | 自定义输出后缀 | .flattened |
| `--exclude` | | string | 排除文件模式（glob语法） | 配置文件决定 |
| `--verbose` | `-v` | boolean | 详细输出模式 | false |
| `--help` | `-h` | boolean | 显示帮助信息 | false |
| `--config` | | boolean | 创建JS配置文件 | false |
| `--config-json` | | boolean | 创建JSON配置文件 | false |
| `--no-gitignore` | | boolean | 禁用自动gitignore处理 | false |

## 📊 输出示例

### 简洁模式输出：
```bash
📋 加载配置文件: vue-flatten.config.js
✅ 配置文件加载成功
📁 发现 3 个Vue文件需要拍平
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Demo.vue -> Demo.flattened.vue
✅ UserProfile.vue -> UserProfile.flattened.vue
✅ Dashboard.vue -> Dashboard.flattened.vue
📋 已更新 .gitignore 文件，添加 2 个新模式

📊 ========== 拍平完成统计 ==========
📂 总文件数: 3
✅ 成功: 3
❌ 失败: 0
📈 成功率: 100.0%
⏱️  总耗时: 1247ms (1.25s)
📊 ====================================
```

### 详细模式输出：
```bash
vue-flatten --verbose

📋 加载配置文件: vue-flatten.config.js
✅ 配置文件加载成功
📁 发现 3 个Vue文件需要拍平

[1/3]
🔄 正在拍平: src/views/Demo.vue
✅ Demo.vue -> Demo.flattened.vue
   📄 大小: 2.45 KB -> 8.92 KB
   ⏱️  耗时: 486ms
   📈 增长: +6.47 KB (+264.1%)

[2/3]
🔄 正在拍平: src/views/UserProfile.vue
✅ UserProfile.vue -> UserProfile.flattened.vue
   📄 大小: 1.23 KB -> 4.56 KB
   ⏱️  耗时: 324ms
   📈 增长: +3.33 KB (+270.7%)
```

## 🎯 高级功能

### 1. 自动GitIgnore管理
CLI工具会自动将拍平文件添加到`.gitignore`：

```gitignore
# ========== Vue拍平工具自动生成 ==========
# Vue拍平工具生成的文件
*.flattened.vue
**/*.flattened.vue

# Vue拍平工具 - 自定义后缀（如果使用 --suffix .flat）
*.flat.vue
**/*.flat.vue
```

### 2. 配置文件优先级
支持以下配置文件（按优先级排序）：
- `vue-flatten.config.js`
- `vue-flatten.config.json`  
- `.vue-flattenrc.js`
- `.vue-flattenrc.json`

### 3. 智能文件排除
- 自动排除已拍平的文件（包含`.flattened.vue`）
- 支持glob模式排除特定文件
- 自动排除测试文件和规范文件

### 4. 错误处理与恢复
```bash
# 如果出现错误，会显示详细信息
❌ Demo.vue: Unexpected token '<'
   详细错误: SyntaxError: Unexpected token '<' at line 15

# 最终统计会显示失败详情
❌ 失败详情:
1. src/views/Demo.vue: Unexpected token '<'
2. src/views/Profile.vue: Cannot read property 'type' of undefined
```

## 🔧 实际使用案例

### 案例1：简单Vue项目
```bash
# 项目结构
my-vue-app/
├── src/
│   ├── views/
│   │   ├── Home.vue
│   │   ├── About.vue
│   │   └── Contact.vue
│   └── components/
└── package.json

# 使用流程
cd my-vue-app
npm link vue-flattener-2
vue-flatten --config           # 创建配置文件
vue-flatten                    # 批量拍平
```

### 案例2：复杂项目结构
```bash
# 项目结构
enterprise-app/
├── src/
│   ├── views/
│   │   ├── admin/
│   │   ├── user/
│   │   └── public/
│   ├── pages/
│   └── modules/
└── vue-flatten.config.js

# 配置文件设置
module.exports = {
  inputPaths: ['src/views', 'src/pages'],
  recursive: true,
  exclude: ['**/*.test.vue', '**/admin/**'],
  suffix: '.compiled'
};

# 执行拍平
vue-flatten --verbose
```

### 案例3：CI/CD集成
```bash
# package.json
{
  "scripts": {
    "prebuild": "vue-flatten",
    "build": "webpack --mode production",
    "flatten:check": "vue-flatten --verbose"
  }
}

# CI流程
npm run prebuild  # 构建前自动拍平
npm run build     # 构建项目
```

## 🛠️ 故障排除

### 常见问题：

#### 1. 命令不存在
```bash
# 错误信息
vue-flatten: command not found

# 解决方案
npm link vue-flattener-2
# 或者使用完整路径
node path/to/vue-flattener-2/src/cli.js
```

#### 2. 权限问题
```bash
# 错误信息
❌ EACCES: permission denied

# 解决方案
sudo chown -R $(whoami) src/views/
# 或者检查文件权限
ls -la src/views/
```

#### 3. 配置文件未生效
```bash
# 检查配置文件位置
ls -la vue-flatten.config.*

# 手动指定配置文件路径（如果需要）
# 当前CLI会自动查找配置文件
```

#### 4. 语法错误
```bash
# 错误信息
❌ Demo.vue: Unexpected token '<'

# 解决方案
# 检查Vue文件语法
# 使用--verbose获取详细错误信息
vue-flatten src/views/Demo.vue --verbose
```

#### 5. 依赖问题
```bash
# 错误信息
Cannot find module 'vue-flattener-2'

# 解决方案
# 确保已正确链接
cd vue-flattener-2 && npm link
cd your-project && npm link vue-flattener-2

# 或者使用相对路径
node ../vue-flattener-2/src/cli.js src/views
```

## 🎉 完整使用示例

**项目结构：**
```
my-project/
├── src/
│   ├── views/
│   │   ├── Home.vue
│   │   ├── About.vue
│   │   ├── Profile.vue
│   │   └── admin/
│   │       ├── Dashboard.vue
│   │       └── Users.vue
│   ├── components/
│   │   ├── Header.vue
│   │   ├── Footer.vue
│   │   └── Button.vue
│   └── pages/
│       ├── Login.vue
│       └── Register.vue
├── vue-flatten.config.js
└── package.json
```

**完整流程：**
```bash
# 1. 进入项目目录
cd my-project

# 2. 链接工具
npm link vue-flattener-2

# 3. 创建配置文件
vue-flatten --config

# 4. 编辑配置文件（可选）
vim vue-flatten.config.js

# 5. 执行批量拍平
vue-flatten --verbose

# 6. 检查结果
find src -name "*.flattened.vue" -type f

# 7. 集成到npm脚本
npm run flatten
```

**预期输出：**
```bash
📋 加载配置文件: vue-flatten.config.js
✅ 配置文件加载成功
📁 发现 7 个Vue文件需要拍平
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[1/7] ✅ Home.vue -> Home.flattened.vue
[2/7] ✅ About.vue -> About.flattened.vue
[3/7] ✅ Profile.vue -> Profile.flattened.vue
[4/7] ✅ Dashboard.vue -> Dashboard.flattened.vue
[5/7] ✅ Users.vue -> Users.flattened.vue
[6/7] ✅ Login.vue -> Login.flattened.vue
[7/7] ✅ Register.vue -> Register.flattened.vue

📋 已更新 .gitignore 文件，添加 2 个新模式

📊 ========== 拍平完成统计 ==========
📂 总文件数: 7
✅ 成功: 7
❌ 失败: 0
📈 成功率: 100.0%
⏱️  总耗时: 2834ms (2.83s)
📊 ====================================
```

## 🎓 最佳实践

### 1. 开发工作流集成
```bash
# 开发时使用
npm run dev    # 启动开发服务器
npm run flatten # 手动拍平（当需要时）

# 构建时使用  
npm run prebuild  # 自动拍平
npm run build     # 构建项目
```

### 2. 团队协作
```bash
# 在项目中提交配置文件
git add vue-flatten.config.js
git commit -m "Add vue-flatten configuration"

# 团队成员使用
npm link vue-flattener-2
npm run flatten
```

### 3. 性能优化
```bash
# 只拍平需要的文件夹
vue-flatten src/views --exclude "**/components/**"

# 使用配置文件精确控制
# vue-flatten.config.js
module.exports = {
  inputPaths: ['src/views'],  // 只监听views
  exclude: ['**/*.test.vue', '**/*.story.vue']
};
```

现在你就可以在任何项目中轻松使用Vue组件拍平工具了！🚀

## 🔗 相关链接

- [webpack插件使用方式](./README.md#webpack插件使用)
- [VueFlattener API文档](./src/README.md)
- [项目开发日志](./log.md)

---

**Happy Coding!** 如果遇到问题，欢迎查看项目的 `log.md` 文件或提交Issue。

