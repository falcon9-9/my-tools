# 📦 Package Size Analyzer - 包体积分析工具

这是一个用于分析和对比不同版本 npm 包体积的工具，可以帮助你了解包的大小变化趋势。

## 🚀 快速开始

推荐使用：Node.js 18.x 或 20.x（LTS 长期支持版本）
最低版本：Node.js 16.0.0
不支持：Node.js 14.x 及以下版本

### 1. 安装依赖

```bash
cd package-size
npm install
```

### 2. 使用方法

#### 方法一：使用预设脚本（分析 @game/game-button）

```bash
npm run analyze:game-button
```

这会自动分析 @game/game-button 的三个版本：3.20.0、3.18.0、3.8.7

#### 方法二：自定义分析

```bash
node index.js --package <包名> --versions <版本1> <版本2> <版本3> --registry <registry地址>
```

例如：
```bash
# 使用标准 npm registry
node index.js --package axios --versions 1.6.0 1.5.0 1.4.0

# 使用 bilibili 的 Nexus 3 registry
node index.js --package @game/game-button --versions 3.20.0 3.18.0 3.8.7 --registry https://nexus3.bilibili.co
```

### 3. 命令行参数

- `--package, -p`: 要分析的包名（必需）
- `--versions, -v`: 要对比的版本号列表（必需）
- `--registry, -r`: NPM registry 地址（可选，默认为 https://registry.npmjs.org）
- `--help`: 显示帮助信息

## 📊 输出说明

工具会生成：

1. **控制台表格**：显示各版本的对比信息
   - 版本号
   - 文件数量
   - 原始大小（未压缩）
   - Gzip 大小（压缩后）
   - 相对于基准版本的百分比

2. **JSON 报告**：保存在 `reports/` 目录下
   - 包含详细的分析数据
   - 时间戳
   - 可用于进一步的数据分析

## 🎯 功能特性

- ✅ 支持多版本对比
- ✅ 显示原始大小和 Gzip 压缩后大小
- ✅ 自动计算大小变化和百分比
- ✅ 支持私有 registry
- ✅ 生成 JSON 格式的详细报告
- ✅ 友好的命令行界面
- ✅ 进度提示和错误处理

## 📝 示例输出

```
📦 包体积分析工具

包名: @game/game-button
版本: 3.20.0, 3.18.0, 3.8.7
Registry: http://registry.npm.bilibili.co

┌─────────┬────────┬──────────────┬─────────────┬──────────┐
│ 版本     │ 文件数  │ 原始大小      │ Gzip 大小   │ 对比基准  │
├─────────┼────────┼──────────────┼─────────────┼──────────┤
│ 3.20.0  │ 45     │ 256 KB       │ 78 KB       │ 基准     │
│ 3.18.0  │ 42     │ 248 KB (-8KB)│ 75 KB (-3KB)│ 96.9%    │
│ 3.8.7   │ 38     │ 225 KB (-31KB)│ 68 KB (-10KB)│ 87.9%   │
└─────────┴────────┴──────────────┴─────────────┴──────────┘
```

## 🔧 技术实现

- 使用 axios 下载包文件
- 使用 tar 解压分析
- 使用 gzip-size 计算压缩大小
- 使用 chalk 美化输出
- 使用 cli-table3 生成表格
- 使用 ora 显示进度

## 📄 许可证

MIT 