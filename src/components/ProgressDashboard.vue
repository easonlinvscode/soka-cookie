<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import LuckyCookieJar from './LuckyCookieJar.vue'
import PersonalCalendar from './PersonalCalendar.vue'
import { getGroupDetails } from '../services/firebaseService.js'
import littleLion from '../assets/characters/little-lion-final.png'
import luckyBear from '../assets/characters/lucky-bear-final.png'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'

const props = defineProps({
  user: { type: Object, required: true },
  profile: { type: Object, required: true },
  reports: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
  groupsLoading: Boolean,
  latestReport: Object,
  highlightLatestUpdate: Boolean,
  initialMode: { type: String, default: 'personal' },
})

const emit = defineEmits(['report', 'groups', 'route'])
const dashboard = ref(null)
const viewMode = ref(props.initialMode === 'groups' ? 'groups' : 'personal')
const groupProgress = ref([])
const progressLoading = ref(false)
const progressError = ref('')
const displayedMinutes = ref(0)
const displayedChants = ref(0)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const counter = { minutes: 0, chants: 0 }
let motionContext
const companionOptions = [
  { src: littleLion, name: '小獅子' },
  { src: luckyBear, name: '幸運小熊' },
  { src: phoenixChick, name: '小鳳雛' },
]
const personalCompanion = companionOptions[Math.floor(Math.random() * companionOptions.length)]

function timestampToDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatDate(value) {
  const date = timestampToDate(value)
  if (!date) return '尚未開始'
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const personalReports = computed(() => {
  const items = [...props.reports]
  if (props.latestReport?.userId === props.user.uid && !items.some((item) => item.id === props.latestReport.id)) {
    items.push(props.latestReport)
  }
  return items
})
const personalMinutes = computed(() => personalReports.value.reduce((sum, item) => sum + Number(item.minutes || 0), 0))
const personalChants = computed(() => personalReports.value.reduce((sum, item) => sum + Number(item.chants || 0), 0))
const personalStartDate = computed(() => {
  const reportDates = personalReports.value.map((item) => timestampToDate(item.createdAt)).filter(Boolean)
  if (reportDates.length) return new Date(Math.min(...reportDates.map((date) => date.getTime())))
  return timestampToDate(props.profile.createdAt)
})
const jarTarget = computed(() => Math.max(1000, personalMinutes.value))
const hasFreshPersonalReport = computed(() => props.highlightLatestUpdate && props.latestReport?.userId === props.user.uid)

function animatePersonalTotals() {
  const minutes = personalMinutes.value
  const chants = personalChants.value
  if (reducedMotion.matches) {
    displayedMinutes.value = minutes
    displayedChants.value = chants
    return
  }
  gsap.killTweensOf(counter)
  counter.minutes = displayedMinutes.value
  counter.chants = displayedChants.value
  gsap.to(counter, {
    minutes,
    chants,
    duration: 1.05,
    ease: 'power3.out',
    onUpdate: () => {
      displayedMinutes.value = counter.minutes
      displayedChants.value = counter.chants
    },
  })
}

async function loadGroupProgress() {
  if (!props.groups.length) {
    groupProgress.value = []
    progressError.value = ''
    progressLoading.value = false
    return
  }
  progressLoading.value = true
  progressError.value = ''
  const results = await Promise.allSettled(props.groups.map((group) => getGroupDetails(group.id)))
  const loaded = []
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return
    const source = props.groups[index]
    const { group, members, contributions } = result.value
    const unitKey = group.targetType === 'minutes' ? 'minutes' : 'chants'
    const unitLabel = unitKey === 'minutes' ? '分鐘' : '遍'
    const total = contributions.reduce((sum, item) => sum + Number(item[unitKey] || 0), 0)
    const mine = contributions
      .filter((item) => item.userId === props.user.uid)
      .reduce((sum, item) => sum + Number(item[unitKey] || 0), 0)
    const target = Number(group.targetValue || 0)
    const endDate = timestampToDate(group.endDate)
    loaded.push({
      ...group,
      membership: source.membership,
      total,
      mine,
      target,
      unitLabel,
      memberCount: members.length,
      percentage: target > 0 ? Math.min(100, Math.round(total / target * 100)) : 0,
      ended: group.status !== 'active' || Boolean(endDate && endDate < new Date()),
      statusLabel: group.status === 'archived'
        ? '群組已封存'
        : (group.status === 'ended'
          ? '挑戰已結束'
          : (endDate && endDate < new Date() ? '挑戰已到期' : '挑戰進行中')),
      justUpdated: props.highlightLatestUpdate && props.latestReport?.groupIds?.includes(group.id),
    })
  })
  groupProgress.value = loaded
  if (loaded.length !== props.groups.length) progressError.value = '部分群組進度暫時無法讀取，請稍後再試。'
  progressLoading.value = false
  await nextTick()
  if (!reducedMotion.matches && viewMode.value === 'groups') {
    gsap.fromTo('.group-progress-card', { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .42, stagger: .08, ease: 'power2.out' })
  }
}

