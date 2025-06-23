# Vue组件拍平工具实现日志

## 项目目标
实现一个Vue组件拍平工具，将包含子组件、工具函数、样式文件的Vue组件内联成单个文件。

## 实现步骤

### 第一阶段：子组件内联
1. 搭建Vue2 + Webpack开发环境
2. 创建简单的测试组件
3. 实现基础的组件解析器
4. 实现子组件内联功能
5. 实现实时监听和自动拍平

### 当前进度
- [x] 初始化项目结构
- [x] 配置Webpack开发环境
- [x] 创建测试组件
- [x] 实现组件解析器
- [x] 实现子组件内联
- [x] 实现文件监听器
- [x] 创建对比展示界面

## 技术方案细节

### 1. 项目结构
```
vue-flattener-2/
├── example/          # 测试环境
│   ├── src/
│   │   ├── App.vue      # 主组件（展示对比）
│   │   ├── AppOriginal.vue  # 原始组件展示
│   │   ├── AppFlattened.vue # 拍平组件展示
│   │   ├── components/  # 子组件
│   │   │   ├── HelloWorld.vue
│   │   │   └── Counter.vue
│   │   └── main.js      # 入口文件
│   ├── webpack.config.js
│   └── package.json
├── src/                  # 拍平工具源码
│   ├── parser/          # 解析器
│   │   └── VueParser.js
│   ├── inliner/         # 内联器
│   │   └── ComponentInliner.js
│   ├── index.js         # 主入口
│   └── watch.js         # 文件监听器
└── log.md               # 实现日志
```

### 2. 核心模块设计
- **Parser**: 解析Vue文件的template、script、style部分
- **ComponentInliner**: 处理子组件内联
- **Watcher**: 监听文件变化，自动执行拍平

## 实现记录

### 2024-12-XX - 项目初始化
- 创建项目基础结构
- 配置Vue2 + Webpack环境
- 创建简单的测试组件

### 第一阶段完成 - 基础子组件内联
已实现功能：
1. **VueParser**: 能够解析Vue文件的template、script、style三个部分
2. **ComponentInliner**: 实现了基础的子组件内联功能
   - 分析import语句
   - 读取子组件文件
   - 将子组件转换为内联格式
   - 更新主组件的script
3. **VueFlattener**: 主类，整合解析和内联功能
4. **文件监听**: 使用chokidar监听文件变化，自动执行拍平
5. **对比展示**: 创建了清晰的左右对比界面，展示原始组件和拍平后的效果

### 使用方法
1. 安装依赖：
   ```bash
   cd vue-flattener-2
   npm install
   
   cd example
   npm install
   ```

2. 启动监听器（在vue-flattener-2目录）：
   ```bash
   npm run dev
   ```

3. 启动测试环境（在example目录）：
   ```bash
   npm run serve
   ```

4. 访问 http://localhost:8080 查看效果

### 实现效果
- 左侧显示原始组件（引入子组件的方式）
- 右侧显示拍平后的组件（内联子组件的方式）
- 底部展示代码结构对比
- 修改任何组件文件都会自动触发重新拍平

### 已知限制
1. 目前只支持简单的组件导入（import Component from './path.vue'）
2. 暂不支持动态导入
3. 暂不支持处理组件中的其他导入（如工具函数、样式文件）
4. 子组件的scoped样式在拍平后可能会影响全局

### 下一步计划
1. 支持工具函数内联
2. 支持样式文件内联
3. 处理更复杂的导入场景（如解构导入、别名导入）
4. 优化scoped样式的处理
5. 添加错误处理和边界情况处理
6. 支持TypeScript
7. 支持递归内联（子组件中还有子组件）

### 技术要点总结
1. **正则表达式解析**: 使用正则表达式解析Vue文件的各个部分
2. **模板字符串**: 使用ES6模板字符串来内联组件模板
3. **字符转义**: 需要正确转义模板中的特殊字符（反斜杠、反引号、$）
4. **样式合并**: 将子组件的样式提取并合并到主组件中
5. **文件监听**: 使用chokidar实现高效的文件监听
