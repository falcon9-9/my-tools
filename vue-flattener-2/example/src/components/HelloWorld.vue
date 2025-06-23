<template>
  <div class="hello">
    <h2>{{ msg }}</h2>
    <p>这是一个子组件</p>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      default: 'Hello Vue!'
    }
  }
}
</script>

<style scoped>
.hello {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.hello h2 {
  color: #42b983;
}
</style> 