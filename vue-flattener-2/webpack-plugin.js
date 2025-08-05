const path = require('path');

/**
 * Vue组件拍平Webpack插件
 * 监听文件变化，自动执行Vue组件拍平，支持依赖追踪
 */
class VueFlattenPlugin {
  /**
   * 构造函数
   * @param {Object} options - 插件配置选项
   * @param {string} options.watchDir - 监听的文件夹路径（必需）
   * @param {string} options.flattenerPath - VueFlattener的路径（可选，默认使用当前包）
   */
  constructor(options = {}) {
    if (!options.watchDir) {
      throw new Error('VueFlattenPlugin: watchDir option is required');
    }
    
    this.options = {
      // 监听的文件夹路径
      watchDir: path.resolve(options.watchDir),
      // VueFlattener的路径，默认使用当前包
      flattenerPath: options.flattenerPath || path.join(__dirname, 'src/index.js'),
      ...options
    };
    
    // 动态引入拍平工具
    try {
      this.VueFlattener = require(this.options.flattenerPath);
      this.flattener = new this.VueFlattener();
    } catch (error) {
      throw new Error(`VueFlattenPlugin: Failed to load VueFlattener from ${this.options.flattenerPath}. Error: ${error.message}`);
    }
    
    // 防重复拍平的状态管理
    this.isFlattening = false;
    this.lastFlattenTime = 0;
    this.initialFlattenDone = false;
    
    // 依赖追踪相关
    this.dependencyMap = new Map(); // 依赖文件 -> [views文件列表]
    this.viewsFilesMap = new Map(); // views文件 -> 依赖文件列表
    this.isAnalyzingDependencies = false;
  }

  apply(compiler) {
    // 只在第一次编译时执行初始拍平和依赖分析
    compiler.hooks.beforeCompile.tapAsync('VueFlattenPlugin', async (params, callback) => {
      if (!this.initialFlattenDone) {
        console.log('[VueFlattenPlugin] 执行初始拍平和依赖分析...');
        await this.analyzeDependenciesAndFlatten();
        this.initialFlattenDone = true;
      }
      callback();
    });

    // 监听文件变化
    compiler.hooks.watchRun.tapAsync('VueFlattenPlugin', async (compilation, callback) => {
      // 防止正在拍平时重复执行
      if (this.isFlattening || this.isAnalyzingDependencies) {
        callback();
        return;
      }

      const changedFiles = Array.from(compilation.modifiedFiles || []);
      const deletedFiles = Array.from(compilation.removedFiles || []);
      const allChangedFiles = [...changedFiles, ...deletedFiles];
      
      if (allChangedFiles.length === 0) {
        callback();
        return;
      }

      // 防抖：如果距离上次拍平不到1秒，则跳过
      const now = Date.now();
      if ((now - this.lastFlattenTime) < 1000) {
        callback();
        return;
      }

      // 检查变化的文件，分两类：
      // 1. views文件夹下的直接文件变化
      // 2. views文件依赖的文件变化
      const { directViewsChanges, dependencyChanges } = this.categorizeChanges(allChangedFiles);
      
      const affectedViewsFiles = new Set();
      
      // 处理直接的views文件变化
      if (directViewsChanges.length > 0) {
        console.log(`[VueFlattenPlugin] 🎯 检测到views文件直接变化: ${directViewsChanges.join(', ')}`);
        directViewsChanges.forEach(file => {
          const viewsFile = this.getViewsFileFromPath(file);
          if (viewsFile) {
            affectedViewsFiles.add(viewsFile);
          }
        });
      }
      
      // 处理依赖文件变化
      if (dependencyChanges.length > 0) {
        console.log(`[VueFlattenPlugin] 🔗 检测到依赖文件变化: ${dependencyChanges.join(', ')}`);
        for (const depFile of dependencyChanges) {
          const normalizedDepFile = path.normalize(depFile);
          if (this.dependencyMap.has(normalizedDepFile)) {
            const dependentViews = this.dependencyMap.get(normalizedDepFile);
            console.log(`[VueFlattenPlugin] 📋 依赖文件 ${depFile} 影响的views文件: ${dependentViews.join(', ')}`);
            dependentViews.forEach(viewFile => affectedViewsFiles.add(viewFile));
          }
        }
      }
      
      // 执行重新拍平
      if (affectedViewsFiles.size > 0) {
        const affectedList = Array.from(affectedViewsFiles);
        console.log(`[VueFlattenPlugin] 🔄 准备重新拍平 ${affectedList.length} 个文件: ${affectedList.join(', ')}`);
        await this.flattenSpecificFiles(affectedList);
      }
      
      callback();
    });
  }

