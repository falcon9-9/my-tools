#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const VueFlattener = require('./index');

/**
 * Vue组件拍平命令行工具
 * 支持单文件拍平和文件夹批量拍平
 */
class VueFlattenCLI {
  constructor(options = {}) {
    this.flattener = new VueFlattener({ silent: !options.verbose });
    this.startTime = Date.now();
    this.stats = {
      totalFiles: 0,
      successFiles: 0,
      failedFiles: 0,
      errors: []
    };
    
    // 🆕 默认配置
    this.defaultConfig = {
      inputPaths: ['src/views'],        // 默认输入路径
      suffix: '.flattened',             // 默认后缀
      recursive: true,                  // 默认递归
      exclude: ['**/*.test.vue'],       // 默认排除模式
      autoGitignore: true,              // 自动添加到gitignore
      gitignorePatterns: [              // gitignore模式
        '*.flattened.vue',
        '**/*.flattened.vue'
      ]
    };
    
    // 🆕 加载配置文件
    this.config = this.loadConfig();
  }

  /**
   * 🆕 加载配置文件
   */
  loadConfig() {
    const configFiles = [
      'vue-flatten.config.js',
      'vue-flatten.config.json',
      '.vue-flattenrc.js',
      '.vue-flattenrc.json'
    ];
    
    let config = { ...this.defaultConfig };
    
    // 查找配置文件
    for (const configFile of configFiles) {
      const configPath = path.resolve(process.cwd(), configFile);
      if (fs.existsSync(configPath)) {
        try {
          console.log(`📋 加载配置文件: ${configFile}`);
          
          if (configFile.endsWith('.js')) {
            // 加载JS配置文件
            delete require.cache[require.resolve(configPath)];
            const userConfig = require(configPath);
            config = { ...config, ...userConfig };
          } else {
            // 加载JSON配置文件
            const userConfig = fs.readJsonSync(configPath);
            config = { ...config, ...userConfig };
          }
          
          console.log(`✅ 配置文件加载成功`);
          break;
        } catch (error) {
          console.warn(`⚠️  配置文件加载失败 ${configFile}:`, error.message);
        }
      }
    }
    
    return config;
  }

  /**
   * 🆕 创建默认配置文件
   */
  createConfigFile(type = 'js') {
    const configContent = type === 'js' ? this.generateJSConfig() : this.generateJSONConfig();
    const configFile = type === 'js' ? 'vue-flatten.config.js' : 'vue-flatten.config.json';
    const configPath = path.resolve(process.cwd(), configFile);
    
    if (fs.existsSync(configPath)) {
      console.log(`📋 配置文件已存在: ${configFile}`);
      return false;
    }
    
    fs.writeFileSync(configPath, configContent, 'utf-8');
    console.log(`✅ 创建配置文件: ${configFile}`);
    return true;
  }

  /**
   * 🆕 生成JS配置文件内容
   */
  generateJSConfig() {
    return `module.exports = {
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
    '**/*.flattened.vue',
    '# Vue拍平工具生成的文件',
    '*.flat.vue',
    '**/*.flat.vue'
  ]
};
`;
  }

  /**
   * 🆕 生成JSON配置文件内容
   */
  generateJSONConfig() {
    return JSON.stringify({
      "inputPaths": ["src/views", "src/pages"],
      "suffix": ".flattened",
      "recursive": true,
      "exclude": ["**/*.test.vue", "**/*.spec.vue"],
      "autoGitignore": true,
      "gitignorePatterns": [
        "*.flattened.vue",
        "**/*.flattened.vue"
      ]
    }, null, 2);
  }

