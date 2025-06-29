const fs = require('fs-extra');
const path = require('path');
const ComponentInliner = require('./inliner/ComponentInliner');

/**
 * Vue组件拍平器主类
 */
class VueFlattener {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   * @param {boolean} options.silent - 是否静默模式，不输出日志
   */
  constructor(options = {}) {
    this.silent = options.silent || false;
  }

  /**
   * 日志输出辅助方法
   * @param {...any} args - 日志参数
   */
  log(...args) {
    if (!this.silent) {
      console.log(...args);
    }
  }

  /**
   * 拍平Vue组件
   * @param {string} inputPath - 输入组件路径
   * @param {string} outputPath - 输出路径
   * @returns {Promise<void>}
   */
  async flatten(inputPath, outputPath) {
    try {
      this.log(`开始拍平组件: ${inputPath}`);
      
      // 使用组件内联器
      this.log('🔧 创建ComponentInliner...');
      const inliner = new ComponentInliner(inputPath, { silent: this.silent });
      
      this.log('🔍 执行内联...');
      const result = await inliner.inline();
      
      this.log('📋 内联结果:');
      this.log('  - Template长度:', result.template ? result.template.length : 0);
      this.log('  - Script长度:', result.script ? result.script.length : 0);
      this.log('  - Styles数量:', result.styles ? result.styles.length : 0);
      
      // 生成拍平后的组件
      this.log('📝 生成组件...');
      const flattenedComponent = this.generateComponent(
        result.template,
        result.script,
        result.styles
      );
      
      this.log('💾 生成的组件长度:', flattenedComponent.length);
      
      // 写入文件
      await fs.ensureDir(path.dirname(outputPath));
      await fs.writeFile(outputPath, flattenedComponent, 'utf-8');
      
      this.log(`拍平完成! 输出到: ${outputPath}`);
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