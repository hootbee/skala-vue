<script setup>
import { onMounted, reactive, ref, watch } from 'vue'
import { postApi } from '../../services/mockApi.js'

const props = defineProps({ refreshKey: { type: Number, default: 0 } })
const emit = defineEmits(['notify', 'changed'])
const posts = ref([])
const query = ref('')
const isLoading = ref(false)
const isSaving = ref(false)
const editingId = ref(null)
const emptyForm = () => ({ title: '', author: '', content: '' })
const form = reactive(emptyForm())
const formatDate = (value) => new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

async function loadPosts() {
  isLoading.value = true
  try {
    posts.value = await postApi.getAll({ q: query.value || undefined })
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

function startEdit(post) {
  editingId.value = post.id
  Object.assign(form, { title: post.title, author: post.author, content: post.content })
  document.querySelector('#post-form')?.scrollIntoView({ behavior: 'smooth' })
}

async function submitPost() {
  isSaving.value = true
  try {
    if (editingId.value) await postApi.update(editingId.value, { ...form })
    else await postApi.create({ ...form })
    emit('notify', { type: 'success', message: editingId.value ? '게시글이 수정되었습니다.' : '새 게시글이 등록되었습니다.' })
    clearForm()
    await loadPosts()
    emit('changed')
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  } finally {
    isSaving.value = false
  }
}

async function removePost(post) {
  if (!window.confirm(`“${post.title}” 게시글을 삭제할까요?`)) return
  try {
    await postApi.remove(post.id)
    if (editingId.value === post.id) clearForm()
    await loadPosts()
    emit('changed')
    emit('notify', { type: 'success', message: '게시글이 삭제되었습니다.' })
  } catch (error) {
    emit('notify', { type: 'error', message: error.message })
  }
}

function clearSearch() {
  query.value = ''
  loadPosts()
}

onMounted(loadPosts)
watch(() => props.refreshKey, loadPosts)
</script>

<template>
  <section class="manager-grid" aria-label="게시글 API 실습">
    <article id="post-form" class="panel panel--form">
      <header class="panel-heading">
        <div><span class="method-badge" :class="editingId ? 'patch' : 'post'">{{ editingId ? 'PATCH' : 'POST' }}</span><h2>{{ editingId ? '게시글 수정' : '게시글 작성' }}</h2></div>
        <button v-if="editingId" class="text-button" type="button" @click="clearForm">수정 취소</button>
      </header>
      <form class="data-form" @submit.prevent="submitPost">
        <label class="field"><span>제목 <b>*</b></span><input v-model.trim="form.title" required maxlength="100" placeholder="게시글 제목"></label>
        <label class="field"><span>작성자</span><input v-model.trim="form.author" maxlength="30" placeholder="비워두면 익명"></label>
        <label class="field"><span>내용</span><textarea v-model.trim="form.content" rows="8" maxlength="1000" placeholder="게시글 내용을 입력하세요."></textarea></label>
        <button class="primary-button wide" :disabled="isSaving">{{ isSaving ? '저장 중…' : editingId ? '수정 내용 저장' : '새 게시글 등록' }}</button>
      </form>
    </article>

    <article class="panel panel--content">
      <header class="panel-heading"><div><span class="method-badge get">GET</span><h2>게시글 목록</h2></div><span class="count-pill">{{ posts.length }}개</span></header>
      <form class="filter-bar posts-filter" @submit.prevent="loadPosts">
        <label class="search-field"><span>게시글 검색</span><input v-model.trim="query" placeholder="제목·내용·작성자 검색"></label>
        <button class="primary-button" type="submit">조회</button><button class="secondary-button" type="button" @click="clearSearch">초기화</button>
      </form>
      <p v-if="isLoading" class="empty-state" role="status">게시글을 불러오는 중입니다.</p>
      <p v-else-if="posts.length === 0" class="empty-state">조건에 맞는 게시글이 없습니다.</p>
      <div v-else class="item-list">
        <article v-for="post in posts" :key="post.id" class="item-card post-card">
          <div class="post-meta"><span>#{{ post.id }}</span><span>{{ post.author }}</span><time :datetime="post.updatedAt">{{ formatDate(post.updatedAt) }}</time></div>
          <h3>{{ post.title }}</h3><p>{{ post.content || '작성된 내용이 없습니다.' }}</p>
          <div class="actions actions-end"><button class="secondary-button small" @click="startEdit(post)">수정</button><button class="danger-button small" @click="removePost(post)">삭제</button></div>
        </article>
      </div>
    </article>
  </section>
</template>

<style scoped src="../../assets/api-lab-manager.css"></style>
