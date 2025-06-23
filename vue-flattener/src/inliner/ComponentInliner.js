/**
 * 组件内联器
 * 负责将子组件内联到主组件中
 */

const fs = require('fs-extra');
const path = require('path');
const VueParser = require('../parser/VueParser');

class ComponentInliner {
  constructor(options = {}) {
    this.options = options;
    this.vueParser = new VueParser(options);
    this.inlinedComponents = new Map(); // 缓存已内联的组件，避免重复处理
  }

  /**
   * 内联组件依赖
   * @param {Object} mainComponent - 主组件
   * @param {Array} componentDependencies - 组件依赖列表
   * @returns {Object} 内联后的组件
   */
  async inline(mainComponent, componentDependencies) {
    console.log(`🔗 开始内联 ${componentDependencies.length} 个子组件...`);
    
    const inlinedComponent = {
      ...mainComponent,
      inlinedComponents: {}
    };

    // 处理每个组件依赖
    for (const dependency of componentDependencies) {
      try {
        await this.inlineComponent(inlinedComponent, dependency);
      } catch (error) {
        console.warn(`⚠️  内联组件失败 ${dependency.name}: ${error.message}`);
        // 继续处理其他组件，不中断整个流程
      }
    }

    // 更新主组件的script，移除import语句并更新components注册
    if (inlinedComponent.script) {
      inlinedComponent.script.content = this.updateScriptContent(
        inlinedComponent.script.content,
        componentDependencies,
        inlinedComponent.inlinedComponents
      );
    }

    return inlinedComponent;
  }

  /**
   * 内联单个组件
   * @param {Object} mainComponent - 主组件
   * @param {Object} dependency - 组件依赖
   */
  async inlineComponent(mainComponent, dependency) {
    // 检查文件是否存在
    if (!await fs.pathExists(dependency.path)) {
      throw new Error(`组件文件不存在: ${dependency.path}`);
    }

    console.log(`  🔗 内联组件: ${dependency.name} (${dependency.path})`);

    // 解析子组件
    const subComponent = await this.vueParser.parse(dependency.path);
    
    // 为子组件生成唯一的命名空间
    const namespace = this.generateNamespace(dependency.name);
    
    // 处理子组件的template
    const inlinedTemplate = this.processTemplate(subComponent.template, namespace);
    
    // 处理子组件的styles
    const inlinedStyles = this.processStyles(subComponent.styles, namespace);
    
    // 存储内联后的组件信息
    mainComponent.inlinedComponents[dependency.name] = {
      original: subComponent,
      namespace,
      template: inlinedTemplate,
      styles: inlinedStyles,
      script: subComponent.script
    };

    // 将内联的样式添加到主组件
    if (inlinedStyles && inlinedStyles.length > 0) {
      mainComponent.styles = mainComponent.styles || [];
      mainComponent.styles.push(...inlinedStyles);
    }
  }

  /**
   * 生成组件命名空间
   * @param {string} componentName - 组件名
   * @returns {string} 命名空间
   */
  generateNamespace(componentName) {
    const prefix = this.options.namespacePrefix || 'inline_';
    return `${prefix}${componentName}_${Date.now()}`;
  }

  /**
   * 处理子组件模板
   * @param {Object} template - 模板对象
   * @param {string} namespace - 命名空间
   * @returns {Object} 处理后的模板
   */
  processTemplate(template, namespace) {
    if (!template || !template.content) {
      return null;
    }

    // 为模板内容添加命名空间class
    let content = template.content;
    
    // 简单的处理：在根元素上添加命名空间class
    // 这里可以使用更复杂的HTML解析器来精确处理
    content = content.replace(/^(\s*<[^>]+)(\s*>)/, `$1 class="${namespace}"$2`);
    
    return {
      ...template,
      content,
      namespace
    };
  }

  /**
   * 处理子组件样式
   * @param {Array} styles - 样式数组
   * @param {string} namespace - 命名空间
   * @returns {Array} 处理后的样式
   */
  processStyles(styles, namespace) {
    if (!styles || styles.length === 0) {
      return [];
    }

    return styles.map(style => {
      let content = style.content;
      
      // 如果启用了样式作用域
      if (this.options.scopeStyles) {
        // 为所有CSS选择器添加命名空间前缀
        content = this.addStyleScope(content, namespace);
      }

      return {
        ...style,
        content,
        namespace,
        // 标记为内联样式
        inlined: true
      };
    });
  }

  /**
   * 为CSS添加作用域
   * @param {string} cssContent - CSS内容
   * @param {string} namespace - 命名空间
   * @returns {string} 添加作用域后的CSS
   */
  addStyleScope(cssContent, namespace) {
    // 简单的CSS选择器作用域处理
    // 这里可以使用PostCSS等工具来更精确地处理
    
    return cssContent.replace(/([^@{}\s][^{}]*)\s*{/g, (match, selector) => {
      // 跳过@规则（如@media, @keyframes等）
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
   * 更新主组件的script内容
   * @param {string} scriptContent - 原始script内容
   * @param {Array} dependencies - 组件依赖
   * @param {Object} inlinedComponents - 已内联的组件
   * @returns {string} 更新后的script内容
   */
  updateScriptContent(scriptContent, dependencies, inlinedComponents) {
    let updatedContent = scriptContent;

    // 移除import语句
    for (const dep of dependencies) {
      const importRegex = new RegExp(`import\\s+${dep.name}\\s+from\\s+['"][^'"]*${path.basename(dep.path)}['"]\\s*;?`, 'g');
      updatedContent = updatedContent.replace(importRegex, '');
    }

    // 添加内联组件的注册信息注释
    const componentNames = Object.keys(inlinedComponents);
    if (componentNames.length > 0) {
      const comment = `\n// 内联的组件: ${componentNames.join(', ')}\n// 原始组件已内联到template和style中\n`;
      
      // 在export default之前添加注释
      updatedContent = updatedContent.replace(/export\s+default/, `${comment}export default`);
    }

    return updatedContent;
  }
}

module.exports = ComponentInliner; 