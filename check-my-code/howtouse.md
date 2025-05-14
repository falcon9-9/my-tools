# 直接运行 babel-plugin-check-my-code 插件检查指定目录

## 1. 配置本地开发的插件

通过 npm link 将本地开发的插件链接到项目中：

```bash
# 在插件目录中
npm link

# 在使用插件的项目中
npm link babel-plugin-check-my-code
```

## 2. 创建 babel-check.js 脚本

```javascript
// babel-check.js
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

// 目标目录
const targetDir = './source-save/biligame';

// 递归查找文件函数
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else if (file.endsWith('.js') || file.endsWith('.vue')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// 查找并处理文件
try {
  const files = findFiles(targetDir);
  files.forEach(file => {
    try {
      if (file.endsWith('.vue')) {
        // 处理 Vue 文件
        const content = fs.readFileSync(file, 'utf8');
        // 提取 script 部分
        const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
        if (scriptMatch && scriptMatch[1]) {
          const scriptContent = scriptMatch[1];
          babel.transform(scriptContent, {
            filename: file,
            plugins: ['babel-plugin-check-my-code'],
            presets: ['@babel/preset-env']
          });
          console.log(`检查 Vue 文件脚本部分: ${file}`);
        } else {
          console.log(`跳过无脚本部分的 Vue 文件: ${file}`);
        }
      } else {
        // 处理 JS 文件
        const code = fs.readFileSync(file, 'utf8');
        babel.transform(code, {
          filename: file,
          plugins: ['babel-plugin-check-my-code'],
          presets: ['@babel/preset-env'] 
        });
        console.log(`检查文件: ${file}`);
      }
    } catch (error) {
      console.error(`处理文件 ${file} 时出错:`, error);
    }
  });
} catch (err) {
  console.error('查找文件出错:', err);
}
```

## 3. 运行脚本

```bash
node babel-check.js
```

## 技术要点

- **不依赖 glob 包**：使用 Node.js 内置的 `fs` 模块递归查找文件
- **Vue 文件解析支持**：
  - 提取 `<script>` 标签中的内容
  - 单独对脚本部分进行 Babel 处理
  - 跳过不包含脚本部分的 Vue 文件
- **错误处理**：捕获并显示处理过程中的错误，但不中断整体检查流程

## 注意事项

- 确保已安装必要的依赖：`@babel/core` 和 `@babel/preset-env`
- 如果脚本报错找不到插件，检查 npm link 是否正确配置
- 可根据需要调整目标目录路径 `targetDir`

使用 Markdown Preview Enhanced 插件打开report.md, 无法跳转链接。
