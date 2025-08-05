<template>
  <div class="counter theme-card animate-fade-in">
    <button class="theme-button hover-lift" @click="decrement">-</button>
    <span class="count theme-text">{{ formattedCount }}</span>
    <button class="theme-button hover-lift" @click="increment">+</button>
    <button class="theme-button secondary hover-lift" @click="square">x²</button>
    <div class="info">
      <div class="theme-text">ID: {{ componentId }}</div>
      <div class="theme-text">平方值: {{ squareFormatted }}</div>
      <div class="loading-spinner animate-pulse" v-if="loading">spin1</div>
    </div>
  </div>
</template>

<script>
import { add, multiply, formatNumber, square } from '../utils/math.js'
import { capitalize, generateId, formatDate } from '../utils/helpers.js'
import '../styles/theme.css'

export default {
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
</script>

<style lang="scss" scoped>
@import '../styles/animations.scss';
.counter {
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

.count {
  font-size: 18px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}
</style> 