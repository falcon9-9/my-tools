/**
 * 函数内联器
 * 负责将JavaScript工具函数内联到主组件中
 */

const fs = require('fs-extra');
const path = require('path');
const { parse: babelParse } = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;

class FunctionInliner {
  constructor(options = {}) {
    this.options = options;
    this.inlinedFunctions = new Map(); // 缓存已内联的函数
  }

  /**
   * 内联函数依赖
   * @param {Object} component - 组件对象
   * @param {Array} functionDependencies - 函数依赖列表
   * @returns {Object} 内联后的组件
   */
  async inline(component, functionDependencies) {
    console.log(`⚙️  开始内联 ${functionDependencies.length} 个工具函数...`);
    
    if (functionDependencies.length === 0) {
      return component;
    }

    const inlinedComponent = {
      ...component,
      inlinedFunctions: {}
    };

    // 处理每个函数依赖
    for (const dependency of functionDependencies) {
      try {
        await this.inlineFunction(inlinedComponent, dependency);
      } catch (error) {
        console.warn(`⚠️  内联函数失败 ${dependency.name}: ${error.message}`);
        // 继续处理其他函数，不中断整个流程
      }
    }

    // 更新script内容
    if (inlinedComponent.script) {
      inlinedComponent.script.content = await this.updateScriptWithInlinedFunctions(
        inlinedComponent.script.content,
        functionDependencies,
        inlinedComponent.inlinedFunctions
      );
    }

    return inlinedComponent;
  }

  /**
   * 内联单个函数文件
   * @param {Object} component - 组件对象
   * @param {Object} dependency - 函数依赖
   */
  async inlineFunction(component, dependency) {
    // 检查文件是否存在
    if (!await fs.pathExists(dependency.path)) {
      throw new Error(`函数文件不存在: ${dependency.path}`);
    }

    console.log(`  ⚙️  内联函数: ${dependency.name} (${dependency.path})`);

    // 读取函数文件内容
    const functionContent = await fs.readFile(dependency.path, 'utf8');
    
    // 解析函数文件
    const functionAst = this.parseFunctionFile(functionContent);
    
    // 提取函数定义
    const extractedFunctions = this.extractFunctions(functionAst, dependency);
    
    // 存储内联后的函数信息
    component.inlinedFunctions[dependency.name] = {
      path: dependency.path,
      type: dependency.importType,
      functions: extractedFunctions,
      originalContent: functionContent
    };
  }