function selectMode(mode) {
  viewMode.value = mode
  emit('route', mode)
  if (mode === 'groups' && props.groups.length) loadGroupProgress()
}

watch(() => props.initialMode, (mode) => {
  const nextMode = mode === 'groups' ? 'groups' : 'personal'
  if (viewMode.value === nextMode) return
  viewMode.value = nextMode
  if (nextMode === 'groups' && props.groups.length) loadGroupProgress()
})

watch([personalMinutes, personalChants], async () => {
  await nextTick()
  animatePersonalTotals()
}, { immediate: true })

watch(
  () => props.groups.map((group) => `${group.id}:${group.updatedAt?.seconds || ''}`).join('|'),
  () => {
    groupProgress.value = []
    if (viewMode.value === 'groups') loadGroupProgress()
  },
  { immediate: true },
)

onMounted(() => {
  motionContext = gsap.context(() => {
    if (reducedMotion.matches) return
    gsap.from('.progress-heading, .view-tabs', { y: -16, autoAlpha: 0, duration: .48, stagger: .08, ease: 'power2.out' })
    gsap.from('.personal-visual', { x: -30, autoAlpha: 0, duration: .62, ease: 'power3.out', delay: .12 })
    gsap.from('.personal-copy > *', { x: 24, autoAlpha: 0, duration: .42, stagger: .06, ease: 'power2.out', delay: .16 })
    gsap.to('.jar-companion', { y: -12, rotation: 3, duration: 1.75, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  }, dashboard.value)
})

onUnmounted(() => {
  gsap.killTweensOf(counter)
  motionContext?.revert()
})
</script>

<template>
  <section ref="dashboard" class="progress-section">
    <div class="progress-wrap">
      <header class="progress-heading">
        <span>MY COOKIE PROGRESS</span>
        <h1>查看進度</h1>
      </header>

      <div class="view-tabs" role="tablist" aria-label="選擇進度內容">
        <button type="button" role="tab" :aria-selected="viewMode === 'personal'" :class="{ active: viewMode === 'personal' }" @click="selectMode('personal')">個人進度</button>
        <button type="button" role="tab" :aria-selected="viewMode === 'groups'" :class="{ active: viewMode === 'groups' }" @click="selectMode('groups')">群組進度</button>
      </div>

      <Transition name="progress-switch" mode="out-in">
        <div v-if="viewMode === 'personal'" key="personal" class="personal-view">
          <article class="personal-panel comic-panel">
            <div class="personal-visual">
              <div v-if="hasFreshPersonalReport" class="latest-badge">剛剛更新!</div>
              <img class="jar-companion" :src="personalCompanion.src" :alt="`${personalCompanion.name}在餅乾罐旁替你加油`">
              <LuckyCookieJar :value="personalMinutes" :target="jarTarget" variant-key="personal-progress" :celebrate="hasFreshPersonalReport" />
            </div>

            <div class="personal-copy">
              <span class="personal-label" :class="profile.division">{{ profile.displayName }}的個人進度</span>
              <h2>我的累積</h2>
              <p class="start-date">從 <strong>{{ formatDate(personalStartDate) }}</strong> 開始</p>

              <div class="personal-stats">
                <div>
                  <span>目前已累積</span>
                  <strong>{{ Math.round(displayedMinutes).toLocaleString() }}</strong>
                  <small>分鐘</small>
                </div>
                <div>
                  <span>目前已累積</span>
                  <strong>{{ Math.round(displayedChants).toLocaleString() }}</strong>
                  <small>遍</small>
                </div>
              </div>

              <p v-if="!personalReports.length" class="personal-empty">還沒有回報紀錄，完成第一次回報後，餅乾就會開始累積。</p>
              <p v-else class="report-count">已完成 {{ personalReports.length.toLocaleString() }} 次回報</p>
              <button class="comic-button pink" type="button" @click="emit('report')">再回報一次</button>
            </div>
          </article>
          <PersonalCalendar :user="user" :profile="profile" :reports="reports" :groups="groups" />
        </div>

        <div v-else key="groups" class="group-progress-view">
          <article v-if="groupsLoading || progressLoading" class="status-panel comic-panel" aria-live="polite">
            <span class="status-cookie" aria-hidden="true">★</span>
            <h2>正在整理群組進度…</h2>
          </article>

          <article v-else-if="!groups.length" class="status-panel empty-panel comic-panel">
            <span class="status-cookie" aria-hidden="true">♡</span>
            <h2>尚未加入任何群組</h2>
            <p>個人進度會繼續累積；建立群組或輸入邀請碼後，就能在這裡查看共同挑戰。</p>
            <div class="empty-actions">
              <button class="comic-button" type="button" @click="emit('groups')">建立或加入群組</button>
              <button class="comic-button secondary" type="button" @click="selectMode('personal')">查看個人進度</button>
            </div>
          </article>

          <div v-else class="group-progress-list">
            <p v-if="progressError" class="progress-error" role="alert">{{ progressError }}</p>
            <article v-for="group in groupProgress" :key="group.id" class="group-progress-card comic-panel" :class="{ expired: group.ended }" role="link" tabindex="0" :aria-label="`開啟群組：${group.name}`" @click="emit('groups', group.id)" @keydown.enter.prevent="emit('groups', group.id)" @keydown.space.prevent="emit('groups', group.id)">
              <header>
                <div>
                  <span class="group-state">{{ group.statusLabel }}</span>
                  <h2>{{ group.name }}</h2>
                </div>
                <span v-if="group.justUpdated" class="updated-chip">剛剛更新!</span>
              </header>
              <p class="group-description">{{ group.description }}</p>
              <p class="group-dates">{{ formatDate(group.createdAt) }} 開始　／　{{ formatDate(group.endDate) }} 完成</p>
              <div class="group-meter progress-breathe" :aria-label="`${group.name} 已完成 ${group.percentage}%`">
                <i :style="{ width: `${group.percentage}%` }"></i>
              </div>
              <div class="group-meter-copy">
                <strong>{{ group.total.toLocaleString() }}／{{ group.target.toLocaleString() }} {{ group.unitLabel }}</strong>
                <span>{{ group.percentage }}%</span>
              </div>
              <div class="group-stats">
                <div><span>我的貢獻</span><strong>{{ group.mine.toLocaleString() }} {{ group.unitLabel }}</strong></div>
                <div><span>群組成員</span><strong>{{ group.memberCount }} 人</strong></div>
                <div><span>我的身分</span><strong>{{ group.ownerId === user.uid ? '建立者' : '成員' }}</strong></div>
              </div>
              <span class="open-group-hint">查看群組內容 →</span>
            </article>
            <button class="manage-groups comic-button secondary" type="button" @click="emit('groups')">管理我的群組</button>
          </div>
        </div>
      </Transition>
    </div>
  </section>
</template>

<style scoped>
.progress-section{min-height:calc(100svh - 86px);padding:22px 0 64px;background-color:var(--cream);background-image:linear-gradient(45deg,rgba(245,4,105,.07) 25%,transparent 25%),linear-gradient(-45deg,rgba(245,4,105,.07) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(245,4,105,.07) 75%),linear-gradient(-45deg,transparent 75%,rgba(245,4,105,.07) 75%);background-size:38px 38px;background-position:0 0,0 19px,19px -19px,-19px 0}.progress-wrap{width:var(--page);margin:auto}.progress-heading{text-align:center}.progress-heading>span{display:inline-block;padding:5px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);box-shadow:4px 4px 0 var(--ink);font-size:.82rem;font-weight:1000}.progress-heading h1{margin:10px 0 14px;font-family:var(--font-display);font-size:clamp(2.1rem,5vw,3.6rem);line-height:1}.view-tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:min(540px,100%);margin:0 auto 20px}.view-tabs button{min-height:50px;border:4px solid var(--ink);border-radius:999px;background:white;box-shadow:4px 4px 0 var(--ink);font-family:var(--font-display);font-size:1.05rem;font-weight:1000;cursor:pointer}.view-tabs button.active{background:var(--yellow);transform:translate(2px,2px);box-shadow:2px 2px 0 var(--ink)}
.personal-panel{display:grid;grid-template-columns:minmax(320px,.88fr) minmax(390px,1.12fr);align-items:center;gap:clamp(20px,5vw,64px);padding:clamp(20px,3vw,36px);background:#fff3b3}.personal-visual{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;justify-content:center;min-width:0}.personal-visual :deep(.cookie-jar){width:min(100%,310px)}.jar-companion{position:relative;z-index:6;width:105px;margin:0 0 24px 4px;filter:drop-shadow(6px 8px 0 rgba(32,22,15,.85));transform-origin:50% 90%}.latest-badge{position:absolute;z-index:8;top:7%;right:2%;padding:8px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--pink);color:white;box-shadow:4px 4px 0 var(--ink);font-weight:1000;transform:rotate(5deg)}
.personal-label{display:inline-block;padding:6px 11px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);color:white;font-weight:1000}.personal-label.women{background:var(--pink)}.personal-copy h2{margin:13px 0 2px;font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem)}.start-date{margin:0 0 16px;font-weight:800}.start-date strong{color:var(--pink)}.personal-stats{display:grid;grid-template-columns:1fr 1fr;gap:12px}.personal-stats>div{padding:14px 16px;border:3px solid var(--ink);border-radius:17px;background:white;box-shadow:3px 3px 0 var(--ink)}.personal-stats span,.personal-stats strong,.personal-stats small{display:block}.personal-stats span{color:var(--muted);font-size:.86rem;font-weight:800}.personal-stats strong{margin-top:2px;color:var(--pink);font-family:var(--font-display);font-size:clamp(2.2rem,5vw,3.4rem);line-height:1}.personal-stats small{margin-top:4px;font-weight:1000}.report-count,.personal-empty{margin:16px 0;font-weight:900}.personal-empty{padding:11px 13px;border:3px dashed var(--ink);border-radius:14px;background:#fff1a5;line-height:1.55}.personal-copy .comic-button{min-height:48px}
.group-progress-view{width:min(930px,100%);margin:auto}.group-progress-list{display:grid;gap:18px}.group-progress-card{padding:clamp(20px,4vw,32px);background:#fff9e9;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease}.group-progress-card:hover,.group-progress-card:focus-visible{transform:translateY(-4px);box-shadow:9px 12px 0 var(--ink);outline:none}.group-progress-card.expired{background:#f1eadf}.group-progress-card>header{display:flex;justify-content:space-between;align-items:flex-start;gap:14px}.group-state,.updated-chip{display:inline-block;padding:4px 9px;border:2px solid var(--ink);border-radius:999px;background:var(--green);color:white;font-size:.78rem;font-weight:1000}.expired .group-state{background:var(--muted)}.updated-chip{background:var(--pink);box-shadow:3px 3px 0 var(--ink);transform:rotate(3deg)}.group-progress-card h2{margin:8px 0 0;font-family:var(--font-display);font-size:clamp(1.65rem,4vw,2.35rem)}.group-description{margin:14px 0 5px;font-weight:800;line-height:1.6}.group-dates{margin:0 0 16px;color:var(--muted);font-size:.9rem;font-weight:900}.group-meter{height:27px;overflow:hidden;border:4px solid var(--ink);border-radius:999px;background:white;box-shadow:3px 3px 0 var(--ink)}.group-meter i{display:block;height:100%;border-right:3px solid var(--ink);background:repeating-linear-gradient(135deg,var(--pink) 0 12px,var(--yellow) 12px 24px);transition:width .7s cubic-bezier(.2,.8,.2,1)}.group-meter-copy{display:flex;justify-content:space-between;gap:12px;margin-top:8px;font-weight:1000}.group-meter-copy span{color:var(--pink)}.group-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:18px}.group-stats div{padding:11px 13px;border:3px solid var(--ink);border-radius:14px;background:white}.group-stats span,.group-stats strong{display:block}.group-stats span{color:var(--muted);font-size:.8rem;font-weight:800}.group-stats strong{margin-top:3px}.open-group-hint{display:block;margin-top:15px;color:var(--pink);font-weight:1000;text-align:right}.manage-groups{justify-self:center}.status-panel{padding:clamp(32px,7vw,64px);text-align:center;background:#fff3b3}.status-cookie{display:grid;place-items:center;width:66px;height:66px;margin:0 auto;border:4px solid var(--ink);border-radius:50%;background:var(--yellow);color:var(--pink);box-shadow:5px 5px 0 var(--ink);font-size:2rem;animation:status-breathe 1.2s ease-in-out infinite alternate}.status-panel h2{margin:20px 0 8px;font-family:var(--font-display);font-size:clamp(1.8rem,5vw,2.7rem)}.status-panel p{max-width:570px;margin:0 auto 22px;font-weight:800;line-height:1.7}.empty-actions{display:flex;justify-content:center;gap:12px}.progress-error{margin:0;padding:11px 14px;border:3px solid var(--ink);border-radius:14px;background:#ffe1ea;color:#9d003b;font-weight:900}
.progress-switch-enter-active,.progress-switch-leave-active{transition:opacity .22s ease,transform .22s ease}.progress-switch-enter-from{opacity:0;transform:translateY(14px)}.progress-switch-leave-to{opacity:0;transform:translateY(-10px)}@keyframes status-breathe{to{transform:translateY(-8px) scale(1.05)}}
@media(max-width:850px){.personal-panel{grid-template-columns:1fr;gap:0}.personal-visual{width:min(470px,100%);margin:auto}.personal-visual :deep(.cookie-jar){width:min(100%,330px)}.jar-companion{width:110px}.personal-copy{text-align:center}.personal-stats{text-align:left}}
@media(max-width:600px){.progress-section{min-height:calc(100svh - 72px);padding:12px 0 38px}.progress-wrap{width:min(100% - 16px,var(--page))}.progress-heading h1{margin-bottom:12px}.view-tabs{gap:7px;margin-bottom:14px}.view-tabs button{min-height:46px;font-size:.95rem}.personal-panel,.group-progress-card,.status-panel{border-radius:28px}.personal-panel{padding:12px 14px 22px}.personal-visual{width:min(330px,100%)}.personal-visual :deep(.cookie-jar){width:min(100%,245px)}.jar-companion{width:78px;margin-bottom:18px}.latest-badge{top:5%;right:4%;padding:6px 9px;font-size:.76rem}.personal-copy h2{font-size:1.9rem}.personal-stats{gap:8px}.personal-stats>div{padding:12px}.personal-stats strong{font-size:2.15rem}.group-progress-card>header{align-items:center}.group-dates{line-height:1.6}.group-stats{grid-template-columns:1fr}.empty-actions{flex-direction:column}.empty-actions button{width:100%}}
@media(prefers-reduced-motion:reduce){.group-meter i,.status-cookie{animation:none}}
.progress-section{min-height:calc(100svh - 152px);padding-bottom:32px}
@media(max-width:600px){.progress-section{min-height:calc(100svh - 136px);padding-bottom:24px}}
.personal-visual{grid-template-columns:minmax(0,1fr) minmax(0,310px) minmax(0,1fr);column-gap:8px}.personal-visual :deep(.cookie-jar){grid-column:2;width:100%}.jar-companion{grid-column:1;grid-row:1;justify-self:end;width:92px;margin-right:0}.personal-copy .comic-button{display:block;margin-left:auto}
@media(max-width:850px){.personal-visual{grid-template-columns:minmax(0,1fr) minmax(0,330px) minmax(0,1fr)}.jar-companion{width:96px}}
@media(max-width:600px){.personal-visual{grid-template-columns:minmax(0,1fr) minmax(0,225px) minmax(0,1fr);width:min(350px,100%)}.personal-visual :deep(.cookie-jar){width:100%}.jar-companion{width:62px}}
</style>
