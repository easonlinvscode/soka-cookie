<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import confetti from 'canvas-confetti'
import { affiliations, divisions, rewardCards } from '../data/content.js'
import cardBack from '../assets/reward-card-back.png'
import CookieParadeIcon from './CookieParadeIcon.vue'
import RewardCardFace from './RewardCardFace.vue'

const props = defineProps({
  report: { type: Object, required: true },
  favoriteCards: { type: Array, default: () => [] },
  favoriteBusy: Boolean,
  favoriteError: String,
})
const emit = defineEmits(['progress', 'favorite'])

const section = ref(null)
const cardShell = ref(null)
const phase = ref('ready')
const displayedMinutes = ref(0)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const cookieShapes = ['star', 'heart', 'flower', 'round']
let motionContext

function stableCardIndex(value) {
  const input = String(value || 'lucky-cookie')
  let hash = 2166136261
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash) % rewardCards.length
}

function pickCard() {
  const favorites = Array.isArray(props.favoriteCards) ? props.favoriteCards : []
  const collectedIds = new Set(favorites.map((item) => item.cardId))
  const uncollectedCards = rewardCards.filter((item) => !collectedIds.has(item.id))
  const cardPool = uncollectedCards.length ? uncollectedCards : rewardCards
  const baseCard = cardPool[stableCardIndex(props.report.id) % cardPool.length]
  const mascots = ['lion', 'bear', 'phoenix']
  const mascot = mascots[stableCardIndex(`${props.report.id}-${baseCard.id}-mascot`) % mascots.length]
  return { ...baseCard, mascot }
}

const card = ref(pickCard())
const isFavorite = computed(() => (Array.isArray(props.favoriteCards) ? props.favoriteCards : []).some((favorite) => {
  const baseCard = rewardCards.find((item) => item.id === favorite.cardId)
  return favorite.cardId === card.value.id && (favorite.mascot || baseCard?.mascot) === card.value.mascot
}))
const divisionLabel = computed(() => divisions.find((item) => item.id === props.report.division)?.label)
const affiliationLabel = computed(() => affiliations.find((item) => item.id === props.report.affiliationId)?.label)

function animateCounter() {
  if (reducedMotion.matches) {
    displayedMinutes.value = props.report.minutes
    return
  }
  const counter = { value: 0 }
  gsap.to(counter, {
    value: props.report.minutes,
    duration: 1,
    ease: 'power2.out',
    onUpdate: () => { displayedMinutes.value = Math.round(counter.value) },
  })
}

async function drawCard() {
  if (phase.value !== 'ready') return
  phase.value = 'drawing'
  await nextTick()
  if (reducedMotion.matches) {
    phase.value = 'revealed'
    displayedMinutes.value = props.report.minutes
    return
  }

  const shell = cardShell.value
  const timeline = gsap.timeline({
    onComplete: () => {
      phase.value = 'revealed'
      animateCounter()
      confetti({ particleCount: 85, spread: 75, origin: { y: .55 }, colors: ['#f50469', '#ffe13b', '#54c8ef'] })
    },
  })
  timeline
    .to(shell, { y: -22, rotation: -6, scale: 1.04, duration: .28, ease: 'power2.out' })
    .to(shell, { x: -18, rotation: 8, duration: .16, repeat: 3, yoyo: true, ease: 'power1.inOut' })
    .to(shell, { x: 0, rotationY: 540, rotation: 0, duration: .88, ease: 'back.inOut(1.25)' })
    .to(shell, { y: 0, scale: 1, duration: .24, ease: 'bounce.out' })
}

