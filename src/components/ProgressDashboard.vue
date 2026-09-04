<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import gsap from 'gsap'
import { divisions, headquarters, TARGET_PER_TEAM } from '../data/content.js'
import LuckyCookieJar from './LuckyCookieJar.vue'
import littleBear from '../assets/characters/lucky-bear-final.png'
import littleLion from '../assets/characters/little-lion-final.png'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'

const guideCharacters = [
  { src: littleBear, alt: '拿著福運餅乾、揮手加油的小熊' },
  { src: littleLion, alt: '在餅乾罐旁揮手加油的小獅子' },
  { src: phoenixChick, alt: '在餅乾罐旁帶來鼓勵的小鳳雛' },
]
const guideCharacter = guideCharacters[Math.floor(Math.random() * guideCharacters.length)]

const props = defineProps({ division: String, progress: Object, latestReport: Object, highlightLatestUpdate: Boolean })
const emit = defineEmits(['update:division', 'report'])
const dashboard = ref(null)
const activeHeadquarters = ref('total')
const currentDivision = computed(() => divisions.find(item => item.id === props.division))
const divisionTotal = computed(() => headquarters.reduce((sum, hq) => sum + props.progress[hq.id][props.division], 0))
const isDivisionTotal = computed(() => activeHeadquarters.value === 'total')
const currentHeadquarters = computed(() => headquarters.find(item => item.id === activeHeadquarters.value))
const currentTarget = computed(() => isDivisionTotal.value ? TARGET_PER_TEAM * headquarters.length : TARGET_PER_TEAM)
const currentValue = computed(() => isDivisionTotal.value ? divisionTotal.value : props.progress[activeHeadquarters.value][props.division])
const districtTotal = computed(() => headquarters.reduce((sum, hq) => sum + props.progress[hq.id].men + props.progress[hq.id].women, 0))
const percentage = computed(() => Math.round(currentValue.value / currentTarget.value * 100))
const displayedValue = ref(0)
const displayedPercentage = ref(0)
const showLatestUpdate = computed(() => props.highlightLatestUpdate
  && props.latestReport?.division === props.division
  && (isDivisionTotal.value || props.latestReport?.headquarters === activeHeadquarters.value))
const counter = { value: 0, percentage: 0 }
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let motionContext
let scrollFrame

watch(() => props.latestReport, report => {
  if (report?.division === props.division) activeHeadquarters.value = 'total'
})
function selectDivision(id) {
  emit('update:division', id)
  activeHeadquarters.value = 'total'
}

function animateProgress(animateJar = true, delay = 0) {
  const nextValue = currentValue.value
  const nextPercentage = percentage.value
  if (reducedMotion.matches) {
    displayedValue.value = nextValue
    displayedPercentage.value = nextPercentage
    return
  }
  gsap.killTweensOf(counter)
  counter.value = displayedValue.value
  counter.percentage = displayedPercentage.value
  gsap.to(counter, {
    value: nextValue,
    percentage: nextPercentage,
    duration: 1.05,
    delay,
    ease: 'power3.out',
    onUpdate: () => {
      displayedValue.value = counter.value
      displayedPercentage.value = counter.percentage
    },
  })
  if (animateJar && dashboard.value) {
    gsap.fromTo(dashboard.value.querySelector('.jar-visual'),
      { autoAlpha: .2, scale: .94, rotation: -1.5 },
      { autoAlpha: 1, scale: 1, rotation: 0, duration: .62, ease: 'back.out(1.35)', clearProps: 'transform' })
  }
}

watch([currentValue, () => props.division, activeHeadquarters], async () => {
  await nextTick()
  animateProgress(true)
})

onMounted(() => {
  scrollFrame = requestAnimationFrame(() => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' })
  })
  motionContext = gsap.context(() => {
    animateProgress(false, .52)
    if (reducedMotion.matches) return
    gsap.from('.jar-stage', { y: 35, autoAlpha: 0, scale: .98, duration: .65, ease: 'power3.out' })
    gsap.from('.jar-companion', { y: 110, autoAlpha: 0, scale: .58, rotation: -18, duration: .82, ease: 'back.out(1.8)', delay: .28 })
    gsap.to('.jar-companion', {
      y: -12,
      rotation: 3,
      scale: 1.025,
      duration: 1.9,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      delay: 1.05,
    })
    gsap.from('.compact-heading, .division-tabs, .headquarters-tabs, .selection-label, .jar-copy h2, .main-number, .jar-copy > p, .meter, .meter-labels, .summary-grid, .report-action', {
      x: 32,
      autoAlpha: 0,
      stagger: .055,
      duration: .42,
      ease: 'power2.out',
      delay: .18,
    })
  }, dashboard.value)
})

