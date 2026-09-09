<script setup>
import { computed, ref } from 'vue'
import { affiliations, circles, districts, divisions, rewardCards } from '../data/content.js'
import RewardCardFace from './RewardCardFace.vue'

const props = defineProps({
  profile: { type: Object, required: true },
  reports: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  favoriteCards: { type: Array, default: () => [] },
  favoriteBusy: Boolean,
  favoriteError: String,
})
const emit = defineEmits(['edit', 'report', 'groups', 'logout', 'favorite'])
const division = computed(() => divisions.find((item) => item.id === props.profile.division))
const affiliation = computed(() => affiliations.find((item) => item.id === props.profile.affiliationId))
const totalMinutes = computed(() => props.reports.reduce((sum, item) => sum + Number(item.minutes || 0), 0))
const totalChants = computed(() => props.reports.reduce((sum, item) => sum + Number(item.chants || 0), 0))
const collectionCards = computed(() => (Array.isArray(props.favoriteCards) ? props.favoriteCards : []).map((favorite) => {
  const card = rewardCards.find((item) => item.id === favorite.cardId)
  return card ? { ...card, cardId: card.id, favoriteId: favorite.favoriteId, mascot: favorite.mascot || card.mascot } : null
}).filter(Boolean))
const previewCard = ref(null)
const removalCard = ref(null)

function requestRemoval(card) {
  previewCard.value = null
  removalCard.value = card
}

