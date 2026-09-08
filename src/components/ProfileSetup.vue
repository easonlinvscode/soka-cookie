<script setup>
import { reactive, computed } from 'vue'
import { affiliations, circles, districts, divisions } from '../data/content.js'

const props = defineProps({ user: { type: Object, required: true }, profile: Object, saving: Boolean, error: String, editing: Boolean })
const emit = defineEmits(['save', 'cancel'])
const form = reactive({
  displayName: props.profile?.displayName || props.user.displayName || '',
  division: props.profile?.division || '',
  affiliationId: props.profile?.affiliationId || '',
})
const valid = computed(() => form.displayName.trim().length >= 2 && form.division && form.affiliationId)
</script>

<template>
  <main class="setup-page">
    <section class="setup-card comic-panel">
      <header>
        <span>{{ editing ? '更新個人資料' : '第一次登入' }}</span>
        <h1>{{ editing ? '調整你的資料' : '先認識你一下！' }}</h1>
        <p>設定一次後，之後就能直接填寫分鐘數或遍數。</p>
      </header>

      <form @submit.prevent="valid && emit('save', form)">
        <label for="profile-name">姓名</label>
        <input id="profile-name" v-model="form.displayName" maxlength="20" autocomplete="name" placeholder="請輸入姓名">

        <fieldset>
          <legend>部別</legend>
          <div class="choice-row">
            <label v-for="item in divisions" :key="item.id" :class="['choice', item.id, { active: form.division === item.id }]">
              <input v-model="form.division" type="radio" name="division" :value="item.id">
              <strong>{{ item.icon }} {{ item.label }}</strong>
            </label>
          </div>
        </fieldset>

        <div class="fixed-grid">
          <label>所屬圈<input :value="circles[0].label" readonly></label>
          <label>所屬區<input :value="districts[0].label" readonly></label>
        </div>

        <fieldset>
          <legend>回報所屬單位</legend>
          <div class="affiliation-grid">
            <label v-for="item in affiliations" :key="item.id" class="affiliation" :class="{ active: form.affiliationId === item.id }" :style="{ '--option-color': item.color }">
              <input v-model="form.affiliationId" type="radio" name="affiliation" :value="item.id">
              <strong>{{ item.label }}</strong>
            </label>
          </div>
        </fieldset>

        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
        <div class="actions">
          <button v-if="editing" class="comic-button secondary" type="button" @click="$emit('cancel')">取消</button>
          <button class="comic-button" type="submit" :disabled="!valid || saving">{{ saving ? '儲存中…' : '儲存並開始回報' }}</button>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.setup-page{min-height:100svh;padding:38px 16px 70px;background-color:var(--pink);background-image:radial-gradient(rgba(255,255,255,.2) 3px,transparent 3px);background-size:28px 28px}.setup-card{width:min(850px,100%);margin:auto;padding:clamp(24px,5vw,46px)}header span{display:inline-block;padding:5px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);font-weight:1000}header h1{margin:14px 0 8px;font-family:var(--font-display);font-size:clamp(2rem,6vw,3.4rem)}header p{margin:0 0 28px;color:var(--muted);font-weight:800}label,legend{font-weight:1000}input[type=text],input:not([type]){width:100%}#profile-name,.fixed-grid input{width:100%;min-height:54px;margin-top:8px;padding:10px 15px;border:4px solid var(--ink);border-radius:15px;background:white;box-shadow:4px 4px 0 var(--ink);font-weight:800}#profile-name:focus-visible,.fixed-grid input:focus-visible{outline:none;box-shadow:inset 0 0 0 3px var(--blue)}.fixed-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:26px 0}.fixed-grid label{display:block}.fixed-grid input{color:var(--muted);box-shadow:none}fieldset{margin:26px 0 0;padding:0;border:0}legend{margin-bottom:10px}.choice-row,.affiliation-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}.affiliation-grid{grid-template-columns:repeat(3,1fr)}.choice,.affiliation{position:relative;display:grid;place-items:center;min-height:60px;padding:12px;border:3px solid var(--ink);border-radius:16px;background:white;box-shadow:4px 4px 0 var(--ink);cursor:pointer}.choice input,.affiliation input{position:absolute;opacity:0}.choice.men.active{background:var(--blue);color:white}.choice.women.active{background:var(--pink);color:white}.affiliation.active{background:var(--option-color);color:white;transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}.error-message{padding:11px;border:3px solid var(--ink);border-radius:14px;background:#ffe1ea;color:#9d003b;font-weight:800}.actions{display:flex;justify-content:flex-end;gap:14px;margin-top:30px}.comic-button:disabled{opacity:.45;cursor:not-allowed}@media(max-width:620px){.setup-page{padding:14px 8px 35px}.setup-card{border-radius:28px}.fixed-grid,.affiliation-grid{grid-template-columns:1fr 1fr}.actions{flex-direction:column-reverse}.actions button{width:100%}}
</style>
