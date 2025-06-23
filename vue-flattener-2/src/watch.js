const chokidar = require('chokidar');
const path = require('path');
const VueFlattener = require('./index');

// 配置
const config = {
  inputPath: path.resolve(__dirname, '../example/src/App.vue'),
  outputPath: path.resolve(__dirname, '../example/src/App.flattened.vue'),
  watchPaths: [
    path.resolve(__dirname, '../example/src/App.vue'),
    path.resolve(__dirname, '../example/src/components/**/*.vue')
  ]
};

// 创建拍平器实例
const flattener = new VueFlattener();

// 执行拍平
async function doFlatten() {
  try {
    await flattener.flatten(config.inputPath, config.outputPath);
    console.log(`[${new Date().toLocaleTimeString()}] 拍平成功!`);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] 拍平失败:`, error.message);
  }
}

// 初始化监听器
console.log('Vue组件拍平监听器启动...');
console.log(`监听文件: ${config.inputPath}`);
console.log(`输出到: ${config.outputPath}`);

// 立即执行一次拍平
doFlatten();

// 监听文件变化
const watcher = chokidar.watch(config.watchPaths, {
  persistent: true,
  ignoreInitial: true
});

watcher
  .on('change', (filePath) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 检测到文件变化: ${filePath}`);
    doFlatten();
  })
  .on('add', (filePath) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 检测到新文件: ${filePath}`);
    doFlatten();
  })
  .on('unlink', (filePath) => {
    console.log(`\n[${new Date().toLocaleTimeString()}] 检测到文件删除: ${filePath}`);
    doFlatten();
  });

// 处理退出
process.on('SIGINT', () => {
  console.log('\n停止监听...');
  watcher.close();
  process.exit();
}); 