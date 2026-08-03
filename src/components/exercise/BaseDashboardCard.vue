<template>
  <section class="dashboard-card">
    <slot />
  </section>
</template>

<style scoped>
.dashboard-card {
  margin-top: 24px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
</style>
