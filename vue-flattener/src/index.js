/**
 * Vue组件拍平工具主入口
 * 将包含子组件、工具函数、样式文件的Vue组件拍平为单个文件
 */

const VueFlattener = require('./core/VueFlattener');
const chalk = require('chalk');

/**
 * 主函数：拍平Vue组件
 * @param {string} inputPath - 输入Vue文件路径
 * @param {string} outputPath - 输出文件路径
 * @param {Object} options - 配置选项
 */
async function flatten(inputPath, outputPath, options = {}) {
  try {
    console.log(chalk.blue('🚀 开始拍平Vue组件...'));
    console.log(chalk.gray(`输入文件: ${inputPath}`));
    console.log(chalk.gray(`输出文件: ${outputPath}`));
    
    const flattener = new VueFlattener(options);
    const result = await flattener.flatten(inputPath, outputPath);
    
    console.log(chalk.green('✅ 拍平完成！'));
    return result;
  } catch (error) {
    console.error(chalk.red('❌ 拍平失败:'), error.message);
    throw error;
  }
}

// 如果直接运行此文件，执行命令行版本
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log(chalk.yellow('使用方法: node src/index.js <input.vue> <output.vue>'));
    process.exit(1);
  }
  
  flatten(args[0], args[1])
    .catch(error => {
      process.exit(1);
    });
}

module.exports = { flatten }; 