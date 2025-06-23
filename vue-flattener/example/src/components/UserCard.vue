<template>
  <div class="user-card" @click="handleClick">
    <img :src="user.avatar" :alt="user.name" class="avatar">
    <div class="user-info">
      <h4>{{ user.name }}</h4>
      <p>{{ user.email }}</p>
      <span class="user-id">ID: {{ user.id }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserCard',
  props: {
    user: {
      type: Object,
      required: true,
      validator(value) {
        return value && value.name && value.email
      }
    }
  },
  methods: {
    handleClick() {
      this.$emit('click', this.user)
    }
  }
}
</script>

<style scoped>
.user-card {
  display: flex;
  align-items: center;
  padding: 15px;
  margin: 10px 0;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.user-card:hover {
  border-color: #42b983;
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.2);
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  margin-right: 15px;
  object-fit: cover;
}

.user-info h4 {
  margin: 0 0 5px 0;
  color: #2c3e50;
}

.user-info p {
  margin: 0 0 5px 0;
  color: #7f8c8d;
  font-size: 0.9em;
}

.user-id {
  font-size: 0.8em;
  color: #95a5a6;
}
</style> 