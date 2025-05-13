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

// 读取现有的JSON报告
function readExistingReport(outputDir) {
  const jsonPath = path.join(outputDir, 'todos.json');
  try {
    if (fs.existsSync(jsonPath)) {
      const data = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Warning: Could not read existing report:', error.message);
  }
  return null;
}

// 合并todos，避免重复
function mergeTodos(existingTodos = [], newTodos = []) {
  const todoMap = new Map();
  
  // 添加现有的todos
  existingTodos.forEach(todo => {
    const key = `${todo.location.file}:${todo.location.line}`;
    todoMap.set(key, todo);
  });

  // 添加或更新新的todos
  newTodos.forEach(todo => {
    const key = `${todo.location.file}:${todo.location.line}`;
    todoMap.set(key, {
      ...todo,
      metadata: {
        ...todo.metadata,
        updatedAt: new Date().toISOString()
      }
    });
  });

  return Array.from(todoMap.values());
}

// 计算Vue文件中的实际行号
function calculateVueFileLine(filename, babelLine, sourceType = 'script') {
  if (!filename.endsWith('.vue')) {
    return babelLine;
  }

  try {
    const content = fs.readFileSync(filename, 'utf8');
    const lines = content.split('\n');
    let targetStartLine = 0;
    let inTargetBlock = false;
    let currentBlock = '';
    
    // 遍历文件查找目标区块
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 检查区块开始
      if (line.match(/<(template|script|style)\b[^>]*>/)) {
        const match = line.match(/<(template|script|style)/);
        currentBlock = match[1];
        inTargetBlock = (currentBlock === sourceType);
        if (inTargetBlock) {
          targetStartLine = i;
          break;
        }
      }
    }
    
    // 计算实际行号
    return targetStartLine + babelLine;
  } catch (error) {
    console.warn(`Warning: Could not calculate Vue file line number for ${filename}:`, error.message);
    return babelLine;
  }
}

// 解析Vue文件的不同区块
function parseVueFile(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  const blocks = {
    template: { start: -1, end: -1, comments: [] },
    script: { start: -1, end: -1, comments: [] },
    style: { start: -1, end: -1, comments: [] }
  };
  
  let currentBlock = null;
  
  // 查找各区块的起始和结束位置
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // 检查区块开始
    const startMatch = line.match(/<(template|script|style)\b[^>]*>/);
    if (startMatch) {
      currentBlock = startMatch[1];
      blocks[currentBlock].start = i + 1;
      continue;
    }
    
    // 检查区块结束
    const endMatch = line.match(/<\/(template|script|style)>/);
    if (endMatch && currentBlock === endMatch[1]) {
      blocks[currentBlock].end = i + 1;
      currentBlock = null;
      continue;
    }
    
    // 如果在某个区块内，检查是否包含@check-my-code
    if (currentBlock && line.includes('@check-my-code')) {
      // 提取注释内容（移除注释符号和@check-my-code标记）
      const commentText = line
        .replace(/\/\*|\*\/|\/\/|<!--|-->/g, '') // 移除所有注释符号
        .trim();
        
      blocks[currentBlock].comments.push({
        value: commentText,
        line: i + 1
      });
    }
  }
  
  return blocks;
}

