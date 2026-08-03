<script setup>
defineProps({
  searchQuery: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update-query'])

const updateQuery = (event) => {
  emit('update-query', event.target.value)
}
</script>

<template>
  <div class="search-section">
    <label for="city-search">도시 이름 검색</label>
    <div class="search-box">
      <span aria-hidden="true">⌕</span>
      <input
        id="city-search"
        type="text"
        placeholder="도시 이름을 한글로 입력하세요"
        :value="searchQuery"
        @input="updateQuery"
      />
    </div>
    <p class="search-result" aria-live="polite">
      입력한 도시:
      <strong>{{ searchQuery || '아직 입력하지 않았어요' }}</strong>
    </p>
  </div>
</template>

<style scoped>
.search-section label {
  display: block;
  margin-bottom: 11px;
  font-size: 0.88rem;
  font-weight: 700;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 18px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--shadow);
}

.search-box span {
  font-size: 1.65rem;
  color: #438dc2;
  transform: rotate(-15deg);
}

.search-box input {
  width: 100%;
  padding: 17px 0;
  border: 0;
  outline: 0;
  color: var(--ink);
  background: transparent;
}

.search-box:focus-within {
  border-color: #318bd0;
  box-shadow: 0 0 0 4px rgba(49, 139, 208, 0.13);
}

.search-result {
  min-height: 24px;
  margin: 10px 4px 0;
  font-size: 0.85rem;
  color: #6b7f90;
}

.search-result strong {
  color: #1c78bc;
}
</style>
