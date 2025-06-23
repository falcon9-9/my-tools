const fs = require('fs-extra');
const path = require('path');
const ComponentInliner = require('./inliner/ComponentInliner');

/**
 * Vue组件拍平器主类
 */
class VueFlattener {
  /**
   * 拍平Vue组件
   * @param {string} inputPath - 输入组件路径
   * @param {string} outputPath - 输出路径
   * @returns {Promise<void>}
   */
  async flatten(inputPath, outputPath) {
    try {
      console.log(`开始拍平组件: ${inputPath}`);
      
      // 使用组件内联器
      const inliner = new ComponentInliner(inputPath);
      const result = await inliner.inline();
      
      // 收集所有样式（包括子组件的样式）
      const allStyles = [...result.styles];
      for (const comp of inliner.inlinedComponents) {
        if (comp.styles) {
          allStyles.push(...comp.styles);
        }
      }
      
      // 生成拍平后的组件
      const flattenedComponent = this.generateComponent(
        result.template,
        result.script,
        allStyles
      );
      
      // 写入文件
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, flattenedComponent, 'utf-8');
      
      console.log(`拍平完成! 输出到: ${outputPath}`);
    } catch (error) {
      console.error('拍平组件时出错:', error);
      throw error;
    }
  }

  /**
   * 生成完整的Vue组件
   * @param {string} template - 模板内容
   * @param {string} script - script内容
   * @param {Array} styles - 样式数组
   * @returns {string} 完整的Vue组件
   */
  generateComponent(template, script, styles) {
    let component = '';

    // 添加template
    if (template) {
      component += '<template>\n';
      component += this.indent(template) + '\n';
      component += '</template>\n\n';
    }

    // 添加script
    if (script) {
      component += '<script>\n';
      component += this.indent(script) + '\n';
      component += '</script>\n\n';
    }

    // 添加styles
    for (const style of styles) {
      const attrs = [];
      if (style.scoped) attrs.push('scoped');
      if (style.lang) attrs.push(`lang="${style.lang}"`);
      
      const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      component += `<style${attrString}>\n`;
      component += this.indent(style.content) + '\n';
      component += '</style>\n\n';
    }

    return component.trim();
  }

  /**
   * 缩进内容
   * @param {string} content - 要缩进的内容
   * @param {number} spaces - 缩进空格数
   * @returns {string} 缩进后的内容
   */
  indent(content, spaces = 2) {
    const indent = ' '.repeat(spaces);
    return content.split('\n').map(line => indent + line).join('\n');
  }
}

module.exports = VueFlattener; 