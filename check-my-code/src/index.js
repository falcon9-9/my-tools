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
    editor: 'vscode',    // 编辑器类型: 'vscode' | 'cursor'
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

// 处理不同编辑器的文件链接格式
function generateEditorLink(filePath, lineNumber, config = {}) {
  // 提取配置参数，设置默认值
  const {
    editor
  } = config;

  // 确保文件路径是绝对路径
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

  // 特定编辑器格式
  let map = {
    vscode: `vscode://file/${absolutePath}:${lineNumber}`,
    cursor: `cursor://file/${absolutePath}:${lineNumber}`,
  };

  return map[editor];
}

// 计算Vue文件中的实际行号
function calculateVueFileLine(filename, babelLine, sourceType = 'script') {
  if (!filename.endsWith('.vue')) {
    return babelLine;
  }

  try {
    if (!fs.existsSync(filename)) {
      console.warn(`Warning: Vue file does not exist when calculating line number: ${filename}`);
      return babelLine;
    }

    const content = fs.readFileSync(filename, 'utf8');
    if (!content) {
      console.warn(`Warning: Vue file is empty when calculating line number: ${filename}`);
      return babelLine;
    }

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
        if (match) {
          currentBlock = match[1];
          inTargetBlock = (currentBlock === sourceType);
          if (inTargetBlock) {
            targetStartLine = i;
            break;
          }
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
  const blocks = {
    template: { start: -1, end: -1, comments: [] },
    script: { start: -1, end: -1, comments: [] },
    style: { start: -1, end: -1, comments: [] }
  };
  try {
    if (!fs.existsSync(filename)) {
      console.warn(`Warning: Vue file does not exist: ${filename}`);
      return blocks;
    }

    const content = fs.readFileSync(filename, 'utf8');
    if (!content) {
      console.warn(`Warning: Vue file is empty: ${filename}`);
      return blocks;
    }

    const lines = content.split('\n');

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
  } catch (e) {
    console.error(`Error parsing Vue file ${filename}: ${e.message}`);
    return blocks;
  }
}

// 生成汇总报告
function generateSummaryReport(outputDir, patterns, currentFileId) {
  try {
    // 设置临时目录路径
    const tempDir = path.join(outputDir, 'temp');

    // 确保临时目录存在
    if (!fs.existsSync(tempDir)) {
      console.log(`[${currentFileId}] 临时目录不存在，创建: ${tempDir}`);
      ensureDir(tempDir);
    }

    // 读取临时目录中的文件
    const files = fs.readdirSync(tempDir);
    const fileReportFiles = files.filter(file => file.startsWith('file-') && file.endsWith('.json'));

    if (fileReportFiles.length === 0) {
      return; // 没有找到文件报告，无需生成汇总
    }

    // 收集所有的todos
    let allTodos = [];
    const fileOrder = [];

    fileReportFiles.forEach(reportFile => {
      try {
        const reportPath = path.join(tempDir, reportFile);
        const reportData = fs.readFileSync(reportPath, 'utf8');
        const report = JSON.parse(reportData);

        if (report.todos && Array.isArray(report.todos) && report.todos.length > 0) {
          const filename = report.metadata.filename;
          const fileBasename = path.basename(filename);

          if (!fileOrder.includes(fileBasename)) {
            fileOrder.push(fileBasename);
          }

          allTodos = allTodos.concat(report.todos);
        }
      } catch (e) {
        // 忽略单个文件的错误
      }
    });

    if (allTodos.length === 0) {
      return; // 没有todos，无需生成汇总
    }

    // 按文件名分组todos
    const todosByFile = {};

    allTodos.forEach(todo => {
      const filename = path.basename(todo.location.file);
      if (!todosByFile[filename]) {
        todosByFile[filename] = [];
      }
      todosByFile[filename].push(todo);
    });

    // 生成报告数据
    const report = {
      metadata: {
        generatedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
        totalCount: allTodos.length,
        fileCount: Object.keys(todosByFile).length,
        fileOrder: fileOrder,
        statistics: {
          byFile: Object.fromEntries(
            Object.entries(todosByFile).map(([file, todos]) => [
              file,
              todos.length
            ])
          )
        }
      },
      todos: allTodos,
      config: {
        patterns: patterns
      }
    };

    // 保存 JSON 报告
    const jsonReportPath = path.join(outputDir, 'todos.json');
    fs.writeFileSync(
      jsonReportPath,
      JSON.stringify(report, null, 2)
    );

    // 生成 Markdown 报告
    const markdown = generateMarkdown(report, todosByFile);
    const mdReportPath = path.join(outputDir, 'todos.md');
    fs.writeFileSync(
      mdReportPath,
      markdown
    );
  } catch (e) {
    console.error(`[${currentFileId}] 生成汇总报告错误: ${e.message}`);
  }
}

// 主插件函数
module.exports = function checkMyCodePlugin(babel) {
  const { types: t } = babel;

  // 当前正在处理的文件计数
  let fileCounter = 0;

  return {
    pre(state) {
      // 获取一个唯一的文件标识符，用于日志
      fileCounter++;
      this.currentFileId = fileCounter;

      // 初始化当前文件的todos收集器
      this.todos = [];

      // 尝试从全局变量获取文件名
      const globalFileName = typeof global !== 'undefined' && global.CURRENT_PROCESSING_FILE;
      if (globalFileName) {
        console.log(`[${this.currentFileId}] 从全局变量获取文件名: ${globalFileName}`);
      }

      // 调试信息，查看state.opts的内容
      // console.log(`[${this.currentFileId}] DEBUG state.opts:`, JSON.stringify(state.opts || {}));

      // 从配置选项中获取文件名
      const currentFilename = state.opts && state.opts.currentFilename;

      if (currentFilename) {
        console.log(`[${this.currentFileId}] 从选项中获取到文件名: ${currentFilename}`);
      }

      // 从state.file.opts中获取文件名
      const fileOpts = state.file && state.file.opts;
      if (fileOpts) {
        console.log(`[${this.currentFileId}] DEBUG file.opts:`, JSON.stringify(fileOpts || {}));
      }

      // 获取当前文件名 - 添加安全检查
      // 优先使用全局变量，然后是配置选项，最后是state中的文件名
      const possibleFilename = globalFileName ||
        currentFilename ||
        (state.file && state.file.opts && state.file.opts.filename) ||
        state.filename || null;
      this.filename = possibleFilename;
      console.log(`[${this.currentFileId}] 处理文件开始: ${possibleFilename || 'unknown-file'}`);

      // 获取项目根目录
      const projectRoot = state.opts.projectRoot || process.cwd();

      // 获取目录最后一部分名称作为输出目录名
      const dirName = getLastDirectoryName(projectRoot);

      // 设置输出目录
      this.outputDir = path.join(
        state.opts.outputDir || DEFAULT_CONFIG.outputDir,
        dirName
      );

      // 确保输出目录存在
      ensureDir(this.outputDir);

      // 设置编辑器链接配置
      this.editorLinkConfig = state.opts.editorLink || DEFAULT_CONFIG.editorConfig;

      // 设置模式匹配
      this.patterns = state.opts.patterns || DEFAULT_CONFIG.patterns;
    },

    visitor: {
      Program: {
        exit(nodePath, state) {
          // 调试信息，查看state对象
          // console.log(`[${this.currentFileId}] EXIT DEBUG state:`, { 
          //   hasOpts: !!state.opts,
          //   currentFilename: state.opts && state.opts.currentFilename,
          //   stateFilename: state.filename,
          //   hasFileOpts: !!(state.file && state.file.opts),
          //   fileOptsFilename: state.file && state.file.opts && state.file.opts.filename
          // });
          // 安全获取文件名 - 这里尝试从state中获取，应该比pre阶段更可靠
          const actualFilename = state.filename || (state.file && state.file.opts && state.file.opts.filename);
          // 检查全局变量
          const globalFileName = typeof global !== 'undefined' && global.CURRENT_PROCESSING_FILE;
          if (globalFileName && (!this.filename || this.filename === 'unknown-file')) {
            this.filename = globalFileName;
            console.log(`[${this.currentFileId}] EXIT: 从全局变量更新文件名: ${this.filename}`);
          }

          // 如果pre阶段没有获取到文件名，但这里获取到了，就更新文件名
          if (actualFilename && (!this.filename || this.filename === 'unknown-file')) {
            this.filename = actualFilename;
            console.log(`[${this.currentFileId}] 更新文件名: ${this.filename}`);
          }

          // 尝试从配置选项中再次获取文件名
          if (state.opts && state.opts.currentFilename && (!this.filename || this.filename === 'unknown-file')) {
            this.filename = state.opts.currentFilename;
            console.log(`[${this.currentFileId}] 从选项中更新文件名: ${this.filename}`);
          }

          // 获取文件名用于日志，如果仍然无法获取，使用命令行参数
          let filename = this.filename;
          if (!filename || filename === 'unknown-file') {
            // 最后尝试从process.argv中获取
            const args = process.argv.slice(2);
            for (const arg of args) {
              if (arg.endsWith('.vue') || arg.endsWith('.js')) {
                filename = arg;
                this.filename = filename;
                console.log(`[${this.currentFileId}] 从命令行参数中提取文件名: ${filename}`);
                break;
              }
            }
          }
          
          // 这时如果依然没有filename，使用这个文件ID作为唯一标识
          if (!filename || filename === 'unknown-file') {
            filename = `unknown-file-${this.currentFileId}`;
            this.filename = filename;
          }
          // 如果是Vue文件且尚未处理
          if (filename.endsWith('.vue')) {
            try {
              // 解析Vue文件的所有区块
              const blocks = parseVueFile(filename);

              // 处理每个区块的注释
              Object.entries(blocks).forEach(([blockType, block]) => {
                if (block.comments.length > 0) {
                  console.log(`[${this.currentFileId}] 在 ${blockType} 区块中找到 ${block.comments.length} 个注释`);
                  block.comments.forEach(comment => {
                    processComment.call(
                      this,
                      {
                        value: comment.value,
                        line: comment.line,
                        sourceType: 'vue',
                        blockType: blockType
                      },
                      filename
                    );
                  });
                }
              });
            } catch (e) {
              console.error(`[${this.currentFileId}] 处理Vue文件错误 ${filename}: ${e.message}`);
            }
          }

          // 处理常规JavaScript注释
          const comments = nodePath.container.comments || [];
          if (!filename.endsWith('.vue')) {
            // 原有的JavaScript注释处理逻辑
            comments.forEach(comment => {
              const commentText = comment.value.trim();

              // 如果注释不包含标记，跳过
              if (!commentText.includes('@check-my-code')) return;

              // 计算实际行号，传入源类型
              const actualLine = calculateVueFileLine(
                filename,
                comment.loc.start.line,
                'script'
              );

              processComment.call(
                this,
                {
                  value: commentText,
                  line: actualLine,
                  column: comment.loc.start.column,
                  sourceType: filename.endsWith('.vue') ? 'script' : 'javascript'
                },
                filename
              );
            });
          }

          console.log(`[${this.currentFileId}] 在文件中找到 ${this.todos.length} 个检查项: ${path.basename(filename)}`);

          // 为该文件生成一个单独的报告
          try {
            // 如果没有todos，跳过报告生成
            if (!this.todos || this.todos.length === 0) {
              console.log(`[${this.currentFileId}] 没有发现todos，跳过报告生成: ${path.basename(filename)}`);
              return;
            }

            const fileBasename = path.basename(filename, path.extname(filename));
            // 获取相对路径并替换路径分隔符为@
            const relativePath = path.relative(process.cwd(), filename)
              .replace(/\\/g, '@')
              .replace(/\//g, '@');
            const fileReport = {
              metadata: {
                generatedAt: new Date().toISOString(),
                filename: filename,
                todoCount: this.todos.length
              },
              todos: this.todos
            };

            // 创建临时目录用于保存单独报告
            const tempDir = path.join(this.outputDir, 'temp');
            ensureDir(tempDir);

            // 生成每个文件的单独报告，使用相对路径确保唯一性
            const fileReportPath = path.join(tempDir, `file-${relativePath}.json`);
            fs.writeFileSync(fileReportPath, JSON.stringify(fileReport, null, 2));
            console.log(`[${this.currentFileId}] 写入文件报告: ${fileReportPath}`);

            // 在处理完文件后尝试生成汇总报告
            generateSummaryReport(this.outputDir, this.patterns, this.currentFileId);
          } catch (e) {
            console.error(`[${this.currentFileId}] 生成文件报告错误: ${e.message}`);
          }
        }
      }
    },

    post() {
      // post方法保留但简化，在所有文件处理完成后生成汇总报告
      generateSummaryReport(this.outputDir, this.patterns, this.currentFileId);
    }
  };
};

// 生成 Markdown 报告
function generateMarkdown(report, todosByFile) {
  let md = '# Code Check Report\n\n';

  // 添加统计信息
  md += '## Statistics\n\n';
  md += `Total items: ${report.metadata.totalCount}\n`;
  md += `Files with todos: ${report.metadata.fileCount}\n\n`;

  // 按文件分组
  const { fileOrder, statistics } = report.metadata;

  // 按照文件处理顺序展示
  fileOrder.forEach(filename => {
    const todos = todosByFile[filename];
    if (!todos || todos.length === 0) return;

    // 添加文件标题和统计
    md += `\n## ${filename} (${todos.length} items)\n\n`;

    // 按照行号排序todos
    const sortedTodos = todos.slice().sort((a, b) => a.location.line - b.location.line);

    sortedTodos.forEach(todo => {
      // 获取文件的相对路径并标准化
      const relativePath = todo.location.relativePath.replace(/\\/g, '/');
      const lineNumber = todo.location.line;

      // 生成链接
      md += `<input type="checkbox"> [${relativePath}:${lineNumber}](${todo.openLink})\n`;

      // 转义注释内容中的特殊字符
      let escapedContent = todo.content
        .replace(/\*/g, '\\*')
        .replace(/\//g, '\\/')
        .replace(/\_/g, '\\_')
        .replace(/\`/g, '\\`')
        .replace(/\[/g, '\\[')
        .replace(/\]/g, '\\]');

      // 查找匹配的模式和优先级
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

      // 添加引用内容，显示优先级和关键词
      md += `  > **[${todo.priority}]** ${matchedPattern ? `(${matchedPattern})` : ''}<br>\n`;
      md += `  > ${escapedContent}\n\n`;
    });
  });

  return md;
}

// 处理注释并添加到todos列表的通用函数
function processComment(comment, filename) {
  const commentText = comment.value.trim();
  
  // 如果注释不包含标记，跳过（仅Vue文件外的评论需要此检查）
  if (comment.sourceType !== 'vue' && !commentText.includes('@check-my-code')) return;
  
  // 移除标记，但保留其他内容
  const contentWithoutFlag = commentText.replace('@check-my-code', '').trim();
  
  // 确定优先级和类型
  let priority = 'medium'; // 默认中等优先级
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
    if (matchedPattern) break;
  }
  
  // 基本位置信息
  const location = {
    file: filename,
    line: comment.line,
    relativePath: path.relative(process.cwd(), filename),
    absolutePath: filename
  };
  
  // 添加Vue特定信息
  if (comment.blockType) {
    location.vueBlock = comment.blockType;
  } else if (filename.endsWith('.vue')) {
    location.vueBlock = 'script';
  }
  
  // 添加列信息（如果有）
  if (comment.column !== undefined) {
    location.column = comment.column;
  }
  
  // 创建元数据
  const metadata = {
    createdAt: new Date().toISOString(),
    status: 'pending',
    sourceType: comment.sourceType
  };
  
  // 添加Vue块类型（如果有）
  if (comment.blockType) {
    metadata.blockType = comment.blockType;
  }
  
  this.todos.push({
    id: `check-${this.todos.length + 1}`,
    type: priority,
    priority,
    content: contentWithoutFlag,
    location,
    openLink: generateEditorLink(
      filename,
      comment.line,
      this.editorLinkConfig || DEFAULT_CONFIG.editorConfig
    ),
    metadata
  });
}
