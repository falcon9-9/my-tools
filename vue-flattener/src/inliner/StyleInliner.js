/**
 * 样式内联器
 * 负责将CSS样式文件内联到主组件中并处理作用域
 */

const fs = require('fs-extra');
const path = require('path');
const postcss = require('postcss');

class StyleInliner {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * 内联样式依赖
   * @param {Object} component - 组件对象
   * @param {Array} styleDependencies - 样式依赖列表
   * @returns {Object} 内联后的组件
   */
  async inline(component, styleDependencies) {
    console.log(`🎨 开始内联 ${styleDependencies.length} 个样式文件...`);
    
    if (styleDependencies.length === 0) {
      return component;
    }

    const inlinedComponent = {
      ...component,
      inlinedStyles: {}
    };

    // 处理每个样式依赖
    for (const dependency of styleDependencies) {
      try {
        await this.inlineStyle(inlinedComponent, dependency);
      } catch (error) {
        console.warn(`⚠️  内联样式失败 ${dependency.path}: ${error.message}`);
        // 继续处理其他样式，不中断整个流程
      }
    }

    // 更新组件的styles数组
    this.updateComponentStyles(inlinedComponent);

    return inlinedComponent;
  }

  /**
   * 内联单个样式文件
   * @param {Object} component - 组件对象
   * @param {Object} dependency - 样式依赖
   */
  async inlineStyle(component, dependency) {
    // 检查文件是否存在
    if (!await fs.pathExists(dependency.path)) {
      throw new Error(`样式文件不存在: ${dependency.path}`);
    }

    console.log(`  🎨 内联样式: ${dependency.path}`);

    // 读取样式文件内容
    const styleContent = await fs.readFile(dependency.path, 'utf8');
    
    // 确定样式文件类型
    const fileExt = path.extname(dependency.path).toLowerCase();
    const lang = this.determineLang(fileExt);
    
    // 处理样式内容
    const processedStyle = await this.processStyleContent(styleContent, dependency, lang);
    
    // 生成唯一的命名空间
    const namespace = this.generateStyleNamespace(dependency.path);
    
    // 应用作用域处理
    const scopedStyle = this.options.scopeStyles ? 
      await this.applyScopeToStyle(processedStyle, namespace) : processedStyle;
    
    // 存储内联后的样式信息
    component.inlinedStyles[dependency.path] = {
      path: dependency.path,
      namespace,
      content: scopedStyle,
      lang,
      original: styleContent,
      importStatement: dependency.importStatement
    };
  }

  /**
   * 确定样式文件语言类型
   * @param {string} fileExt - 文件扩展名
   * @returns {string} 语言类型
   */
  determineLang(fileExt) {
    const langMap = {
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.styl': 'stylus',
      '.stylus': 'stylus'
    };
    
    return langMap[fileExt] || 'css';
  }

  /**
   * 处理样式内容
   * @param {string} styleContent - 原始样式内容
   * @param {Object} dependency - 样式依赖
   * @param {string} lang - 样式语言
   * @returns {string} 处理后的样式内容
   */
  async processStyleContent(styleContent, dependency, lang) {
    let processedContent = styleContent;

    try {
      // 使用PostCSS处理CSS
      const result = await postcss([
        // 处理@import语句
        this.createImportProcessor(dependency.path),
        // 处理相对路径的资源引用
        this.createUrlProcessor(dependency.path)
      ]).process(processedContent, {
        from: dependency.path,
        to: undefined
      });

      processedContent = result.css;
    } catch (error) {
      console.warn(`PostCSS处理失败，使用原始内容: ${error.message}`);
      // 如果PostCSS处理失败，使用简单的字符串处理
      processedContent = this.fallbackStyleProcessing(styleContent, dependency);
    }

    return processedContent;
  }

  /**
   * 创建@import处理器
   * @param {string} basePath - 基础路径
   * @returns {Function} PostCSS插件函数
   */
  createImportProcessor(basePath) {
    const baseDir = path.dirname(basePath);
    
    return {
      postcssPlugin: 'import-inliner',
      Once(root) {
        root.walkAtRules('import', async (rule) => {
          try {
            // 提取导入路径
            const importPath = rule.params.replace(/['"]([^'"]+)['"].*/, '$1');
            const resolvedPath = path.resolve(baseDir, importPath);
            
            if (await fs.pathExists(resolvedPath)) {
              // 读取被导入的文件内容
              const importedContent = await fs.readFile(resolvedPath, 'utf8');
              
              // 递归处理导入的样式
              const processedImported = await this.processStyleContent(
                importedContent, 
                { path: resolvedPath }, 
                this.determineLang(path.extname(resolvedPath))
              );
              
              // 替换@import规则为实际内容
              rule.replaceWith(postcss.parse(processedImported));
            } else {
              console.warn(`导入的样式文件不存在: ${resolvedPath}`);
              rule.remove();
            }
          } catch (error) {
            console.warn(`处理@import失败: ${error.message}`);
            rule.remove();
          }
        });
      }
    };
  }

