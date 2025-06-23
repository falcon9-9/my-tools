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
  }

  /**
   * 执行内联
   * @returns {Promise<Object>} 内联后的组件内容
   */
  async inline() {
    // 读取主组件
    const mainContent = await fs.readFile(this.mainPath, 'utf-8');
    const parser = new VueParser(mainContent);
    const parsed = parser.parse();

    // 分析导入的组件
    const imports = this.analyzeImports(parsed.script);
    
    // 内联每个子组件
    for (const imp of imports) {
      if (imp.source.endsWith('.vue')) {
        const componentContent = await this.inlineComponent(imp);
        if (componentContent) {
          this.inlinedComponents.push(componentContent);
        }
      }
    }

    // 更新主组件的script
    const updatedScript = this.updateMainScript(parsed.script, imports);

    return {
      template: parsed.template,
      script: updatedScript,
      styles: parsed.styles
    };
  }

  /**
   * 分析script中的import语句
   * @param {string} script - script内容
   * @returns {Array} import信息数组
   */
  analyzeImports(script) {
    const imports = [];
    const importRegex = /import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = importRegex.exec(script)) !== null) {
      imports.push({
        name: match[1],
        source: match[2],
        statement: match[0]
      });
    }

    return imports;
  }

  /**
   * 内联单个组件
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

      // 提取组件配置
      const componentConfig = this.extractComponentConfig(parsed.script);
      
      // 生成内联组件定义
      const inlineDefinition = this.generateInlineComponent(
        importInfo.name,
        parsed.template,
        componentConfig,
        parsed.styles
      );

      return {
        name: importInfo.name,
        definition: inlineDefinition,
        styles: parsed.styles
      };
    } catch (error) {
      console.error(`无法内联组件 ${importInfo.name}:`, error.message);
      return null;
    }
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

    return `const ${name} = {
  template: \`${escapedTemplate}\`,
  ${config}
}`;
  }

  /**
   * 更新主组件的script
   * @param {string} script - 原始script内容
   * @param {Array} imports - import信息数组
   * @returns {string} 更新后的script
   */
  updateMainScript(script, imports) {
    let updatedScript = script;

    // 移除.vue组件的import语句
    for (const imp of imports) {
      if (imp.source.endsWith('.vue')) {
        updatedScript = updatedScript.replace(imp.statement, '');
      }
    }

    // 在export default前插入内联组件定义
    const componentDefinitions = this.inlinedComponents
      .map(comp => comp.definition)
      .join('\n\n');

    updatedScript = updatedScript.replace(
      /export\s+default/,
      `${componentDefinitions}\n\nexport default`
    );

    return updatedScript;
  }
}

module.exports = ComponentInliner; 