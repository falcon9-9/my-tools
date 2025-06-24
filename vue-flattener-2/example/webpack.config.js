const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

// 自定义的Vue组件拍平插件
class VueFlattenPlugin {
  constructor(options = {}) {
    this.options = {
      // 监听的文件夹路径
      watchDir: path.resolve(__dirname, 'src/views'),
      ...options
    };
    
    // 引入拍平工具
    this.VueFlattener = require('../src/index');
    this.flattener = new this.VueFlattener();
    
    // 防重复拍平的状态管理
    this.isFlattening = false;
    this.lastFlattenTime = 0;
    this.initialFlattenDone = false;
  }

  apply(compiler) {
    // 只在第一次编译时执行初始拍平
    compiler.hooks.beforeCompile.tapAsync('VueFlattenPlugin', async (params, callback) => {
      if (!this.initialFlattenDone) {
        console.log('[VueFlattenPlugin] 执行初始拍平...');
        await this.flatten();
        this.initialFlattenDone = true;
      }
      callback();
    });

    // 监听文件变化
    compiler.hooks.watchRun.tapAsync('VueFlattenPlugin', async (compilation, callback) => {
      // 防止正在拍平时重复执行
      if (this.isFlattening) {
        callback();
        return;
      }

      const changedFiles = Array.from(compilation.modifiedFiles || []);
      const deletedFiles = Array.from(compilation.removedFiles || []);
      
      // 只检查 views 文件夹下的Vue文件变化，排除拍平生成的文件
      const viewsVueFiles = [...changedFiles, ...deletedFiles].filter(file => {
        const normalizedFile = path.normalize(file);
        const normalizedWatchDir = path.normalize(this.options.watchDir);
        return file.endsWith('.vue') && 
               !file.includes('.flattened.vue') &&
               normalizedFile.includes(normalizedWatchDir);
      });
      
      // 防抖：如果距离上次拍平不到1秒，则跳过
      const now = Date.now();
      if (viewsVueFiles.length > 0 && (now - this.lastFlattenTime) > 1000) {
        console.log(`[VueFlattenPlugin] 检测到views文件夹下Vue文件变化: ${viewsVueFiles.join(', ')}`);
        await this.flatten();
      }
      
      callback();
    });
  }

  async flatten() {
    // 防重复执行
    if (this.isFlattening) {
      console.log('[VueFlattenPlugin] 正在拍平中，跳过重复请求');
      return;
    }

    this.isFlattening = true;
    this.lastFlattenTime = Date.now();
    
    try {
      const fs = require('fs');
      const watchDir = this.options.watchDir;
      
      // 检查文件夹是否存在
      if (!fs.existsSync(watchDir)) {
        console.log(`[VueFlattenPlugin] views文件夹不存在: ${watchDir}`);
        return;
      }
      
      // 读取views文件夹下的所有.vue文件（排除.flattened.vue）
      const files = fs.readdirSync(watchDir).filter(file => {
        return file.endsWith('.vue') && !file.includes('.flattened.vue');
      });
      
      console.log(`[VueFlattenPlugin] 发现${files.length}个Vue文件需要拍平: ${files.join(', ')}`);
      
      // 逐个拍平每个文件
      for (const file of files) {
        const inputPath = path.join(watchDir, file);
        const outputPath = path.join(watchDir, file.replace('.vue', '.flattened.vue'));
        
        try {
          await this.flattener.flatten(inputPath, outputPath);
          console.log(`[VueFlattenPlugin] ✅ ${file} 拍平成功！`);
        } catch (error) {
          console.error(`[VueFlattenPlugin] ❌ ${file} 拍平失败:`, error.message);
        }
      }
      
      console.log(`[VueFlattenPlugin] 所有文件拍平完成！`);
    } catch (error) {
      console.error(`[VueFlattenPlugin] 拍平过程发生错误:`, error.message);
    } finally {
      this.isFlattening = false;
    }
  }
}

module.exports = {
  entry: './src/main.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: [
          'vue-style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.scss$/,
        use: [
          'vue-style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              // 为了兼容性，暂时保持使用legacy API但静默警告
              sassOptions: {
                quietDeps: true, // 静默依赖警告
                logger: {
                  warn: function(message) {
                    // 过滤掉legacy API警告
                    if (!message.includes('legacy JS API')) {
                      console.warn(message);
                    }
                  }
                }
              }
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html'
    }),
    // 添加拍平插件 - 拍平views文件夹下的所有Vue文件
    new VueFlattenPlugin({
      watchDir: path.resolve(__dirname, 'src/views')
    })
  ],
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.esm.js',
      '@': path.resolve(__dirname, 'src')
    },
    extensions: ['*', '.js', '.vue', '.json']
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 8081,
    hot: true,
    // 添加启动后的提示
    onListening: function(devServer) {
      const port = devServer.server.address().port;
      console.log('\n=====================================');
      console.log('Vue组件拍平工具已启动！');
      console.log(`访问地址: http://localhost:${port}`);
      console.log('组件会在修改时自动拍平');
      console.log('=====================================\n');
    }
  }
}; 