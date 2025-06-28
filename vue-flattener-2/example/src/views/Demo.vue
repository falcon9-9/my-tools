<template>
      <div class="demo">
        <HelloWorld msg="欢迎使用Vue组件拍平工具！@import功能已实现" />
        <Counter />
      </div>
</template>

<script>
import HelloWorld from '../components/HelloWorld.vue'
import Counter from '../components/Counter.vue'

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