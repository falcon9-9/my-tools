const fs = require('fs-extra');
const path = require('path');
const VueParser = require('../parser/VueParser');

/**
 * 组件内联器
 * 用于将子组件内联到主组件中
 */
class ComponentInliner {
  constructor(mainComponentPath) {
    this.mainPath = mainComponentPath;
    this.mainDir = path.dirname(mainComponentPath);
    this.inlinedComponents = [];
    this.componentStyles = []; // 收集组件样式
    this.inlinedStyles = []; // 收集内联的样式文件
  }

  /**
   * 执行内联
   * @returns {Promise<Object>} 内联后的组件内容
   */
  async inline() {
    try {
    // 读取主组件
    const mainContent = await fs.readFile(this.mainPath, 'utf-8');
      
      // 解析Vue组件
    const parser = new VueParser(mainContent);
    const parsed = parser.parse();

      // 分析导入的组件和工具函数
      console.log('🔍 分析import语句...');
    const imports = this.analyzeImports(parsed.script);
      console.log('✅ 发现', imports.length, '个import:');
      imports.forEach(imp => {
        console.log(`  - ${imp.type || '未知'}: ${imp.name || imp.namedImports} from ${imp.source}`);
      });
      
      this.inlinedFunctions = []; // 收集内联的工具函数
      
      console.log('🔧 开始内联处理...');
      // 内联每个子组件和工具函数
    for (const imp of imports) {
      if (imp.source.endsWith('.vue')) {
          console.log(`📦 处理Vue组件: ${imp.source}`);
          // 处理Vue组件
        const componentContent = await this.inlineComponent(imp);
        if (componentContent) {
          this.inlinedComponents.push(componentContent);
            console.log(`✅ 成功内联Vue组件: ${imp.name}`);
          // 收集组件样式
          if (componentContent.styles) {
            this.componentStyles.push({
              name: componentContent.name,
              styles: componentContent.styles
            });
          }
          }
        } else if (imp.source.endsWith('.js')) {
          console.log(`🔧 处理JavaScript文件: ${imp.source}`);
          // 🔧 处理JavaScript工具函数
          const functionContent = await this.inlineJavaScriptFile(imp);
          if (functionContent) {
            this.inlinedFunctions.push(functionContent);
            console.log(`✅ 成功内联JavaScript函数: ${Object.keys(functionContent.functions).join(', ')}`);
          } else {
            console.log(`❌ JavaScript文件处理失败: ${imp.source}`);
        }
      } else if (imp.source.endsWith('.css') || imp.source.endsWith('.scss')) {
        console.log(`🎨 处理样式文件: ${imp.source}`);
        // 🎨 处理样式文件
        const styleContent = await this.inlineStyleFile(imp);
        if (styleContent) {
          // 确保 inlinedStyles 数组存在
          if (!this.inlinedStyles) {
            this.inlinedStyles = [];
          }
          this.inlinedStyles.push(styleContent);
          console.log(`✅ 成功内联样式文件: ${imp.source}`);
        } else {
          console.log(`❌ 样式文件处理失败: ${imp.source}`);
        }
      }
    }

      console.log('📝 更新主组件script...');
    // 更新主组件的script
    const updatedScript = this.updateMainScript(parsed.script, imports);
      console.log('✅ Script更新完成，长度:', updatedScript.length);

      console.log('🎨 合并样式...');
    // 合并所有样式
    const allStyles = this.mergeStyles(parsed.styles);
      console.log('✅ 样式合并完成，共', allStyles.length, '个样式块');

      const result = {
      template: parsed.template,
      script: updatedScript,
      styles: allStyles
    };
      
      console.log('🎉 内联完成！');
      return result;
    } catch (error) {
      console.error('❌ ComponentInliner.inline() 出错:', error);
      throw error;
    }
  }

