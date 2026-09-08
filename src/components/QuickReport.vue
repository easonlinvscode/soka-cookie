<script setup>
import { computed, reactive } from 'vue'
import { affiliations, circles, districts, divisions } from '../data/content.js'

const props = defineProps({ profile: { type: Object, required: true }, groups: { type: Array, default: () => [] }, submitting: Boolean, error: String })
const emit = defineEmits(['submit'])
const form = reactive({ unit: 'minutes', amount: '', groupIds: [] })
const division = computed(() => divisions.find((item) => item.id === props.profile.division))
const affiliation = computed(() => affiliations.find((item) => item.id === props.profile.affiliationId))
const activeGroups = computed(() => props.groups.filter((group) => group.status === 'active' && (!group.endDate?.toDate || group.endDate.toDate() >= new Date())))
const amount = computed(() => Math.max(0, Math.round(Number(form.amount) || 0)))
const minutes = computed(() => form.unit === 'minutes' ? amount.value : amount.value > 0 ? Math.max(1, Math.round(amount.value / 60)) : 0)
const chants = computed(() => form.unit === 'chants' ? amount.value : amount.value * 60)
const valid = computed(() => Number.isInteger(Number(form.amount)) && amount.value > 0)

function addAmount(value) { form.amount = amount.value + value }
function submit() {
  if (!valid.value) return
  emit('submit', { unit: form.unit, amount: amount.value, groupIds: [...form.groupIds], submissionId: crypto.randomUUID() })
}
</script>

<template>
  <section class="quick-page">
    <div class="quick-wrap">
      <header class="quick-heading">
        <span>QUICK REPORT</span>
        <h1>回報今天的成果</h1>
      </header>
      <article class="quick-card comic-panel" :class="profile.division">
        <div class="identity-card">
          <img v-if="profile.photoURL" :src="profile.photoURL" alt="" referrerpolicy="no-referrer">
          <div><small>回報人</small><strong>{{ profile.displayName }}</strong></div>
          <div class="identity-tags">
            <span>{{ division?.icon }} {{ division?.label }}</span>
            <span>{{ circles[0].label }}／{{ districts[0].label }}</span>
            <span>{{ affiliation?.label }}</span>
          </div>
        </div>

        <fieldset>
          <legend>回報單位</legend>
          <div class="unit-tabs">
            <button type="button" :class="{ active: form.unit === 'minutes' }" @click="form.unit='minutes';form.amount=''">分鐘</button>
            <button type="button" :class="{ active: form.unit === 'chants' }" @click="form.unit='chants';form.amount=''">遍數</button>
          </div>
        </fieldset>

        <label class="amount-label" for="quick-amount">{{ form.unit === 'minutes' ? '本次分鐘數' : '本次遍數' }}</label>
        <div class="amount-row">
          <input id="quick-amount" v-model.number="form.amount" type="number" min="1" step="1" inputmode="numeric" placeholder="0">
          <strong>{{ form.unit === 'minutes' ? '分鐘' : '遍' }}</strong>
        </div>
        <div class="quick-buttons">
          <button v-for="value in (form.unit === 'minutes' ? [5,10,30] : [100,500,1000])" :key="value" type="button" @click="addAmount(value)">+{{ value.toLocaleString() }}</button>
        </div>
        <div class="conversion"><span>自動換算</span><strong>{{ minutes.toLocaleString() }} 分鐘</strong><b>=</b><strong>{{ chants.toLocaleString() }} 遍</strong></div>

        <fieldset class="group-choice">
          <legend>這次要計入哪些群組？</legend>
          <p>沒有勾選也會計入你的個人進度。</p>
          <div v-if="activeGroups.length" class="group-options">
            <label v-for="group in activeGroups" :key="group.id" :class="{ active: form.groupIds.includes(group.id) }">
              <input v-model="form.groupIds" type="checkbox" :value="group.id">
              <span aria-hidden="true">✓</span><strong>{{ group.name }}</strong>
            </label>
          </div>
          <div v-else class="empty-groups">目前沒有進行中的群組，可到「群組」建立或加入。</div>
        </fieldset>

        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <button class="submit-button comic-button pink" type="button" :disabled="!valid || submitting" @click="submit">{{ submitting ? '送出中…' : '確認送出！' }}</button>
      </article>
    </div>
  </section>
</template>

