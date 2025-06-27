<template>
  <div class="demo">
        <HelloWorld msg="欢迎使用Vue组件拍平工具!" />
        <Counter />
      </div>
</template>

<script>
  
  
  
  // 📦 来自 ../utils/math.js 的内联函数
  function add(a, b) {
    return a + b;
  }
  function multiply(a, b) {
    return a * b;
  }
  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  function square(num) {
    return multiply(num, num);
  }
  
  // 📦 来自 ../utils/helpers.js 的内联函数
  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  function generateId() {
    return 'id_' + Math.random().toString(36).substr(2, 9);
  }
  function formatDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // 📦 内联的Vue组件
  const SimpleButton = {
    template: `<button class="simple-btn simplebutton-component" @click="handleClick">
      <span class="btn-text">{{ label }}</span>
      <span class="btn-icon">✨</span>
    </button>`,
    name: 'SimpleButton',
    props: {
      label: {
        type: String,
        default: '点击我'
      }
    },
    methods: {
      handleClick() {
        this.$emit('button-clicked', this.label)
      }
    }
  }
  const HelloWorld = {
    template: `<div class="hello helloworld-component">
      <h2>{{ msg }}</h2>
      <p>这是一个子组件</p>
      <!-- 测试2层嵌套：HelloWorld -> SimpleButton -->
      <div class="nested-content">
        <p>嵌套子组件示例：</p>
        <SimpleButton 
          label="嵌套按钮" 
          @button-clicked="onButtonClick" 
        />
      </div>
      <!-- 测试同级类名修复 -->
    </div>`,
    name: 'HelloWorld',
    components: {
      SimpleButton
    },
    props: {
      msg: {
        type: String,
        default: 'Hello Vue!'
      }
    },
    methods: {
      onButtonClick(label) {
        console.log(`子组件按钮被点击了: ${label}`)
      }
    }
  }
  const Counter = {
    template: `<div class="counter theme-card animate-fade-in counter-component">
      <button class="theme-button hover-lift" @click="decrement">-</button>
      <span class="count theme-text">{{ formattedCount }}</span>
      <button class="theme-button hover-lift" @click="increment">+</button>
      <button class="theme-button secondary hover-lift" @click="square">x²</button>
      <div class="info">
        <div class="theme-text">ID: {{ componentId }}</div>
        <div class="theme-text">平方值: {{ squareFormatted }}</div>
        <div class="loading-spinner animate-pulse" v-if="loading">spin</div>
      </div>
    </div>`,
    name: 'Counter',
    data() {
      return {
        count: 0,
        componentId: generateId(),
        loading: true
      }
    },
    computed: {
      formattedCount() {
        return formatNumber(this.count)
      },
      squareFormatted() {
        return formatNumber(square(this.count))
      }
    },
    methods: {
      increment() {
        this.count = add(this.count, 1)
      },
      decrement() {
        this.count = add(this.count, -1)
      },
      square() {
        this.count = square(this.count)
      }
    },
    mounted() {
      console.log(`Counter组件已挂载，ID: ${this.componentId}, 日期: ${formatDate()}`)
      console.log('🔄 测试依赖文件监听功能')
    }
  }
  
  export default {
    name: 'Demo',
    components: {
      HelloWorld,
      Counter
    }
  }
</script>

<style scoped>
  .demo {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>

<style>
  .simplebutton-component.simple-btn {
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;}
  
  .simplebutton-component.simple-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);}
  
  .simplebutton-component .btn-text {
    font-size: 14px;
    font-weight: 500;}
  
  .simplebutton-component .btn-icon {
    font-size: 12px;}
</style>

<style lang="scss">
  .hello.helloworld-component {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  
    h2 {
      color: #42b983;
    }
  }
  
  .hello.helloworld-component .nested-content {
    margin-top: 15px;
    padding: 15px;
    background-color: #fff;
    border-radius: 6px;
    border-left: 4px solid #42b983;
  
    p {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }
  }
</style>

<style lang="scss">
  .counter.counter-component {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background-color: #e3f2fd;
    border-radius: 5px;
  
    button {
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 4px;
      background-color: #2196f3;
      color: white;
      font-size: 18px;
      cursor: pointer;
  
      &:hover {
        background-color: #1976d2;
      }
    }
  }
  
  .counter.counter-component .count {
    font-size: 18px;
    font-weight: bold;
    min-width: 30px;
    text-align: center;
  }
</style>

<style lang="css">
  /* 📦 来自 ../styles/theme.css 的内联样式 */
  /* 主题样式文件 - theme.css */
  
  /* 基础颜色变量 */
  :root {
    --primary-color: #3498db;
    --secondary-color: #2ecc71;
    --danger-color: #e74c3c;
    --warning-color: #f39c12;
    --text-color: #2c3e50;
    --bg-color: #ecf0f1;
    --border-color: #bdc3c7;
  }
  
  /* 基础主题样式 */
  .theme-card {
    background-color: var(--bg-color);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    margin: 8px 0;
    color: var(--text-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .theme-button {
    background-color: var(--primary-color);
    border: none;
    border-radius: 4px;
    padding: 8px 16px;
    color: white;
    cursor: pointer;
    font-size: 14px;
    transition: background-color 0.3s ease;
  }
  
  .theme-button:hover {
    background-color: #2980b9;
  }
  
  .theme-button.secondary {
    background-color: var(--secondary-color);
  }
  
  .theme-button.secondary:hover {
    background-color: #27ae60;
  }
  
  .theme-text {
    color: var(--text-color);
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.5;
  }
  
  .theme-title {
    color: var(--primary-color);
    font-size: 1.5em;
    font-weight: 600;
    margin-bottom: 8px;
  } 
</style>

<style lang="scss">
  /* 📦 来自 ../styles/animations.scss 的内联样式 */
  // 动画样式文件 - animations.scss
  
  // SCSS变量
  $animation-speed: 0.3s;
  $bounce-height: 10px;
  $fade-opacity: 0.7;
  
  // 动画关键帧
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounce {
    0%, 20%, 60%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-$bounce-height);
    }
    80% {
      transform: translateY(-5px);
    }
  }
  
  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.05);
    }
    100% {
      transform: scale(1);
    }
  }
  
  // 动画工具类
  .animate-fade-in {
    animation: fadeIn $animation-speed ease-out;
  }
  
  .animate-bounce {
    animation: bounce 1s infinite;
  }
  
  .animate-pulse {
    animation: pulse 2s infinite;
  }
  
  // 悬停动画
  .hover-lift {
    transition: transform $animation-speed ease;
    
    &:hover {
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
  
  .hover-fade {
    transition: opacity $animation-speed ease;
    
    &:hover {
      opacity: $fade-opacity;
    }
  }
  
  // 加载动画
  .loading-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #f3f3f3;
    border-top: 2px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  } 
</style>