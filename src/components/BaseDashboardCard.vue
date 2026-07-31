<template>
  <section class="dashboard-card">
    <slot />
  </section>
</template>

<style scoped>
.dashboard-card {
  margin-top: 28px;
  padding: 28px;
  border: 1px solid rgba(195, 218, 234, 0.76);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: 0 16px 32px rgba(54, 97, 129, 0.07);
}
</style>
