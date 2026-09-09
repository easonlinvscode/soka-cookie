<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import gsap from 'gsap'
import { divisions, headquarters } from '../data/content.js'

const emit = defineEmits(['cancel', 'complete'])
const step = ref(1)
const form = reactive({ division: '', headquarters: '', name: '', unit: 'minutes', amount: '' })
const flowSection = ref(null)
const flowCard = ref(null)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let motionContext
let scrollFrame

const selectedDivision = computed(() => divisions.find((item) => item.id === form.division))
const selectedHeadquarters = computed(() => headquarters.find((item) => item.id === form.headquarters))
const numericAmount = computed(() => Math.max(0, Math.round(Number(form.amount) || 0)))
const minutes = computed(() => form.unit === 'minutes'
  ? numericAmount.value
  : numericAmount.value > 0 ? Math.max(1, Math.round(numericAmount.value / 60)) : 0)
const chants = computed(() => form.unit === 'chants' ? numericAmount.value : Math.round(numericAmount.value * 60))
const canContinue = computed(() => {
  if (step.value === 1) return Boolean(form.division)
  if (step.value === 2) return Boolean(form.headquarters)
  if (step.value === 3) return form.name.trim().length >= 2 && numericAmount.value > 0
  return true
})

function next() { if (canContinue.value) step.value += 1 }
function back() { if (step.value > 1) step.value -= 1; else emit('cancel') }
function addAmount(value) { form.amount = numericAmount.value + value }
function choose(field, value, event) {
  form[field] = value
  if (reducedMotion.matches) return
  gsap.fromTo(event.currentTarget, { scale: .92 }, { scale: 1, duration: .58, ease: 'elastic.out(1, .42)' })
}
function submit() {
  emit('complete', {
    division: form.division,
    headquarters: form.headquarters,
    name: form.name.trim(),
    minutes: minutes.value,
    chants: chants.value,
  })
}

watch(step, async (value, oldValue) => {
  await nextTick()
  cancelAnimationFrame(scrollFrame)
  scrollFrame = requestAnimationFrame(() => {
    flowCard.value?.scrollIntoView({
      behavior: 'auto',
      block: 'start',
    })
  })
  if (reducedMotion.matches || !flowCard.value) return
  const direction = value > oldValue ? 1 : -1
  gsap.fromTo(flowCard.value.querySelector('.step-content'),
    { autoAlpha: 0, x: direction * 56, rotation: direction * 1.5 },
    { autoAlpha: 1, x: 0, rotation: 0, duration: .52, ease: 'back.out(1.25)', clearProps: 'transform' },
  )
  gsap.fromTo(flowCard.value.querySelectorAll('.step-track span.active'),
    { scale: .82 }, { scale: 1, duration: .42, stagger: .05, ease: 'back.out(2)', clearProps: 'scale' })
})