<style scoped>
.quick-page{min-height:calc(100svh - 86px);padding:24px 0 55px;background-color:var(--pink);background-image:radial-gradient(rgba(255,255,255,.18) 3px,transparent 3px);background-size:28px 28px}.quick-wrap{width:min(900px,calc(100% - 24px));margin:auto}.quick-heading{text-align:center;color:white}.quick-heading span{display:inline-block;padding:5px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);color:var(--ink);box-shadow:4px 4px 0 var(--ink);font-weight:1000}.quick-heading h1{margin:12px 0 18px;font-family:var(--font-display);font-size:clamp(2rem,5vw,3.4rem);text-shadow:4px 4px 0 var(--ink)}.quick-card{padding:clamp(20px,4vw,38px)}.identity-card{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:14px;border:3px solid var(--ink);border-radius:18px;background:#fff3b3}.identity-card img{width:56px;height:56px;border:3px solid var(--ink);border-radius:50%}.identity-card small,.identity-card strong{display:block}.identity-card small{color:var(--muted);font-weight:800}.identity-card strong{font-family:var(--font-display);font-size:1.35rem}.identity-tags{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.identity-tags span{padding:5px 9px;border:2px solid var(--ink);border-radius:999px;background:white;font-size:.78rem;font-weight:900}fieldset{margin:24px 0 0;padding:0;border:0}legend,.amount-label{display:block;margin-bottom:9px;font-weight:1000}.unit-tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px}.unit-tabs button,.quick-buttons button{min-height:46px;border:3px solid var(--ink);border-radius:999px;background:white;font-weight:1000;cursor:pointer}.unit-tabs button.active{background:var(--blue);color:white;box-shadow:4px 4px 0 var(--ink)}.women .unit-tabs button.active{background:var(--pink)}.amount-label{margin-top:22px}.amount-row{display:grid;grid-template-columns:1fr auto;align-items:center;gap:13px}.amount-row input{width:100%;min-height:56px;padding:11px 15px;border:4px solid var(--ink);border-radius:15px;background:white;box-shadow:4px 4px 0 var(--ink);font-weight:900}.amount-row input:focus-visible{outline:none;border-color:var(--blue)}.women .amount-row input:focus-visible{border-color:var(--pink)}.quick-buttons{display:flex;gap:10px;margin-top:15px}.quick-buttons button{flex:1;background:var(--blue)}.women .quick-buttons button{background:var(--pink-soft)}.conversion{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:7px 14px;margin-top:20px;padding:13px;border:3px dashed var(--ink);border-radius:16px;background:#fff1a5}.conversion span{width:100%;color:var(--muted);font-size:.82rem;text-align:center}.group-choice{padding-top:20px;border-top:3px dashed rgba(32,22,15,.45)!important}.group-choice p{margin:0 0 12px;color:var(--muted);font-size:.88rem;font-weight:800}.group-options{display:grid;grid-template-columns:repeat(2,1fr);gap:9px}.group-options label{position:relative;display:flex;align-items:center;gap:9px;min-height:48px;padding:9px 12px;border:3px solid var(--ink);border-radius:14px;background:white;cursor:pointer}.group-options input{position:absolute;opacity:0}.group-options span{display:grid;place-items:center;width:24px;height:24px;border:2px solid var(--ink);border-radius:7px;color:transparent}.group-options label.active{background:var(--yellow)}.group-options label.active span{background:var(--ink);color:white}.empty-groups{padding:12px;border:2px dashed var(--muted);border-radius:13px;color:var(--muted);font-weight:800}.submit-button{display:block;margin:26px 0 0 auto}.submit-button:disabled{opacity:.45;cursor:not-allowed}.error-message{padding:10px;border:3px solid var(--ink);border-radius:14px;background:#ffe1ea;color:#9d003b;font-weight:800}@media(max-width:620px){.quick-page{padding-top:10px}.quick-card{border-radius:28px}.identity-card{grid-template-columns:auto 1fr}.identity-tags{grid-column:1/-1;justify-content:flex-start}.group-options{grid-template-columns:1fr}.submit-button{width:100%}}
.quick-page{min-height:calc(100svh - 152px);padding-top:16px;padding-bottom:32px}
@media(max-width:620px){.quick-page{min-height:calc(100svh - 136px);padding-bottom:24px}}
</style>
