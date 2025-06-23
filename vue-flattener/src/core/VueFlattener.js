/**
 * Vue组件拍平器核心类
 * 负责解析Vue文件并内联所有依赖
 */

const fs = require('fs-extra');
const path = require('path');
const VueParser = require('../parser/VueParser');
const ComponentInliner = require('../inliner/ComponentInliner');
const FunctionInliner = require('../inliner/FunctionInliner');
const StyleInliner = require('../inliner/StyleInliner');
const VueGenerator = require('../generator/VueGenerator');

class VueFlattener {
  constructor(options = {}) {
    this.options = {
      preserveComments: true,
      minifyInlined: false,
      scopeStyles: true,
      namespacePrefix: 'inline_',
      excludePatterns: ['*.test.js'],
      maxDepth: 10, // 防止无限递归
      ...options
    };

    // 初始化各个组件
    this.vueParser = new VueParser(this.options);
    this.componentInliner = new ComponentInliner(this.options);
    this.functionInliner = new FunctionInliner(this.options);
    this.styleInliner = new StyleInliner(this.options);
    this.vueGenerator = new VueGenerator(this.options);
  }

  /**
   * 拍平Vue组件
   * @param {string} inputPath - 输入文件路径
   * @param {string} outputPath - 输出文件路径
   * @returns {Object} 拍平结果
   */
  async flatten(inputPath, outputPath) {
    // 第一阶段：解析主组件
    console.log('📖 第一阶段：解析Vue文件...');
    const mainComponent = await this.vueParser.parse(inputPath);
    
    // 第二阶段：分析所有依赖
    console.log('🔍 第二阶段：分析依赖关系...');
    const dependencies = await this.analyzeDependencies(mainComponent, inputPath);
    
    // 第三阶段：内联组件 (第一阶段实现)
    console.log('🔗 第三阶段：内联子组件...');
    const inlinedComponents = await this.componentInliner.inline(mainComponent, dependencies.components);
    
    // 第四阶段：内联函数 (第二阶段实现)
    console.log('⚙️  第四阶段：内联工具函数...');
    const inlinedFunctions = await this.functionInliner.inline(inlinedComponents, dependencies.functions);
    
    // 第五阶段：内联样式 (第三阶段实现)
    console.log('🎨 第五阶段：内联样式文件...');
    const inlinedStyles = await this.styleInliner.inline(inlinedFunctions, dependencies.styles);
    
    // 第六阶段：生成最终文件
    console.log('📝 第六阶段：生成拍平文件...');
    const flattenedContent = await this.vueGenerator.generate(inlinedStyles);
    
    // 写入文件
    await fs.ensureFile(outputPath);
    await fs.writeFile(outputPath, flattenedContent, 'utf8');
    
    return {
      inputPath,
      outputPath,
      dependencies,
      flattenedContent
    };
  }

  /**
   * 分析所有依赖关系
   * @param {Object} mainComponent - 主组件解析结果
   * @param {string} basePath - 基础路径
   * @returns {Object} 依赖关系对象
   */
  async analyzeDependencies(mainComponent, basePath) {
    const dependencies = {
      components: [],
      functions: [],
      styles: []
    };

    const baseDir = path.dirname(basePath);

    // 分析组件依赖（从template和script中）
    if (mainComponent.script && mainComponent.script.content) {
      const componentDeps = await this.vueParser.extractComponentDependencies(
        mainComponent.script.content, 
        baseDir
      );
      dependencies.components = componentDeps;
    }

    // 分析函数依赖（从script中的import语句）
    if (mainComponent.script && mainComponent.script.content) {
      const functionDeps = await this.vueParser.extractFunctionDependencies(
        mainComponent.script.content, 
        baseDir
      );
      dependencies.functions = functionDeps;
    }

    // 分析样式依赖（从style块中的@import）
    if (mainComponent.styles && mainComponent.styles.length > 0) {
      for (const style of mainComponent.styles) {
        const styleDeps = await this.vueParser.extractStyleDependencies(
          style.content, 
          baseDir
        );
        dependencies.styles.push(...styleDeps);
      }
    }

    return dependencies;
  }
}

module.exports = VueFlattener; 