// 主插件函数
module.exports = function checkMyCodePlugin(babel) {
  const { types: t } = babel;

  return {
    pre(state) {
      // 初始化收集器
      this.todos = [];
      this.processedFiles = new Set();

      // 获取项目根目录
      const projectRoot = state.opts.projectRoot || process.cwd();

      // 获取目录最后一部分名称作为输出目录名
      const dirName = getLastDirectoryName(projectRoot);

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
      Program: {
        exit(nodePath, state) {
          const filename = state.file.opts.filename;
          
          // 如果是Vue文件且尚未处理
          if (filename.endsWith('.vue') && !this.processedFiles.has(filename)) {
            this.processedFiles.add(filename);
            
            // 解析Vue文件的所有区块
            const blocks = parseVueFile(filename);
            
            // 处理每个区块的注释
            Object.entries(blocks).forEach(([blockType, block]) => {
              if (block.comments.length > 0) {
                block.comments.forEach(comment => {
                  const commentText = comment.value.trim();
                  const contentWithoutFlag = commentText.replace('@check-my-code', '').trim();
                  
                  // 确定优先级和类型
                  let priority = null;
                  let matchedPattern = null;
                  
                  // 检查每个优先级的模式
                  const priorities = Object.keys(this.patterns);
                  for (const p of priorities) {
                    const currentPatterns = this.patterns[p];
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
                  
                  this.todos.push({
                    id: `check-${this.todos.length + 1}`,
                    type: priority,
                    priority,
                    content: contentWithoutFlag,
                    location: {
                      file: filename,
                      line: comment.line,
                      relativePath: path.relative(process.cwd(), filename),
                      absolutePath: filename,
                      vueBlock: blockType
                    },
                    links: {
                      cursor: generateEditorLink(
                        filename,
                        comment.line,
                        this.editorConfig || DEFAULT_CONFIG.editorConfig
                      ),
                    },
                    metadata: {
                      createdAt: new Date().toISOString(),
                      status: 'pending',
                      sourceType: 'vue',
                      blockType: blockType
                    }
                  });
                });
              }
            });
          }
          
          // 处理常规JavaScript注释
          const comments = nodePath.container.comments || [];
          if (!filename.endsWith('.vue')) {
            // 原有的JavaScript注释处理逻辑
            comments.forEach(comment => {
              const commentText = comment.value.trim();

              // 如果注释不包含标记，跳过
              if (!commentText.includes('@check-my-code')) return;

              console.log('commentText---------', commentText);
              // 移除标记，但保留其他内容
              const contentWithoutFlag = commentText.replace('@check-my-code', '').trim();

              // 确定优先级和类型
              let priority = null;
              let matchedPattern = null;

              // 检查每个优先级的模式
              const priorities = Object.keys(this.patterns);
              for (const p of priorities) {
                const currentPatterns = this.patterns[p];
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

              // 计算实际行号，传入源类型
              const actualLine = calculateVueFileLine(
                filename, 
                comment.loc.start.line,
                'script'
              );

              this.todos.push({
                id: `check-${this.todos.length + 1}`,
                type: priority,
                priority,
                content,
                location: {
                  file: filename,
                  line: actualLine,
                  column: comment.loc.start.column,
                  relativePath: path.relative(process.cwd(), filename),
                  absolutePath: filename,
                  vueBlock: filename.endsWith('.vue') ? 'script' : undefined
                },
                links: {
                  cursor: generateEditorLink(
                    filename,
                    actualLine,
                    this.editorConfig || DEFAULT_CONFIG.editorConfig
                  ),
                },
                metadata: {
                  createdAt: new Date().toISOString(),
                  status: 'pending',
                  sourceType: filename.endsWith('.vue') ? 'script' : 'javascript'
                }
              });
            });
          }
        }
      }
    },

    post() {
      if (this.todos.length === 0) return;

      // 读取现有报告
      const existingReport = readExistingReport(this.outputDir);
      const existingTodos = existingReport ? existingReport.todos : [];
      
      // 合并todos
      const mergedTodos = mergeTodos(existingTodos, this.todos);

      // 生成报告数据
      const priorities = Object.keys(this.patterns);
      const report = {
        metadata: {
          generatedAt: new Date().toISOString(),
          lastUpdatedAt: new Date().toISOString(),
          totalCount: mergedTodos.length,
          statistics: {
            byPriority: Object.fromEntries(
              priorities.map(priority => [
                priority,
                mergedTodos.filter(t => t.priority === priority).length
              ])
            )
          }
        },
        todos: mergedTodos,
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