onMounted(() => {
  motionContext = gsap.context(() => {
    if (reducedMotion.matches) return
    gsap.from('.flow-heading > *', { y: 26, autoAlpha: 0, stagger: .1, duration: .5, ease: 'power3.out' })
    gsap.from(flowCard.value, { y: 45, autoAlpha: 0, scale: .97, duration: .66, ease: 'back.out(1.2)', delay: .12 })
  })
  scrollFrame = requestAnimationFrame(() => {
    scrollFrame = requestAnimationFrame(() => {
      flowSection.value?.scrollIntoView({
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  })
})

onUnmounted(() => {
  cancelAnimationFrame(scrollFrame)
  motionContext?.revert()
})
</script>

<template>
  <section ref="flowSection" class="flow-section">
    <div class="flow-wrap">
      <header class="flow-heading">
        <span>SOKA PARTY</span>
        <h1>烤一塊今天的<br /><strong>幸運餅乾!</strong></h1>
        <p>只要三個步驟，就能把今天的努力加入共同進度。</p>
      </header>

      <div ref="flowCard" class="flow-card comic-panel" :class="{ 'women-flow': form.division === 'women' }">
        <div class="step-track" aria-label="回報步驟">
          <svg class="step-connector" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
            <polyline points="6,14 35,7 65,14 94,9" />
          </svg>
          <span v-for="n in 4" :key="n" :class="{ active: step >= n }">{{ n }}</span>
        </div>

        <div v-if="step === 1" class="step-content">
          <div class="step-kicker">STEP 01</div>
          <h2>你是哪個部別？</h2>
          <div class="choice-grid division-grid">
            <button
              v-for="item in divisions"
              :key="item.id"
              type="button"
              class="choice-card division-card"
              :class="[item.color, { selected: form.division === item.id }]"
              @click="choose('division', item.id, $event)"
            >
              <span class="choice-icon">{{ item.icon }}</span>
              <strong>{{ item.label }}</strong>
              <small>選擇後繼續</small>
            </button>
          </div>
        </div>

        <div v-else-if="step === 2" class="step-content">
          <div class="step-kicker">STEP 02 · {{ selectedDivision.label }}</div>
          <h2>選擇你的本部</h2>
          <div class="choice-grid headquarters-grid">
            <button
              v-for="(item, index) in headquarters"
              :key="item.id"
              type="button"
              class="choice-card hq-card"
              :class="{ selected: form.headquarters === item.id }"
              :style="{ '--card-color': item.color, '--tilt': index % 2 ? '1.5deg' : '-1.5deg' }"
              @click="choose('headquarters', item.id, $event)"
            >
              <span class="number">0{{ index + 1 }}</span>
              <strong>{{ item.label }}</strong>
              <span class="mini-cookie">★</span>
            </button>
          </div>
        </div>

        <div v-else-if="step === 3" class="step-content form-step">
          <div class="step-kicker">STEP 03 · {{ selectedDivision.label }}／{{ selectedHeadquarters.label }}</div>
          <h2>回報今天的成果</h2>
          <label class="field-label" for="report-name">姓名</label>
          <input id="report-name" v-model="form.name" maxlength="20" placeholder="請輸入姓名" autocomplete="name" />

          <fieldset>
            <legend class="field-label">回報單位</legend>
            <div class="unit-tabs">
              <button type="button" :class="{ active: form.unit === 'minutes' }" @click="form.unit = 'minutes'; form.amount = ''">分鐘</button>
              <button type="button" :class="{ active: form.unit === 'chants' }" @click="form.unit = 'chants'; form.amount = ''">遍數</button>
            </div>
          </fieldset>

          <label class="field-label" for="report-amount">{{ form.unit === 'minutes' ? '本次分鐘數' : '本次遍數' }}</label>
          <div class="amount-row">
            <input id="report-amount" v-model.number="form.amount" type="number" min="1" step="1" inputmode="numeric" placeholder="0" />
            <strong>{{ form.unit === 'minutes' ? '分鐘' : '遍' }}</strong>
          </div>
          <div class="quick-row">
            <button v-for="n in (form.unit === 'minutes' ? [5, 10, 30] : [100, 500, 1000])" :key="n" type="button" @click="addAmount(n)">+{{ n }}</button>
          </div>
          <div class="conversion">
            <span>自動換算</span>
            <strong>{{ minutes.toLocaleString() }} 分鐘</strong>
            <b>=</b>
            <strong>{{ chants.toLocaleString() }} 遍</strong>
          </div>
        </div>

        <div v-else class="step-content confirm-step">
          <div class="step-kicker">FINAL CHECK</div>
          <h2>確認這塊幸運餅乾</h2>
          <div class="ticket">
            <div><span>姓名</span><strong>{{ form.name }}</strong></div>
            <div><span>回報組別</span><strong>{{ selectedDivision.label }}／{{ selectedHeadquarters.label }}</strong></div>
            <div><span>本次累積</span><strong>{{ minutes.toLocaleString() }} 分鐘</strong></div>
            <div><span>換算遍數</span><strong>{{ chants.toLocaleString() }} 遍</strong></div>
          </div>
          <p>送出後會先收到一張鼓勵語，再查看最新進度。</p>
        </div>

        <div class="flow-actions">
          <button class="comic-button secondary" type="button" @click="back">{{ step === 1 ? '回首頁' : '上一步' }}</button>
          <button v-if="step < 4" class="comic-button" type="button" :disabled="!canContinue" @click="next">下一步</button>
          <button v-else class="comic-button pink" type="button" @click="submit">確認送出！</button>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.flow-section {
  min-height: calc(100vh - 86px);
  padding: 58px 0 90px;
  background-color: var(--pink);
  background-image: radial-gradient(rgba(255,255,255,.18) 3px, transparent 3px);
  background-size: 28px 28px;
}
.flow-wrap { width: min(960px, calc(100% - 32px)); margin: 0 auto; }
.flow-heading { color: white; text-align: center; }
.flow-heading > span { display: inline-block; padding: 6px 14px; border: 3px solid var(--ink); border-radius: 999px; background: var(--blue); color: var(--ink); font-weight: 1000; box-shadow: 4px 4px 0 var(--ink); }
.flow-heading h1 { margin: 20px 0 14px; font-family: var(--font-display); font-size: clamp(2.8rem, 7vw, 5rem); line-height: .95; text-shadow: 5px 6px 0 var(--ink); }
.flow-heading h1 strong { color: var(--yellow); }
.flow-heading p { font-size: 1.05rem; font-weight: 800; }
.flow-card { margin-top: 34px; padding: clamp(24px, 5vw, 52px); scroll-margin-top: 20px; }
.step-track { display: flex; align-items: center; justify-content: center; margin-bottom: 32px; }
.step-track span { position: relative; display: grid; place-items: center; width: 38px; height: 38px; border: 3px solid var(--ink); border-radius: 50%; background: white; font-weight: 1000; }
.step-track span:not(:last-child) { margin-right: 48px; }
.step-track span:not(:last-child)::after { content: ''; position: absolute; left: 35px; width: 51px; border-top: 4px solid var(--ink); }
.step-track span.active { background: var(--yellow); transform: rotate(-7deg) scale(1.08); }
.step-kicker { color: var(--pink); font-family: var(--font-display); font-size: .85rem; font-weight: 1000; letter-spacing: .08em; }
h2 { margin: 7px 0 28px; font-family: var(--font-display); font-size: clamp(2rem, 5vw, 3.25rem); line-height: 1.15; }
.choice-grid { display: grid; gap: 18px; }
.division-grid { grid-template-columns: repeat(2, 1fr); }
.headquarters-grid { grid-template-columns: repeat(2, 1fr); }
.choice-card { position: relative; min-height: 180px; border: var(--stroke) solid var(--ink); border-radius: var(--radius-md); box-shadow: 6px 6px 0 var(--ink); cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
.choice-card:hover, .choice-card.selected { transform: translate(-3px, -3px) rotate(-1deg); box-shadow: 9px 9px 0 var(--ink); }
.choice-card.selected::after { content: '✓'; position: absolute; top: -14px; right: -10px; display: grid; place-items: center; width: 42px; height: 42px; border: 3px solid var(--ink); border-radius: 50%; background: var(--yellow); font-size: 1.3rem; font-weight: 1000; }
.division-card { display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--blue); }
.division-card.pink { background: var(--pink-soft); }
.choice-icon { display: grid; place-items: center; width: 70px; aspect-ratio: 1; margin-bottom: 10px; border: 4px solid var(--ink); border-radius: 50%; background: var(--yellow); color: var(--pink); font-size: 2rem; }
.division-card strong { font-family: var(--font-display); font-size: 1.8rem; }
.division-card small { margin-top: 4px; font-weight: 800; }
.hq-card { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 15px; min-height: 118px; padding: 20px; background: var(--card-color); transform: rotate(var(--tilt)); text-align: left; }
.hq-card strong { font-family: var(--font-display); font-size: 1.45rem; }
.number { font-size: .8rem; font-weight: 1000; }
.mini-cookie { display: grid; place-items: center; width: 48px; aspect-ratio: 1; border: 3px solid var(--ink); border-radius: 43%; background: var(--yellow); color: var(--orange); font-size: 1.3rem; transform: rotate(8deg); }
.form-step h2 { margin: 9px 0 34px; font-size: clamp(1.9rem, 4vw, 2.75rem); }
.field-label { display: block; margin: 24px 0 10px; font-weight: 1000; line-height: 1.4; }
.form-step h2 + .field-label { margin-top: 0; }
input { width: 100%; min-height: 56px; padding: 12px 16px; border: var(--stroke) solid var(--ink); border-radius: 15px; background: white; box-shadow: 4px 4px 0 var(--ink); font-size: 1.05rem; font-weight: 800; }
input:focus-visible { outline: none; border-color: var(--blue); box-shadow: 4px 4px 0 var(--ink), 0 0 0 3px rgba(84, 200, 239, .22); }
.flow-card.women-flow input:focus-visible { border-color: var(--pink); box-shadow: 4px 4px 0 var(--ink), 0 0 0 3px rgba(245, 4, 105, .24); }
fieldset { margin: 0; padding: 0; border: 0; }
.form-step fieldset { margin-top: 28px; }
.form-step fieldset .field-label { margin: 0 0 11px; }
.unit-tabs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.unit-tabs button, .quick-row button { min-height: 46px; border: 3px solid var(--ink); border-radius: 999px; background: white; font-weight: 1000; cursor: pointer; }
.unit-tabs button.active { background: var(--yellow); box-shadow: 4px 4px 0 var(--ink); }
.amount-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 15px; }
.amount-row strong { font-size: 1.1rem; }
.quick-row { display: flex; gap: 12px; margin-top: 18px; }
.quick-row button { flex: 1; background: var(--blue); }
.conversion { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 16px; margin-top: 26px; padding: 18px; border: 3px dashed var(--ink); border-radius: 18px; background: #fff1a5; }
.conversion span { width: 100%; color: var(--muted); font-size: .85rem; text-align: center; }
.ticket { border: 4px solid var(--ink); border-radius: 24px; overflow: hidden; background: white; }
.ticket div { display: flex; justify-content: space-between; gap: 18px; padding: 16px 20px; border-bottom: 2px dashed #bd9a7e; }
.ticket div:last-child { border: 0; }
.ticket span { color: var(--muted); }
.confirm-step > p { text-align: center; font-weight: 800; }
.flow-actions { display: flex; justify-content: space-between; gap: 16px; margin-top: 34px; }
.comic-button:disabled { opacity: .45; cursor: not-allowed; transform: none; box-shadow: 3px 3px 0 var(--ink); }
@media (max-width: 640px) {
  .flow-section { padding-top: 35px; }
  .flow-card { border-radius: 28px; }
  .division-grid, .headquarters-grid { grid-template-columns: 1fr; }
  .division-card { min-height: 145px; }
  .hq-card { min-height: 92px; }
  .step-track span:not(:last-child) { margin-right: 25px; }
  .step-track span:not(:last-child)::after { width: 28px; }
  .flow-actions { flex-direction: column-reverse; }
  .flow-actions .comic-button { width: 100%; }
  .ticket div { flex-direction: column; gap: 4px; }
}

/* Compact reporting flow: keep the complete step visible at common viewport sizes. */
.flow-section { padding: 24px 0 48px; }
.flow-heading > span { padding: 5px 11px; font-size: .82rem; }
.flow-heading h1 { margin: 12px 0 8px; font-size: clamp(2.5rem, 5vw, 3.8rem); line-height: .9; }
.flow-heading p { margin: 8px 0 0; font-size: .95rem; }
.flow-card { margin-top: 18px; padding: clamp(20px, 3vw, 34px); }
.step-track { margin-bottom: 20px; }
.step-track span { width: 34px; height: 34px; }
.step-kicker { font-size: .78rem; }
h2 { margin: 5px 0 18px; font-size: clamp(1.8rem, 4vw, 2.45rem); }
.choice-grid { gap: 13px; }
.choice-card { min-height: 132px; }
.choice-icon { width: 56px; margin-bottom: 6px; font-size: 1.65rem; }
.division-card strong { font-size: 1.5rem; }
.hq-card { min-height: 82px; padding: 14px 17px; }
.hq-card strong { font-size: 1.25rem; }
.mini-cookie { width: 40px; }
.form-step h2 { margin: 5px 0 20px; font-size: clamp(1.8rem, 3.5vw, 2.35rem); }
.field-label { margin: 15px 0 7px; }
input { min-height: 50px; padding: 9px 14px; font-size: 1rem; }
.form-step fieldset { margin-top: 18px; }
.form-step fieldset .field-label { margin-bottom: 7px; }
.unit-tabs button, .quick-row button { min-height: 42px; }
.quick-row { margin-top: 11px; }
.conversion { margin-top: 15px; padding: 13px; }
.ticket div { padding: 12px 17px; }
.confirm-step > p { margin: 14px 0; }
.flow-actions { margin-top: 20px; }

@media (max-width: 640px) {
  .flow-section { padding: 14px 0 34px; }
  .flow-heading h1 { font-size: clamp(2.25rem, 11vw, 3rem); }
  .flow-heading p { font-size: .88rem; }
  .flow-card { margin-top: 14px; padding: 17px; }
  .division-grid, .headquarters-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .division-card { min-height: 112px; }
  .division-card strong { font-size: 1.2rem; }
  .division-card small { font-size: .72rem; }
  .choice-icon { width: 45px; font-size: 1.35rem; }
  .hq-card { grid-template-columns: 1fr auto; min-height: 76px; padding: 10px; }
  .hq-card .number { display: none; }
  .hq-card strong { font-size: 1rem; }
  .mini-cookie { width: 34px; }
  .step-track { margin-bottom: 15px; }
  h2 { margin-bottom: 14px; font-size: 1.65rem; }
  .flow-actions { flex-direction: row; margin-top: 16px; }
  .flow-actions .comic-button { width: auto; min-height: 46px; padding: 9px 16px; }
}

/* One continuous connector sits behind every step marker. */
.step-track { position: relative; width: fit-content; margin: 0 auto 20px; }
.step-track::before { display: none; }
.step-connector { position: absolute; z-index: 0; inset: 5px 0 auto; width: 100%; height: 24px; overflow: visible; }
.step-connector polyline { fill: none; stroke: var(--ink); stroke-width: 4; stroke-linecap: round; stroke-linejoin: round; vector-effect: non-scaling-stroke; }
.step-track span { z-index: 1; }
.step-track span:not(:last-child)::after { display: none; }
@media (max-width: 640px) {
  .step-track { margin-bottom: 15px; }
}
</style>
