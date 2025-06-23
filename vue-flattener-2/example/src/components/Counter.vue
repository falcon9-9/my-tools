<template>
  <div class="counter">
    <button @click="decrement">-</button>
    <span class="count">{{ count }}</span>
    <button @click="increment">+</button>
  </div>
</template>

<script>
export default {
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
</script>

<style scoped>
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