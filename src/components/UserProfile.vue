<script setup>
import { computed } from 'vue'
import { affiliations, circles, districts, divisions } from '../data/content.js'

const props = defineProps({ profile: { type: Object, required: true }, reports: { type: Array, default: () => [] }, groups: { type: Array, default: () => [] } })
defineEmits(['edit', 'report', 'groups', 'logout'])
const division = computed(() => divisions.find((item) => item.id === props.profile.division))
const affiliation = computed(() => affiliations.find((item) => item.id === props.profile.affiliationId))
const totalMinutes = computed(() => props.reports.reduce((sum, item) => sum + Number(item.minutes || 0), 0))
const totalChants = computed(() => props.reports.reduce((sum, item) => sum + Number(item.chants || 0), 0))
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
      <div class="profile-actions"><button class="comic-button pink" type="button" @click="$emit('report')">立即回報</button><button class="comic-button secondary" type="button" @click="$emit('groups')">查看我的群組</button></div>
      <button class="logout" type="button" @click="$emit('logout')">登出 Google 帳號</button>
    </article>
  </section>
</template>

<style scoped>
.profile-page{min-height:calc(100svh - 86px);display:grid;place-items:start center;padding:42px 12px 70px;background-color:var(--pink);background-image:radial-gradient(rgba(255,255,255,.2) 3px,transparent 3px);background-size:28px 28px}.profile-card{width:min(820px,100%);padding:clamp(24px,5vw,46px)}header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:17px}header img{width:76px;height:76px;border:4px solid var(--ink);border-radius:50%;box-shadow:4px 4px 0 var(--ink)}header span{display:inline-block;padding:3px 8px;border:2px solid var(--ink);border-radius:999px;background:var(--yellow);font-size:.75rem;font-weight:1000}header h1{margin:5px 0 2px;font-family:var(--font-display);font-size:clamp(1.9rem,5vw,3rem)}header p{margin:0;color:var(--muted);font-weight:800}header button,.logout{padding:8px 12px;border:2px solid var(--ink);border-radius:999px;background:white;font-weight:900;cursor:pointer}.profile-tags{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.profile-tags span{padding:7px 11px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);color:white;font-weight:900}.profile-tags span:last-child{background:#b996e8}.personal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.personal-stats div{padding:18px;border:3px solid var(--ink);border-radius:17px;background:#fff3b3}.personal-stats small,.personal-stats strong,.personal-stats span{display:block}.personal-stats small{color:var(--muted);font-weight:800}.personal-stats strong{margin-top:5px;color:var(--pink);font-family:var(--font-display);font-size:2rem}.personal-stats span{font-weight:900}.profile-actions{display:flex;gap:14px;margin-top:26px}.logout{display:block;margin:28px auto 0;color:var(--muted)}@media(max-width:650px){header{grid-template-columns:auto 1fr}header button{grid-column:1/-1}.personal-stats{grid-template-columns:1fr}.profile-actions{flex-direction:column}.profile-actions button{width:100%}}
.profile-page{min-height:calc(100svh - 152px);padding-top:24px;padding-bottom:36px}
@media(max-width:650px){.profile-page{min-height:calc(100svh - 136px);padding-top:16px;padding-bottom:24px}}
</style>
