<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { affiliations, divisions } from '../data/content.js'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'
import CookieParadeIcon from './CookieParadeIcon.vue'

const props = defineProps({ report: { type: Object, required: true }, quote: { type: Object, required: true } })
defineEmits(['progress'])
const divisionLabel = computed(() => divisions.find((item) => item.id === props.report.division)?.label)
const affiliationLabel = computed(() => affiliations.find((item) => item.id === props.report.affiliationId)?.label)
const section = ref(null)
const displayedMinutes = ref(0)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const cookieShapes = ['star', 'heart', 'flower', 'round']
let motionContext

onMounted(() => {
  if (reducedMotion.matches) {
    displayedMinutes.value = props.report.minutes
    return
  }
  motionContext = gsap.context(() => {
    const counter = { value: 0 }
    const timeline = gsap.timeline()
    timeline
      .from('.success-badge', { y: -45, autoAlpha: 0, scale: .7, rotation: -12, duration: .55, ease: 'back.out(2)' })
      .from('.encouragement-card', { scaleY: .08, scaleX: .82, autoAlpha: 0, transformOrigin: '50% 0%', duration: .72, ease: 'back.out(1.25)' }, '-=.26')
      .from('.phoenix-guide', { y: 75, autoAlpha: 0, rotation: -12, scale: .7, duration: .65, ease: 'back.out(1.8)' }, '-=.34')
      .from('.encouragement-card blockquote, .encouragement-card cite, .dashed-line, .encourage, .report-result, .encouragement-card button', { y: 18, autoAlpha: 0, stagger: .07, duration: .36, ease: 'power2.out' }, '-=.28')

    gsap.from('.cookie-piece', {
      y: -260,
      rotation: -150,
      autoAlpha: 0,
      stagger: .075,
      duration: .82,
      ease: 'bounce.out',
    })
    gsap.to('.cookie-piece', {
      rotation: index => index % 2 ? '+=360' : '-=360',
      duration: index => 3.4 + (index % 4) * .35,
      repeat: -1,
      ease: 'none',
      delay: 1.28,
    })
    gsap.to('.phoenix-guide', { x: 8, rotation: 7, duration: .68, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.05 })
    gsap.to('.success-badge', { y: -4, rotation: 2, scale: 1.035, duration: .9, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 })
    gsap.to(counter, {
      value: props.report.minutes,
      duration: 1.05,
      delay: .7,
      ease: 'power2.out',
      onUpdate: () => { displayedMinutes.value = counter.value },
    })
  }, section.value)
})

onUnmounted(() => motionContext?.revert())
</script>

<template>
  <section ref="section" class="encouragement-section">
    <div class="cookie-parade" aria-hidden="true">
      <span v-for="n in 12" :key="n" class="cookie-piece">
        <CookieParadeIcon :type="cookieShapes[(n - 1) % cookieShapes.length]" :color-index="n - 1" />
      </span>
    </div>
    <div class="success-badge">DING! 烤好了</div>
    <article class="encouragement-card comic-panel">
      <img class="phoenix-guide" :src="phoenixChick" alt="帶來鼓勵語的小鳳雛" />
      <p class="category">{{ quote.category }}</p>
      <blockquote>「{{ quote.quote }}」</blockquote>
      <cite v-if="quote.source">{{ quote.source }}</cite>
      <div class="dashed-line"></div>
      <p class="encourage">{{ quote.encourage }}</p>
      <div class="report-result">
        <span>{{ divisionLabel }}／{{ affiliationLabel }}</span>
        <strong>+ {{ Math.round(displayedMinutes).toLocaleString() }} 分鐘</strong>
        <small>{{ report.chants.toLocaleString() }} 遍的幸運能量已加入！</small>
      </div>
      <button class="comic-button" type="button" @click="$emit('progress')">查看最新進度</button>
    </article>
  </section>
</template>