onUnmounted(() => {
  cancelAnimationFrame(scrollFrame)
  gsap.killTweensOf(counter)
  motionContext?.revert()
})
</script>

<template>
  <section ref="dashboard" class="progress-section">
    <div class="progress-wrap">
      <article class="jar-stage comic-panel">
        <div class="jar-visual">
          <div v-if="showLatestUpdate" class="latest-badge">剛剛更新!</div>
          <img class="jar-companion" :src="guideCharacter.src" :alt="guideCharacter.alt">
          <LuckyCookieJar :value="currentValue" :target="currentTarget" :variant-key="`${division}-${activeHeadquarters}`"
            :celebrate="showLatestUpdate" />
        </div>

        <div class="jar-copy">
          <span class="selection-label" :class="{ women: division === 'women' }">{{ isDivisionTotal ? `${currentDivision.label} TOTAL` : `${currentDivision.label}／${currentHeadquarters.label}` }}</span>
          <h2>{{ isDivisionTotal ? `${currentDivision.label}目前總累積` : '這一罐已經裝了' }}</h2>
          <strong class="main-number">{{ Math.round(displayedValue).toLocaleString() }}<small>分鐘</small></strong>
          <p>{{ Math.round(displayedValue * 60).toLocaleString() }} 遍的幸運能量</p>
          <div class="meter" :aria-label="`完成 ${percentage}%`"><i :style="{ width: Math.min(100, displayedPercentage) + '%' }"></i></div>
          <div class="meter-labels"><span>0</span><strong>{{ Math.round(displayedPercentage) }}%</strong><span>{{ currentTarget.toLocaleString() }} 分鐘</span></div>
          <div class="summary-grid">
            <div v-if="isDivisionTotal"><span>四個本部共同目標</span><strong>{{ currentTarget.toLocaleString() }}</strong><small>分鐘</small></div>
            <div v-else><span>{{ currentDivision.label }}總累積</span><strong>{{ divisionTotal.toLocaleString() }}</strong><small>/ 4,000 分鐘</small></div>
            <div><span>{{ isDivisionTotal ? `距離${currentDivision.label}目標` : '距離本罐目標' }}</span><strong>{{ Math.max(0, currentTarget - currentValue).toLocaleString() }}</strong><small>分鐘</small></div>
          </div>
          <div v-if="percentage >= 100" class="complete-message">★ 已經裝滿，繼續累積更多幸運！</div>
          <div class="progress-options">
            <div class="division-tabs" role="tablist" aria-label="切換部別">
              <button v-for="item in divisions" :key="item.id" type="button" role="tab"
                :aria-selected="division === item.id" :class="{ active: division === item.id }"
                @click="selectDivision(item.id)">{{ item.icon }} {{ item.label }}</button>
            </div>
            <div class="headquarters-tabs" aria-label="選擇總覽或本部">
              <button type="button" class="total-option" :class="{ active: isDivisionTotal, women: division === 'women' }"
                @click="activeHeadquarters = 'total'">
                {{ currentDivision.label }}總覽<small>{{ Math.round(divisionTotal / (TARGET_PER_TEAM * headquarters.length) * 100) }}%</small>
              </button>
              <button v-for="hq in headquarters" :key="hq.id" type="button"
                :class="{ active: activeHeadquarters === hq.id }" :style="{ '--hq-color': hq.color }"
                @click="activeHeadquarters = hq.id">
                {{ hq.label }}<small>{{ Math.round(progress[hq.id][division] / TARGET_PER_TEAM * 100) }}%</small>
              </button>
            </div>
          </div>
          <div class="report-action">
            <button class="comic-button" type="button" @click="$emit('report')">再回報一次</button>
          </div>
        </div>
      </article>

      <div class="district-ribbon">
        <span>桃園西區總累積</span><strong>{{ districtTotal.toLocaleString() }} 分鐘</strong>
        <small>{{ (districtTotal * 60).toLocaleString() }} 遍 · 共同目標 8,000 分鐘</small>
      </div>
    </div>
  </section>
