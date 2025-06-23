<template>
  <div class="counter-button">
    <h4>计数器组件</h4>
    <div class="counter-display">
      当前计数: <span class="count">{{ count }}</span>
    </div>
    <div class="counter-controls">
      <button @click="decrement" class="btn btn-small">-</button>
      <button @click="increment" class="btn btn-small btn-primary">+</button>
      <button @click="reset" class="btn btn-small btn-secondary">重置</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CounterButton',
  props: {
    initialCount: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      count: this.initialCount
    }
  },
  watch: {
    count(newValue) {
      this.$emit('increment', newValue)
    }
  },
  methods: {
    increment() {
      this.count++
    },
    decrement() {
      this.count--
    },
    reset() {
      this.count = this.initialCount
    }
  }
}
</script>

<style scoped>
.counter-button {
  padding: 15px;
  margin: 10px 0;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  background: white;
}

.counter-button h4 {
  margin: 0 0 10px 0;
  color: #495057;
  font-size: 1em;
}

.counter-display {
  margin: 15px 0;
  text-align: center;
  font-size: 1.2em;
  color: #2c3e50;
}

.count {
  font-weight: bold;
  color: #42b983;
  font-size: 1.5em;
}

.counter-controls {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.btn-small {
  padding: 5px 12px;
  font-size: 0.9em;
  min-width: 50px;
}
</style> 