  /**
   * 分析依赖关系并执行初始拍平
   */
  async analyzeDependenciesAndFlatten() {
    this.isAnalyzingDependencies = true;
    
    try {
      console.log('[VueFlattenPlugin] 🔍 开始分析依赖关系...');
      
      // 清空之前的依赖映射
      this.dependencyMap.clear();
      this.viewsFilesMap.clear();
      
      const fs = require('fs');
      const watchDir = this.options.watchDir;
      
      // 检查文件夹是否存在
      if (!fs.existsSync(watchDir)) {
        console.log(`[VueFlattenPlugin] views文件夹不存在: ${watchDir}`);
        return;
      }
      
      // 读取views文件夹下的所有.vue文件（排除.flattened.vue）
      const files = fs.readdirSync(watchDir).filter(file => {
        return file.endsWith('.vue') && !file.includes('.flattened.vue');
      });
      
      console.log(`[VueFlattenPlugin] 📁 发现${files.length}个views文件: ${files.join(', ')}`);
      
      // 为每个views文件分析依赖
      for (const file of files) {
        const inputPath = path.join(watchDir, file);
        await this.analyzeDependenciesForFile(inputPath, file);
      }
      
      // 输出依赖分析结果
      this.logDependencyAnalysis();
      
      // 执行初始拍平
      console.log('\n[VueFlattenPlugin] 📦 开始初始拍平...');
      await this.flatten();
      
    } catch (error) {
      console.error(`[VueFlattenPlugin] ❌ 依赖分析过程发生错误:`, error.message);
    } finally {
      this.isAnalyzingDependencies = false;
    }
  }

  /**
   * 为单个文件分析依赖关系
   */
  async analyzeDependenciesForFile(filePath, fileName) {
    try {
      console.log(`[VueFlattenPlugin] 🔍 分析 ${fileName} 的依赖...`);
      
      // 使用ComponentInliner来分析依赖
      const ComponentInliner = require(path.join(__dirname, 'src/inliner/ComponentInliner'));
      const inliner = new ComponentInliner(filePath);
      
      // 获取文件依赖
      const dependencies = await this.extractAllDependencies(inliner, filePath);
      
      // 记录views文件的依赖列表
      this.viewsFilesMap.set(fileName, dependencies);
      
      // 建立反向映射：依赖文件 -> views文件列表
      for (const dep of dependencies) {
        const normalizedDep = path.normalize(dep);
        if (!this.dependencyMap.has(normalizedDep)) {
          this.dependencyMap.set(normalizedDep, []);
        }
        if (!this.dependencyMap.get(normalizedDep).includes(fileName)) {
          this.dependencyMap.get(normalizedDep).push(fileName);
        }
      }
      
      console.log(`[VueFlattenPlugin] ✅ ${fileName} 依赖分析完成，共 ${dependencies.length} 个依赖`);
      
    } catch (error) {
      console.error(`[VueFlattenPlugin] ❌ 分析 ${fileName} 依赖时出错:`, error.message);
    }
  }

  /**
   * 递归提取文件的所有依赖
   */
  async extractAllDependencies(inliner, currentPath) {
    const dependencies = [];
    const visitedFiles = new Set(); // 防止循环依赖
    
    await this.extractDependenciesRecursive(inliner, currentPath, dependencies, visitedFiles);
    
    return [...new Set(dependencies)]; // 去重
  }

