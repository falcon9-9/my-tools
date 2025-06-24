#!/usr/bin/env node

const VueFlattener = require('./index');

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方法: node cli.js <输入文件> <输出文件>');
    console.log('示例: node cli.js example/src/views/Demo.vue example/src/views/Demo.flattened.vue');
    process.exit(1);
  }
  
  const [inputPath, outputPath] = args;
  
  try {
    console.log('🔧 创建VueFlattener实例...');
    const flattener = new VueFlattener();
    
    console.log('📁 输入文件:', inputPath);
    console.log('📁 输出文件:', outputPath);
    
    await flattener.flatten(inputPath, outputPath);
    console.log('✅ 拍平成功完成!');
  } catch (error) {
    console.error('❌ 拍平失败:', error.message);
    console.error('详细错误:', error.stack);
    process.exit(1);
  }
}

main(); 