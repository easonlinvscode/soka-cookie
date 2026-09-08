<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import littleLion from '../assets/characters/little-lion-final.png'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'
import littleBear from '../assets/characters/lucky-bear-final.png'
import CookieParadeIcon from './CookieParadeIcon.vue'

defineEmits(['report', 'progress'])

const hero = ref(null)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let motionContext
const cookieShapes = [
  'star', 'heart', 'flower', 'round', 'heart', 'star', 'round', 'flower', 'star', 'heart', 'flower', 'round',
  'round', 'flower', 'heart', 'star', 'flower', 'round', 'star', 'heart', 'round', 'flower',
]

onMounted(() => {
  motionContext = gsap.context(() => {
    if (reducedMotion.matches) return
    const timeline = gsap.timeline({ defaults: { ease: 'back.out(1.5)' } })
    timeline
      .from('.eyebrow', { y: -24, autoAlpha: 0, rotation: -8, duration: .45 })
      .from('h1 span, h1 strong', { y: 75, autoAlpha: 0, scale: .72, rotation: -7, stagger: .14, duration: .72 }, '-=.18')
      .from('.hero-copy p', { y: 22, autoAlpha: 0, duration: .42, ease: 'power2.out' }, '-=.3')
      .from('.hero-actions .comic-button', { y: 24, autoAlpha: 0, scale: .86, stagger: .1, duration: .42 }, '-=.2')
      .from('.mascot', { y: 190, autoAlpha: 0, rotation: -18, stagger: .12, duration: .66 }, '-=.48')

    gsap.from('.float-treat', { autoAlpha: 0, scale: .35, rotation: -40, stagger: { each: .055, from: 'random' }, duration: .55, ease: 'back.out(2)', delay: .28 })

    gsap.utils.toArray('.mascot').forEach((mascot, index) => {
      gsap.to(mascot, {
        y: index === 1 ? -30 : -24,
        scale: index === 1 ? 1.055 : 1.045,
        rotation: '+=4',
        duration: 1.08 + index * .14,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: .62 + index * .12,
      })
    })

    gsap.utils.toArray('.float-treat').forEach((treat, index) => {
      gsap.to(treat, {
        x: index % 2 ? 5 : -5,
        y: index % 3 === 0 ? -10 : -7,
        rotation: `+=${index % 2 ? 10 : -10}`,
        scale: 1.08,
        duration: 1.35 + index * .14,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: .7 + index * .08,
      })
    })
  }, hero.value)
})

onUnmounted(() => motionContext?.revert())
</script>