  /**
   * 创建URL处理器
   * @param {string} basePath - 基础路径
   * @returns {Function} PostCSS插件函数
   */
  createUrlProcessor(basePath) {
    const baseDir = path.dirname(basePath);
    
    return {
      postcssPlugin: 'url-processor',
      Declaration(decl) {
        // 处理url()函数中的相对路径
        if (decl.value.includes('url(')) {
          decl.value = decl.value.replace(/url\(['"]?([^'"]+)['"]?\)/g, (match, url) => {
            // 跳过绝对路径和数据URL
            if (url.startsWith('/') || url.startsWith('http') || url.startsWith('data:')) {
              return match;
            }
            
            // 转换相对路径为绝对路径（这里简化处理）
            const resolvedPath = path.resolve(baseDir, url);
            return `url('${resolvedPath}')`;
          });
        }
      }
    };
  }

  /**
   * 备用样式处理方法
   * @param {string} styleContent - 样式内容
   * @param {Object} dependency - 依赖信息
   * @returns {string} 处理后的样式
   */
  fallbackStyleProcessing(styleContent, dependency) {
    let processedContent = styleContent;
    const baseDir = path.dirname(dependency.path);

    // 简单处理@import语句
    processedContent = processedContent.replace(/@import\s+['"]([^'"]+)['"];?/g, (match, importPath) => {
      try {
        const resolvedPath = path.resolve(baseDir, importPath);
        if (fs.existsSync(resolvedPath)) {
          const importedContent = fs.readFileSync(resolvedPath, 'utf8');
          return `/* 内联样式来自: ${importPath} */\n${importedContent}\n`;
        }
      } catch (error) {
        console.warn(`处理@import失败: ${error.message}`);
      }
      return `/* 无法内联: ${importPath} */`;
    });

    return processedContent;
  }

  /**
   * 生成样式命名空间
   * @param {string} stylePath - 样式文件路径
   * @returns {string} 命名空间
   */
  generateStyleNamespace(stylePath) {
    const filename = path.basename(stylePath, path.extname(stylePath));
    const prefix = this.options.namespacePrefix || 'inline_';
    return `${prefix}style_${filename}_${Date.now()}`;
  }

  /**
   * 为样式应用作用域
   * @param {string} styleContent - 样式内容
   * @param {string} namespace - 命名空间
   * @returns {string} 作用域后的样式
   */
  async applyScopeToStyle(styleContent, namespace) {
    try {
      // 使用PostCSS添加作用域
      const result = await postcss([
        this.createScopeProcessor(namespace)
      ]).process(styleContent, { from: undefined });

      return result.css;
    } catch (error) {
      console.warn(`样式作用域处理失败: ${error.message}`);
      // 备用方法
      return this.fallbackScopeProcessing(styleContent, namespace);
    }
  }

  /**
   * 创建作用域处理器
   * @param {string} namespace - 命名空间
   * @returns {Function} PostCSS插件函数
   */
  createScopeProcessor(namespace) {
    return {
      postcssPlugin: 'scope-processor',
      Rule(rule) {
        // 跳过@规则
        if (rule.parent && rule.parent.type === 'atrule') {
          return;
        }

        // 为每个选择器添加命名空间
        const scopedSelectors = rule.selectors.map(selector => {
          // 跳过伪元素和伪类选择器的特殊处理
          if (selector.includes('::') || selector.includes(':global')) {
            return selector;
          }
          
          // 添加命名空间前缀
          return `.${namespace} ${selector}`;
        });

        rule.selector = scopedSelectors.join(', ');
      }
    };
  }

  /**
   * 备用作用域处理方法
   * @param {string} styleContent - 样式内容
   * @param {string} namespace - 命名空间
   * @returns {string} 作用域后的样式
   */
  fallbackScopeProcessing(styleContent, namespace) {
    // 简单的正则表达式处理
    return styleContent.replace(/([^@{}\s][^{}]*)\s*{/g, (match, selector) => {
      // 跳过@规则
      if (selector.trim().startsWith('@')) {
        return match;
      }
      
      // 为每个选择器添加命名空间前缀
      const scopedSelector = selector
        .split(',')
        .map(sel => `.${namespace} ${sel.trim()}`)
        .join(', ');
      
      return `${scopedSelector} {`;
    });
  }

  /**
   * 更新组件的样式数组
   * @param {Object} component - 组件对象
   */
  updateComponentStyles(component) {
    // 将内联的样式添加到组件的styles数组中
    const inlinedStylesArray = Object.values(component.inlinedStyles).map(inlinedStyle => ({
      content: inlinedStyle.content,
      lang: inlinedStyle.lang,
      attrs: {
        'data-inline-from': inlinedStyle.path
      },
      scoped: false, // 已经通过命名空间处理了作用域
      inlined: true,
      namespace: inlinedStyle.namespace
    }));

    // 添加到现有样式中
    component.styles = component.styles || [];
    component.styles.push(...inlinedStylesArray);

    // 移除原始样式中的@import语句
    component.styles = component.styles.map(style => {
      if (!style.inlined && style.content) {
        // 移除@import语句，因为已经内联了
        const processedContent = style.content.replace(/@import\s+['"][^'"]+['"];?/g, '');
        return {
          ...style,
          content: processedContent
        };
      }
      return style;
    });
  }
}

// 注册PostCSS插件
StyleInliner.prototype.createImportProcessor.postcss = true;
StyleInliner.prototype.createUrlProcessor.postcss = true;
StyleInliner.prototype.createScopeProcessor.postcss = true;

module.exports = StyleInliner; 