<template>
  <div class="hello">
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
  </div>
</template>

<script>
import SimpleButton from './SimpleButton.vue'

export default {
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
</script>

<style lang="scss" scoped>
.hello {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  h2 {
    color: #42b983;
  }
}

.nested-content {
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