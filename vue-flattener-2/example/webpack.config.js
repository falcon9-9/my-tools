const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
// 引入独立的VueFlattenPlugin
const VueFlattenPlugin = require('../webpack-plugin');

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