</template>

<style scoped>
.progress-section{min-height:calc(100vh - 86px);padding:54px 0 100px;background-color:var(--cream);background-image:linear-gradient(45deg,rgba(245,4,105,.07) 25%,transparent 25%),linear-gradient(-45deg,rgba(245,4,105,.07) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(245,4,105,.07) 75%),linear-gradient(-45deg,transparent 75%,rgba(245,4,105,.07) 75%);background-size:38px 38px;background-position:0 0,0 19px,19px -19px,-19px 0}.progress-wrap{width:var(--page);margin:auto}.progress-heading{text-align:center}.progress-heading>span{display:inline-block;padding:6px 13px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);box-shadow:4px 4px 0 var(--ink);font-weight:1000}.progress-heading h1{margin:18px 0 26px;color:var(--pink);font-family:var(--font-display);font-size:clamp(3rem,7vw,5.5rem);line-height:.93;-webkit-text-stroke:4px var(--ink);paint-order:stroke fill;text-shadow:6px 7px 0 var(--yellow),10px 12px 0 var(--ink)}.progress-heading h1 strong{color:white}.district-ribbon{width:fit-content;max-width:100%;margin:0 auto 32px;padding:12px 24px;border:4px solid var(--ink);border-radius:999px;background:var(--yellow);box-shadow:5px 5px 0 var(--ink);text-align:center}.district-ribbon span,.district-ribbon strong,.district-ribbon small{margin:0 5px;font-weight:900}.district-ribbon strong{color:var(--pink);font-family:var(--font-display);font-size:1.25rem}.division-tabs{display:grid;grid-template-columns:repeat(2,1fr);gap:14px;width:min(580px,100%);margin:0 auto 20px}.division-tabs button{min-height:60px;border:4px solid var(--ink);border-radius:999px;background:white;box-shadow:5px 5px 0 var(--ink);font-family:var(--font-display);font-size:1.15rem;font-weight:1000;cursor:pointer}.division-tabs button.active{background:var(--pink);color:white;transform:translate(2px,2px);box-shadow:3px 3px 0 var(--ink)}.division-tabs button:first-child.active{background:var(--blue);color:var(--ink)}.headquarters-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:0 auto 30px}.headquarters-tabs button{min-height:64px;padding:8px 12px;border:3px solid var(--ink);border-radius:16px;background:white;box-shadow:4px 4px 0 var(--ink);font-weight:1000;cursor:pointer}.headquarters-tabs button small{display:block;margin-top:2px}.headquarters-tabs button.active{background:var(--hq-color);transform:translateY(3px);box-shadow:2px 2px 0 var(--ink)}.jar-stage{display:grid;grid-template-columns:minmax(500px,1.08fr) minmax(390px,.92fr);align-items:center;gap:clamp(24px,3vw,42px);padding:clamp(28px,5vw,62px);background:#fff3b3}.jar-visual{position:relative;display:grid;grid-template-columns:minmax(145px,175px) minmax(0,380px);align-items:end;justify-content:center;padding-bottom:5px}.jar-visual :deep(.cookie-jar){width:min(100%,380px)}.jar-companion{position:relative;z-index:6;align-self:end;justify-self:center;width:clamp(160px,14vw,195px);height:auto;margin:0 -20px 28px 0;object-fit:contain;filter:drop-shadow(7px 9px 0 rgba(32,22,15,.92));transform-origin:50% 90%;will-change:transform}.latest-badge{position:absolute;z-index:7;top:4%;right:0;padding:9px 13px;border:3px solid var(--ink);border-radius:999px;background:var(--pink);color:white;box-shadow:4px 4px 0 var(--ink);font-weight:1000;transform:rotate(5deg)}.selection-label{display:inline-block;padding:7px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);font-weight:1000}.jar-copy h2{margin:18px 0 0;font-family:var(--font-display);font-size:clamp(1.7rem,4vw,2.6rem)}.main-number{display:block;margin:4px 0 0;color:var(--pink);font-family:var(--font-display);font-size:clamp(3.5rem,8vw,6.5rem);line-height:1}.main-number small{margin-left:8px;color:var(--ink);font-size:1rem}.jar-copy>p{margin:8px 0 24px;font-weight:900}.meter{height:27px;overflow:hidden;border:4px solid var(--ink);border-radius:999px;background:white;box-shadow:3px 3px 0 var(--ink)}.meter i{display:block;height:100%;border-right:3px solid var(--ink);background:repeating-linear-gradient(135deg,var(--pink) 0 12px,var(--yellow) 12px 24px);transition:width .7s cubic-bezier(.2,.8,.2,1)}.meter-labels{display:flex;justify-content:space-between;margin-top:8px;font-size:.85rem}.meter-labels strong{color:var(--pink);font-size:1.05rem}.summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin:24px 0}.summary-grid div{padding:14px;border:3px solid var(--ink);border-radius:15px;background:white}.summary-grid span,.summary-grid strong,.summary-grid small{display:block}.summary-grid span{color:var(--muted);font-size:.8rem;font-weight:800}.summary-grid strong{margin-top:5px;font-family:var(--font-display);font-size:1.45rem}.complete-message{margin-bottom:20px;padding:12px;border:3px dashed var(--ink);border-radius:14px;background:var(--yellow);font-weight:1000}@media(max-width:1040px){.headquarters-tabs{grid-template-columns:repeat(2,1fr)}.jar-stage{grid-template-columns:1fr}.jar-copy{text-align:center}.jar-visual{grid-template-columns:minmax(140px,170px) minmax(0,380px)}.summary-grid,.meter-labels{text-align:left}}@media(max-width:520px){.progress-section{padding-top:36px}.district-ribbon{border-radius:22px}.district-ribbon span,.district-ribbon strong,.district-ribbon small{display:block}.jar-stage{border-radius:28px}.jar-visual{display:flex;justify-content:center;padding-bottom:74px}.jar-visual :deep(.cookie-jar){width:min(100%,340px)}.jar-companion{position:absolute;left:0;bottom:0;width:135px;margin:0}.summary-grid{grid-template-columns:1fr}}
.jar-stage + .district-ribbon{margin-top:32px;margin-bottom:0}.jar-copy .division-tabs{width:100%;margin-bottom:16px}.jar-copy .headquarters-tabs{grid-template-columns:repeat(2,1fr);margin-bottom:24px}.progress-section{padding-top:24px}.jar-stage{align-items:start}.jar-visual{align-self:start;padding-top:0}.compact-heading{margin-bottom:18px}.compact-heading>span{display:inline-block;padding:5px 11px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);font-size:.75rem;font-weight:1000}.compact-heading h1{margin:10px 0 0;color:var(--pink);font-family:var(--font-display);font-size:clamp(2rem,4vw,3.2rem);line-height:1.05;-webkit-text-stroke:2px var(--ink);paint-order:stroke fill;text-shadow:3px 4px 0 var(--yellow)}
.report-action{display:flex;align-items:flex-end;gap:18px;margin-top:6px}@media(max-width:520px){.report-action{justify-content:center}}
.progress-options{margin-top:30px;padding-top:26px;border-top:3px dashed rgba(36,22,14,.55)}
.progress-options .total-option{grid-column:1 / -1;background:white}
.progress-options .total-option.active{background:var(--blue)}
.progress-options .total-option.active.women{background:var(--pink)}

