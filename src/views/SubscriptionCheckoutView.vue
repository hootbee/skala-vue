<script setup>
import { computed, nextTick, ref } from 'vue'

document.title = 'SKALA Weather Pro 구독 | 안전한 결제'

const billingCycle = ref('yearly')
const paymentMethod = ref('card')
const cardNumber = ref('')
const expiry = ref('')
const cvc = ref('')
const cardholder = ref('')
const email = ref('')
const agreed = ref(false)
const isSubmitting = ref(false)
const isComplete = ref(false)
const errorMessage = ref('')
const formStatus = ref(null)

const plans = {
  monthly: { label: '월간', price: 6900, description: '언제든 해지 가능' },
  yearly: { label: '연간', price: 55200, description: '월 4,600원 · 20% 절약' },
}

const currentPlan = computed(() => plans[billingCycle.value])
const formattedPrice = computed(() => `${currentPlan.value.price.toLocaleString('ko-KR')}원`)
const nextBillingDate = computed(() => {
  const date = new Date()
  if (billingCycle.value === 'yearly') date.setFullYear(date.getFullYear() + 1)
  else date.setMonth(date.getMonth() + 1)
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
})

const onlyDigits = (value, maxLength) => value.replace(/\D/g, '').slice(0, maxLength)

const formatCardNumber = (event) => {
  cardNumber.value = onlyDigits(event.target.value, 16).replace(/(\d{4})(?=\d)/g, '$1 ')
}

const formatExpiry = (event) => {
  const digits = onlyDigits(event.target.value, 4)
  expiry.value = digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits
}

const formatCvc = (event) => {
  cvc.value = onlyDigits(event.target.value, 3)
}

const validate = () => {
  if (!email.value || !/^\S+@\S+\.\S+$/.test(email.value)) return '이메일 주소를 정확히 입력해 주세요.'
  if (paymentMethod.value === 'card') {
    if (onlyDigits(cardNumber.value, 16).length !== 16) return '카드 번호 16자리를 확인해 주세요.'
    const [month, year] = expiry.value.replaceAll(' ', '').split('/')
    if (!month || !year || Number(month) < 1 || Number(month) > 12) return '카드 유효기간을 확인해 주세요.'
    if (cvc.value.length !== 3) return 'CVC 3자리를 입력해 주세요.'
    if (!cardholder.value.trim()) return '카드 소유자 이름을 입력해 주세요.'
  }
  if (!agreed.value) return '결제 및 구독 약관에 동의해 주세요.'
  return ''
}

