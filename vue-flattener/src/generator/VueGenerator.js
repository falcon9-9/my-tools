/**
 * Vue文件生成器
 * 将内联后的组件数据生成为完整的Vue单文件组件字符串
 */

class VueGenerator {
  constructor(options = {}) {
    this.options = {
      preserveComments: true,
      indentSize: 2,
      ...options
    };
  }

  /**
   * 生成Vue单文件组件内容
   * @param {Object} component - 内联后的组件对象
   * @returns {string} Vue文件内容
   */
  async generate(component) {
    console.log('📝 生成拍平后的Vue文件...');
    
    const parts = [];
    
    // 添加文件头注释
    if (this.options.preserveComments) {
      parts.push(this.generateHeader(component));
    }
    
    // 生成template部分
    if (component.template) {
      parts.push(this.generateTemplate(component));
    }
    
    // 生成script部分
    if (component.script) {
      parts.push(this.generateScript(component));
    }
    
    // 生成style部分
    if (component.styles && component.styles.length > 0) {
      parts.push(this.generateStyles(component));
    }
    
    return parts.join('\n\n');
  }

  /**
   * 生成文件头注释
   * @param {Object} component - 组件对象
   * @returns {string} 头部注释
   */
  generateHeader(component) {
    const timestamp = new Date().toISOString();
    const inlinedComponents = component.inlinedComponents ? Object.keys(component.inlinedComponents) : [];
    const inlinedFunctions = component.inlinedFunctions ? Object.keys(component.inlinedFunctions) : [];
    const inlinedStyles = component.inlinedStyles ? Object.keys(component.inlinedStyles) : [];
    
    let header = `<!--
🚀 Vue组件拍平工具生成的文件
生成时间: ${timestamp}
原始文件: ${component.filename}
`;

    if (inlinedComponents.length > 0) {
      header += `
内联的组件 (${inlinedComponents.length}个):
${inlinedComponents.map(name => `  - ${name}`).join('\n')}`;
    }

    if (inlinedFunctions.length > 0) {
      header += `
内联的函数 (${inlinedFunctions.length}个):
${inlinedFunctions.map(name => `  - ${name}`).join('\n')}`;
    }

    if (inlinedStyles.length > 0) {
      header += `
内联的样式 (${inlinedStyles.length}个):
${inlinedStyles.map(path => `  - ${path}`).join('\n')}`;
    }

    header += `
⚠️  这是一个自动生成的文件，请勿手动修改
-->`;

    return header;
  }

  /**
   * 生成template部分
   * @param {Object} component - 组件对象
   * @returns {string} template内容
   */
  generateTemplate(component) {
    let templateContent = component.template.content;
    
    // 处理内联组件的模板合并
    if (component.inlinedComponents) {
      templateContent = this.mergeInlinedComponentTemplates(templateContent, component.inlinedComponents);
    }
    
    // 构建template块
    const attrs = this.buildAttributes(component.template.attrs);
    const langAttr = component.template.lang && component.template.lang !== 'html' ? 
      ` lang="${component.template.lang}"` : '';
    
    return `<template${langAttr}${attrs}>
${this.indentContent(templateContent)}
</template>`;
  }

  /**
   * 合并内联组件的模板
   * @param {string} mainTemplate - 主模板
   * @param {Object} inlinedComponents - 内联的组件
   * @returns {string} 合并后的模板
   */
  mergeInlinedComponentTemplates(mainTemplate, inlinedComponents) {
    let mergedTemplate = mainTemplate;
    
    // 为每个内联组件的模板添加命名空间class
    Object.values(inlinedComponents).forEach(inlinedComp => {
      if (inlinedComp.template && inlinedComp.namespace) {
        // 这里可以实现更复杂的模板合并逻辑
        // 目前简单地添加注释说明内联的组件
        const comment = `\n  <!-- 内联组件模板: ${inlinedComp.original.filename} (命名空间: ${inlinedComp.namespace}) -->\n`;
        mergedTemplate = mergedTemplate.replace(/(<\/template>|\s*$)/, comment + '$1');
      }
    });
    
    return mergedTemplate;
  }

  /**
   * 生成script部分
   * @param {Object} component - 组件对象
   * @returns {string} script内容
   */
  generateScript(component) {
    const attrs = this.buildAttributes(component.script.attrs);
    const langAttr = component.script.lang && component.script.lang !== 'js' ? 
      ` lang="${component.script.lang}"` : '';
    
    return `<script${langAttr}${attrs}>
${this.indentContent(component.script.content)}
</script>`;
  }

  /**
   * 生成styles部分
   * @param {Object} component - 组件对象
   * @returns {string} styles内容
   */
  generateStyles(component) {
    const styleParts = [];
    
    component.styles.forEach((style, index) => {
      const attrs = this.buildStyleAttributes(style);
      const langAttr = style.lang && style.lang !== 'css' ? ` lang="${style.lang}"` : '';
      const scopedAttr = style.scoped ? ' scoped' : '';
      
      let styleContent = style.content;
      
      // 添加内联样式的注释
      if (style.inlined && this.options.preserveComments) {
        const comment = `/* 内联样式来自: ${style.attrs && style.attrs['data-inline-from'] || '未知'} */\n`;
        styleContent = comment + styleContent;
      }
      
      styleParts.push(`<style${langAttr}${scopedAttr}${attrs}>
${this.indentContent(styleContent)}
</style>`);
    });
    
    return styleParts.join('\n\n');
  }

  /**
   * 构建属性字符串
   * @param {Object} attrs - 属性对象
   * @returns {string} 属性字符串
   */
  buildAttributes(attrs) {
    if (!attrs || Object.keys(attrs).length === 0) {
      return '';
    }
    
    const attrPairs = Object.entries(attrs)
      .filter(([key, value]) => value !== false && value !== null && value !== undefined)
      .map(([key, value]) => {
        if (value === true) {
          return key;
        }
        return `${key}="${this.escapeAttribute(value)}"`;
      });
    
    return attrPairs.length > 0 ? ` ${attrPairs.join(' ')}` : '';
  }

  /**
   * 构建样式属性字符串
   * @param {Object} style - 样式对象
   * @returns {string} 属性字符串
   */
  buildStyleAttributes(style) {
    const attrs = { ...style.attrs };
    
    // 移除内部使用的属性
    delete attrs['data-inline-from'];
    
    return this.buildAttributes(attrs);
  }

  /**
   * 转义属性值
   * @param {string} value - 属性值
   * @returns {string} 转义后的值
   */
  escapeAttribute(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * 为内容添加缩进
   * @param {string} content - 内容
   * @returns {string} 缩进后的内容
   */
  indentContent(content) {
    if (!content) return '';
    
    const indent = ' '.repeat(this.options.indentSize);
    return content
      .split('\n')
      .map(line => line.trim() ? indent + line : line)
      .join('\n');
  }

  /**
   * 清理和格式化内容
   * @param {string} content - 内容
   * @returns {string} 清理后的内容
   */
  cleanContent(content) {
    // 移除多余的空行
    return content
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim();
  }
}

module.exports = VueGenerator; 