/* Keep the jar prominent and centered; the guide character overlaps only its lower-left edge. */
.jar-stage{grid-template-columns:minmax(330px,.9fr) 1.1fr;gap:clamp(28px,6vw,74px)}
.jar-visual{display:flex;justify-content:center;align-items:flex-end;padding-bottom:5px}
.jar-visual :deep(.cookie-jar){width:min(100%,440px)}
.jar-companion{position:absolute;left:calc(50% - 233px);bottom:10px;width:clamp(180px,16vw,220px);margin:0}
@media(max-width:1040px){
  .jar-stage{grid-template-columns:1fr}
  .jar-visual :deep(.cookie-jar){width:min(100%,440px)}
}
@media(max-width:520px){
  .jar-visual{padding-bottom:20px}
  .jar-visual :deep(.cookie-jar){width:min(100%,360px)}
  .jar-companion{left:calc(50% - 187px);bottom:20px;width:145px}
}

/* Compact progress information so the complete overview reads within one screen. */
.progress-section{padding:16px 0 60px}
.jar-stage{padding:clamp(20px,3vw,36px)}
.selection-label{padding:5px 10px;font-size:.88rem}
.jar-copy h2{margin:12px 0 0;font-size:clamp(1.55rem,3vw,2.15rem)}
.main-number{margin-top:2px;font-size:clamp(3.1rem,6vw,5rem)}
.main-number small{font-size:.9rem}
.jar-copy>p{margin:4px 0 14px;font-size:.9rem}
.meter{height:23px}
.meter-labels{margin-top:5px}
.summary-grid{gap:10px;margin:14px 0}
.summary-grid div{padding:10px 12px}
.summary-grid strong{margin-top:2px;font-size:1.25rem}
.progress-options{margin-top:18px;padding-top:16px}
.jar-copy .division-tabs{gap:10px;margin-bottom:11px}
.division-tabs button{min-height:48px;font-size:1rem}
.jar-copy .headquarters-tabs{gap:8px;margin-bottom:14px}
.headquarters-tabs button{min-height:48px;padding:5px 9px}
.report-action .comic-button{min-height:48px;padding-block:9px}
.jar-stage + .district-ribbon{margin-top:18px}