  /**
   * 解析函数文件
   * @param {string} content - 文件内容
   * @returns {Object} AST对象
   */
  parseFunctionFile(content) {
    try {
      return babelParse(content, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties'
        ]
      });
    } catch (error) {
      throw new Error(`解析函数文件失败: ${error.message}`);
    }
  }

  /**
   * 从AST中提取函数定义
   * @param {Object} ast - AST对象
   * @param {Object} dependency - 依赖信息
   * @returns {Array} 提取的函数列表
   */
  extractFunctions(ast, dependency) {
    const functions = [];
    
    traverse(ast, {
      // 处理函数声明
      FunctionDeclaration(path) {
        if (dependency.importType === 'named' && path.node.id.name === dependency.name) {
          functions.push({
            type: 'FunctionDeclaration',
            name: path.node.id.name,
            code: generate(path.node).code,
            node: path.node
          });
        }
      },

      // 处理变量声明中的箭头函数
      VariableDeclarator(path) {
        if (path.node.id.name === dependency.name && 
            (path.node.init.type === 'ArrowFunctionExpression' || 
             path.node.init.type === 'FunctionExpression')) {
          functions.push({
            type: 'VariableDeclarator',
            name: path.node.id.name,
            code: generate(path.parent).code, // 包含const/let声明
            node: path.parent
          });
        }
      },

      // 处理默认导出
      ExportDefaultDeclaration(path) {
        if (dependency.importType === 'default') {
          if (path.node.declaration.type === 'FunctionDeclaration') {
            functions.push({
              type: 'ExportDefaultDeclaration',
              name: dependency.name, // 使用导入时的名称
              code: generate(path.node.declaration).code,
              node: path.node.declaration
            });
          } else if (path.node.declaration.type === 'Identifier') {
            // 默认导出的是一个标识符，需要找到对应的函数定义
            const referencedFunction = this.findReferencedFunction(ast, path.node.declaration.name);
            if (referencedFunction) {
              functions.push({
                type: 'ExportDefaultDeclaration',
                name: dependency.name,
                code: referencedFunction.code,
                node: referencedFunction.node
              });
            }
          }
        }
      },

      // 处理命名导出
      ExportNamedDeclaration(path) {
        if (dependency.importType === 'named') {
          if (path.node.declaration) {
            // 直接导出声明
            if (path.node.declaration.type === 'FunctionDeclaration' && 
                path.node.declaration.id.name === dependency.name) {
              functions.push({
                type: 'ExportNamedDeclaration',
                name: dependency.name,
                code: generate(path.node.declaration).code,
                node: path.node.declaration
              });
            }
          } else if (path.node.specifiers) {
            // 导出说明符
            const specifier = path.node.specifiers.find(spec => 
              spec.exported.name === dependency.name
            );
            if (specifier) {
              const referencedFunction = this.findReferencedFunction(ast, specifier.local.name);
              if (referencedFunction) {
                functions.push({
                  type: 'ExportNamedDeclaration',
                  name: dependency.name,
                  code: referencedFunction.code,
                  node: referencedFunction.node
                });
              }
            }
          }
        }
      }
    });

    return functions;
  }

  /**
   * 查找被引用的函数定义
   * @param {Object} ast - AST对象
   * @param {string} name - 函数名
   * @returns {Object|null} 函数定义信息
   */
  findReferencedFunction(ast, name) {
    let result = null;
    
    traverse(ast, {
      FunctionDeclaration(path) {
        if (path.node.id.name === name) {
          result = {
            type: 'FunctionDeclaration',
            name: name,
            code: generate(path.node).code,
            node: path.node
          };
          path.stop();
        }
      },
      VariableDeclarator(path) {
        if (path.node.id.name === name && 
            (path.node.init.type === 'ArrowFunctionExpression' || 
             path.node.init.type === 'FunctionExpression')) {
          result = {
            type: 'VariableDeclarator',
            name: name,
            code: generate(path.parent).code,
            node: path.parent
          };
          path.stop();
        }
      }
    });

    return result;
  }

  /**
   * 更新script内容，内联函数并移除import语句
   * @param {string} scriptContent - 原始script内容
   * @param {Array} dependencies - 函数依赖
   * @param {Object} inlinedFunctions - 已内联的函数
   * @returns {string} 更新后的script内容
   */
  async updateScriptWithInlinedFunctions(scriptContent, dependencies, inlinedFunctions) {
    let updatedContent = scriptContent;

    try {
      // 解析原始script
      const ast = babelParse(updatedContent, {
        sourceType: 'module',
        plugins: [
          'jsx',
          'typescript',
          'decorators-legacy',
          'classProperties'
        ]
      });

      // 移除import语句并收集要内联的函数
      const functionsToInline = [];
      
      traverse(ast, {
                 ImportDeclaration(astPath) {
           const source = astPath.node.source.value;
           const matchingDep = dependencies.find(dep => 
             dep.path.endsWith(source) || source.endsWith(path.basename(dep.path))
           );
          
                     if (matchingDep && inlinedFunctions[matchingDep.name]) {
             // 收集要内联的函数
             const inlinedFunc = inlinedFunctions[matchingDep.name];
             functionsToInline.push(...inlinedFunc.functions);
             
             // 移除import语句
             astPath.remove();
           }
        }
      });

      // 在export default之前插入内联的函数
      if (functionsToInline.length > 0) {
                 traverse(ast, {
           ExportDefaultDeclaration(astPath) {
             // 在export default之前插入函数
             const functionCodes = functionsToInline.map(func => func.code);
             const comment = `\n// === 内联的工具函数 ===\n`;
             const inlinedCode = `${comment}${functionCodes.join('\n\n')}\n// === 内联函数结束 ===\n\n`;
             
             // 这里需要手动插入代码，因为AST操作比较复杂
             // 我们使用字符串替换的方式
             const exportMatch = updatedContent.match(/export\s+default/);
             if (exportMatch) {
               updatedContent = updatedContent.replace(/export\s+default/, `${inlinedCode}export default`);
             }
             
             astPath.stop();
           }
        });
      }

      // 如果没有找到export default，就在文件末尾添加函数
      if (functionsToInline.length > 0 && !updatedContent.includes('export default')) {
        const functionCodes = functionsToInline.map(func => func.code);
        const comment = `\n// === 内联的工具函数 ===\n`;
        const inlinedCode = `${comment}${functionCodes.join('\n\n')}\n// === 内联函数结束 ===\n`;
        updatedContent += inlinedCode;
      }

    } catch (error) {
      console.warn(`处理内联函数时出错: ${error.message}`);
      // 如果AST处理失败，使用简单的字符串替换
      updatedContent = this.fallbackStringReplacement(updatedContent, dependencies, inlinedFunctions);
    }

    return updatedContent;
  }

  /**
   * 备用的字符串替换方法
   * @param {string} content - 原始内容
   * @param {Array} dependencies - 依赖列表
   * @param {Object} inlinedFunctions - 内联函数
   * @returns {string} 处理后的内容
   */
  fallbackStringReplacement(content, dependencies, inlinedFunctions) {
    let updatedContent = content;

    // 移除import语句
    for (const dep of dependencies) {
      const importRegex = new RegExp(`import\\s+[^;]*from\\s+['"][^'"]*${path.basename(dep.path).replace('.', '\\.')}['"]\\s*;?`, 'g');
      updatedContent = updatedContent.replace(importRegex, '');
    }

    // 添加内联函数
    const allFunctions = [];
    Object.values(inlinedFunctions).forEach(inlined => {
      allFunctions.push(...inlined.functions);
    });

    if (allFunctions.length > 0) {
      const functionCodes = allFunctions.map(func => func.code);
      const comment = `\n// === 内联的工具函数 ===\n`;
      const inlinedCode = `${comment}${functionCodes.join('\n\n')}\n// === 内联函数结束 ===\n\n`;
      
      // 在export default之前插入
      if (updatedContent.includes('export default')) {
        updatedContent = updatedContent.replace(/export\s+default/, `${inlinedCode}export default`);
      } else {
        updatedContent += inlinedCode;
      }
    }

    return updatedContent;
  }
}

module.exports = FunctionInliner; 