<style scoped>
.encouragement-section {
  position: relative;
  min-height: calc(100vh - 86px);
  display: grid;
  place-items: center;
  padding: 75px 16px 95px;
  overflow: hidden;
  background: var(--blue);
  background-image: radial-gradient(rgba(255,255,255,.32) 3px, transparent 3px);
  background-size: 30px 30px;
}
.success-badge { position: absolute; z-index: 3; top: 42px; left: 50%; padding: 10px 20px; border: 4px solid var(--ink); border-radius: 999px; background: var(--yellow); box-shadow: 5px 5px 0 var(--ink); font-family: var(--font-display); font-weight: 1000; transform: translateX(-50%) rotate(-3deg); }
.encouragement-card { position: relative; z-index: 2; width: min(660px, 100%); padding: clamp(34px, 7vw, 65px); text-align: center; }
.phoenix-guide { width: 150px; height: 150px; margin: -125px auto 8px; display: block; object-fit: contain; filter: drop-shadow(5px 6px 0 rgba(32,22,15,.9)); }
.category { display: inline-block; margin: 0; padding: 5px 12px; border: 3px solid var(--ink); border-radius: 999px; background: var(--pink); color: white; font-weight: 900; }
blockquote { margin: 26px 0 12px; font-family: var(--font-display); font-size: clamp(1.9rem, 5vw, 3rem); font-weight: 1000; line-height: 1.35; }
cite { color: var(--muted); font-style: normal; font-weight: 800; }
.dashed-line { margin: 25px 0; border-top: 3px dashed var(--ink); }
.encourage { font-size: 1.05rem; font-weight: 800; line-height: 1.8; }
.report-result { display: flex; flex-direction: column; gap: 5px; margin: 24px 0; padding: 18px; border: 4px solid var(--ink); border-radius: 20px; background: var(--yellow); box-shadow: 5px 5px 0 var(--ink); }
.report-result strong { color: var(--pink); font-family: var(--font-display); font-size: 1.65rem; }
.report-result small { font-weight: 800; }
.cookie-parade { position: absolute; z-index: 1; top: 88px; left: 50%; width: min(1080px, calc(100% - 34px)); display: flex; align-items: center; justify-content: space-between; transform: translateX(-50%); pointer-events: none; }
.cookie-piece { position: relative; display: grid; place-items: center; width: 47px; height: 47px; filter: drop-shadow(3px 4px 0 rgba(36,22,14,.3)); transform-origin: center; }
.cookie-piece:nth-child(3n) { width: 53px; height: 53px; }
.encouragement-section { padding: 54px 16px 62px; }
.success-badge { top: 24px; padding: 7px 15px; }
.encouragement-card { width: min(580px, 100%); padding: clamp(28px, 5vw, 44px); }
.phoenix-guide { width: 122px; height: 122px; margin: -96px auto 6px; }
.category { padding: 4px 10px; font-size: .88rem; }
blockquote { margin: 20px 0 9px; font-size: clamp(1.65rem, 4vw, 2.35rem); }
.dashed-line { margin: 18px 0; }
.encourage { margin: 10px 0; font-size: .95rem; }
.report-result { margin: 18px 0; padding: 13px; }
.report-result strong { font-size: 1.45rem; }
.encouragement-card .comic-button { min-height: 48px; padding-block: 9px; }
@media (max-width: 520px) {
  .encouragement-section { padding: 48px 12px 42px; }
  .success-badge { top: 18px; }
  .encouragement-card { padding: 25px 18px; }
  .phoenix-guide { width: 100px; height: 100px; margin-top: -78px; }
  blockquote { font-size: 1.55rem; }
  .report-result { margin: 14px 0; }
  .cookie-parade { top: 72px; width: calc(100% - 16px); }
  .cookie-piece { width: 31px; height: 31px; filter: drop-shadow(1.5px 2px 0 rgba(36,22,14,.24)); }
  .cookie-piece:nth-child(3n) { width: 35px; height: 35px; }
}
.encouragement-section { min-height: calc(100svh - 152px); padding-bottom: 46px; }
@media (max-width: 520px) { .encouragement-section { min-height: calc(100svh - 136px); padding-bottom: 30px; } }
</style>