  /**
   * 🆕 自动处理gitignore
   */
  async handleGitignore(options) {
    if (!this.config.autoGitignore) {
      return;
    }
    
    const gitignorePath = path.resolve(process.cwd(), '.gitignore');
    let gitignoreContent = '';
    let needsUpdate = false;
    
    // 读取现有的.gitignore文件
    if (fs.existsSync(gitignorePath)) {
      gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    }
    
    // 检查需要添加的模式
    const patterns = this.config.gitignorePatterns || [];
    const newPatterns = [];
    
    for (const pattern of patterns) {
      if (pattern.startsWith('#')) {
        // 注释行，检查是否存在
        if (!gitignoreContent.includes(pattern)) {
          newPatterns.push(pattern);
          needsUpdate = true;
        }
      } else {
        // 实际的ignore模式
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*').replace(/\./g, '\\.')}$`, 'm');
        if (!regex.test(gitignoreContent) && !gitignoreContent.includes(pattern)) {
          newPatterns.push(pattern);
          needsUpdate = true;
        }
      }
    }
    
    // 如果使用了自定义后缀，也添加到gitignore
    if (options.suffix && options.suffix !== '.flattened') {
      const customPattern = `*${options.suffix}.vue`;
      if (!gitignoreContent.includes(customPattern)) {
        newPatterns.push(`# Vue拍平工具 - 自定义后缀`, customPattern, `**/*${options.suffix}.vue`);
        needsUpdate = true;
      }
    }
    
    if (needsUpdate && newPatterns.length > 0) {
      // 添加分隔符和新模式
      const separator = '\n# ========== Vue拍平工具自动生成 ==========\n';
      const newContent = gitignoreContent + 
        (gitignoreContent.endsWith('\n') ? '' : '\n') + 
        separator + 
        newPatterns.join('\n') + '\n';
      
      fs.writeFileSync(gitignorePath, newContent, 'utf-8');
      console.log(`📋 已更新 .gitignore 文件，添加 ${newPatterns.filter(p => !p.startsWith('#')).length} 个新模式`);
      
      if (options.verbose) {
        console.log(`   新增模式: ${newPatterns.filter(p => !p.startsWith('#')).join(', ')}`);
      }
    } else {
      if (options.verbose) {
        console.log(`📋 .gitignore 文件已包含所需模式，无需更新`);
      }
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
🚀 Vue组件拍平工具 - 命令行版本

用法:
  vue-flatten [输入路径] [选项]

参数:
  输入路径    要拍平的Vue文件或包含Vue文件的文件夹（可选，使用配置文件中的默认路径）

选项:
  --output, -o <路径>     指定输出路径
  --recursive, -r         递归处理子文件夹中的Vue文件
  --suffix <后缀>         自定义输出文件后缀（默认: .flattened）
  --exclude <模式>        排除文件模式（支持glob语法）
  --verbose, -v           详细输出模式
  --help, -h              显示帮助信息
  --config                创建默认配置文件
  --config-json           创建JSON格式的配置文件
  --no-gitignore          禁用自动gitignore处理

配置文件:
  支持以下配置文件（按优先级排序）：
  - vue-flatten.config.js
  - vue-flatten.config.json  
  - .vue-flattenrc.js
  - .vue-flattenrc.json

示例:
  # 使用配置文件中的默认路径批量拍平
  vue-flatten

  # 拍平单个文件
  vue-flatten src/Demo.vue

  # 拍平指定文件夹
  vue-flatten src/views

  # 递归拍平文件夹及子文件夹
  vue-flatten src --recursive

  # 自定义后缀（自动添加到gitignore）
  vue-flatten src/views --suffix .flat

  # 创建配置文件
  vue-flatten --config

  # 排除特定文件
  vue-flatten src/views --exclude "**/*.test.vue"
`);
  }

  /**
   * 解析命令行参数
   */
  parseArgs() {
    const args = process.argv.slice(2);
    const options = {
      inputPath: null,
      outputPath: null,
      recursive: this.config.recursive,      // 🆕 使用配置文件默认值
      suffix: this.config.suffix,            // 🆕 使用配置文件默认值
      exclude: null,
      verbose: false,
      help: false,
      createConfig: false,                    // 🆕 创建配置文件选项
      createConfigJson: false,                // 🆕 创建JSON配置文件选项
      noGitignore: false                     // 🆕 禁用gitignore选项
    };

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      
      if (arg === '--help' || arg === '-h') {
        options.help = true;
      } else if (arg === '--output' || arg === '-o') {
        options.outputPath = args[++i];
      } else if (arg === '--recursive' || arg === '-r') {
        options.recursive = true;
      } else if (arg === '--suffix') {
        options.suffix = args[++i];
      } else if (arg === '--exclude') {
        options.exclude = args[++i];
      } else if (arg === '--verbose' || arg === '-v') {
        options.verbose = true;
      } else if (arg === '--config') {              // 🆕
        options.createConfig = true;
      } else if (arg === '--config-json') {         // 🆕
        options.createConfigJson = true;
      } else if (arg === '--no-gitignore') {        // 🆕
        options.noGitignore = true;
      } else if (!arg.startsWith('-')) {
        if (!options.inputPath) {
          options.inputPath = arg;
        } else if (!options.outputPath) {
          options.outputPath = arg;
        }
      } else {
        console.error(`❌ 未知选项: ${arg}`);
        console.log('使用 --help 查看可用选项');
        process.exit(1);
      }
    }

    return options;
  }

  /**
   * 格式化文件大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件夹中所有Vue文件
   */
  async getVueFiles(dirPath, recursive = false, exclude = null) {
    const files = [];
    
    const scanDir = async (currentDir) => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory() && recursive) {
          await scanDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.vue')) {
          // 排除已拍平的文件
          if (entry.name.includes('.flattened.vue')) {
            continue;
          }
          
          // 排除指定模式的文件
          if (exclude && this.matchPattern(fullPath, exclude)) {
            console.log(`⏭️  跳过文件: ${fullPath} (匹配排除模式)`);
            continue;
          }
          
          files.push(fullPath);
        }
      }
    };
    
    await scanDir(dirPath);
    return files;
  }

  /**
   * 简单的模式匹配（支持基本的glob语法）
   */
  matchPattern(filePath, pattern) {
    // 简化的glob匹配，支持 * 和 **
    const regex = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*');
    return new RegExp(regex).test(filePath);
  }

  /**
   * 生成输出路径
   */
  generateOutputPath(inputPath, outputPath, suffix) {
    if (outputPath) {
      return outputPath;
    }
    
    const dir = path.dirname(inputPath);
    const name = path.basename(inputPath, '.vue');
    return path.join(dir, `${name}${suffix}.vue`);
  }

  /**
   * 拍平单个文件
   */
  async flattenSingleFile(inputPath, outputPath, verbose = false) {
    const startTime = Date.now();
    
    try {
      if (verbose) {
        console.log(`🔄 正在拍平: ${inputPath}`);
      }
      
      // 获取输入文件大小
      const inputStats = await fs.stat(inputPath);
      const inputSize = inputStats.size;
      
      await this.flattener.flatten(inputPath, outputPath);
      
      // 获取输出文件大小
      const outputStats = await fs.stat(outputPath);
      const outputSize = outputStats.size;
      const duration = Date.now() - startTime;
      
      this.stats.successFiles++;
      
      console.log(`✅ ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
      if (verbose) {
        console.log(`   📄 大小: ${this.formatBytes(inputSize)} -> ${this.formatBytes(outputSize)}`);
        console.log(`   ⏱️  耗时: ${duration}ms`);
        
        if (outputSize > inputSize) {
          const increase = outputSize - inputSize;
          const percentage = ((increase / inputSize) * 100).toFixed(1);
          console.log(`   📈 增长: +${this.formatBytes(increase)} (+${percentage}%)`);
        }
      }
      
      return true;
    } catch (error) {
      this.stats.failedFiles++;
      this.stats.errors.push({
        file: inputPath,
        error: error.message
      });
      
      console.error(`❌ ${path.basename(inputPath)}: ${error.message}`);
      if (verbose) {
        console.error(`   详细错误: ${error.stack}`);
      }
      
      return false;
    }
  }

