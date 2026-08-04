<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { productApi } from '../../services/mockApi.js'

const props = defineProps({ refreshKey: { type: Number, default: 0 } })
const emit = defineEmits(['notify', 'changed'])
const products = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const editingId = ref(null)
const filters = reactive({ q: '', category: '전체', available: false })
const emptyForm = () => ({ name: '', category: '장비', price: 0, stock: 0, description: '' })
const form = reactive(emptyForm())

const formatPrice = (price) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(price)

async function loadProducts() {
  isLoading.value = true
  try {
    products.value = await productApi.getAll({ q: filters.q || undefined, category: filters.category, available: filters.available || undefined })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isLoading.value = false
  }
}

function clearForm() {
  editingId.value = null
  Object.assign(form, emptyForm())
}

function startEdit(product) {
  editingId.value = product.id
  Object.assign(form, product)
  document.querySelector('#product-form')?.scrollIntoView({ behavior: 'smooth' })
}

async function submitProduct() {
  isSaving.value = true
  try {
    if (editingId.value) await productApi.update(editingId.value, { ...form })
    else await productApi.create({ ...form })
    emit('notify', { type: 'success', message: editingId.value ? '상품이 수정되었습니다.' : '새 상품이 등록되었습니다.' })
    clearForm()
    await loadProducts()
    emit('changed')
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isSaving.value = false
  }
}

async function removeProduct(product) {
  if (!window.confirm(`“${product.name}” 상품을 삭제할까요?`)) return
  try {
    await productApi.remove(product.id)
    if (editingId.value === product.id) clearForm()
    await loadProducts()
    emit('changed')
    emit('notify', { type: 'success', message: '상품이 삭제되었습니다.' })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  }
}

function resetFilters() {
  Object.assign(filters, { q: '', category: '전체', available: false })
  loadProducts()
}

onMounted(loadProducts)
watch(() => props.refreshKey, loadProducts)
</script>

<template>
  <section class="manager-grid" aria-label="상품 API 실습">
    <article id="product-form" class="panel panel--form">
      <header class="panel-heading">
        <div><span class="method-badge" :class="editingId ? 'patch' : 'post'">{{ editingId ? 'PATCH' : 'POST' }}</span><h2>{{ editingId ? '상품 수정' : '상품 등록' }}</h2></div>
        <button v-if="editingId" class="text-button" type="button" @click="clearForm">수정 취소</button>
      </header>
      <form class="data-form" @submit.prevent="submitProduct">
        <label class="field"><span>상품명 <b>*</b></span><input v-model.trim="form.name" required maxlength="80" placeholder="예: 노트북 거치대"></label>
        <div class="field-row">
          <label class="field"><span>카테고리</span><select v-model="form.category"><option>장비</option><option>도서</option><option>강의</option><option>기타</option></select></label>
          <label class="field"><span>재고</span><input v-model.number="form.stock" type="number" min="0" step="1" required></label>
        </div>
        <label class="field"><span>가격</span><input v-model.number="form.price" type="number" min="0" step="100" required></label>
        <label class="field"><span>상품 설명</span><textarea v-model.trim="form.description" rows="4" maxlength="300" placeholder="상품의 특징을 입력하세요."></textarea></label>
        <button class="primary-button wide" :disabled="isSaving">{{ isSaving ? '저장 중…' : editingId ? '수정 내용 저장' : '새 상품 등록' }}</button>
      </form>
    </article>

    <article class="panel panel--content">
      <header class="panel-heading"><div><span class="method-badge get">GET</span><h2>상품 목록</h2></div><span class="count-pill">{{ products.length }}개</span></header>
      <form class="filter-bar" @submit.prevent="loadProducts">
        <label class="search-field"><span>상품 검색</span><input v-model.trim="filters.q" placeholder="상품명·설명 검색"></label>
        <label><span class="visually-hidden">카테고리</span><select v-model="filters.category"><option>전체</option><option>장비</option><option>도서</option><option>강의</option><option>기타</option></select></label>
        <label class="check-field"><input v-model="filters.available" type="checkbox"> 재고 있음</label>
        <button class="primary-button" type="submit">조회</button><button class="secondary-button" type="button" @click="resetFilters">초기화</button>
      </form>
      <p v-if="isLoading" class="empty-state" role="status">상품을 불러오는 중입니다.</p>
      <p v-else-if="products.length === 0" class="empty-state">조건에 맞는 상품이 없습니다.</p>
      <div v-else class="item-list">
        <article v-for="product in products" :key="product.id" class="item-card">
          <div class="item-top"><div><span class="category-tag">{{ product.category }}</span><h3>{{ product.name }}</h3></div><strong>{{ formatPrice(product.price) }}</strong></div>
          <p>{{ product.description || '등록된 상품 설명이 없습니다.' }}</p>
          <div class="item-bottom"><span :class="{ danger: product.stock === 0 }">{{ product.stock === 0 ? '품절' : `재고 ${product.stock}개` }}</span><div class="actions"><button class="secondary-button small" @click="startEdit(product)">수정</button><button class="danger-button small" @click="removeProduct(product)">삭제</button></div></div>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped src="../../assets/api-lab-manager.css"></style>
