<template>
  <div class="original-demo">
    <HelloWorld msg="欢迎使用Vue组件拍平工具!" />
    <Counter />
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'
import Counter from './components/Counter.vue'

export default {
  name: 'AppOriginal',
  components: {
    HelloWorld,
    Counter
  }
}
</script>

<style scoped>
.original-demo {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
</style> 