  /**
   * 递归提取依赖（深度优先）
   */
  async extractDependenciesRecursive(inliner, currentPath, dependencies, visitedFiles) {
    const normalizedPath = path.normalize(currentPath);
    
    if (visitedFiles.has(normalizedPath)) {
      return; // 避免循环依赖
    }
    visitedFiles.add(normalizedPath);
    
    try {
      const fs = require('fs-extra');
      const VueParser = require(path.join(__dirname, 'src/parser/VueParser'));
      
      // 读取并解析当前文件
      const content = await fs.readFile(currentPath, 'utf-8');
      let imports = [];
      
      if (currentPath.endsWith('.vue')) {
        // Vue文件：解析script部分的import
        const parser = new VueParser(content);
        const parsed = parser.parse();
        imports = inliner.analyzeImports(parsed.script);
      } else if (currentPath.endsWith('.js')) {
        // JavaScript文件：直接分析import
        imports = inliner.analyzeImports(content);
      }
      // CSS/SCSS文件暂时不分析内部的@import，因为已经在主要分析中涵盖
      
      // 处理每个import
      for (const imp of imports) {
        if (imp.source.endsWith('.vue') || 
            imp.source.endsWith('.js') || 
            imp.source.endsWith('.css') || 
            imp.source.endsWith('.scss')) {
          
          // 解析相对路径
          const depPath = path.resolve(path.dirname(currentPath), imp.source);
          dependencies.push(depPath);
          
          // 递归分析依赖的依赖
          if (fs.existsSync(depPath)) {
            await this.extractDependenciesRecursive(inliner, depPath, dependencies, visitedFiles);
          }
        }
      }
      
    } catch (error) {
      console.error(`[VueFlattenPlugin] ⚠️ 分析 ${currentPath} 的导入时出错:`, error.message);
    }
  }