const submitPayment = async () => {
  errorMessage.value = validate()
  if (errorMessage.value) {
    await nextTick()
    formStatus.value?.focus()
    return
  }

  isSubmitting.value = true
  await new Promise((resolve) => setTimeout(resolve, 900))
  isSubmitting.value = false
  isComplete.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <main class="checkout-page">
    <section v-if="isComplete" class="success-panel" aria-labelledby="success-title">
      <span class="success-icon" aria-hidden="true">✓</span>
      <p class="eyebrow">PAYMENT COMPLETE</p>
      <h1 id="success-title">이제 더 깊은 날씨를 만나보세요.</h1>
      <p class="success-copy">
        <strong>{{ email }}</strong>로 구독 확인 메일을 보냈습니다.<br>
        SKALA Weather Pro의 모든 기능을 바로 사용할 수 있어요.
      </p>
      <div class="receipt">
        <span>결제 금액</span>
        <strong>{{ formattedPrice }}</strong>
        <span>다음 결제일</span>
        <strong>{{ nextBillingDate }}</strong>
      </div>
      <RouterLink class="primary-link" to="/">날씨 홈으로 이동</RouterLink>
    </section>

    <template v-else>
      <header class="checkout-header">
        <RouterLink class="back-link" to="/" aria-label="날씨 홈으로 돌아가기">← 돌아가기</RouterLink>
        <div class="secure-label"><span aria-hidden="true">●</span> 안전한 결제</div>
      </header>

      <div class="checkout-layout">
        <section class="checkout-main" aria-labelledby="checkout-title">
          <p class="eyebrow">SKALA WEATHER PRO</p>
          <h1 id="checkout-title">날씨를 미리 알고,<br>하루를 여유롭게.</h1>
          <p class="lead">광고 없이 더 긴 예보와 세밀한 생활 기상 정보를 확인하세요.</p>

          <div class="plan-toggle" aria-label="결제 주기 선택">
            <label :class="{ selected: billingCycle === 'monthly' }">
              <input v-model="billingCycle" type="radio" value="monthly">
              <span>월간</span>
              <strong>월 6,900원</strong>
            </label>
            <label :class="{ selected: billingCycle === 'yearly' }">
              <span class="save-badge">20% 절약</span>
              <input v-model="billingCycle" type="radio" value="yearly">
              <span>연간</span>
              <strong>연 55,200원</strong>
            </label>
          </div>

          <form class="payment-form" novalidate @submit.prevent="submitPayment">
            <div class="form-heading">
              <span>01</span>
              <div><h2>연락처 정보</h2><p>영수증과 구독 안내를 보내드려요.</p></div>
            </div>
            <div class="field">
              <label for="email">이메일</label>
              <input id="email" v-model.trim="email" type="email" autocomplete="email" placeholder="weather@example.com">
            </div>

            <div class="form-heading payment-heading">
              <span>02</span>
              <div><h2>결제 수단</h2><p>원하는 결제 방법을 선택하세요.</p></div>
            </div>
            <div class="payment-tabs" role="radiogroup" aria-label="결제 수단">
              <label :class="{ active: paymentMethod === 'card' }">
                <input v-model="paymentMethod" type="radio" value="card">
                <span aria-hidden="true">▣</span> 신용·체크카드
              </label>
              <label :class="{ active: paymentMethod === 'kakao' }">
                <input v-model="paymentMethod" type="radio" value="kakao">
                <span class="kakao-mark" aria-hidden="true">K</span> 카카오페이
              </label>
            </div>

            <div v-if="paymentMethod === 'card'" class="card-fields">
              <div class="field full-field">
                <label for="card-number">카드 번호</label>
                <div class="input-with-mark">
                  <input id="card-number" :value="cardNumber" inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" @input="formatCardNumber">
                  <span aria-hidden="true">VISA</span>
                </div>
              </div>
              <div class="field">
                <label for="expiry">유효기간</label>
                <input id="expiry" :value="expiry" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" @input="formatExpiry">
              </div>
              <div class="field">
                <label for="cvc">CVC</label>
                <input id="cvc" :value="cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="카드 뒷면 3자리" @input="formatCvc">
              </div>
              <div class="field full-field">
                <label for="cardholder">카드 소유자 이름</label>
                <input id="cardholder" v-model="cardholder" autocomplete="cc-name" placeholder="카드에 표시된 이름">
              </div>
            </div>
            <div v-else class="kakao-info">
              <span class="kakao-logo" aria-hidden="true">K</span>
              <div><strong>카카오페이로 결제</strong><p>아래 결제 버튼을 누르면 카카오페이 인증 화면으로 연결됩니다.</p></div>
            </div>

            <label class="agreement">
              <input v-model="agreed" type="checkbox">
              <span><strong>필수</strong> 정기 결제 및 구독 이용약관에 동의합니다. 구독은 언제든 해지할 수 있으며, 다음 결제일부터 청구되지 않습니다.</span>
            </label>

            <p v-if="errorMessage" ref="formStatus" class="form-error" role="alert" tabindex="-1">{{ errorMessage }}</p>
            <button class="submit-button" type="submit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner" aria-hidden="true"></span>
              {{ isSubmitting ? '안전하게 처리 중…' : `${formattedPrice} 결제하고 시작하기` }}
            </button>
            <p class="demo-notice">데모 화면입니다. 실제 결제나 카드 정보 전송은 발생하지 않습니다.</p>
          </form>
        </section>

        <aside class="order-card" aria-labelledby="order-title">
          <div class="plan-visual">
            <span class="weather-orb" aria-hidden="true">☀</span>
            <div><p>SKALA WEATHER</p><strong>PRO</strong></div>
          </div>
          <h2 id="order-title">주문 요약</h2>
          <div class="summary-row"><span>Weather Pro {{ currentPlan.label }}</span><strong>{{ formattedPrice }}</strong></div>
          <p class="plan-description">{{ currentPlan.description }}</p>
          <ul class="benefit-list">
            <li><span aria-hidden="true">✓</span> 시간대별 14일 상세 예보</li>
            <li><span aria-hidden="true">✓</span> 관심 지역 무제한 저장</li>
            <li><span aria-hidden="true">✓</span> 비·미세먼지 맞춤 알림</li>
            <li><span aria-hidden="true">✓</span> 광고 없는 깔끔한 화면</li>
          </ul>
          <div class="summary-total">
            <div><span>오늘 결제 금액</span><small>부가세 포함</small></div>
            <strong>{{ formattedPrice }}</strong>
          </div>
          <p class="renewal-note">다음 결제일은 <strong>{{ nextBillingDate }}</strong>이며, 그 전까지 언제든 해지할 수 있습니다.</p>
        </aside>
      </div>
    </template>
  </main>
</template>

<style scoped>
.checkout-page { width: min(1120px, calc(100% - 40px)); margin: 0 auto; padding: 18px 0 72px; }
.checkout-header { display: flex; align-items: center; justify-content: space-between; margin: 10px 0 46px; }
.back-link { color: var(--muted); font-size: .9rem; font-weight: 700; text-decoration: none; }
.back-link:hover { color: var(--blue-700); }
.secure-label { display: flex; align-items: center; gap: 8px; color: #557186; font-size: .82rem; font-weight: 700; }
.secure-label span { color: #30a570; font-size: .65rem; }
.checkout-layout { display: grid; grid-template-columns: minmax(0, 1fr) 380px; align-items: start; gap: 72px; }
.checkout-main { max-width: 610px; }
.eyebrow { margin: 0 0 12px; color: var(--blue-500); font-size: .72rem; font-weight: 800; letter-spacing: .18em; }
h1 { margin: 0; color: #15364f; font-size: clamp(2.35rem, 5vw, 4.25rem); line-height: 1.08; letter-spacing: -.065em; }
.lead { max-width: 520px; margin: 20px 0 30px; color: var(--muted); line-height: 1.75; }
.plan-toggle { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 46px; }
.plan-toggle label { position: relative; display: grid; gap: 4px; padding: 17px 18px; border: 1px solid var(--line); border-radius: 14px; color: var(--muted); background: rgba(255,255,255,.66); cursor: pointer; transition: border-color .2s, box-shadow .2s, background .2s; }
.plan-toggle label.selected { border-color: var(--blue-500); color: var(--ink); background: #fff; box-shadow: 0 0 0 3px rgba(49,139,208,.1); }
.plan-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.plan-toggle label:has(input:focus-visible) { outline: 3px solid rgba(49,139,208,.4); outline-offset: 3px; }
.plan-toggle span { font-size: .82rem; font-weight: 700; }
.plan-toggle strong { font-size: 1rem; }
.save-badge { position: absolute; top: -11px; right: 12px; padding: 4px 9px; border-radius: 99px; color: #fff; background: var(--blue-700); font-size: .68rem !important; }
.payment-form { padding-top: 2px; }
.form-heading { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
.form-heading > span { display: grid; width: 30px; height: 30px; flex: 0 0 auto; border-radius: 50%; place-items: center; color: var(--blue-700); background: var(--blue-100); font-size: .72rem; font-weight: 800; }
.form-heading h2 { margin: 0 0 3px; color: #203d53; font-size: 1.15rem; }
.form-heading p { margin: 0; color: #7890a1; font-size: .82rem; }
.payment-heading { margin-top: 38px; }
.field { display: grid; gap: 8px; }
.field label { color: #3d586d; font-size: .82rem; font-weight: 700; }
.field input { width: 100%; min-height: 50px; padding: 0 15px; border: 1px solid #cbdce6; border-radius: 10px; color: var(--ink); background: #fff; outline: none; transition: border-color .2s, box-shadow .2s; }
.field input::placeholder { color: #9aacb8; }
.field input:focus { border-color: var(--blue-500); box-shadow: 0 0 0 3px rgba(49,139,208,.1); }
.payment-tabs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
.payment-tabs label { display: flex; align-items: center; justify-content: center; min-height: 52px; gap: 8px; border: 1px solid var(--line); border-radius: 10px; color: #637b8e; background: #fff; font-size: .86rem; font-weight: 700; cursor: pointer; }
.payment-tabs label.active { border-color: var(--blue-500); color: var(--blue-700); background: #f7fcff; box-shadow: inset 0 0 0 1px var(--blue-500); }
.payment-tabs input { position: absolute; opacity: 0; }
.payment-tabs label:has(input:focus-visible) { outline: 3px solid rgba(49,139,208,.4); outline-offset: 3px; }
.kakao-mark, .kakao-logo { display: grid; border-radius: 50%; place-items: center; color: #251c00; background: #fee500; font-weight: 900; }
.kakao-mark { width: 20px; height: 20px; font-size: .67rem; }
.card-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px 14px; }
.full-field { grid-column: 1 / -1; }
.input-with-mark { position: relative; }
.input-with-mark input { padding-right: 70px; }
.input-with-mark span { position: absolute; top: 50%; right: 14px; transform: translateY(-50%); color: #194794; font-size: .78rem; font-weight: 900; letter-spacing: .04em; }
.kakao-info { display: flex; align-items: center; gap: 16px; padding: 20px; border: 1px solid #eadb83; border-radius: 12px; background: #fffdf0; }
.kakao-logo { width: 42px; height: 42px; flex: 0 0 auto; }
.kakao-info strong { color: #3f391c; font-size: .9rem; }
.kakao-info p { margin: 4px 0 0; color: #756e4a; font-size: .78rem; line-height: 1.5; }
.agreement { display: flex; align-items: flex-start; gap: 10px; margin: 24px 0 16px; color: #6b8192; font-size: .78rem; line-height: 1.6; cursor: pointer; }
.agreement input { width: 18px; height: 18px; flex: 0 0 auto; margin-top: 2px; accent-color: var(--blue-700); }
.agreement strong { color: var(--blue-700); }
.form-error { margin: 0 0 12px; padding: 11px 13px; border-radius: 8px; color: #a33a3a; background: #fff0f0; font-size: .8rem; font-weight: 600; }
.submit-button { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 56px; gap: 10px; border: 0; border-radius: 11px; color: #fff; background: #17649a; box-shadow: 0 10px 22px rgba(23,100,154,.2); font-weight: 800; transition: transform .2s, background .2s; }
.submit-button:hover:not(:disabled) { background: #12527e; transform: translateY(-1px); }
.submit-button:disabled { cursor: wait; opacity: .75; }
.spinner { width: 17px; height: 17px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
.demo-notice { margin: 12px 0 0; color: #8aa0af; text-align: center; font-size: .72rem; }
.order-card { position: sticky; top: 28px; overflow: hidden; padding: 24px; border: 1px solid #cbdfea; border-radius: 20px; background: rgba(255,255,255,.92); box-shadow: 0 20px 50px rgba(31,79,111,.11); }
.plan-visual { display: flex; align-items: center; gap: 16px; min-height: 128px; margin-bottom: 26px; padding: 22px; border-radius: 15px; color: #fff; background: linear-gradient(135deg, #0e527f, #318bd0); }
.weather-orb { display: grid; width: 64px; height: 64px; border-radius: 50%; place-items: center; color: #ffe893; background: rgba(255,255,255,.15); font-size: 2rem; box-shadow: inset 0 0 0 1px rgba(255,255,255,.16); }
.plan-visual p { margin: 0 0 3px; font-size: .68rem; font-weight: 700; letter-spacing: .13em; opacity: .78; }
.plan-visual strong { font-size: 2rem; letter-spacing: -.03em; }
.order-card h2 { margin: 0 0 20px; color: #213e54; font-size: 1.18rem; }
.summary-row { display: flex; justify-content: space-between; gap: 12px; color: #3c586c; font-size: .9rem; }
.plan-description { margin: 6px 0 20px; color: var(--blue-500); font-size: .75rem; }
.benefit-list { display: grid; gap: 12px; margin: 0; padding: 20px 0; border-top: 1px solid #e4edf2; border-bottom: 1px solid #e4edf2; color: #536d80; font-size: .82rem; list-style: none; }
.benefit-list span { margin-right: 8px; color: #29906a; font-weight: 900; }
.summary-total { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 22px; }
.summary-total div { display: grid; gap: 3px; color: #3c586c; font-size: .84rem; }
.summary-total small { color: #90a1ad; font-size: .68rem; }
.summary-total > strong { color: #173b56; font-size: 1.55rem; letter-spacing: -.04em; }
.renewal-note { margin: 18px 0 0; padding: 12px; border-radius: 9px; color: #6c8190; background: #f3f8fb; font-size: .72rem; line-height: 1.6; }
.success-panel { width: min(620px, 100%); margin: 64px auto 0; padding: 56px; border: 1px solid #cfe1eb; border-radius: 24px; text-align: center; background: #fff; box-shadow: var(--shadow); }
.success-icon { display: grid; width: 66px; height: 66px; margin: 0 auto 24px; border-radius: 50%; place-items: center; color: #fff; background: #2eaa76; font-size: 1.8rem; font-weight: 900; box-shadow: 0 10px 24px rgba(46,170,118,.2); }
.success-panel h1 { font-size: clamp(2rem, 5vw, 3.1rem); }
.success-copy { margin: 20px 0 28px; color: var(--muted); line-height: 1.8; }
.receipt { display: grid; grid-template-columns: 1fr auto; gap: 12px; margin-bottom: 28px; padding: 20px; border-radius: 12px; text-align: left; color: #6b8191; background: #f3f8fb; font-size: .84rem; }
.receipt strong { color: #29485e; }
.primary-link { display: inline-flex; min-height: 48px; align-items: center; justify-content: center; padding: 0 22px; border-radius: 10px; color: #fff; background: var(--blue-700); font-weight: 800; text-decoration: none; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .checkout-layout { grid-template-columns: minmax(0, 1fr) 330px; gap: 32px; }
}
@media (max-width: 760px) {
  .checkout-layout { grid-template-columns: 1fr; }
  .checkout-main { max-width: none; }
  .order-card { position: static; grid-row: 1; }
  .plan-visual { min-height: 108px; }
}
@media (max-width: 560px) {
  .checkout-page { width: min(100% - 24px, 1120px); padding-bottom: 48px; }
  .checkout-header { margin-bottom: 30px; }
  .checkout-layout { gap: 34px; }
  .lead { margin-top: 16px; font-size: .9rem; }
  .plan-toggle { gap: 8px; margin-bottom: 38px; }
  .plan-toggle label { padding: 15px 12px; }
  .payment-tabs, .card-fields { grid-template-columns: 1fr; }
  .full-field { grid-column: auto; }
  .payment-tabs label { min-height: 48px; }
  .order-card { padding: 18px; border-radius: 16px; }
  .success-panel { margin-top: 34px; padding: 36px 20px; }
}
</style>
