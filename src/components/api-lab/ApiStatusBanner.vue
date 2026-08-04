<script setup>
defineProps({
  type: { type: String, default: 'success' },
  message: { type: String, required: true },
})
</script>

<template>
  <p class="status-banner" :class="`status-banner--${type}`" :role="type === 'error' ? 'alert' : 'status'">
    <span aria-hidden="true">{{ type === 'error' ? '!' : '✓' }}</span>
    {{ message }}
  </p>
</template>

<style scoped>
.status-banner { display: flex; align-items: center; gap: 9px; margin: 0 0 18px; padding: 12px 14px; border: 1px solid #b8dccb; border-radius: 10px; color: #256144; background: #edf9f3; font-size: .86rem; font-weight: 700; }
.status-banner span { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; color: #fff; background: #3a9b69; font-size: .72rem; }
.status-banner--error { color: #8d3d3d; border-color: #efc8c8; background: #fff4f4; }
.status-banner--error span { background: #c75a5a; }
</style>