  /**
   * 输出依赖分析结果
   */
  logDependencyAnalysis() {
    console.log('\n[VueFlattenPlugin] 📊 依赖分析结果:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    // 输出每个views文件的依赖
    for (const [viewFile, deps] of this.viewsFilesMap) {
      console.log(`📁 ${viewFile}:`);
      if (deps.length === 0) {
        console.log('   无外部依赖');
      } else {
        deps.forEach(dep => {
          const relPath = path.relative(this.options.watchDir, dep);
          console.log(`   🔗 ${relPath}`);
        });
      }
      console.log('');
    }
    
    // 输出依赖影响范围
    console.log('🎯 依赖影响范围:');
    for (const [depFile, affectedViews] of this.dependencyMap) {
      const relPath = path.relative(path.dirname(this.options.watchDir), depFile);
      console.log(`📎 ${relPath} → ${affectedViews.join(', ')}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  /**
   * 将文件变化分类为直接views变化和依赖变化
   */
  categorizeChanges(changedFiles) {
    const directViewsChanges = [];
    const dependencyChanges = [];
    
    const normalizedWatchDir = path.normalize(this.options.watchDir);
    
    for (const file of changedFiles) {
      const normalizedFile = path.normalize(file);
      
      // 检查是否是views文件夹下的直接文件
      if (file.endsWith('.vue') && 
          !file.includes('.flattened.vue') &&
          normalizedFile.includes(normalizedWatchDir)) {
        directViewsChanges.push(file);
      } 
      // 检查是否是依赖文件
      else if (this.dependencyMap.has(normalizedFile)) {
        dependencyChanges.push(file);
      }
    }
    
    return { directViewsChanges, dependencyChanges };
  }

  /**
   * 从文件路径获取views文件名
   */
  getViewsFileFromPath(filePath) {
    const normalizedWatchDir = path.normalize(this.options.watchDir);
    const normalizedFile = path.normalize(filePath);
    
    if (normalizedFile.includes(normalizedWatchDir)) {
      return path.basename(filePath);
    }
    return null;
  }

  /**
   * 重新拍平指定的views文件
   */
  async flattenSpecificFiles(viewsFileNames) {
    if (this.isFlattening) {
      console.log('[VueFlattenPlugin] 正在拍平中，跳过重复请求');
      return;
    }

    this.isFlattening = true;
    this.lastFlattenTime = Date.now();
    
    const reflattenStartTime = Date.now();
    const reflattenRecord = {
      startTime: new Date().toLocaleString(),
      files: [],
      success: 0,
      failed: 0,
      totalTime: 0,
      trigger: 'dependency_change'
    };
    
    console.log('\n🔄 ========== 重新拍平记录开始 ==========');
    console.log(`⏰ 开始时间: ${reflattenRecord.startTime}`);
    console.log(`🎯 触发原因: 依赖文件变化`);
    console.log(`📋 需要重新拍平的文件: ${viewsFileNames.join(', ')}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
      const fs = require('fs');
      const watchDir = this.options.watchDir;
      
      for (const fileName of viewsFileNames) {
        const inputPath = path.join(watchDir, fileName);
        const outputPath = path.join(watchDir, fileName.replace('.vue', '.flattened.vue'));
        
        const fileStartTime = Date.now();
        console.log(`🔄 正在重新拍平: ${fileName}...`);
        
        try {
          // 重新分析该文件的依赖（因为依赖可能已经改变）
          console.log(`   🔍 重新分析依赖关系...`);
          await this.analyzeDependenciesForFile(inputPath, fileName);
          
          // 执行拍平
          console.log(`   📦 执行拍平操作...`);
          await this.flattener.flatten(inputPath, outputPath);
          
          const fileEndTime = Date.now();
          const fileTime = fileEndTime - fileStartTime;
          
          reflattenRecord.files.push({
            name: fileName,
            status: 'success',
            time: fileTime,
            inputSize: fs.statSync(inputPath).size,
            outputSize: fs.statSync(outputPath).size
          });
          reflattenRecord.success++;
          
          console.log(`✅ ${fileName} 重新拍平成功！耗时: ${fileTime}ms`);
          console.log(`   📄 输入文件大小: ${this.formatBytes(fs.statSync(inputPath).size)}`);
          console.log(`   📄 输出文件大小: ${this.formatBytes(fs.statSync(outputPath).size)}`);
        } catch (error) {
          const fileEndTime = Date.now();
          const fileTime = fileEndTime - fileStartTime;
          
          reflattenRecord.files.push({
            name: fileName,
            status: 'failed',
            time: fileTime,
            error: error.message
          });
          reflattenRecord.failed++;
          
          console.error(`❌ ${fileName} 重新拍平失败！耗时: ${fileTime}ms`);
          console.error(`   错误信息: ${error.message}`);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      const reflattenEndTime = Date.now();
      reflattenRecord.totalTime = reflattenEndTime - reflattenStartTime;
      reflattenRecord.endTime = new Date().toLocaleString();
      
      this.printFlattenSummary(reflattenRecord, true);
      
    } catch (error) {
      console.error(`❌ 重新拍平过程发生错误:`, error.message);
      reflattenRecord.failed++;
    } finally {
      this.isFlattening = false;
      console.log('🔄 ========== 重新拍平记录结束 ==========\n');
    }
  }

  async flatten() {
    // 防重复执行
    if (this.isFlattening) {
      console.log('[VueFlattenPlugin] 正在拍平中，跳过重复请求');
      return;
    }

    this.isFlattening = true;
    this.lastFlattenTime = Date.now();
    
    const flattenStartTime = Date.now();
    const flattenRecord = {
      startTime: new Date().toLocaleString(),
      files: [],
      success: 0,
      failed: 0,
      totalTime: 0
    };
    
    console.log('\n📦 ============ 拍平记录开始 ============');
    console.log(`⏰ 开始时间: ${flattenRecord.startTime}`);
    
    try {
      const fs = require('fs');
      const watchDir = this.options.watchDir;
      
      // 检查文件夹是否存在
      if (!fs.existsSync(watchDir)) {
        console.log(`[VueFlattenPlugin] views文件夹不存在: ${watchDir}`);
        return;
      }
      
      // 读取views文件夹下的所有.vue文件（排除.flattened.vue）
      const files = fs.readdirSync(watchDir).filter(file => {
        return file.endsWith('.vue') && !file.includes('.flattened.vue');
      });
      
      console.log(`📁 目标文件夹: ${watchDir}`);
      console.log(`🔍 发现${files.length}个Vue文件需要拍平: ${files.join(', ')}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 逐个拍平每个文件
      for (const file of files) {
        const inputPath = path.join(watchDir, file);
        const outputPath = path.join(watchDir, file.replace('.vue', '.flattened.vue'));
        
        const fileStartTime = Date.now();
        console.log(`🔄 正在拍平: ${file}...`);
        
        try {
          await this.flattener.flatten(inputPath, outputPath);
          const fileEndTime = Date.now();
          const fileTime = fileEndTime - fileStartTime;
          
          flattenRecord.files.push({
            name: file,
            status: 'success',
            time: fileTime,
            inputSize: fs.statSync(inputPath).size,
            outputSize: fs.statSync(outputPath).size
          });
          flattenRecord.success++;
          
          console.log(`✅ ${file} 拍平成功！耗时: ${fileTime}ms`);
          console.log(`   📄 输入文件大小: ${this.formatBytes(fs.statSync(inputPath).size)}`);
          console.log(`   📄 输出文件大小: ${this.formatBytes(fs.statSync(outputPath).size)}`);
        } catch (error) {
          const fileEndTime = Date.now();
          const fileTime = fileEndTime - fileStartTime;
          
          flattenRecord.files.push({
            name: file,
            status: 'failed',
            time: fileTime,
            error: error.message
          });
          flattenRecord.failed++;
          
          console.error(`❌ ${file} 拍平失败! 耗时: ${fileTime}ms`);
          console.error(`   错误信息: ${error.message}`);
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      }
      
      const flattenEndTime = Date.now();
      flattenRecord.totalTime = flattenEndTime - flattenStartTime;
      flattenRecord.endTime = new Date().toLocaleString();
      
      this.printFlattenSummary(flattenRecord);
      
    } catch (error) {
      console.error(`❌ 拍平过程发生错误:`, error.message);
      flattenRecord.failed++;
    } finally {
      this.isFlattening = false;
      console.log('📦 ============ 拍平记录结束 ============\n');
    }
  }

  /**
   * 打印拍平汇总信息
   */
  printFlattenSummary(record, isReflatten = false) {
    const title = isReflatten ? '重新拍平汇总报告' : '拍平汇总报告';
    const emoji = isReflatten ? '🔄' : '📦';
    
    console.log(`\n${emoji} ========== ${title} ==========`);
    console.log(`⏰ 开始时间: ${record.startTime}`);
    console.log(`⏱️ 结束时间: ${record.endTime}`);
    console.log(`🕒 总耗时: ${record.totalTime}ms (${(record.totalTime / 1000).toFixed(2)}s)`);
    console.log(`📊 处理文件: ${record.files.length} 个`);
    console.log(`✅ 成功: ${record.success} 个`);
    console.log(`❌ 失败: ${record.failed} 个`);
    console.log(`📈 成功率: ${record.files.length > 0 ? ((record.success / record.files.length) * 100).toFixed(1) : 0}%`);
    
    if (record.files.length > 0) {
      console.log('\n📋 详细记录:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      record.files.forEach((file, index) => {
        const status = file.status === 'success' ? '✅' : '❌';
        const size = file.status === 'success' ? 
          ` (${this.formatBytes(file.inputSize)} → ${this.formatBytes(file.outputSize)})` : '';
        
        console.log(`${index + 1}. ${status} ${file.name} - ${file.time}ms${size}`);
        
        if (file.status === 'failed' && file.error) {
          console.log(`   💬 错误: ${file.error}`);
        }
        
        if (file.status === 'success' && file.outputSize > file.inputSize) {
          const increase = file.outputSize - file.inputSize;
          const percentage = ((increase / file.inputSize) * 100).toFixed(1);
          console.log(`   📈 文件增大: +${this.formatBytes(increase)} (+${percentage}%)`);
        } else if (file.status === 'success' && file.outputSize < file.inputSize) {
          const decrease = file.inputSize - file.outputSize;
          const percentage = ((decrease / file.inputSize) * 100).toFixed(1);
          console.log(`   📉 文件减小: -${this.formatBytes(decrease)} (-${percentage}%)`);
        }
      });
      
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      // 统计信息
      if (record.success > 0) {
        const avgTime = record.files
          .filter(f => f.status === 'success')
          .reduce((sum, f) => sum + f.time, 0) / record.success;
        console.log(`⚡ 平均拍平时间: ${avgTime.toFixed(1)}ms`);
        
        const totalInputSize = record.files
          .filter(f => f.status === 'success')
          .reduce((sum, f) => sum + f.inputSize, 0);
        const totalOutputSize = record.files
          .filter(f => f.status === 'success')
          .reduce((sum, f) => sum + f.outputSize, 0);
          
        console.log(`📦 总输入大小: ${this.formatBytes(totalInputSize)}`);
        console.log(`📦 总输出大小: ${this.formatBytes(totalOutputSize)}`);
        
        if (totalOutputSize !== totalInputSize) {
          const diff = totalOutputSize - totalInputSize;
          const percentage = ((Math.abs(diff) / totalInputSize) * 100).toFixed(1);
          const symbol = diff > 0 ? '+' : '-';
          const trend = diff > 0 ? '📈' : '📉';
          console.log(`${trend} 大小变化: ${symbol}${this.formatBytes(Math.abs(diff))} (${symbol}${percentage}%)`);
        }
      }
    }
    
    console.log(`${emoji} ==============================\n`);
  }

  /**
   * 格式化字节大小
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = VueFlattenPlugin; 