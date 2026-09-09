<script setup>
import { computed } from 'vue'
import { affiliations, circles, districts, divisions, rewardCards } from '../data/content.js'
import RewardCardFace from './RewardCardFace.vue'

const props = defineProps({ profile: { type: Object, required: true }, reports: { type: Array, default: () => [] }, groups: { type: Array, default: () => [] }, favoriteCardIds: { type: Array, default: () => [] } })
defineEmits(['edit', 'report', 'groups', 'logout'])
const division = computed(() => divisions.find((item) => item.id === props.profile.division))
const affiliation = computed(() => affiliations.find((item) => item.id === props.profile.affiliationId))
const totalMinutes = computed(() => props.reports.reduce((sum, item) => sum + Number(item.minutes || 0), 0))
const totalChants = computed(() => props.reports.reduce((sum, item) => sum + Number(item.chants || 0), 0))
const favoriteCards = computed(() => props.favoriteCardIds.map((id) => rewardCards.find((card) => card.id === id)).filter(Boolean))
</script>

<template>
  <section class="profile-page">
    <article class="profile-card comic-panel">
      <header>
        <img v-if="profile.photoURL" :src="profile.photoURL" alt="" referrerpolicy="no-referrer">
        <div><span>MY COOKIE</span><h1>{{ profile.displayName }}</h1><p>{{ profile.email }}</p></div>
        <button type="button" @click="$emit('edit')">編輯資料</button>
      </header>
      <div class="profile-tags"><span>{{ division?.icon }} {{ division?.label }}</span><span>{{ circles[0].label }}</span><span>{{ districts[0].label }}</span><span>{{ affiliation?.label }}</span></div>
      <div class="personal-stats"><div><small>我的累積分鐘</small><strong>{{ totalMinutes.toLocaleString() }}</strong><span>分鐘</span></div><div><small>我的累積遍數</small><strong>{{ totalChants.toLocaleString() }}</strong><span>遍</span></div><div><small>參與群組</small><strong>{{ groups.length }}</strong><span>個</span></div></div>
      <section class="card-collection">
        <header class="collection-heading">
          <div><span>MY COLLECTION</span><h2>我的收藏卡片</h2></div>
          <strong>{{ favoriteCards.length }} 張</strong>
        </header>
        <div v-if="favoriteCards.length" class="collection-grid">
          <RewardCardFace v-for="card in favoriteCards" :key="card.id" :card="card" compact />
        </div>
        <div v-else class="empty-collection">
          <span aria-hidden="true">♡</span>
          <p>還沒有收藏卡片。<br>完成一筆回報並抽卡，就能把喜歡的鼓勵收藏在這裡。</p>
        </div>
      </section>
      <div class="profile-actions"><button class="comic-button pink" type="button" @click="$emit('report')">立即回報</button><button class="comic-button secondary" type="button" @click="$emit('groups')">查看我的群組</button></div>
      <button class="logout" type="button" @click="$emit('logout')">登出 Google 帳號</button>
    </article>
  </section>
</template>

<style scoped>
.profile-page{min-height:calc(100svh - 86px);display:grid;place-items:start center;padding:42px 12px 70px;background-color:var(--pink);background-image:radial-gradient(rgba(255,255,255,.2) 3px,transparent 3px);background-size:28px 28px}.profile-card{width:min(920px,100%);padding:clamp(24px,5vw,46px)}.profile-card>header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:17px}.profile-card>header img{width:76px;height:76px;border:4px solid var(--ink);border-radius:50%;box-shadow:4px 4px 0 var(--ink)}.profile-card>header span,.collection-heading span{display:inline-block;padding:3px 8px;border:2px solid var(--ink);border-radius:999px;background:var(--yellow);font-size:.75rem;font-weight:1000}.profile-card>header h1{margin:5px 0 2px;font-family:var(--font-display);font-size:clamp(1.9rem,5vw,3rem)}.profile-card>header p{margin:0;color:var(--muted);font-weight:800}.profile-card>header button,.logout{padding:8px 12px;border:2px solid var(--ink);border-radius:999px;background:white;font-weight:900;cursor:pointer}.profile-tags{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.profile-tags span{padding:7px 11px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);color:white;font-weight:900}.profile-tags span:last-child{background:#b996e8}.personal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.personal-stats div{padding:18px;border:3px solid var(--ink);border-radius:17px;background:#fff3b3}.personal-stats small,.personal-stats strong,.personal-stats span{display:block}.personal-stats small{color:var(--muted);font-weight:800}.personal-stats strong{margin-top:5px;color:var(--pink);font-family:var(--font-display);font-size:2rem}.personal-stats span{font-weight:900}
.card-collection{margin-top:30px;padding-top:26px;border-top:3px dashed rgba(32,22,15,.45)}.collection-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:18px}.collection-heading h2{margin:7px 0 0;font-family:var(--font-display);font-size:clamp(1.55rem,4vw,2.2rem)}.collection-heading>strong{padding:7px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--pink);color:white}.collection-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.empty-collection{display:flex;align-items:center;justify-content:center;gap:15px;padding:25px;border:3px dashed var(--ink);border-radius:19px;background:#fff3b3;text-align:left}.empty-collection span{color:var(--pink);font-size:2.7rem}.empty-collection p{margin:0;font-weight:800;line-height:1.65}
.profile-actions{display:flex;gap:14px;margin-top:26px}.logout{display:block;margin:28px auto 0;color:var(--muted)}@media(max-width:650px){.profile-card>header{grid-template-columns:auto 1fr}.profile-card>header button{grid-column:1/-1}.personal-stats{grid-template-columns:1fr}.collection-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.profile-actions{flex-direction:column}.profile-actions button{width:100%}}@media(max-width:420px){.collection-grid{grid-template-columns:1fr 1fr}.empty-collection{align-items:flex-start;padding:18px}.empty-collection span{font-size:2rem}}
.profile-page{min-height:calc(100svh - 152px);padding-top:24px;padding-bottom:36px}
@media(max-width:650px){.profile-page{min-height:calc(100svh - 136px);padding-top:16px;padding-bottom:24px}}
</style>