  /**
   * 批量拍平文件
   */
  async flattenMultipleFiles(files, options) {
    console.log(`📁 发现 ${files.length} 个Vue文件需要拍平`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (let i = 0; i < files.length; i++) {
      const inputPath = files[i];
      const outputPath = this.generateOutputPath(inputPath, null, options.suffix);
      
      if (options.verbose) {
        console.log(`\n[${i + 1}/${files.length}]`);
      }
      
      await this.flattenSingleFile(inputPath, outputPath, options.verbose);
    }
  }

  /**
   * 显示最终统计信息
   */
  showSummary() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n📊 ========== 拍平完成统计 ==========');
    console.log(`📂 总文件数: ${this.stats.totalFiles}`);
    console.log(`✅ 成功: ${this.stats.successFiles}`);
    console.log(`❌ 失败: ${this.stats.failedFiles}`);
    console.log(`📈 成功率: ${this.stats.totalFiles > 0 ? ((this.stats.successFiles / this.stats.totalFiles) * 100).toFixed(1) : 0}%`);
    console.log(`⏱️  总耗时: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);
    
    if (this.stats.errors.length > 0) {
      console.log('\n❌ 失败详情:');
      this.stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.file}: ${error.error}`);
      });
    }
    
    console.log('📊 ====================================');
  }

  /**
   * 🆕 批量处理配置文件中的路径
   */
  async processConfigPaths(options) {
    const inputPaths = this.config.inputPaths || ['src/views'];
    let totalProcessed = 0;
    
    console.log(`📋 使用配置文件，处理 ${inputPaths.length} 个路径:`);
    inputPaths.forEach((path, index) => {
      console.log(`  ${index + 1}. ${path}`);
    });
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    for (let i = 0; i < inputPaths.length; i++) {
      const inputPath = inputPaths[i];
      console.log(`\n📁 [${i + 1}/${inputPaths.length}] 处理路径: ${inputPath}`);
      
      // 检查路径是否存在
      if (!await fs.pathExists(inputPath)) {
        console.warn(`⚠️  路径不存在，跳过: ${inputPath}`);
        continue;
      }
      
      const inputStat = await fs.stat(inputPath);
      
      if (inputStat.isDirectory()) {
        // 处理文件夹
        const files = await this.getVueFiles(
          inputPath, 
          options.recursive, 
          options.exclude || this.config.exclude?.join(',') || null
        );
        
        if (files.length === 0) {
          console.log(`📂 ${inputPath} 中未找到需要拍平的Vue文件`);
          continue;
        }
        
        console.log(`📁 发现 ${files.length} 个Vue文件需要拍平`);
        this.stats.totalFiles += files.length;
        await this.flattenMultipleFiles(files, options);
        totalProcessed += files.length;
        
      } else if (inputStat.isFile() && inputPath.endsWith('.vue')) {
        // 处理单个文件
        const outputPath = this.generateOutputPath(inputPath, null, options.suffix);
        
        console.log(`📄 处理单文件: ${path.basename(inputPath)}`);
        this.stats.totalFiles += 1;
        await this.flattenSingleFile(inputPath, outputPath, options.verbose);
        totalProcessed += 1;
      } else {
        console.warn(`⚠️  跳过非Vue文件: ${inputPath}`);
      }
    }
    
    console.log(`\n📊 配置文件处理完成，共处理 ${totalProcessed} 个文件`);
  }

  /**
   * 主程序入口
   */
  async run() {
    try {
      const options = this.parseArgs();
      
      // 🆕 处理配置文件创建
      if (options.createConfig) {
        this.createConfigFile('js');
        return;
      }
      
      if (options.createConfigJson) {
        this.createConfigFile('json');
        return;
      }
      
      // 重新创建flattener实例，传入verbose选项
      this.flattener = new VueFlattener({ silent: !options.verbose });
      
      // 显示帮助信息
      if (options.help) {
        this.showHelp();
        return;
      }
      
      console.log('🚀 Vue组件拍平工具启动');
      
      // 🆕 处理gitignore（在开始处理前）
      if (!options.noGitignore) {
        await this.handleGitignore(options);
      }
      
      // 🆕 如果没有指定输入路径，使用配置文件中的路径
      if (!options.inputPath) {
        if (options.verbose) {
          console.log(`🔧 配置选项:`, JSON.stringify({
            ...this.config,
            commandOptions: options
          }, null, 2));
        }
        
        await this.processConfigPaths(options);
      } else {
        // 原有的单路径处理逻辑
        console.log(`📁 输入路径: ${options.inputPath}`);
        if (options.verbose) {
          console.log(`🔧 配置选项:`, JSON.stringify(options, null, 2));
        }
        
        // 检查输入路径是否存在
        if (!await fs.pathExists(options.inputPath)) {
          console.error(`❌ 输入路径不存在: ${options.inputPath}`);
          process.exit(1);
        }
        
        const inputStat = await fs.stat(options.inputPath);
        
        if (inputStat.isFile()) {
          // 单文件处理
          if (!options.inputPath.endsWith('.vue')) {
            console.error('❌ 输入文件必须是.vue文件');
            process.exit(1);
          }
          
          this.stats.totalFiles = 1;
          const outputPath = this.generateOutputPath(options.inputPath, options.outputPath, options.suffix);
          
          console.log(`📄 单文件模式: ${path.basename(options.inputPath)}`);
          console.log(`📁 输出路径: ${outputPath}`);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          await this.flattenSingleFile(options.inputPath, outputPath, options.verbose);
          
        } else if (inputStat.isDirectory()) {
          // 文件夹处理
          console.log(`📁 文件夹模式: ${options.inputPath}`);
          console.log(`🔄 递归模式: ${options.recursive ? '开启' : '关闭'}`);
          if (options.exclude) {
            console.log(`⚡ 排除模式: ${options.exclude}`);
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          
          const files = await this.getVueFiles(options.inputPath, options.recursive, options.exclude);
          
          if (files.length === 0) {
            console.log('📂 未找到需要拍平的Vue文件');
            return;
          }
          
          this.stats.totalFiles = files.length;
          await this.flattenMultipleFiles(files, options);
          
        } else {
          console.error('❌ 输入路径必须是文件或文件夹');
          process.exit(1);
        }
      }
      
      this.showSummary();
      
      if (this.stats.failedFiles > 0) {
        process.exit(1);
      }
      
    } catch (error) {
      console.error('❌ 程序执行失败:', error.message);
      if (options && options.verbose) {
        console.error('详细错误:', error.stack);
      }
      process.exit(1);
    }
  }
}

// 创建CLI实例并运行
const cli = new VueFlattenCLI();
cli.run(); 