onMounted(() => {
  motionContext = gsap.context(() => {
    if (!reducedMotion.matches) {
      gsap.from('.draw-heading > *', { y: 24, autoAlpha: 0, stagger: .08, duration: .45, ease: 'power2.out' })
      gsap.from('.draw-stage', { scale: .84, autoAlpha: 0, duration: .65, ease: 'back.out(1.55)' })
      gsap.to('.card-back-glow', { scale: 1.12, autoAlpha: .25, duration: 1.1, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.to('.cookie-piece', { y: index => index % 2 ? -8 : 8, rotation: index => index % 2 ? 12 : -12, duration: index => .9 + index * .04, repeat: -1, yoyo: true, ease: 'sine.inOut', stagger: .05 })
    }
  }, section.value)
})

onUnmounted(() => motionContext?.revert())
</script>

<template>
  <section ref="section" class="draw-page">
    <div class="cookie-parade" aria-hidden="true">
      <span v-for="n in 20" :key="n" class="cookie-piece">
        <CookieParadeIcon :type="cookieShapes[(n - 1) % cookieShapes.length]" :color-index="n - 1" />
      </span>
    </div>

    <header class="draw-heading">
      <span>REPORT COMPLETE</span>
      <h1>{{ phase === 'revealed' ? '你的福運卡來了！' : '回報成功！' }}</h1>
      <p v-if="phase !== 'revealed'">你獲得一次福運鼓勵卡抽卡機會。</p>
    </header>

    <div class="draw-layout" :class="{ revealed: phase === 'revealed' }">
      <div class="draw-stage" aria-live="polite">
        <div class="card-back-glow" aria-hidden="true"></div>
        <div ref="cardShell" class="draw-card" :class="{ flipped: phase === 'revealed' }">
          <div class="draw-face draw-back">
            <img :src="cardBack" alt="沒有文字的福運鼓勵卡背面">
          </div>
          <div class="draw-face draw-front">
            <RewardCardFace :card="card" />
          </div>
        </div>
        <div v-if="phase === 'drawing'" class="drawing-status">幸運餅乾烘焙中⋯</div>
      </div>

      <div class="draw-actions">
        <button v-if="phase === 'ready'" class="comic-button draw-button" type="button" @click="drawCard">抽一張福運鼓勵卡！</button>
        <template v-else-if="phase === 'revealed'">
          <button class="favorite-button" :class="{ active: isFavorite }" type="button" :disabled="favoriteBusy" @click="emit('favorite', card, !isFavorite)">
            <span aria-hidden="true">{{ isFavorite ? '♥' : '♡' }}</span>
            {{ favoriteBusy ? '儲存中…' : isFavorite ? '已收藏' : '收藏這張卡' }}
          </button>
          <p v-if="favoriteError" class="favorite-error" role="alert">{{ favoriteError }}</p>
          <div class="report-result">
            <span>{{ divisionLabel }}／{{ affiliationLabel }}</span>
            <strong>+ {{ displayedMinutes.toLocaleString() }} 分鐘</strong>
            <small>{{ report.chants.toLocaleString() }} 遍的幸運能量已加入！</small>
          </div>
          <button class="comic-button secondary progress-button" type="button" @click="emit('progress')">查看最新進度</button>
        </template>
        <p v-else class="drawing-hint">卡片正在洗牌，看看今天會抽到哪一張！</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.draw-page{position:relative;min-height:calc(100svh - 152px);padding:28px 16px 45px;overflow:hidden;background-color:var(--blue);background-image:radial-gradient(rgba(255,255,255,.34) 3px,transparent 3px);background-size:30px 30px}
.draw-heading{position:relative;z-index:2;margin:0 auto 22px;text-align:center}.draw-heading span{display:inline-block;padding:5px 11px;border:3px solid var(--ink);border-radius:999px;background:var(--yellow);box-shadow:4px 4px 0 var(--ink);font-size:.75rem;font-weight:1000;letter-spacing:.08em}.draw-heading h1{margin:12px 0 5px;font-family:var(--font-display);font-size:clamp(2rem,5vw,3.4rem)}.draw-heading p{margin:0;font-weight:900}
.draw-layout{position:relative;z-index:2;display:grid;justify-items:center;gap:22px;width:min(720px,100%);margin:auto}.draw-stage{position:relative;width:min(310px,72vw);perspective:1400px}.card-back-glow{position:absolute;inset:8%;border-radius:36px;background:white;filter:blur(22px);opacity:.12}.draw-card{position:relative;width:100%;aspect-ratio:2/3;transform-style:preserve-3d;will-change:transform}.draw-face{position:absolute;inset:0;backface-visibility:hidden}.draw-back{overflow:hidden;border:5px solid var(--ink);border-radius:27px;background:var(--cream);box-shadow:9px 10px 0 var(--ink)}.draw-back img{position:absolute;inset:0;width:100%;height:100%;display:block;object-fit:cover;transform:scale(1.075)}.draw-front{transform:rotateY(180deg)}.draw-card.flipped{transform:rotateY(180deg)}
.drawing-status{position:absolute;right:50%;bottom:20px;z-index:4;min-width:max-content;padding:7px 13px;border:3px solid var(--ink);border-radius:999px;background:var(--yellow);box-shadow:4px 4px 0 var(--ink);font-weight:1000;transform:translateX(50%)}
.draw-actions{display:grid;justify-items:center;width:min(520px,100%)}.draw-button{background:var(--pink);color:white;font-size:1.05rem}.drawing-hint{margin:0;padding:10px 14px;border:3px solid var(--ink);border-radius:999px;background:white;font-weight:900;text-align:center}
.favorite-button{display:flex;align-items:center;gap:8px;min-height:48px;padding:9px 18px;border:3px solid var(--ink);border-radius:999px;background:white;box-shadow:4px 4px 0 var(--ink);font-weight:1000;cursor:pointer}.favorite-button span{color:var(--pink);font-size:1.45rem;line-height:1}.favorite-button.active{background:#ffe4ef}.favorite-button:disabled{opacity:.6;cursor:wait}.favorite-error{margin:12px 0 0;color:#9d003b;font-weight:900}
.report-result{display:flex;flex-direction:column;gap:3px;width:100%;margin:18px 0 14px;padding:13px;border:3px solid var(--ink);border-radius:17px;background:#fff1a5;box-shadow:4px 4px 0 var(--ink);text-align:center}.report-result span,.report-result small{font-weight:800}.report-result strong{color:var(--pink);font-family:var(--font-display);font-size:1.45rem}.progress-button{min-height:48px;padding-block:9px}
.cookie-parade{position:absolute;z-index:1;inset:0;pointer-events:none}.cookie-piece{position:absolute;display:grid;place-items:center;width:42px;height:42px;opacity:.58;filter:drop-shadow(3px 4px 0 rgba(36,22,14,.24))}.cookie-piece:nth-child(3n){width:50px;height:50px}.cookie-piece:nth-child(1){top:8%;left:5%}.cookie-piece:nth-child(2){top:19%;left:15%}.cookie-piece:nth-child(3){top:34%;left:4%}.cookie-piece:nth-child(4){top:50%;left:13%}.cookie-piece:nth-child(5){top:68%;left:5%}.cookie-piece:nth-child(6){top:84%;left:17%}.cookie-piece:nth-child(7){top:12%;left:29%}.cookie-piece:nth-child(8){top:73%;left:27%}.cookie-piece:nth-child(9){top:91%;left:38%}.cookie-piece:nth-child(10){top:8%;right:31%}.cookie-piece:nth-child(11){top:88%;right:36%}.cookie-piece:nth-child(12){top:21%;right:17%}.cookie-piece:nth-child(13){top:38%;right:5%}.cookie-piece:nth-child(14){top:55%;right:14%}.cookie-piece:nth-child(15){top:72%;right:4%}.cookie-piece:nth-child(16){top:87%;right:18%}.cookie-piece:nth-child(17){top:6%;right:5%}.cookie-piece:nth-child(18){top:47%;left:24%}.cookie-piece:nth-child(19){top:62%;right:27%}.cookie-piece:nth-child(20){top:94%;right:6%}
@media(max-width:520px){.draw-page{min-height:calc(100svh - 136px);padding:18px 12px 30px}.draw-heading{margin-bottom:16px}.draw-heading h1{margin-top:9px}.draw-layout{gap:17px}.draw-stage{width:min(265px,68vw)}.cookie-piece{width:28px;height:28px;opacity:.42}.cookie-piece:nth-child(3n){width:32px;height:32px}.cookie-piece:nth-child(7),.cookie-piece:nth-child(10),.cookie-piece:nth-child(18),.cookie-piece:nth-child(19){display:none}.report-result{margin-top:15px}}
</style>
