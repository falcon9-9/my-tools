/**
 * Vue文件解析器
 * 使用@vue/compiler-sfc解析Vue单文件组件
 */

const fs = require('fs-extra');
const path = require('path');
const { parse } = require('@vue/compiler-sfc');
const { parse: babelParse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class VueParser {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * 解析Vue文件
   * @param {string} filePath - Vue文件路径
   * @returns {Object} 解析结果
   */
  async parse(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const { descriptor, errors } = parse(content, {
        filename: filePath
      });

      if (errors.length > 0) {
        throw new Error(`Vue文件解析错误: ${errors.map(e => e.message).join(', ')}`);
      }

      return {
        filename: path.basename(filePath),
        filePath,
        template: descriptor.template ? {
          content: descriptor.template.content,
          attrs: descriptor.template.attrs,
          lang: descriptor.template.lang || 'html'
        } : null,
        script: descriptor.script ? {
          content: descriptor.script.content,
          attrs: descriptor.script.attrs,
          lang: descriptor.script.lang || 'js'
        } : null,
        styles: descriptor.styles.map(style => ({
          content: style.content,
          attrs: style.attrs,
          lang: style.lang || 'css',
          scoped: style.scoped || false
        })),
        customBlocks: descriptor.customBlocks,
        raw: content
      };
    } catch (error) {
      throw new Error(`解析Vue文件失败 (${filePath}): ${error.message}`);
    }
  }

  /**
   * 从script中提取组件依赖
   * @param {string} scriptContent - script内容
   * @param {string} baseDir - 基础目录
   * @returns {Array} 组件依赖列表
   */
  async extractComponentDependencies(scriptContent, baseDir) {
    const dependencies = [];
    
    try {
      // 解析JavaScript代码
      const ast = babelParse(scriptContent, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties'
        ]
      });

      // 遍历AST查找import语句和components注册
      traverse(ast, {
        // 处理 import 语句
        ImportDeclaration(astPath) {
          const source = astPath.node.source.value;
          
          // 检查是否是Vue组件文件
          if (source.endsWith('.vue')) {
            const componentPath = this.resolveImportPath(source, baseDir);
            const defaultImport = astPath.node.specifiers.find(spec => spec.type === 'ImportDefaultSpecifier');
            
            if (defaultImport) {
              dependencies.push({
                name: defaultImport.local.name,
                path: componentPath,
                type: 'component',
                importType: 'default'
              });
            }
          }
        },

        // 处理 components 对象中的组件注册
        ObjectProperty(astPath) {
          const parent = astPath.parent;
          const grandParent = astPath.findParent(p => p.isObjectExpression());
          
          // 检查是否在components对象中
          if (parent && parent.type === 'ObjectExpression') {
            const componentsProperty = astPath.findParent(p => 
              p.isObjectProperty() && 
              p.node.key && 
              (p.node.key.name === 'components' || p.node.key.value === 'components')
            );
            
            if (componentsProperty) {
              const componentName = astPath.node.key.name || astPath.node.key.value;
              // 这里可以进一步分析组件的来源
              // 暂时记录组件名，后续可以通过import分析找到对应的文件
            }
          }
        }
      });

    } catch (error) {
      console.warn(`解析script依赖时出错: ${error.message}`);
    }

    return dependencies;
  }

  /**
   * 从script中提取函数依赖
   * @param {string} scriptContent - script内容  
   * @param {string} baseDir - 基础目录
   * @returns {Array} 函数依赖列表
   */
  async extractFunctionDependencies(scriptContent, baseDir) {
    const dependencies = [];

    try {
      const ast = babelParse(scriptContent, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties'
        ]
      });

      traverse(ast, {
        ImportDeclaration(astPath) {
          const source = astPath.node.source.value;
          
          // 检查是否是JS/TS工具文件
          if (source.match(/\.(js|ts)$/) && !source.endsWith('.vue')) {
            const functionPath = this.resolveImportPath(source, baseDir);
            
            astPath.node.specifiers.forEach(spec => {
              if (spec.type === 'ImportDefaultSpecifier') {
                dependencies.push({
                  name: spec.local.name,
                  path: functionPath,
                  type: 'function',
                  importType: 'default'
                });
              } else if (spec.type === 'ImportSpecifier') {
                dependencies.push({
                  name: spec.imported.name,
                  localName: spec.local.name,
                  path: functionPath,
                  type: 'function',
                  importType: 'named'
                });
              }
            });
          }
        }
      });

    } catch (error) {
      console.warn(`解析函数依赖时出错: ${error.message}`);
    }

    return dependencies;
  }

  /**
   * 从style中提取样式依赖
   * @param {string} styleContent - 样式内容
   * @param {string} baseDir - 基础目录  
   * @returns {Array} 样式依赖列表
   */
  async extractStyleDependencies(styleContent, baseDir) {
    const dependencies = [];
    
    // 匹配 @import 语句
    const importRegex = /@import\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(styleContent)) !== null) {
      const importPath = match[1];
      const resolvedPath = this.resolveImportPath(importPath, baseDir);
      
      dependencies.push({
        path: resolvedPath,
        type: 'style',
        importStatement: match[0]
      });
    }

    return dependencies;
  }

  /**
   * 解析导入路径
   * @param {string} importPath - 导入路径
   * @param {string} baseDir - 基础目录
   * @returns {string} 解析后的绝对路径
   */
  resolveImportPath(importPath, baseDir) {
    // 处理相对路径
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return path.resolve(baseDir, importPath);
    }
    
    // 处理绝对路径（以@开头等）
    if (importPath.startsWith('@/')) {
      // 假设@指向src目录，这里需要根据实际项目配置调整
      return path.resolve(baseDir, importPath.replace('@/', ''));
    }
    
    // 其他情况返回原路径
    return importPath;
  }
}

module.exports = VueParser; 