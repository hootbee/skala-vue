<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { authApi } from '../../services/mockApi.js'

const props = defineProps({ refreshKey: { type: Number, default: 0 } })
const emit = defineEmits(['notify', 'changed'])

const registration = reactive({ name: '', email: '', password: '', passwordConfirm: '' })
const login = reactive({ email: 'demo@skala.dev', password: 'demo1234' })
const token = ref('')
const currentUser = ref(null)
const isRegistering = ref(false)
const isLoggingIn = ref(false)
const isCheckingSession = ref(false)
const isLoggingOut = ref(false)

const maskedToken = computed(() => token.value ? `${token.value.slice(0, 10)}••••••••${token.value.slice(-8)}` : '')

function notify(type, message) {
  emit('notify', { type, message })
}

function clearSession() {
  token.value = ''
  currentUser.value = null
}

async function registerUser() {
  if (registration.password !== registration.passwordConfirm) {
    notify('error', '비밀번호 확인이 일치하지 않습니다.')
    return
  }
  isRegistering.value = true
  try {
    const result = await authApi.register({
      name: registration.name,
      email: registration.email,
      password: registration.password,
    })
    login.email = result.user.email
    login.password = ''
    Object.assign(registration, { name: '', email: '', password: '', passwordConfirm: '' })
    notify('success', `${result.message} 가입한 이메일로 로그인해 보세요.`)
    emit('changed')
  } catch (error) {
    notify('error', error.message)
  } finally {
    isRegistering.value = false
  }
}

async function loginUser() {
  isLoggingIn.value = true
  try {
    const result = await authApi.login(login)
    token.value = result.token
    currentUser.value = result.user
    login.password = ''
    notify('success', result.message)
    emit('changed')
  } catch (error) {
    clearSession()
    notify('error', error.message)
  } finally {
    isLoggingIn.value = false
  }
}

async function fetchCurrentUser() {
  if (!token.value) return
  isCheckingSession.value = true
  try {
    const result = await authApi.getMe(token.value)
    currentUser.value = result.user
    notify('success', 'Bearer 토큰으로 사용자 정보를 확인했습니다.')
  } catch (error) {
    clearSession()
    notify('error', error.message)
    emit('changed')
  } finally {
    isCheckingSession.value = false
  }
}

async function logoutUser() {
  if (!token.value) return
  isLoggingOut.value = true
  try {
    const result = await authApi.logout(token.value)
    clearSession()
    notify('success', result.message)
    emit('changed')
  } catch (error) {
    clearSession()
    notify('error', error.message)
    emit('changed')
  } finally {
    isLoggingOut.value = false
  }
}

watch(() => props.refreshKey, () => {
  clearSession()
  Object.assign(registration, { name: '', email: '', password: '', passwordConfirm: '' })
  Object.assign(login, { email: 'demo@skala.dev', password: 'demo1234' })
})
</script>

