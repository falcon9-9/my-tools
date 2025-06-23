<template>
  <div id="app">
    <div class="header">
      <h2>📦 Vue组件拍平工具测试</h2>
      <p>对比原始组件和拍平后的组件效果</p>
    </div>
    
    <div class="demo-section">
      <div class="demo-item">
        <h3>🎯 原始组件</h3>
        <div class="component-wrapper">
          <MainComponent />
        </div>
        <p class="description">
          这是原始的复合组件，包含子组件、工具函数和样式文件
        </p>
      </div>
      
      <div class="demo-item">
        <h3>✨ 拍平后的组件</h3>
        <div class="component-wrapper">
          <!-- 拍平后的组件将在这里显示 -->
          <div class="placeholder">
            <p>运行 <code>npm run test-flatten</code> 生成拍平组件</p>
            <p>然后在此处引入 FlattenedComponent.vue</p>
            <FlattenedComponent />
          </div>
        </div>
        <p class="description">
          这是拍平后的单文件组件，所有依赖已内联
        </p>
      </div>
    </div>

    <div class="info-section">
      <h3>📋 测试步骤</h3>
      <ol>
        <li>运行 <code>npm run serve</code> 启动开发服务器</li>
        <li>查看原始组件的效果</li>
        <li>运行 <code>npm run test-flatten</code> 拍平组件</li>
        <li>在 <code>dist/</code> 目录查看生成的拍平文件</li>
        <li>替换上方的占位符为拍平后的组件</li>
      </ol>
    </div>
  </div>
</template>

<script>
import MainComponent from './components/MainComponent.vue'
import FlattenedComponent from '../dist/FlattenedComponent.vue'
export default {
  name: 'App',
  components: {
    MainComponent,
    FlattenedComponent
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin: 0;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
}

.header h2 {
  margin: 0 0 10px 0;
  font-size: 2em;
}

.header p {
  margin: 0;
  opacity: 0.9;
}

.demo-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
}

.demo-item {
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  padding: 20px;
  background: #f8f9fa;
}

.demo-item h3 {
  margin: 0 0 15px 0;
  color: #495057;
}

.component-wrapper {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 20px;
  margin: 15px 0;
  min-height: 200px;
}

.placeholder {
  text-align: center;
  color: #6c757d;
  padding: 40px 20px;
}

.placeholder code {
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

.description {
  margin: 15px 0 0 0;
  color: #6c757d;
  font-size: 0.9em;
}

.info-section {
  background: #e7f3ff;
  border: 1px solid #b3d7ff;
  border-radius: 8px;
  padding: 20px;
}

.info-section h3 {
  margin: 0 0 15px 0;
  color: #0366d6;
}

.info-section ol {
  margin: 0;
  padding-left: 20px;
}

.info-section li {
  margin-bottom: 8px;
}

.info-section code {
  background: #f1f8ff;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  color: #0366d6;
}

@media (max-width: 768px) {
  .demo-section {
    grid-template-columns: 1fr;
  }
}
</style> 