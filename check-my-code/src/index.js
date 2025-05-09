const path = require('path');
const fs = require('fs');

// 默认配置
const DEFAULT_CONFIG = {
  outputDir: path.join(path.resolve(__dirname, '..'), 'reports'),
  flag: '@check-my-code',
  patterns: {
    high: ['test'],
    medium: ['check'],
    low: ['remove', '222233']
  },
  // 添加编辑器配置
  editorConfig: {
    editor: 'cursor',    // 编辑器类型: 'cursor', 'vscode', 等
    pathStyle: 'encoded'  // 路径格式化方式 'encoded', 'raw', or 'posix'
  }
};

// 确保目录存在
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 获取目录最后一部分名称
function getLastDirectoryName(projectRoot) {
  return path.basename(projectRoot);
}

// 生成项目ID (保留此函数但不再使用)
function generateProjectId(projectRoot) {
  return Buffer.from(projectRoot).toString('base64').replace(/[/+=]/g, '_');
}

// 处理不同编辑器的文件链接格式
function generateEditorLink(filePath, lineNumber, config = {}) {
  // 提取配置参数，设置默认值
  const {
    editor,
    pathStyle
  } = config;

  // 标准化路径
  let normalizedPath;
  if (pathStyle === 'posix') {
    normalizedPath = filePath.replace(/\\/g, '/');
  } else if (pathStyle === 'raw') {
    normalizedPath = filePath; // Keep original path format (with backslashes on Windows)
  } else { // 'encoded'
    // For Windows, maintain backslashes if they exist in the original path
    normalizedPath = process.platform === 'win32' ? filePath : filePath.replace(/\\/g, '/');
  }

  // 特定编辑器格式
  let map = {
    cursor: `cursor://file/${normalizedPath}:${lineNumber}`,
    vscode: `vscode://file/${normalizedPath}:${lineNumber}`
  }
  return map[editor];
}


// 主插件函数
module.exports = function checkMyCodePlugin(babel) {
  const { types: t } = babel;

  return {
    pre(state) {
      // 初始化收集器
      this.todos = [];

      // 获取项目根目录
      const projectRoot = state.opts.projectRoot || process.cwd();

      // 获取目录最后一部分名称作为输出目录名
      const dirName = getLastDirectoryName(projectRoot);
      console.log('dirName---------', dirName);

      // 设置输出目录，使用目录名而不是projectId
      this.outputDir = path.join(
        state.opts.outputDir || DEFAULT_CONFIG.outputDir,
        dirName
      );

      // 设置编辑器链接配置
      this.editorLinkConfig = state.opts.editorLink || DEFAULT_CONFIG.editorLink;

      // 设置模式匹配
      this.patterns = state.opts.patterns || DEFAULT_CONFIG.patterns;

      // 确保输出目录存在
      ensureDir(this.outputDir);
    },

    visitor: {
      Program(nodePath, state) {
        const filename = state.file.opts.filename;
        const comments = nodePath.container.comments || [];

        const patterns = this.patterns;
        const { flag } = DEFAULT_CONFIG;
        const priorities = Object.keys(patterns);

        comments.forEach(comment => {
          const commentText = comment.value.trim();

          // 如果注释不包含标记，跳过
          if (!commentText.includes(flag)) return;

          // 移除标记，但保留其他内容
          const contentWithoutFlag = commentText.replace(flag, '').trim();

          // 确定优先级和类型
          let priority = null;
          let matchedPattern = null;

          // 检查每个优先级的模式
          for (const p of priorities) {
            const currentPatterns = patterns[p];
            for (const pattern of currentPatterns) {
              if (contentWithoutFlag.includes(pattern)) {
                priority = p;
                matchedPattern = pattern;
                break;
              }
            }
            if (priority) break;
          }

          // 如果没有匹配的优先级，跳过
          if (!priority) return;

          // 不再移除匹配的模式，保留完整内容
          const content = contentWithoutFlag;

          this.todos.push({
            id: `check-${this.todos.length + 1}`,
            type: priority,
            priority,
            content,
            location: {
              file: filename,
              line: comment.loc.start.line,
              column: comment.loc.start.column,
              relativePath: path.relative(process.cwd(), filename),
              absolutePath: filename
            },
            links: {
              cursor: generateEditorLink(
                filename,
                comment.loc.start.line,
                this.editorConfig || DEFAULT_CONFIG.editorConfig
              ),
            },
            metadata: {
              createdAt: new Date().toISOString(),
              status: 'pending'
            }
          });
        });
      }
    },

    post() {
      if (this.todos.length === 0) return;

      // 生成报告数据
      const priorities = Object.keys(this.patterns);

      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          totalCount: this.todos.length,
          statistics: {
            byPriority: Object.fromEntries(
              priorities.map(priority => [
                priority,
                this.todos.filter(t => t.priority === priority).length
              ])
            )
          }
        },
        todos: this.todos,
        config: {
          patterns: this.patterns
        }
      };

      // 保存 JSON 报告
      fs.writeFileSync(
        path.join(this.outputDir, 'todos.json'),
        JSON.stringify(report, null, 2)
      );

      // 生成 Markdown 报告
      const markdown = generateMarkdown(report);
      fs.writeFileSync(
        path.join(this.outputDir, 'todos.md'),
        markdown
      );
    }
  };
};

// 生成 Markdown 报告
function generateMarkdown(report) {
  let md = '# Code Check Report\n\n';

  // 添加统计信息
  md += '## Statistics\n\n';
  md += `Total items: ${report.metadata.totalCount}\n\n`;
  
  // 按优先级分组
  Object.keys(report.config.patterns).forEach(priority => {
    const items = report.todos.filter(todo => todo.priority === priority);
    if (items.length === 0) return;

    md += `\n## ${priority.charAt(0).toUpperCase() + priority.slice(1)} Priority\n\n`;
    items.forEach(todo => {
      // 获取文件的相对路径并标准化
      const relativePath = todo.location.relativePath.replace(/\\/g, '/');
      const lineNumber = todo.location.line;

      // md += `- [ ] [${relativePath}:${lineNumber}](${todo.links.cursor})\n`;
      md += `<input type="checkbox"> [${relativePath}:${lineNumber}](${todo.links.cursor})\n`;
      
      // 转义注释内容中的特殊字符
      let escapedContent = todo.content
        .replace(/\*/g, '\\*')
        .replace(/\//g, '\\/')
        .replace(/\_/g, '\\_')
        .replace(/\`/g, '\\`')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');

      // 查找匹配的模式
      let matchedPattern = '';
      const patterns = report.config.patterns[todo.priority] || [];
      for (const pattern of patterns) {
        if (todo.content.includes(pattern)) {
          matchedPattern = pattern;
          break;
        }
      }

      // 将 \n 替换为 HTML 换行标签
      escapedContent = escapedContent.replace(/\n/g, '<br>');
      
      // 添加引用内容，在第一行显示加粗的关键词
      md += `  > **${matchedPattern}**<br>\n`;
      md += `  > ${escapedContent}\n\n`;
    });
  });

  return md;
}
