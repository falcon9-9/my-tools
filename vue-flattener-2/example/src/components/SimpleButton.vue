<template>
  <button class="simple-btn" @click="handleClick">
    <span class="btn-text">{{ label }}</span>
    <span class="btn-icon">✨</span>
  </button>
</template>

<script>
export default {
  name: 'SimpleButton',
  props: {
    label: {
      type: String,
      default: '点击我'
    }
  },
  methods: {
    handleClick() {
      this.$emit('button-clicked', this.label)
    }
  }
}
</script>

<style scoped>
.simple-btn {
  background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.simple-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(255, 107, 107, 0.3);
}

.btn-text {
  font-size: 14px;
  font-weight: 500;
}

.btn-icon {
  font-size: 12px;
}
</style> 