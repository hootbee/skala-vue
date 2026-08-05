<script setup>
import { onMounted, ref } from 'vue'
import SelectButton from 'primevue/selectbutton'
import { useToast } from 'primevue/usetoast'
import PostManager from '../components/api-lab/PostManager.vue'
import ProductManager from '../components/api-lab/ProductManager.vue'
import { systemApi } from '../services/mockApi.js'

document.title = 'Mock API 실습 | SKALA Weather'

const activeTab = ref('products')
const tabOptions = [
  { label: '상품 API', value: 'products' },
  { label: '게시글 API', value: 'posts' },
]
const toast = useToast()
const health = ref(null)
const isChecking = ref(false)
const isResetting = ref(false)
const refreshKey = ref(0)

function showNotice(payload) {
  const severity = payload.type === 'error' ? 'error' : payload.type === 'success' ? 'success' : 'info'
  toast.add({ severity, summary: payload.type === 'error' ? '요청 실패' : '작업 완료', detail: payload.message, life: 4000 })
}

async function checkHealth({ quiet = false } = {}) {
  isChecking.value = true
  try {
    health.value = await systemApi.getHealth()
  } catch (error) {
    health.value = null
    if (!quiet) showNotice({ type: 'error', message: error.message })
  } finally {
    isChecking.value = false
  }
}

async function resetAllData() {
  if (!window.confirm('상품과 게시글 데이터를 처음 상태로 되돌릴까요?')) return
  isResetting.value = true
  try {
    const result = await systemApi.reset()
    refreshKey.value += 1
    await checkHealth({ quiet: true })
    showNotice({ type: 'success', message: result.message })
  } catch (error) {
    showNotice({ type: 'error', message: error.message })
  } finally {
    isResetting.value = false
  }
}

onMounted(() => checkHealth({ quiet: true }))
</script>

<template>
  <main class="lab-page">
    <header class="lab-header">
      <div class="header-copy">
        <p class="eyebrow">VUE 3 · AXIOS · NODE HTTP</p>
        <h1>Mock API 실습실</h1>
        <p>상품과 게시글 데이터를 직접 조회하고 변경하며 Vue의 비동기 통신과 REST API 흐름을 익혀보세요.</p>
      </div>
      <aside class="server-status" aria-live="polite">
        <span class="status-dot" :class="{ online: health }" aria-hidden="true"></span>
        <div><strong>{{ health ? 'API 연결됨' : 'API 연결 확인 필요' }}</strong><small v-if="health">상품 {{ health.productCount }}개 · 게시글 {{ health.postCount }}개</small><small v-else>localhost:3001 · npm run dev:all</small></div>
        <button type="button" :disabled="isChecking" @click="checkHealth()">{{ isChecking ? '확인 중' : '다시 확인' }}</button>
      </aside>
    </header>

    <section class="lab-workspace" aria-label="Mock API 작업 공간">
      <div class="toolbar">
        <SelectButton
          v-model="activeTab"
          class="tabs"
          :options="tabOptions"
          option-label="label"
          option-value="value"
          aria-label="API 실습 선택"
          :allow-empty="false"
        />
        <button class="reset-button" type="button" :disabled="isResetting" @click="resetAllData">{{ isResetting ? '초기화 중…' : 'Mock 데이터 초기화' }}</button>
      </div>

      <ProductManager v-if="activeTab === 'products'" role="tabpanel" aria-label="상품 API" :refresh-key="refreshKey" @notify="showNotice" @changed="checkHealth({ quiet: true })" />
      <PostManager v-else role="tabpanel" aria-label="게시글 API" :refresh-key="refreshKey" @notify="showNotice" @changed="checkHealth({ quiet: true })" />

      <footer class="flow-note" aria-label="API 통신 구조">
        <code>Vue :5173</code><span aria-hidden="true">→</span><span>Axios 요청</span><span aria-hidden="true">→</span><code>Mock API :3001</code>
        <p>데이터는 서버 메모리에만 저장되어 Mock API 서버를 다시 시작하면 초기화됩니다.</p>
      </footer>
    </section>
  </main>
</template>

<style scoped>
.lab-page { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 38px 0 72px; color: var(--ink); }
.lab-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 36px; padding: 38px 0 42px; border-bottom: 1px solid var(--line); }
.header-copy { max-width: 680px; }
.eyebrow { margin: 0 0 10px; color: var(--blue-500); font-size: .7rem; font-weight: 800; letter-spacing: .16em; }
h1 { margin: 0; font-size: clamp(2.3rem, 6vw, 4rem); line-height: 1.08; letter-spacing: -.06em; }
.header-copy > p:last-child { max-width: 650px; margin: 18px 0 0; color: var(--muted); line-height: 1.8; }
.server-status { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 11px; min-width: 340px; padding: 15px; border: 1px solid var(--line); border-radius: 14px; background: var(--surface); box-shadow: var(--shadow); }
.status-dot { width: 9px; height: 9px; border-radius: 50%; background: #c96060; box-shadow: 0 0 0 5px #fbeaea; }
.status-dot.online { background: #32956a; box-shadow: 0 0 0 5px #e2f5eb; }
.server-status strong, .server-status small { display: block; }
.server-status strong { font-size: .82rem; }
.server-status small { margin-top: 3px; color: var(--muted); font-size: .68rem; }
.server-status button { min-height: 36px; padding: 7px 10px; border: 1px solid #c9dce8; border-radius: 8px; color: var(--blue-700); background: #fff; font: inherit; font-size: .72rem; font-weight: 800; }
.server-status button:hover { background: var(--blue-100); }
.lab-workspace { padding-top: 24px; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.tabs { display: inline-flex; gap: 4px; padding: 4px; border-radius: 11px; background: #e6eef3; }
.tabs :deep(.p-togglebutton) { min-height: 40px; padding: 8px 16px; border: 0; border-radius: 8px; color: var(--muted); background: transparent; box-shadow: none; font-size: .8rem; font-weight: 800; }
.tabs :deep(.p-togglebutton:hover) { color: var(--blue-700); background: rgba(255,255,255,.55); }
.tabs :deep(.p-togglebutton-checked) { color: var(--blue-700); background: #fff; box-shadow: 0 2px 7px rgba(35, 81, 112, .1); }
.reset-button { min-height: 40px; padding: 8px 13px; border: 1px solid #eacaca; border-radius: 8px; color: #a24646; background: #fff6f6; font: inherit; font-size: .76rem; font-weight: 800; }
.reset-button:hover { background: #ffecec; }
.flow-note { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 9px; margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--line); color: var(--muted); font-size: .74rem; }
.flow-note code { padding: 4px 7px; border-radius: 6px; color: var(--blue-700); background: var(--blue-100); }
.flow-note p { flex-basis: 100%; margin: 5px 0 0; text-align: center; }
button:disabled { cursor: wait; opacity: .6; }
@media (max-width: 820px) { .lab-header { align-items: stretch; flex-direction: column; } .server-status { min-width: 0; } }
@media (max-width: 520px) { .lab-page { width: min(100% - 24px, 1120px); padding-top: 16px; } .lab-header { gap: 24px; padding: 28px 0 32px; } .server-status { grid-template-columns: auto 1fr; } .server-status button { grid-column: 1 / -1; } .toolbar { align-items: stretch; flex-direction: column; } .tabs { display: grid; grid-template-columns: 1fr 1fr; } .reset-button { width: 100%; } }
</style>