<template>
  <section ref="hero" class="hero">
    <div class="decor decor-star" aria-hidden="true">★</div>
    <div class="decor decor-heart" aria-hidden="true">♥</div>
    <div class="party-treats" aria-hidden="true">
      <span v-for="(shape, index) in cookieShapes" :key="`${shape}-${index}`" :class="`float-treat jar-cookie treat-${index + 1}`">
        <CookieParadeIcon :type="shape" :color-index="index" />
      </span>
    </div>
    <div class="hero-inner">
      <div class="hero-copy">
        <div class="eyebrow">TAOYUAN WEST PARTY</div>
        <h1 aria-label="福運餅乾大作戰">
          <span>福運餅乾</span>
          <strong>大作戰！</strong>
        </h1>
        <p>把今天的努力烤成一塊福運餅乾，一起裝滿福運派對包！</p>
        <div class="hero-actions">
          <button class="comic-button" type="button" @click="$emit('report')">開始回報 GO!</button>
          <button class="comic-button secondary" type="button" @click="$emit('progress')">查看進度</button>
        </div>
      </div>

      <div class="mascot-stage" aria-label="小獅子、小鳳雛與小熊一起為大家加油">
        <img class="mascot mascot-lion" :src="littleLion" alt="揮手加油的小獅子" />
        <img class="mascot mascot-phoenix" :src="phoenixChick" alt="揮手加油的小鳳雛" />
        <img class="mascot mascot-bear" :src="littleBear" alt="拿著星星餅乾的小熊" />
      </div>
    </div>

    <div class="marquee" aria-hidden="true">
      <div>HAPPY ★ LUCKY ★ TOGETHER ★ KEEP GOING ★ HAPPY ★ LUCKY ★ TOGETHER ★ HAPPY ★ LUCKY ★ TOGETHER ★ KEEP GOING ★ HAPPY ★ LUCKY ★ TOGETHER ★ HAPPY ★ LUCKY ★ TOGETHER ★ KEEP GOING ★ HAPPY ★ LUCKY ★ TOGETHER ★ HAPPY ★ LUCKY ★ TOGETHER ★ KEEP GOING ★ HAPPY ★ LUCKY ★ TOGETHER ★</div>
    </div>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: calc(100svh - 156px);
  overflow: hidden;
  background-color: var(--pink);
  background-image: radial-gradient(rgba(255,255,255,.19) 3px, transparent 3px);
  background-size: 27px 27px;
}
.hero::before {
  content: '';
  position: absolute;
  inset: 8% -8% auto;
  height: 72%;
  background: repeating-conic-gradient(from 8deg at 50% 55%, rgba(255,225,59,.13) 0 8deg, transparent 8deg 18deg);
}
.hero-inner {
  position: relative;
  z-index: 2;
  width: var(--page);
  min-height: max(650px, calc(100svh - 156px));
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 48px 0 260px;
}
.hero-copy {
  position: relative;
  z-index: 4;
  width: min(100%, 900px);
  text-align: center;
}
.eyebrow {
  display: inline-block;
  padding: 7px 14px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: var(--blue);
  box-shadow: 4px 4px 0 var(--ink);
  font-family: var(--font-display);
  font-size: .8rem;
  font-weight: 900;
  letter-spacing: .08em;
  transform: rotate(-2deg);
}
h1 {
  margin: 24px auto 20px;
  font-family: var(--font-display);
  font-size: clamp(3.6rem, 8vw, 7.4rem);
  font-weight: 1000;
  letter-spacing: -.075em;
  line-height: .82;
}
h1 span, h1 strong { display: block; }
h1 span {
  color: var(--yellow);
  -webkit-text-stroke: 6px var(--ink);
  paint-order: stroke fill;
  text-shadow: 6px 7px 0 var(--white), 11px 13px 0 var(--ink);
  transform: rotate(-1.5deg);
}
h1 strong {
  margin-top: 18px;
  color: var(--white);
  -webkit-text-stroke: 6px var(--ink);
  paint-order: stroke fill;
  text-shadow: 7px 8px 0 var(--blue), 12px 14px 0 var(--ink);
  transform: rotate(1.5deg);
}
.hero-copy p {
  max-width: 520px;
  margin: 32px auto 24px;
  color: var(--white);
  font-size: 1.12rem;
  font-weight: 800;
  line-height: 1.8;
  text-shadow: 2px 2px 0 var(--pink-dark);
}
.hero-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 14px; }
.mascot-stage {
  position: absolute;
  z-index: 3;
  inset: 0;
  pointer-events: none;
}
.mascot {
  position: absolute;
  bottom: 54px;
  width: 180px;
  height: auto;
  object-fit: contain;
  filter: drop-shadow(7px 9px 0 rgba(32,22,15,.95));
}
.mascot-lion { left: 12%; transform: rotate(-7deg); }
.mascot-phoenix { left: 50%; width: 165px; transform: translateX(-50%) rotate(2deg); }
.mascot-bear { right: 12%; transform: rotate(7deg); }
.decor { position: absolute; z-index: 1; font-size: 4rem; color: var(--yellow); -webkit-text-stroke: 4px var(--ink); paint-order: stroke fill; }
.decor-star { left: 3%; top: 20%; transform: rotate(-18deg); }
.decor-heart { right: 4%; top: 52%; color: var(--blue); transform: rotate(16deg); }
.party-treats { position: absolute; z-index: 1; inset: 0; pointer-events: none; }
.float-treat { position: absolute; display: grid; place-items: center; will-change: transform; }
.jar-cookie { width: clamp(42px, 4.4vw, 64px); aspect-ratio: 1; filter: drop-shadow(3px 5px 0 rgba(36,22,14,.28)); }
.treat-1 { left: 4%; top: 11%; transform: rotate(-14deg); }
.treat-2 { right: 4%; top: 11%; transform: rotate(12deg); }
.treat-3 { left: 12%; top: 23%; transform: rotate(-9deg); }
.treat-4 { right: 12%; top: 23%; transform: rotate(16deg); }
.treat-5 { left: 3%; top: 36%; transform: rotate(8deg); }
.treat-6 { right: 3%; top: 36%; transform: rotate(-12deg); }
.treat-7 { left: 18%; top: 47%; transform: rotate(-8deg); }
.treat-8 { right: 18%; top: 47%; transform: rotate(13deg); }
.treat-9 { left: 5%; top: 58%; transform: rotate(11deg); }
.treat-10 { right: 5%; top: 58%; transform: rotate(-15deg); }
.treat-11 { left: 27%; top: 66%; transform: rotate(-8deg); }
.treat-12 { right: 27%; top: 66%; transform: rotate(12deg); }
.treat-13 { left: 13%; top: 74%; transform: rotate(9deg); }
.treat-14 { right: 13%; top: 74%; transform: rotate(-11deg); }
.treat-15 { left: 3%; top: 82%; transform: rotate(14deg); }
.treat-16 { right: 3%; top: 82%; transform: rotate(-8deg); }
.treat-17 { left: 25%; top: 15%; transform: rotate(-13deg); }
.treat-18 { right: 25%; top: 15%; transform: rotate(10deg); }
.treat-19 { left: 25%; top: 34%; transform: rotate(7deg); }
.treat-20 { right: 25%; top: 34%; transform: rotate(-14deg); }
.treat-21 { left: 37%; top: 78%; transform: rotate(12deg); }
.treat-22 { right: 37%; top: 78%; transform: rotate(-9deg); }
.treat-13, .treat-15, .treat-17, .treat-19, .treat-21 { width: clamp(34px, 3.7vw, 52px); }
.marquee {
  position: absolute;
  z-index: 10;
  left: 0; right: 0; bottom: 0;
  overflow: hidden;
  border-block: 5px solid var(--ink);
  background: var(--yellow);
  transform: rotate(-1deg) scale(1.02);
}
.marquee div { width: max-content; padding: 12px 0; font-family: var(--font-display); font-weight: 1000; word-spacing: 14px; animation: marquee 20s linear infinite; }
@keyframes marquee { to { transform: translateX(-50%); } }
@media (max-width: 860px) {
  .hero-inner { padding-top: 36px; }
  h1 strong { transform: rotate(2deg); }
  .mascot-lion { left: 4%; }
  .mascot-bear { right: 4%; }
  .decor { display: none; }
  .treat-1 { left: 5%; top: 12%; }
  .treat-2 { right: 5%; top: 12%; }
  .treat-3 { left: 3%; top: 27%; }
  .treat-4 { right: 3%; top: 27%; }
  .treat-5 { left: 8%; top: 43%; }
  .treat-6 { right: 8%; top: 43%; }
  .treat-7 { left: 24%; top: 57%; }
  .treat-8 { right: 24%; top: 57%; }
  .treat-9 { left: 5%; top: 69%; }
  .treat-10 { right: 5%; top: 69%; }
  .treat-11 { left: 36%; top: 80%; }
  .treat-12 { right: 36%; top: 80%; }
  .treat-13, .treat-14, .treat-15, .treat-16, .treat-17,
  .treat-18, .treat-19, .treat-20, .treat-21, .treat-22 { display: none; }
}
@media (max-width: 520px) {
  .hero { min-height: calc(100svh - 168px); }
  .hero-inner { min-height: max(640px, calc(100svh - 168px)); padding: 30px 0 230px; }
  h1 { font-size: clamp(2.9rem, 14vw, 4.3rem); letter-spacing: -.07em; }
  h1 span, h1 strong { -webkit-text-stroke-width: 4px; }
  .hero-copy p { font-size: 1rem; }
  .hero-actions { flex-direction: column; }
  .mascot { bottom: 56px; width: 118px; }
  .mascot-phoenix { width: 108px; }
  .mascot-lion { left: 0; }
  .mascot-bear { right: 0; }
  .jar-cookie { width: clamp(34px, 10vw, 44px); filter: drop-shadow(2px 3px 0 rgba(36,22,14,.24)); }
}
.hero { min-height: calc(100svh - 152px); }
.hero-inner { min-height: max(560px, calc(100svh - 152px)); padding-top: 34px; padding-bottom: 218px; }
@media (max-width: 520px) {
  .hero { min-height: calc(100svh - 136px); }
  .hero-inner { min-height: max(540px, calc(100svh - 136px)); padding-top: 24px; padding-bottom: 198px; }
}
</style>
