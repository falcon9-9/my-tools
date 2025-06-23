<!--
🚀 Vue组件拍平工具生成的文件
生成时间: 2025-06-23T10:36:46.730Z
原始文件: MainComponent.vue

内联的样式 (2个):
  - D:\falcon\my-tools\vue-flattener\example\src\styles\components.css
  - D:\falcon\my-tools\vue-flattener\example\src\styles\buttons.css
⚠️  这是一个自动生成的文件，请勿手动修改
-->

<template>

    <div class="main-component">
      <h3>🎯 主组件展示</h3>
      <p>当前时间：{{ formattedTime }}</p>
    
      <!-- 使用子组件 -->
      <UserCard :user="user" @click="handleUserClick" />
    
      <!-- 使用另一个子组件 -->
      <CounterButton :initial-count="5" @increment="handleIncrement" />
    
      <div class="actions">
        <button @click="updateTime" class="btn btn-primary">更新时间</button>
        <button @click="generateRandomUser" class="btn btn-secondary">随机用户</button>
      </div>
    
      <div class="status">
        <p>计数器值：{{ counter }}</p>
        <p>工具函数测试：{{ utilsTest }}</p>
      </div>
    </div>

</template>

<script>

  // 引入子组件
  import UserCard from './UserCard.vue'
  import CounterButton from './CounterButton.vue'

  // 引入工具函数
  import { formatTime, generateRandomName } from '../utils/helpers.js'
  import { calculateSum } from '../utils/math.js'

  export default {
    name: 'MainComponent',
    components: {
      UserCard,
      CounterButton
    },
    data() {
      return {
        currentTime: new Date(),
        counter: 0,
        user: {
          id: 1,
          name: '张三',
          email: 'zhangsan@example.com',
          avatar: 'https://via.placeholder.com/60x60?text=👤'
        }
      }
    },
    computed: {
      formattedTime() {
        return formatTime(this.currentTime)
      },
      utilsTest() {
        return `计算结果: ${calculateSum([1, 2, 3, 4, 5])}`
      }
    },
    methods: {
      updateTime() {
        this.currentTime = new Date()
      },
      generateRandomUser() {
        this.user = {
          ...this.user,
          name: generateRandomName(),
          id: Math.floor(Math.random() * 1000)
        }
      },
      handleUserClick(user) {
        console.log('用户点击:', user)
        alert(`点击了用户: ${user.name}`)
      },
      handleIncrement(value) {
        this.counter = value
      }
    }
  }

</script>

<style>

  /* 引入外部样式文件 */



  .main-component {
    padding: 20px;
    border: 2px solid #42b983;
    border-radius: 8px;
    background: #f9f9f9;
  }

  .main-component h3 {
    color: #2c3e50;
    margin-bottom: 15px;
  }

  .actions {
    margin: 20px 0;
  }

  .actions .btn {
    margin-right: 10px;
  }

  .status {
    margin-top: 20px;
    padding: 15px;
    background: #e8f5e8;
    border-radius: 5px;
    border-left: 4px solid #42b983;
  }

  .status p {
    margin: 5px 0;
    color: #2c3e50;
  }

</style>

<style>
  /* 内联样式来自: D:\falcon\my-tools\vue-flattener\example\src\styles\components.css */
  /* 组件通用样式 */

  .inline_style_components_1750675006724 .component-base {
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .inline_style_components_1750675006724 .component-base:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  /* 卡片样式 */
  .inline_style_components_1750675006724 .card {
    background: white;
    border: 1px solid #e1e5e9;
    border-radius: 8px;
    padding: 20px;
    margin: 10px 0;
  }

  .inline_style_components_1750675006724 .card-header {
    border-bottom: 1px solid #e1e5e9;
    padding-bottom: 15px;
    margin-bottom: 15px;
  }

  .inline_style_components_1750675006724 .card-title {
    margin: 0;
    color: #2c3e50;
    font-size: 1.2em;
    font-weight: 600;
  }

  .inline_style_components_1750675006724 .card-body {
    color: #495057;
    line-height: 1.5;
  }

  /* 响应式网格 */
  .inline_style_components_1750675006724 .grid {
    display: grid;
    gap: 20px;
  }

  .inline_style_components_1750675006724 .grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }

  .inline_style_components_1750675006724 .grid-3 {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    .grid-2,
    .grid-3 {
      grid-template-columns: 1fr;
    }
  }

  /* 文本样式 */
  .inline_style_components_1750675006724 .text-primary {
    color: #42b983;
  }

  .inline_style_components_1750675006724 .text-secondary {
    color: #6c757d;
  }

  .inline_style_components_1750675006724 .text-muted {
    color: #95a5a6;
  }

  .inline_style_components_1750675006724 .text-center {
    text-align: center;
  }

  /* 间距辅助类 */
  .inline_style_components_1750675006724 .mb-0 { margin-bottom: 0; }
  .inline_style_components_1750675006724 .mb-1 { margin-bottom: 0.5rem; }
  .inline_style_components_1750675006724 .mb-2 { margin-bottom: 1rem; }
  .inline_style_components_1750675006724 .mb-3 { margin-bottom: 1.5rem; }

  .inline_style_components_1750675006724 .mt-0 { margin-top: 0; }
  .inline_style_components_1750675006724 .mt-1 { margin-top: 0.5rem; }
  .inline_style_components_1750675006724 .mt-2 { margin-top: 1rem; }
  .inline_style_components_1750675006724 .mt-3 { margin-top: 1.5rem; } 