@media(max-width:700px){
  .progress-section{padding:8px 0 38px}
  .progress-wrap{width:min(100% - 16px,var(--page))}
  .jar-stage{gap:2px;padding:14px;border-radius:28px}
  .jar-visual{padding-bottom:0}
  .jar-visual :deep(.cookie-jar){width:min(100%,270px)}
  .jar-companion{left:calc(50% - 137px);bottom:10px;width:112px}
  .latest-badge{top:3%;right:5%;padding:6px 9px;font-size:.78rem}
  .selection-label{padding:4px 9px;font-size:.8rem}
  .jar-copy h2{margin-top:8px;font-size:1.45rem}
  .main-number{font-size:clamp(2.8rem,12vw,3.6rem)}
  .main-number small{font-size:.78rem}
  .jar-copy>p{margin:2px 0 10px;font-size:.82rem}
  .meter{height:20px;border-width:3px}
  .meter-labels{font-size:.75rem}
  .meter-labels strong{font-size:.9rem}
  .summary-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:11px 0}
  .summary-grid div{padding:8px}
  .summary-grid span{font-size:.7rem}
  .summary-grid strong{font-size:1.05rem}
  .summary-grid small{font-size:.72rem}
  .progress-options{margin-top:13px;padding-top:11px}
  .division-tabs button{min-height:43px;border-width:3px;font-size:.92rem}
  .headquarters-tabs button{min-height:42px;font-size:.82rem}
  .report-action{margin-top:2px}
  .report-action .comic-button{min-height:44px;padding:8px 18px}
}

/* Final density pass: show the full dashboard and district total sooner. */
@media(min-width:1041px){
  .jar-stage{padding:24px 28px;gap:42px}
  .jar-visual :deep(.cookie-jar){width:410px}
  .jar-companion{left:calc(50% - 218px);bottom:12px;width:190px}
  .jar-copy h2{font-size:1.9rem}
  .main-number{font-size:4.35rem}
  .summary-grid{margin:11px 0}
  .summary-grid div{padding:8px 11px}
  .progress-options{margin-top:12px;padding-top:11px}
  .jar-copy .division-tabs{margin-bottom:8px}
  .division-tabs button{min-height:43px}
  .jar-copy .headquarters-tabs{grid-template-columns:repeat(3,minmax(0,1fr));margin-bottom:10px}
  .progress-options .total-option{grid-column:auto}
  .headquarters-tabs button{min-height:42px;padding:4px 7px;font-size:.84rem}
  .report-action .comic-button{min-height:43px;padding:7px 18px}
}
@media(max-width:700px){
  .jar-visual :deep(.cookie-jar){width:min(100%,240px)}
  .jar-companion{left:calc(50% - 124px);bottom:8px;width:102px}
  .jar-copy .selection-label{margin-top:18px}
}
.selection-label{color:white}
.selection-label.women{background:var(--pink)}
.division-tabs button:first-child.active{color:white}
.headquarters-tabs button.active{color:white}
.meter i{animation:meter-breathe 1.8s ease-in-out infinite}
@keyframes meter-breathe{
  0%,100%{filter:brightness(.82) saturate(.9);opacity:.8}
  50%{filter:brightness(1.22) saturate(1.25);opacity:1}
}
@media(prefers-reduced-motion:reduce){.meter i{animation:none}}
</style>
