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
@import '../styles/components.css';
@import '../styles/buttons.css';

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