<template>
  <div class="flattened-demo">
    <HelloWorld msg="欢迎使用Vue组件拍平工具!" />
    <Counter />
  </div>
</template>

<script>
const HelloWorld = {
  template: `<div class="hello">
    <h2>{{ msg }}</h2>
    <p>这是一个子组件</p>
  </div>`,
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      default: 'Hello Vue!'
    }
  }
}

const Counter = {
  template: `<div class="counter">
    <button @click="decrement">-</button>
    <span class="count">{{ count }}</span>
    <button @click="increment">+</button>
  </div>`,
  name: 'Counter',
  data() {
    return {
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    }
  }
}

export default {
  name: 'AppFlattened',
  components: {
    HelloWorld,
    Counter
  }
}
</script>

<style scoped>
.flattened-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hello {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hello h2 {
  color: #42b983;
}

.counter {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #e3f2fd;
  border-radius: 5px;
}

.counter button {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 4px;
  background-color: #2196f3;
  color: white;
  font-size: 18px;
  cursor: pointer;
}

.counter button:hover {
  background-color: #1976d2;
}

.count {
  font-size: 18px;
  font-weight: bold;
  min-width: 30px;
  text-align: center;
}
</style> 