function confirmRemoval() {
  if (!removalCard.value || props.favoriteBusy) return
  emit('favorite', removalCard.value, false)
  removalCard.value = null
}
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
          <strong>{{ collectionCards.length }} 張</strong>
        </header>
        <div v-if="collectionCards.length" class="collection-grid">
          <article v-for="card in collectionCards" :key="card.favoriteId" class="collection-item">
            <button class="card-preview-button" type="button" :aria-label="`放大預覽「${card.title}」`" @click="previewCard=card">
              <span class="card-mini-frame"><span class="card-mini-scale"><RewardCardFace :card="card" /></span></span>
            </button>
          </article>
        </div>
        <div v-else class="empty-collection">
          <span aria-hidden="true">♡</span>
          <p>還沒有收藏卡片。<br>完成一筆回報並抽卡，就能把喜歡的鼓勵收藏在這裡。</p>
        </div>
        <p v-if="favoriteError" class="collection-error" role="alert">{{ favoriteError }}</p>
      </section>
      <div class="profile-actions"><button class="comic-button pink" type="button" @click="$emit('report')">立即回報</button><button class="comic-button secondary" type="button" @click="$emit('groups')">查看我的群組</button></div>
      <button class="logout" type="button" @click="$emit('logout')">登出 Google 帳號</button>
    </article>

    <Teleport to="body">
      <div v-if="previewCard" class="card-modal" role="dialog" aria-modal="true" :aria-label="`${previewCard.title}卡片預覽`" @click.self="previewCard=null">
        <div class="preview-dialog">
          <button class="modal-close" type="button" aria-label="關閉卡片預覽" @click="previewCard=null">×</button>
          <button class="modal-delete" type="button" aria-label="移除這張收藏卡片" @click="requestRemoval(previewCard)">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7V5.8C8 4.8 8.8 4 9.8 4h4.4c1 0 1.8.8 1.8 1.8V7m-10 0h12M8 10v7m4-7v7m4-7v7M7 7l.8 12h8.4L17 7" /></svg>
          </button>
          <RewardCardFace :card="previewCard" />
        </div>
      </div>

      <div v-if="removalCard" class="card-modal" role="alertdialog" aria-modal="true" aria-labelledby="remove-card-title" @click.self="removalCard=null">
        <div class="confirm-dialog comic-panel">
          <span aria-hidden="true">♡</span>
          <h2 id="remove-card-title">確定要移除收藏嗎？</h2>
          <p>「{{ removalCard.title }}」將從你的收藏卡片中移除。</p>
          <div>
            <button type="button" :disabled="favoriteBusy" @click="removalCard=null">先保留</button>
            <button class="confirm-remove" type="button" :disabled="favoriteBusy" @click="confirmRemoval">{{ favoriteBusy ? '移除中…' : '確定移除' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
.profile-page{min-height:calc(100svh - 86px);display:grid;place-items:start center;padding:42px 12px 70px;background-color:var(--pink);background-image:radial-gradient(rgba(255,255,255,.2) 3px,transparent 3px);background-size:28px 28px}.profile-card{width:min(920px,100%);padding:clamp(24px,5vw,46px)}.profile-card>header{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:17px}.profile-card>header img{width:76px;height:76px;border:4px solid var(--ink);border-radius:50%;box-shadow:4px 4px 0 var(--ink)}.profile-card>header span,.collection-heading span{display:inline-block;padding:3px 8px;border:2px solid var(--ink);border-radius:999px;background:var(--yellow);font-size:.75rem;font-weight:1000}.profile-card>header h1{margin:5px 0 2px;font-family:var(--font-display);font-size:clamp(1.9rem,5vw,3rem)}.profile-card>header p{margin:0;color:var(--muted);font-weight:800}.profile-card>header button,.logout{padding:8px 12px;border:2px solid var(--ink);border-radius:999px;background:white;font-weight:900;cursor:pointer}.profile-tags{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0}.profile-tags span{padding:7px 11px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);color:white;font-weight:900}.profile-tags span:last-child{background:#b996e8}.personal-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.personal-stats div{padding:18px;border:3px solid var(--ink);border-radius:17px;background:#fff3b3}.personal-stats small,.personal-stats strong,.personal-stats span{display:block}.personal-stats small{color:var(--muted);font-weight:800}.personal-stats strong{margin-top:5px;color:var(--pink);font-family:var(--font-display);font-size:2rem}.personal-stats span{font-weight:900}
.card-collection{margin-top:30px;padding-top:26px;border-top:3px dashed rgba(32,22,15,.45)}.collection-heading{display:flex;align-items:end;justify-content:space-between;gap:16px;margin-bottom:18px}.collection-heading h2{margin:7px 0 0;font-family:var(--font-display);font-size:clamp(1.55rem,4vw,2.2rem)}.collection-heading>strong{padding:7px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--pink);color:white}.collection-grid{display:grid;grid-template-columns:repeat(auto-fit,195px);justify-content:center;gap:24px}.collection-item{display:grid}.card-preview-button{display:block;width:195px;height:293px;padding:0;border:0;border-radius:20px;background:transparent;cursor:zoom-in}.card-preview-button:focus-visible{outline-offset:7px}.card-mini-frame{--card-scale:.573529;display:block;width:195px;height:293px}.card-mini-scale{display:block;width:340px;height:510px;transform:scale(var(--card-scale));transform-origin:top left}.empty-collection{display:flex;align-items:center;justify-content:center;gap:15px;padding:25px;border:3px dashed var(--ink);border-radius:19px;background:#fff3b3;text-align:left}.empty-collection span{color:var(--pink);font-size:2.7rem}.empty-collection p{margin:0;font-weight:800;line-height:1.65}.collection-error{margin:18px 0 0;padding:10px 13px;border:3px solid var(--ink);border-radius:14px;background:#ffe1ea;color:#9d003b;font-weight:900}
.card-modal{position:fixed;z-index:1000;inset:0;display:grid;place-items:center;padding:20px;background:rgba(32,22,15,.78);backdrop-filter:blur(6px)}.preview-dialog{position:relative;width:min(340px,82vw)}.preview-dialog :deep(.reward-face){box-shadow:10px 11px 0 rgba(0,0,0,.65)}.modal-close,.modal-delete{position:absolute;z-index:4;top:-16px;display:grid;place-items:center;width:44px;height:44px;border:4px solid var(--ink);border-radius:50%;box-shadow:4px 4px 0 var(--ink);cursor:pointer}.modal-close{right:-16px;background:var(--yellow);font-size:1.8rem;font-weight:1000;line-height:1}.modal-delete{left:-16px;background:white;color:var(--pink)}.modal-delete svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.confirm-dialog{width:min(430px,100%);padding:30px;text-align:center}.confirm-dialog>span{color:var(--pink);font-size:3rem}.confirm-dialog h2{margin:5px 0 10px;font-family:var(--font-display);font-size:1.65rem}.confirm-dialog p{font-weight:800;line-height:1.6}.confirm-dialog>div{display:flex;justify-content:center;gap:12px;margin-top:22px}.confirm-dialog button{min-height:45px;padding:9px 17px;border:3px solid var(--ink);border-radius:999px;background:white;font-weight:1000;cursor:pointer}.confirm-dialog .confirm-remove{background:var(--pink);color:white}
.profile-actions{display:flex;justify-content:center;gap:14px;margin-top:26px}.logout{display:block;margin:28px auto 0;color:var(--muted)}@media(max-width:650px){.profile-card>header{grid-template-columns:auto 1fr}.profile-card>header button{grid-column:1/-1}.personal-stats{grid-template-columns:1fr}.collection-grid{grid-template-columns:repeat(auto-fit,175px);gap:18px 10px}.card-preview-button,.card-mini-frame{width:175px;height:263px}.card-mini-frame{--card-scale:.514706}.profile-actions{flex-direction:column;align-items:center}.profile-actions button{width:min(100%,340px)}.modal-close{top:-12px;right:-12px}.modal-delete{top:-12px;left:-12px}}@media(max-width:420px){.collection-grid{grid-template-columns:175px}.empty-collection{align-items:flex-start;padding:18px}.empty-collection span{font-size:2rem}.confirm-dialog{padding:24px 18px}.confirm-dialog>div{flex-direction:column}.confirm-dialog button{width:100%}}
.profile-page{min-height:calc(100svh - 152px);padding-top:24px;padding-bottom:36px}
@media(max-width:650px){.profile-page{min-height:calc(100svh - 136px);padding-top:16px;padding-bottom:24px}}
</style>
