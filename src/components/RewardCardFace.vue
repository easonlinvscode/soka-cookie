<script setup>
import { computed } from 'vue'
import littleLion from '../assets/characters/little-lion-final.png'
import luckyBear from '../assets/characters/lucky-bear-final.png'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'

const props = defineProps({
  card: { type: Object, required: true },
  compact: Boolean,
})

const mascots = { lion: littleLion, bear: luckyBear, phoenix: phoenixChick }
const mascotAlt = { lion: '小獅子', bear: '幸運小熊', phoenix: '小鳳雛' }
const mascotImage = computed(() => mascots[props.card.mascot] || phoenixChick)
</script>

<template>
  <article class="reward-face" :class="[`theme-${card.theme}`, { compact }]">
    <div class="card-speckles" aria-hidden="true"></div>
    <header>
      <span>{{ card.kind }}</span>
      <i aria-hidden="true">★</i>
    </header>
    <img class="card-mascot" :src="mascotImage" :alt="mascotAlt[card.mascot]">
    <div class="card-copy">
      <small>{{ card.title }}</small>
      <blockquote>「{{ card.message }}」</blockquote>
      <cite v-if="card.source">{{ card.source }}</cite>
      <p>{{ card.note }}</p>
    </div>
    <footer aria-hidden="true"><span>★</span><b>♥</b><span>★</span></footer>
  </article>
</template>

<style scoped>
.reward-face{--card-accent:var(--blue);position:relative;isolation:isolate;width:100%;aspect-ratio:2/3;overflow:hidden;border:5px solid var(--ink);border-radius:26px;background:linear-gradient(145deg,#f9fdff 0%,#dff7ff 100%);box-shadow:8px 9px 0 rgba(32,22,15,.95);color:var(--ink)}
.reward-face::before,.reward-face::after{content:"";position:absolute;z-index:-1;width:190px;height:190px;border-radius:50%;background:var(--card-accent);opacity:.88}.reward-face::before{top:-92px;left:-82px}.reward-face::after{right:-105px;bottom:-112px;background:var(--yellow)}
.theme-yellow{--card-accent:var(--yellow);background:linear-gradient(145deg,#fffdf1 0%,#fff2a8 100%)}.theme-yellow::after{background:var(--blue)}
.theme-pink{--card-accent:var(--pink-soft);background:linear-gradient(145deg,#fff8fb 0%,#ffd9e8 100%)}.theme-pink::after{background:var(--blue)}
.card-speckles{position:absolute;inset:0;z-index:-1;opacity:.35;background-image:radial-gradient(var(--ink) 1.5px,transparent 1.5px);background-size:19px 19px}
header{display:flex;align-items:center;justify-content:space-between;padding:18px 18px 0}header span{padding:5px 11px;border:3px solid var(--ink);border-radius:999px;background:white;font-size:.8rem;font-weight:1000}header i{font-style:normal;font-size:1.25rem;color:var(--pink);filter:drop-shadow(1px 2px 0 var(--ink))}
.card-mascot{position:absolute;z-index:2;top:48px;right:8px;width:39%;height:32%;object-fit:contain;filter:drop-shadow(3px 4px 0 rgba(32,22,15,.45))}
.card-copy{position:absolute;left:18px;right:18px;bottom:48px;padding:20px 16px 18px;border:3px solid var(--ink);border-radius:20px;background:rgba(255,249,233,.94);text-align:center;box-shadow:4px 5px 0 var(--ink)}
.card-copy small{display:block;color:var(--muted);font-weight:1000}.card-copy blockquote{margin:9px 0 6px;font-family:var(--font-display);font-size:clamp(1.35rem,4vw,1.85rem);font-weight:1000;line-height:1.42}.card-copy cite{display:block;color:var(--muted);font-size:.78rem;font-style:normal;font-weight:800}.card-copy p{margin:12px 0 0;padding-top:11px;border-top:2px dashed var(--ink);font-size:.87rem;font-weight:800;line-height:1.55}
footer{position:absolute;right:0;bottom:12px;left:0;display:flex;justify-content:center;gap:13px;color:var(--pink);font-size:.9rem}footer span{color:var(--yellow-dark);text-shadow:1px 1px 0 var(--ink)}
.compact{border-width:4px;border-radius:20px;box-shadow:5px 6px 0 var(--ink)}.compact header{padding:11px 11px 0}.compact header span{padding:3px 8px;border-width:2px;font-size:.66rem}.compact .card-mascot{top:37px;width:37%;height:28%}.compact .card-copy{left:10px;right:10px;bottom:30px;padding:12px 9px 10px;border-width:2px;border-radius:14px;box-shadow:3px 3px 0 var(--ink)}.compact .card-copy blockquote{margin:5px 0;font-size:1rem;line-height:1.35}.compact .card-copy p{display:none}.compact .card-copy cite{font-size:.62rem}.compact footer{bottom:6px;font-size:.7rem}
</style>
