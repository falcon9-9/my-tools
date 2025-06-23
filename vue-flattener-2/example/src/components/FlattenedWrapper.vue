<template>
  <div class="flattened-wrapper">
    <component :is="flattenedComponent" v-if="flattenedComponent" />
    <div v-else class="loading">
      正在加载拍平后的组件...
    </div>
  </div>
</template>

<script>
export default {
  name: 'FlattenedWrapper',
  data() {
    return {
      flattenedComponent: null
    }
  },
  mounted() {
    this.loadFlattenedComponent();
  },
  methods: {
    async loadFlattenedComponent() {
      try {
        // 动态导入拍平后的组件
        const module = await import('../App.flattened.vue');
        this.flattenedComponent = module.default;
      } catch (error) {
        console.error('加载拍平组件失败:', error);
      }
    }
  }
}
</script>

<style scoped>
.flattened-wrapper {
  min-height: 200px;
}

.loading {
  text-align: center;
  color: #999;
  padding: 20px;
}
</style> 