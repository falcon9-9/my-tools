/**
 * Vue组件解析器
 * 用于解析Vue单文件组件的template、script和style部分
 */
class VueParser {
  constructor(content) {
    this.content = content;
    this.template = null;
    this.script = null;
    this.styles = [];
  }

  /**
   * 解析Vue组件
   * @returns {Object} 包含template、script和styles的对象
   */
  parse() {
    this.extractTemplate();
    this.extractScript();
    this.extractStyles();
    
    return {
      template: this.template,
      script: this.script,
      styles: this.styles
    };
  }

  /**
   * 提取template部分
   */
  extractTemplate() {
    const templateRegex = /<template>([\s\S]*?)<\/template>/;
    const match = this.content.match(templateRegex);
    
    if (match) {
      this.template = match[1].trim();
    }
  }

  /**
   * 提取script部分
   */
  extractScript() {
    const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/;
    const match = this.content.match(scriptRegex);
    
    if (match) {
      this.script = match[1].trim();
    }
  }

  /**
   * 提取所有style部分
   */
  extractStyles() {
    const styleRegex = /<style([^>]*)>([\s\S]*?)<\/style>/g;
    let match;
    
    while ((match = styleRegex.exec(this.content)) !== null) {
      const attributes = match[1];
      const content = match[2].trim();
      
      this.styles.push({
        content: content,
        scoped: attributes.includes('scoped'),
        lang: this.extractLang(attributes)
      });
    }
  }

  /**
   * 从属性字符串中提取lang属性
   * @param {string} attributes - 属性字符串
   * @returns {string|null} lang属性值
   */
  extractLang(attributes) {
    const langMatch = attributes.match(/lang=["']([^"']+)["']/);
    return langMatch ? langMatch[1] : null;
  }
}

module.exports = VueParser; 