  /**
   * 分析script中的import语句
   * @param {string} script - script内容
   * @returns {Array} import信息数组
   */
  analyzeImports(script) {
    const imports = [];
    
    // 支持多种import格式：
    // 1. 默认导入：import Component from './path'
    // 2. 命名导入：import { func1, func2 } from './path'
    // 3. 混合导入：import Default, { named } from './path'
    // 4. 直接导入：import './path' (通常用于样式文件)
    
    // 匹配带from的导入
    const importWithFromRegex = /import\s+(.+?)\s+from\s+['"](.+?)['"];?/g;
    let match;

    while ((match = importWithFromRegex.exec(script)) !== null) {
      const importClause = match[1].trim();
      const source = match[2];
      const statement = match[0];
      
      // 解析导入类型
      const importInfo = this.parseImportClause(importClause, source, statement);
      imports.push(importInfo);
    }
    
    // 匹配直接导入（无from关键字，通常用于样式文件）
    const directImportRegex = /import\s+['"]([^'"]+)['"];?/g;
    while ((match = directImportRegex.exec(script)) !== null) {
      const source = match[1];
      const statement = match[0];
      
      // 直接导入类型
      const importInfo = {
        type: 'direct',
        name: null, // 无导入名称
        source,
        statement
      };
      imports.push(importInfo);
    }

    return imports;
  }

  /**
   * 解析import子句，支持多种导入格式
   * @param {string} importClause - import子句部分
   * @param {string} source - 导入源
   * @param {string} statement - 完整的import语句
   * @returns {Object} 解析后的导入信息
   */
  parseImportClause(importClause, source, statement) {
    // 检查是否包含花括号（命名导入）
    if (importClause.includes('{')) {
      // 命名导入或混合导入
      const namedMatch = importClause.match(/\{\s*([^}]+)\s*\}/);
      const defaultMatch = importClause.match(/^([^,{]+)(?=,|\{|$)/);
      
      const namedImports = namedMatch ? 
        namedMatch[1].split(',').map(name => name.trim()) : [];
      const defaultImport = defaultMatch ? defaultMatch[1].trim() : null;
      
      return {
        type: 'named',
        defaultImport,
        namedImports,
        source,
        statement,
        // 保持兼容性
        name: defaultImport || namedImports[0] || 'unknown'
      };
    } else {
      // 默认导入
      return {
        type: 'default',
        name: importClause.trim(),
        source,
        statement
      };
    }
  }

  /**
   * 内联JavaScript文件中的函数
   * @param {Object} importInfo - import信息
   * @returns {Promise<Object>} 内联的函数定义
   */
  async inlineJavaScriptFile(importInfo) {
    try {
      // 解析JavaScript文件路径
      const jsFilePath = path.resolve(this.mainDir, importInfo.source);
      const jsContent = await fs.readFile(jsFilePath, 'utf-8');
      
      // 解析JavaScript文件，提取export的函数
      const exportedFunctions = this.parseJavaScriptExports(jsContent);
      
      // 根据import类型过滤需要的函数
      const requiredFunctions = this.filterRequiredFunctions(exportedFunctions, importInfo);
      
      return {
        importInfo,
        functions: requiredFunctions,
        source: importInfo.source
      };
    } catch (error) {
      console.error(`❌ 无法内联JavaScript文件 ${importInfo.source}:`, error.message);
      return null;
    }
  }

  /**
   * 内联样式文件（CSS/SCSS）支持@import嵌套导入
   * @param {Object} importInfo - import信息
   * @returns {Promise<Object>} 内联的样式内容
   */
  async inlineStyleFile(importInfo) {
    try {
      // 解析样式文件路径
      const styleFilePath = path.resolve(this.mainDir, importInfo.source);
      const styleContent = await fs.readFile(styleFilePath, 'utf-8');
      
      // 确定样式语言类型
      const lang = importInfo.source.endsWith('.scss') ? 'scss' : 'css';
      
      // 🆕 处理@import语句的嵌套导入
      const processedContent = await this.processStyleImports(styleContent, path.dirname(styleFilePath));
      
      return {
        content: processedContent,
        lang: lang,
        source: importInfo.source,
        scoped: false // 外部样式文件通常是全局的
      };
    } catch (error) {
      console.error(`❌ 无法内联样式文件 ${importInfo.source}:`, error.message);
      return null;
    }
  }

  /**
   * 递归处理样式文件中的@import语句
   * @param {string} styleContent - 样式文件内容
   * @param {string} currentDir - 当前样式文件所在目录
   * @param {Set} processedFiles - 已处理的文件集合（防止循环导入）
   * @returns {Promise<string>} 处理后的样式内容
   */
  async processStyleImports(styleContent, currentDir, processedFiles = new Set()) {
    try {
      // 解析@import语句
      const importStatements = this.parseImportStatements(styleContent);
      
      if (importStatements.length === 0) {
        return styleContent; // 没有@import语句，直接返回
      }
      
      console.log(`🔍 发现 ${importStatements.length} 个@import语句`);
      
      let processedContent = styleContent;
      
      // 处理每个@import语句
      for (const importStatement of importStatements) {
        const { statement, path: importPath } = importStatement;
        
        // 解析完整的文件路径
        const fullPath = path.resolve(currentDir, importPath);
        const normalizedPath = path.normalize(fullPath);
        
        // 检查循环导入
        if (processedFiles.has(normalizedPath)) {
          console.warn(`⚠️ 检测到循环导入，跳过: ${importPath}`);
          // 移除@import语句但不替换内容
          processedContent = processedContent.replace(statement, `/* 循环导入已跳过: ${importPath} */`);
          continue;
        }
        
        try {
          // 添加到已处理文件集合
          const newProcessedFiles = new Set(processedFiles);
          newProcessedFiles.add(normalizedPath);
          
          // 读取被导入的文件
          const importedContent = await fs.readFile(fullPath, 'utf-8');
          console.log(`📥 内联@import文件: ${importPath}`);
          
          // 递归处理被导入文件中的@import语句
          const recursivelyProcessedContent = await this.processStyleImports(
            importedContent, 
            path.dirname(fullPath), 
            newProcessedFiles
          );
          
          // 替换@import语句为实际内容
          const replacementContent = `/* 📦 来自 ${importPath} 的内联样式 */\n${recursivelyProcessedContent}\n/* 📦 结束来自 ${importPath} 的样式 */`;
          processedContent = processedContent.replace(statement, replacementContent);
          
          console.log(`✅ 成功内联@import: ${importPath}`);
          
        } catch (error) {
          console.error(`❌ 无法读取@import文件 ${importPath}:`, error.message);
          // 保留原始@import语句，添加错误注释
          processedContent = processedContent.replace(statement, `${statement} /* 导入失败: ${error.message} */`);
        }
      }
      
      return processedContent;
      
    } catch (error) {
      console.error(`❌ 处理@import语句时出错:`, error.message);
      return styleContent; // 出错时返回原始内容
    }
  }

  /**
   * 解析样式文件中的@import语句
   * @param {string} styleContent - 样式文件内容
   * @returns {Array} @import语句数组
   */
  parseImportStatements(styleContent) {
    const importStatements = [];
    
    // 匹配各种@import格式
    const importRegexes = [
      // @import './file.css';
      // @import "./file.scss";
      /@import\s+['"]([^'"]+)['"]\s*;/g,
      
      // @import url('./file.css');
      // @import url("./file.scss");
      /@import\s+url\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;/g
    ];
    
    for (const regex of importRegexes) {
      let match;
      while ((match = regex.exec(styleContent)) !== null) {
        const statement = match[0];
        const importPath = match[1];
        
        // 只处理相对路径导入（./、../）
        if (importPath.startsWith('./') || importPath.startsWith('../')) {
          importStatements.push({
            statement: statement,
            path: importPath
          });
        } else {
          console.log(`⏭️ 跳过非相对路径@import: ${importPath}`);
        }
      }
    }
    
    return importStatements;
  }

  /**
   * 提取export function声明（使用括号计数确保正确匹配）
   * @param {string} jsContent - JavaScript文件内容
   * @returns {Array} 函数匹配结果数组
   */
  extractExportFunctions(jsContent) {
    const functions = [];
    
    // 使用不同的方法：先找到export function，然后使用括号平衡算法找参数
    const exportFunctionStartRegex = /export\s+function\s+(\w+)\s*\(/g;
    let match;
    
    while ((match = exportFunctionStartRegex.exec(jsContent)) !== null) {
      const functionName = match[1];
      const startPos = match.index;
      const paramStartPos = match.index + match[0].length - 1; // 参数开始的位置（左括号）
      
      // 使用括号平衡算法找到参数结束位置
      let parenCount = 1;
      let paramEndPos = paramStartPos + 1;
      
      while (paramEndPos < jsContent.length && parenCount > 0) {
        if (jsContent[paramEndPos] === '(') parenCount++;
        else if (jsContent[paramEndPos] === ')') parenCount--;
        paramEndPos++;
      }
      
      if (parenCount !== 0) {
        console.error(`❌ 无法找到函数 ${functionName} 的参数结束位置`);
        continue;
      }
      
      // 找到函数体的开始位置（左大括号）
      let braceStartPos = paramEndPos;
      while (braceStartPos < jsContent.length && jsContent[braceStartPos] !== '{') {
        braceStartPos++;
      }
      
      if (braceStartPos >= jsContent.length) {
        console.error(`❌ 无法找到函数 ${functionName} 的函数体`);
        continue;
      }
      
      const openBracePos = braceStartPos;
      
      // 从开始大括号位置开始计数，找到匹配的结束大括号
      let braceCount = 1;
      let pos = openBracePos + 1;
      let inString = false;
      let inRegex = false;
      let stringChar = '';
      let prevChar = '';
      
      while (pos < jsContent.length && braceCount > 0) {
        const char = jsContent[pos];
        
        // 处理字符串
        if (!inRegex && (char === '"' || char === "'" || char === '`')) {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar && prevChar !== '\\') {
            inString = false;
          }
        }
        // 处理正则表达式
        else if (!inString && char === '/' && prevChar !== '\\') {
          // 检查是否是正则表达式的开始（简单判断）
          if (!inRegex && pos > 0) {
            const prevNonSpace = this.getPreviousNonSpaceChar(jsContent, pos - 1);
            if (prevNonSpace && '=([,;:!&|+'.includes(prevNonSpace)) {
              inRegex = true;
            }
          } else if (inRegex) {
            inRegex = false;
          }
        }
        // 处理大括号
        else if (!inString && !inRegex) {
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
          }
        }
        
        prevChar = char;
        pos++;
      }
      
      if (braceCount === 0) {
        const functionCode = jsContent.substring(startPos, pos);
        functions.push({
          name: functionName,
          code: functionCode
        });
      }
    }
    
    return functions;
  }

  /**
   * 获取指定位置之前的非空格字符
   * @param {string} content - 内容字符串
   * @param {number} pos - 起始位置
   * @returns {string|null} 非空格字符
   */
  getPreviousNonSpaceChar(content, pos) {
    while (pos >= 0 && /\s/.test(content[pos])) {
      pos--;
    }
    return pos >= 0 ? content[pos] : null;
  }

  /**
   * 解析JavaScript文件中的export语句
   * @param {string} jsContent - JavaScript文件内容
   * @returns {Object} 导出的函数定义
   */
  parseJavaScriptExports(jsContent) {
    const exports = {};
    
    // 匹配 export function 声明 - 使用更智能的括号匹配
    const functionMatches = this.extractExportFunctions(jsContent);
    for (const match of functionMatches) {
      const functionName = match.name;
      const functionCode = match.code.replace(/^export\s+/, ''); // 移除export关键字
      exports[functionName] = functionCode;
    }
    
    // 匹配 export const/let/var 声明
    const constExportRegex = /export\s+(const|let|var)\s+(\w+)\s*=\s*([^;]+;?)/g;
    let constMatch;
    while ((constMatch = constExportRegex.exec(jsContent)) !== null) {
      const varName = constMatch[2];
      const varDeclaration = `${constMatch[1]} ${constMatch[2]} = ${constMatch[3]}`;
      exports[varName] = varDeclaration;
    }
    
    // 匹配 export default 语句
    const defaultExportRegex = /export\s+default\s+(\{[\s\S]*?\}|\w+|[^;]+);?/;
    const defaultMatch = defaultExportRegex.exec(jsContent);
    if (defaultMatch) {
      const defaultContent = defaultMatch[1];
      
      // 如果是对象形式的默认导出，解析其属性
      if (defaultContent.trim().startsWith('{')) {
        const objMatch = defaultContent.match(/\{([\s\S]*)\}/);
        if (objMatch) {
          const objContent = objMatch[1];
          // 简单解析对象属性（方法引用）
          const propRegex = /(\w+)(?:\s*:\s*(\w+))?/g;
          let propMatch;
          while ((propMatch = propRegex.exec(objContent)) !== null) {
            const propName = propMatch[1];
            const propValue = propMatch[2] || propMatch[1];
            if (exports[propValue]) {
              exports[propName] = exports[propValue];
            }
          }
        }
      }
      
      exports['default'] = defaultContent;
    }
    
    return exports;
  }

  /**
   * 根据import类型过滤需要的函数
   * @param {Object} exportedFunctions - 文件中导出的所有函数
   * @param {Object} importInfo - import信息
   * @returns {Object} 过滤后的函数
   */
  filterRequiredFunctions(exportedFunctions, importInfo) {
    const required = {};
    
    if (importInfo.type === 'named') {
      // 命名导入：只导入指定的函数
      for (const funcName of importInfo.namedImports) {
        if (exportedFunctions[funcName]) {
          required[funcName] = exportedFunctions[funcName];
        }
      }
      
      // 处理默认导入（如果存在）
      if (importInfo.defaultImport && exportedFunctions['default']) {
        required[importInfo.defaultImport] = exportedFunctions['default'];
      }
    } else if (importInfo.type === 'default') {
      // 默认导入：导入default export
      if (exportedFunctions['default']) {
        required[importInfo.name] = exportedFunctions['default'];
      }
    }
    
    return required;
  }

  /**
   * 内联单个组件（支持递归嵌套）
   * @param {Object} importInfo - import信息
   * @returns {Promise<Object>} 内联的组件定义
   */
  async inlineComponent(importInfo) {
    try {
      // 解析组件路径
      const componentPath = path.resolve(this.mainDir, importInfo.source);
      const componentContent = await fs.readFile(componentPath, 'utf-8');
      
      // 解析子组件
      const parser = new VueParser(componentContent);
      const parsed = parser.parse();

      // 🔄 递归处理：分析当前组件的导入，递归内联其子组件和工具函数
      const childImports = this.analyzeImports(parsed.script);
      const childComponents = [];
      
      for (const childImp of childImports) {
        if (childImp.source.endsWith('.vue')) {
          // 递归内联子组件的子组件
          const childComponentDir = path.dirname(componentPath);
          const childInliner = new ComponentInliner(componentPath);
          // 设置正确的目录
          childInliner.mainDir = childComponentDir;
          
          const childComponentContent = await childInliner.inlineComponent(childImp);
          if (childComponentContent) {
            childComponents.push(childComponentContent);
            // 将递归的子组件也添加到当前的内联组件列表中
            this.inlinedComponents.push(childComponentContent);
            this.componentStyles.push({
              name: childComponentContent.name,
              styles: childComponentContent.styles
            });
          }
        } else if (childImp.source.endsWith('.js')) {
          // 🔧 递归处理子组件中的JavaScript工具函数
          const jsFilePath = path.resolve(path.dirname(componentPath), childImp.source);
          const jsContent = await fs.readFile(jsFilePath, 'utf-8');
          const exportedFunctions = this.parseJavaScriptExports(jsContent);
          const requiredFunctions = this.filterRequiredFunctions(exportedFunctions, childImp);
          
          if (Object.keys(requiredFunctions).length > 0) {
            // 将子组件中的函数也添加到主组件的内联函数列表中
            if (!this.inlinedFunctions) {
              this.inlinedFunctions = [];
            }
            this.inlinedFunctions.push({
              importInfo: childImp,
              functions: requiredFunctions,
              source: childImp.source
            });
            
            console.log(`🔧 递归内联JS文件: ${childImp.source}`);
          }
        } else if (childImp.source.endsWith('.css') || childImp.source.endsWith('.scss')) {
          // 🎨 递归处理子组件中的样式文件（支持@import嵌套导入）
          console.log(`🎨 递归处理样式文件: ${childImp.source}`);
          const styleFilePath = path.resolve(path.dirname(componentPath), childImp.source);
          const styleContent = await fs.readFile(styleFilePath, 'utf-8');
          const lang = childImp.source.endsWith('.scss') ? 'scss' : 'css';
          
          // 🆕 处理@import语句的嵌套导入
          const processedContent = await this.processStyleImports(styleContent, path.dirname(styleFilePath));
          
          // 将子组件中的样式也添加到主组件的内联样式列表中
          if (!this.inlinedStyles) {
            this.inlinedStyles = [];
          }
          this.inlinedStyles.push({
            content: processedContent,
            lang: lang,
            source: childImp.source,
            scoped: false
          });
          
          console.log(`✅ 成功递归内联样式文件: ${childImp.source}`);
        }
      }

      // 更新当前组件的script（移除子组件的import，添加内联定义）
      let updatedComponentConfig = this.updateComponentScript(parsed.script, childImports, childComponents);

      // 为组件生成唯一的类名前缀
      const classPrefix = `${importInfo.name.toLowerCase()}-component`;
      
      // 包装模板，添加唯一的类名（同级方式）
      const wrappedTemplate = this.wrapTemplate(parsed.template, classPrefix);
      
      // 生成内联组件定义
      const inlineDefinition = this.generateInlineComponent(
        importInfo.name,
        wrappedTemplate,
        updatedComponentConfig,
        parsed.styles
      );

      // 分析根元素的类名
      const rootClassName = this.extractRootClassName(parsed.template);

      return {
        name: importInfo.name,
        definition: inlineDefinition,
        styles: parsed.styles,
        classPrefix: classPrefix,
        rootClassName: rootClassName
      };
    } catch (error) {
      console.error(`无法内联组件 ${importInfo.name}:`, error.message);
      return null;
    }
  }

  /**
   * 提取模板根元素的类名
   * @param {string} template - 模板内容
   * @returns {string|null} 根元素的类名
   */
  extractRootClassName(template) {
    const trimmedTemplate = template.trim();
    const firstTagMatch = trimmedTemplate.match(/^<\w+[^>]*class=["']([^"']+)["'][^>]*>/);
    if (firstTagMatch) {
      const classes = firstTagMatch[1].split(/\s+/);
      return classes[0]; // 返回第一个类名
    }
    return null;
  }

  /**
   * 包装模板，添加唯一的类名（同级方式）
   * @param {string} template - 原始模板
   * @param {string} classPrefix - 类名前缀
   * @returns {string} 包装后的模板
   */
  wrapTemplate(template, classPrefix) {
    // 方案二：同级类名方式，避免额外的DOM层级
    // HTML: <div class="original-class prefix-class">
    const trimmedTemplate = template.trim();
    
    // 查找第一个标签
    const firstTagMatch = trimmedTemplate.match(/^<(\w+)([^>]*?)>/);
    if (firstTagMatch) {
      const tag = firstTagMatch[1];
      const attrs = firstTagMatch[2];
      
      // 检查是否已有class属性
      if (attrs.includes('class=')) {
        // 在现有class中添加新类名
        return trimmedTemplate.replace(
          /class=["']([^"']+)["']/,
          `class="$1 ${classPrefix}"`
        );
      } else {
        // 添加新的class属性
        return trimmedTemplate.replace(
          /^<(\w+)([^>]*?)>/,
          `<$1$2 class="${classPrefix}">`
        );
      }
    }
    
    return trimmedTemplate;
  }

  /**
   * 从script中提取组件配置
   * @param {string} script - script内容
   * @returns {string} 组件配置字符串
   */
  extractComponentConfig(script) {
    // 移除export default
    const configMatch = script.match(/export\s+default\s+({[\s\S]*})/);
    if (configMatch) {
      const config = configMatch[1];
      // 提取组件选项（移除外层大括号）
      const innerMatch = config.match(/{\s*([\s\S]*)\s*}/);
      return innerMatch ? innerMatch[1] : '';
    }
    return '';
  }

  /**
   * 生成内联组件定义
   * @param {string} name - 组件名称
   * @param {string} template - 模板内容
   * @param {string} config - 组件配置
   * @param {Array} styles - 样式数组
   * @returns {string} 内联组件定义
   */
  generateInlineComponent(name, template, config, styles) {
    // 转义模板中的特殊字符
    const escapedTemplate = template
      .replace(/\\/g, '\\\\')
      .replace(/`/g, '\\`')
      .replace(/\$/g, '\\$');

    // 确保config格式正确（去掉可能的换行和多余空格）
    const cleanConfig = config.trim();

    return `const ${name} = {
  template: \`${escapedTemplate}\`,
  ${cleanConfig}
}`;
  }

  /**
   * 更新组件的script（用于子组件递归处理）
   * @param {string} script - 原始script内容
   * @param {Array} imports - import信息数组
   * @param {Array} childComponents - 子组件数组
   * @returns {string} 更新后的组件配置
   */
  updateComponentScript(script, imports, childComponents) {
    let updatedScript = script;

    // 移除.vue组件、.js文件和样式文件的import语句
    for (const imp of imports) {
      if (imp.source.endsWith('.vue') || imp.source.endsWith('.js') || 
          imp.source.endsWith('.css') || imp.source.endsWith('.scss')) {
        updatedScript = updatedScript.replace(imp.statement, '');
      }
    }

    // 提取组件配置（移除export default）
    const componentConfig = this.extractComponentConfig(updatedScript);
    
    // ⚠️ 注意：对于递归嵌套，我们不在这里添加子组件定义
    // 子组件定义应该在顶层统一管理，避免重复定义
    // JavaScript函数也会在顶层统一内联
    // 这里只返回当前组件的配置
    return componentConfig;
  }

  /**
   * 更新主组件的script
   * @param {string} script - 原始script内容
   * @param {Array} imports - import信息数组
   * @returns {string} 更新后的script
   */
  updateMainScript(script, imports) {
    let updatedScript = script;

    // 移除.vue组件、.js文件和样式文件的import语句
    for (const imp of imports) {
      if (imp.source.endsWith('.vue') || imp.source.endsWith('.js') || 
          imp.source.endsWith('.css') || imp.source.endsWith('.scss')) {
        updatedScript = updatedScript.replace(imp.statement, '');
      }
    }

    // 准备内联内容
    const inlineDefinitions = [];
    
    // 添加内联的工具函数
    if (this.inlinedFunctions && this.inlinedFunctions.length > 0) {
      for (const funcInfo of this.inlinedFunctions) {
        const functionDefinitions = Object.values(funcInfo.functions);
        if (functionDefinitions.length > 0) {
          inlineDefinitions.push(
            `// 📦 来自 ${funcInfo.source} 的内联函数`,
            ...functionDefinitions,
            '' // 空行分隔
          );
        }
      }
    }
    
    // 添加内联的组件定义
    if (this.inlinedComponents && this.inlinedComponents.length > 0) {
    const componentDefinitions = this.inlinedComponents
        .map(comp => comp.definition);
      inlineDefinitions.push(
        '// 📦 内联的Vue组件',
        ...componentDefinitions
      );
    }

    // 在export default前插入所有内联定义
    if (inlineDefinitions.length > 0) {
      const allDefinitions = inlineDefinitions.join('\n');
    updatedScript = updatedScript.replace(
      /export\s+default/,
        `${allDefinitions}\n\nexport default`
    );
    }

    return updatedScript;
  }

  /**
   * 合并样式，处理scoped样式
   * @param {Array} mainStyles - 主组件样式
   * @returns {Array} 合并后的样式
   */
  mergeStyles(mainStyles) {
    const allStyles = [...mainStyles];

    // 处理每个组件的样式
    for (const compStyle of this.componentStyles) {
      const { name, styles, classPrefix, rootClassName } = this.inlinedComponents.find(c => c.name === compStyle.name);
      
      for (const style of styles) {
        // 如果是scoped样式，需要处理选择器
        if (style.scoped) {
          // 根据样式语言决定处理方式
          if (style.lang === 'scss') {
            // SCSS嵌套处理
            const processedContent = this.processScopedStyleScss(style.content, classPrefix, rootClassName);
            allStyles.push({
              content: processedContent,
              scoped: false, // 转换后不再需要scoped
              lang: style.lang
            });
          } else {
            // CSS平铺处理
            const processedContent = this.processScopedStyle(style.content, classPrefix, rootClassName);
            allStyles.push({
              content: processedContent,
              scoped: false, // 转换后不再需要scoped
              lang: style.lang
            });
          }
        } else {
          // 非scoped样式直接添加
          allStyles.push(style);
        }
      }
    }

    // 🎨 添加内联的样式文件
    if (this.inlinedStyles && this.inlinedStyles.length > 0) {
      for (const styleFile of this.inlinedStyles) {
        allStyles.push({
          content: `/* 📦 来自 ${styleFile.source} 的内联样式 */\n${styleFile.content}`,
          scoped: false,
          lang: styleFile.lang
        });
      }
    }

    return allStyles;
  }

  /**
   * 处理SCSS嵌套样式（同级类名版本）
   * @param {string} styleContent - 样式内容
   * @param {string} classPrefix - 类名前缀
   * @param {string} rootClassName - 组件根元素的类名
   * @returns {string} 处理后的SCSS样式
   */
  processScopedStyleScss(styleContent, classPrefix, rootClassName) {
    // 智能处理策略：
    // 1. 根元素类名 (.counter) → 交集选择器 (.counter.prefix)
    // 2. 其他独立类名 (.count) → 后代选择器 (.counter.prefix .count)
    
    const trimmedContent = styleContent.trim();
    if (!trimmedContent) {
      return '';
    }
    
    // 找到所有根级选择器
    const rootSelectors = this.findRootSelectors(trimmedContent);
    let processedContent = trimmedContent;
    
    // 处理每个根级选择器
    for (const rootSelector of rootSelectors) {
      const className = rootSelector.substring(1); // 移除点号
      
      if (className === rootClassName) {
        // 这是组件根元素，使用交集选择器
        const intersectionSelector = `.${className}.${classPrefix}`;
        const rootPattern = new RegExp(`^(\\s*)\\${rootSelector}\\s*\\{`, 'gm');
        processedContent = processedContent.replace(rootPattern, `$1${intersectionSelector} {`);
      } else {
        // 这是其他元素，使用后代选择器
        const descendantSelector = `.${rootClassName}.${classPrefix} ${rootSelector}`;
        const rootPattern = new RegExp(`^(\\s*)\\${rootSelector}\\s*\\{`, 'gm');
        processedContent = processedContent.replace(rootPattern, `$1${descendantSelector} {`);
      }
    }
    
    return processedContent;
  }

  /**
   * 找到所有根级选择器
   * @param {string} content - SCSS内容
   * @returns {Array} 根级选择器数组
   */
  findRootSelectors(content) {
    const selectors = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 匹配行首的类选择器
      const match = trimmedLine.match(/^(\.[a-zA-Z][\w-]*)\s*\{/);
      if (match) {
        const selector = match[1];
        if (!selectors.includes(selector)) {
          selectors.push(selector);
        }
      }
    }
    
    return selectors;
  }

  /**
   * 处理同级类名的选择器
   * @param {string} selector - 原始选择器
   * @param {string} classPrefix - 类名前缀
   * @returns {string} 处理后的选择器
   */
  processSelectorForSameLevel(selector, classPrefix) {
    // 处理多个选择器（逗号分隔）
    return selector.split(',').map(sel => {
      const trimmedSel = sel.trim();
      
      // 如果是类选择器，转换为交集选择器
      if (trimmedSel.startsWith('.')) {
        const className = trimmedSel.substring(1);
        // .hello -> .hello.helloworld-component
        return `.${className}.${classPrefix}`;
      } else if (trimmedSel.match(/^[a-zA-Z]/)) {
        // 元素选择器，添加类名限制
        // div -> div.helloworld-component
        return `${trimmedSel}.${classPrefix}`;
      } else {
        // 其他选择器，保持原样
        return trimmedSel;
      }
    }).join(', ');
  }

  /**
   * 处理scoped样式，添加组件类名前缀
   * @param {string} styleContent - 样式内容
   * @param {string} classPrefix - 类名前缀
   * @param {string} rootClassName - 根元素类名
   * @returns {string} 处理后的样式
   */
  processScopedStyle(styleContent, classPrefix, rootClassName) {
    // 将样式内容按规则分割（简单实现）
    const rules = styleContent.split('}').filter(rule => rule.trim());
    const processedRules = [];
    
    for (const rule of rules) {
      const trimmedRule = rule.trim();
      if (!trimmedRule) continue;
      
      // 分离选择器和样式声明
      const selectorEndIndex = trimmedRule.lastIndexOf('{');
      if (selectorEndIndex === -1) continue;
      
      const selector = trimmedRule.substring(0, selectorEndIndex).trim();
      const declarations = trimmedRule.substring(selectorEndIndex);
      
      // 跳过 @规则
      if (selector.startsWith('@')) {
        processedRules.push(rule + '}');
        continue;
      }
      
      // 处理选择器
      const processedSelectors = selector.split(',').map(sel => {
        const trimmedSel = sel.trim();
        
        // 如果选择器已经包含类名前缀，不处理
        if (trimmedSel.includes(classPrefix)) {
          return trimmedSel;
        }
        
        // 分析选择器结构
        // 例如：.hello -> .helloworld-component.hello （合并类选择器）
        // 例如：.hello h2 -> .helloworld-component.hello h2 （保持后代关系）
        
        if (trimmedSel.startsWith('.')) {
          // 获取第一个类名
           const firstClassMatch = trimmedSel.match(/^\.[\w-]+/);
           if (firstClassMatch) {
             const firstClass = firstClassMatch[0]; // 例如 '.hello'
             const restOfSelector = trimmedSel.substring(firstClass.length);
             
             if (restOfSelector) {
               // 有后续选择器，判断是伪类还是后代选择器
               if (restOfSelector.startsWith(':')) {
                 // 伪类选择器，例如：.simple-btn:hover -> .simplebutton-component.simple-btn:hover
                 const className = firstClass.substring(1); // 移除点号，得到类名
                 if (className === rootClassName) {
                   // 是根元素类名，合并类选择器 + 伪类
                   return `.${classPrefix}${firstClass}${restOfSelector}`;
                 } else {
                   // 不是根元素类名，使用后代选择器 + 伪类
                   return `.${classPrefix} ${firstClass}${restOfSelector}`;
                 }
               } else {
                 // 后代选择器，例如：.counter button -> .counter-component.counter button
                 return `.${classPrefix}${firstClass} ${restOfSelector.trim()}`;
               }
             } else {
                // 只是单个类选择器，需要判断是否是根元素的类名
                 const className = firstClass.substring(1); // 移除点号，得到类名
                 
                 if (className === rootClassName) {
                   // 是根元素类名，合并类选择器
                   // 例如：.hello -> .helloworld-component.hello
                   return `.${classPrefix}${firstClass}`;
                 } else {
                   // 不是根元素类名，使用后代选择器
                   // 例如：.count -> .counter-component .count
                   return `.${classPrefix} ${firstClass}`;
                 }
             }
           }
        } else if (trimmedSel.match(/^[a-zA-Z]/)) {
          // 元素选择器，添加类名前缀作为父选择器
          // 例如：div -> .helloworld-component div
          return `.${classPrefix} ${trimmedSel}`;
        } else if (trimmedSel.startsWith('#')) {
          // ID选择器，添加类名前缀作为父选择器
          // 例如：#myid -> .helloworld-component #myid
          return `.${classPrefix} ${trimmedSel}`;
        } else {
          // 其他选择器（属性选择器、伪类等），添加类名前缀
          return `.${classPrefix} ${trimmedSel}`;
        }
      }).join(', ');
      
      processedRules.push(`${processedSelectors} ${declarations}}`);
    }
    
    return processedRules.join('\n\n');
  }
}

module.exports = ComponentInliner; 