</style>

<style>
  /* 内联样式来自: D:\falcon\my-tools\vue-flattener\example\src\styles\buttons.css */
  /* 按钮基础样式 */
  .inline_style_buttons_1750675006727 .btn {
    display: inline-block;
    padding: 8px 16px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.5;
    color: #212529;
    text-align: center;
    text-decoration: none;
    vertical-align: middle;
    cursor: pointer;
    border: 1px solid transparent;
    border-radius: 4px;
    background-color: #f8f9fa;
    transition: all 0.15s ease-in-out;
    user-select: none;
  }

  .inline_style_buttons_1750675006727 .btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .inline_style_buttons_1750675006727 .btn:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .inline_style_buttons_1750675006727 .btn:focus {
    outline: 0;
    box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.25);
  }

  .inline_style_buttons_1750675006727 .btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  /* 按钮颜色变体 */
  .inline_style_buttons_1750675006727 .btn-primary {
    color: white;
    background-color: #42b983;
    border-color: #42b983;
  }

  .inline_style_buttons_1750675006727 .btn-primary:hover {
    background-color: #369970;
    border-color: #369970;
  }

  .inline_style_buttons_1750675006727 .btn-secondary {
    color: white;
    background-color: #6c757d;
    border-color: #6c757d;
  }

  .inline_style_buttons_1750675006727 .btn-secondary:hover {
    background-color: #5a6268;
    border-color: #5a6268;
  }

  .inline_style_buttons_1750675006727 .btn-success {
    color: white;
    background-color: #28a745;
    border-color: #28a745;
  }

  .inline_style_buttons_1750675006727 .btn-success:hover {
    background-color: #218838;
    border-color: #218838;
  }

  .inline_style_buttons_1750675006727 .btn-danger {
    color: white;
    background-color: #dc3545;
    border-color: #dc3545;
  }

  .inline_style_buttons_1750675006727 .btn-danger:hover {
    background-color: #c82333;
    border-color: #c82333;
  }

  .inline_style_buttons_1750675006727 .btn-warning {
    color: #212529;
    background-color: #ffc107;
    border-color: #ffc107;
  }

  .inline_style_buttons_1750675006727 .btn-warning:hover {
    background-color: #e0a800;
    border-color: #e0a800;
  }

  /* 按钮尺寸 */
  .inline_style_buttons_1750675006727 .btn-small {
    padding: 4px 8px;
    font-size: 12px;
  }

  .inline_style_buttons_1750675006727 .btn-large {
    padding: 12px 24px;
    font-size: 16px;
  }

  /* 按钮组 */
  .inline_style_buttons_1750675006727 .btn-group {
    display: inline-flex;
  }

  .inline_style_buttons_1750675006727 .btn-group .btn {
    border-radius: 0;
    margin-left: -1px;
  }

  .inline_style_buttons_1750675006727 .btn-group .btn:first-child {
    border-top-left-radius: 4px;
    border-bottom-left-radius: 4px;
  }

  .inline_style_buttons_1750675006727 .btn-group .btn:last-child {
    border-top-right-radius: 4px;
    border-bottom-right-radius: 4px;
  }

  .inline_style_buttons_1750675006727 .btn-group .btn:hover {
    z-index: 1;
  } 
</style>