<template>
  <div class="manager-grid auth-manager">
    <section class="panel panel--form" aria-labelledby="register-title">
      <div class="panel-heading">
        <div><span class="method-badge post">POST</span><h2 id="register-title">회원가입</h2></div>
      </div>
      <p class="endpoint"><code>/api/auth/register</code></p>
      <form class="data-form" @submit.prevent="registerUser">
        <label class="field">이름 <b aria-hidden="true">*</b><input v-model.trim="registration.name" name="name" autocomplete="name" minlength="2" maxlength="30" required placeholder="홍길동" /></label>
        <label class="field">이메일 <b aria-hidden="true">*</b><input v-model.trim="registration.email" name="email" type="email" autocomplete="email" required placeholder="user@example.com" /></label>
        <label class="field">비밀번호 <b aria-hidden="true">*</b><input v-model="registration.password" name="password" type="password" autocomplete="new-password" minlength="8" maxlength="128" required placeholder="8자 이상" /></label>
        <label class="field">비밀번호 확인 <b aria-hidden="true">*</b><input v-model="registration.passwordConfirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" maxlength="128" required placeholder="비밀번호 다시 입력" /></label>
        <button class="primary-button wide" type="submit" :disabled="isRegistering">{{ isRegistering ? '가입 요청 중…' : '회원가입 요청' }}</button>
      </form>
    </section>

    <div class="auth-stack">
      <section class="panel" aria-labelledby="login-title">
        <div class="panel-heading">
          <div><span class="method-badge post">POST</span><h2 id="login-title">로그인</h2></div>
          <span class="demo-badge">DEMO 계정</span>
        </div>
        <p class="endpoint"><code>/api/auth/login</code></p>
        <form class="data-form login-form" @submit.prevent="loginUser">
          <label class="field">이메일<input v-model.trim="login.email" name="email" type="email" autocomplete="username" required /></label>
          <label class="field">비밀번호<input v-model="login.password" name="password" type="password" autocomplete="current-password" required /></label>
          <button class="primary-button" type="submit" :disabled="isLoggingIn">{{ isLoggingIn ? '로그인 중…' : '로그인' }}</button>
        </form>
        <p class="demo-help">초기 계정: <code>demo@skala.dev</code> / <code>demo1234</code></p>
      </section>

      <section class="panel session-panel" aria-labelledby="session-title" aria-live="polite">
        <div class="panel-heading">
          <div><span class="method-badge get">GET</span><h2 id="session-title">인증 세션</h2></div>
          <span class="session-state" :class="{ active: currentUser }">{{ currentUser ? '로그인됨' : '로그아웃됨' }}</span>
        </div>

        <div v-if="currentUser" class="user-summary">
          <span class="avatar" aria-hidden="true">{{ currentUser.name.slice(0, 1) }}</span>
          <div><strong>{{ currentUser.name }}</strong><span>{{ currentUser.email }}</span></div>
        </div>
        <p v-else class="empty-session">로그인하면 발급된 토큰과 현재 사용자 정보를 여기에서 확인할 수 있습니다.</p>

        <dl v-if="currentUser" class="session-data">
          <div><dt>사용자 ID</dt><dd>{{ currentUser.id }}</dd></div>
          <div><dt>Bearer Token</dt><dd><code>{{ maskedToken }}</code></dd></div>
          <div><dt>가입 시각</dt><dd>{{ new Date(currentUser.createdAt).toLocaleString('ko-KR') }}</dd></div>
        </dl>

        <div class="session-actions">
          <button class="secondary-button" type="button" :disabled="!token || isCheckingSession" @click="fetchCurrentUser">{{ isCheckingSession ? '조회 중…' : 'GET /auth/me' }}</button>
          <button class="danger-button" type="button" :disabled="!token || isLoggingOut" @click="logoutUser">{{ isLoggingOut ? '로그아웃 중…' : 'POST /auth/logout' }}</button>
        </div>
      </section>

      <aside class="security-note">
        <strong>학습용 인증 API</strong>
        <p>비밀번호는 서버 메모리에 해시로 저장되고 응답에는 포함되지 않습니다. 토큰도 이 화면의 메모리에만 보관되며, 운영 서비스에서는 HTTPS와 안전한 쿠키·세션 정책이 추가로 필요합니다.</p>
      </aside>
    </div>
  </div>
</template>

<style scoped src="../../assets/api-lab-manager.css"></style>
<style scoped>
.auth-stack { display: grid; gap: 20px; }
.endpoint { margin: -10px 0 20px; color: var(--muted); font-size: .75rem; }
.endpoint code, .demo-help code, .session-data code { padding: 3px 6px; border-radius: 5px; color: var(--blue-700); background: var(--blue-100); }
.login-form { grid-template-columns: 1fr 1fr auto; align-items: end; }
.demo-badge, .session-state { padding: 5px 9px; border-radius: 999px; color: #6b7780; background: #edf2f5; font-size: .68rem; font-weight: 800; }
.session-state.active { color: #246d4d; background: #e3f4eb; }
.demo-help { margin: 14px 0 0; color: var(--muted); font-size: .73rem; }
.user-summary { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
.avatar { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 12px; color: #fff; background: var(--blue-700); font-weight: 900; }
.user-summary strong, .user-summary span { display: block; }
.user-summary span { margin-top: 3px; color: var(--muted); font-size: .76rem; }
.empty-session { margin: 0 0 18px; color: var(--muted); font-size: .82rem; line-height: 1.7; }
.session-data { display: grid; gap: 1px; margin: 0 0 18px; overflow: hidden; border: 1px solid #e1eaf0; border-radius: 10px; background: #e1eaf0; }
.session-data > div { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 12px; padding: 11px 13px; background: #fff; }
.session-data dt { color: var(--muted); font-size: .72rem; font-weight: 800; }
.session-data dd { min-width: 0; margin: 0; overflow-wrap: anywhere; color: var(--ink); font-size: .75rem; }
.session-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.security-note { padding: 18px 20px; border: 1px solid #cfe0eb; border-radius: 14px; color: #355b73; background: #f2f8fb; }
.security-note strong { font-size: .8rem; }
.security-note p { margin: 7px 0 0; font-size: .75rem; line-height: 1.7; }
@media (max-width: 680px) {
  .login-form { grid-template-columns: 1fr; }
  .session-data > div { grid-template-columns: 1fr; gap: 5px; }
  .session-actions button { flex: 1 1 150px; }
}
</style>
