<template>
  <div id="app">
    <h1>Vue组件拍平测试</h1>
    <div class="container">
      <div class="panel">
        <h3>原始组件（引入子组件）</h3>
        <div class="content">
          <AppOriginal />
        </div>
      </div>
      
      <div class="panel">
        <h3>拍平后组件（内联子组件）</h3>
        <div class="content">
          <AppFlattened />
        </div>
      </div>
    </div>

    <div class="code-preview">
      <h2>代码对比</h2>
      <div class="code-container">
        <div class="code-panel">
          <h4>原始代码结构</h4>
          <pre>// App.vue
import HelloWorld from './components/HelloWorld.vue'
import Counter from './components/Counter.vue'

export default {
  components: { HelloWorld, Counter }
}</pre>
        </div>
        <div class="code-panel">
          <h4>拍平后代码结构</h4>
          <pre>// App.flattened.vue
const HelloWorld = { /* 内联的组件定义 */ }
const Counter = { /* 内联的组件定义 */ }

export default {
  components: { HelloWorld, Counter }
}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AppOriginal from './AppOriginal.vue'
import AppFlattened from './AppFlattened.vue'

export default {
  name: 'App',
  components: {
    AppOriginal,
    AppFlattened
  }
}
</script>

<style>
#app {
  padding: 20px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

.container {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.panel h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #555;
  border-bottom: 2px solid #42b983;
  padding-bottom: 10px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.code-preview {
  margin-top: 40px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.code-preview h2 {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.code-container {
  display: flex;
  gap: 20px;
}

.code-panel {
  flex: 1;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 20px;
}

.code-panel h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #666;
}

.code-panel pre {
  background: #2d2d2d;
  color: #ccc;
  padding: 15px;
  border-radius: 5px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
}
</style> 