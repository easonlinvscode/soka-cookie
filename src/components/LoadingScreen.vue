<script setup>
import CookieParadeIcon from './CookieParadeIcon.vue'

const cookieShapes = ['star', 'round', 'star', 'heart', 'flower', 'round', 'star', 'heart', 'flower', 'round']
</script>

<template>
  <div class="loading-screen" role="status" aria-live="polite" aria-label="幸運餅乾準備中">
    <div class="loading-cookies" aria-hidden="true">
      <span
        v-for="(shape, index) in cookieShapes"
        :key="`${shape}-${index}`"
        class="loading-cookie"
        :style="{ '--delay': `${index * -0.11}s`, '--tilt': `${index % 2 ? 7 : -7}deg`, '--tilt-end': `${index % 2 ? -7 : 7}deg` }"
      >
        <CookieParadeIcon :type="shape" :color-index="index" />
      </span>
    </div>
    <p>幸運餅乾準備中</p>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  z-index: 9999;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 26px;
  padding: 24px 14px;
  overflow: hidden;
  background-color: var(--blue);
  background-image: radial-gradient(rgba(255,255,255,.34) 3px, transparent 3px);
  background-size: 30px 30px;
}
.loading-cookies {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  align-items: center;
  gap: clamp(3px, 1vw, 9px);
  width: min(620px, calc(100vw - 28px));
}
.loading-cookie {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  filter: drop-shadow(3px 4px 0 rgba(36,22,14,.28));
  transform-origin: 50% 60%;
  animation: cookie-breathe 1.25s ease-in-out var(--delay) infinite;
}
p {
  width: fit-content;
  margin: 0 auto;
  padding: 8px 16px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: var(--yellow);
  box-shadow: 4px 4px 0 var(--ink);
  font-family: var(--font-display);
  font-weight: 1000;
  letter-spacing: .08em;
}
@keyframes cookie-breathe {
  0%,100% { transform: translateY(8px) rotate(var(--tilt)) scale(.88); filter: drop-shadow(2px 3px 0 rgba(36,22,14,.2)) brightness(.94); }
  50% { transform: translateY(-10px) rotate(var(--tilt-end)) scale(1.08); filter: drop-shadow(4px 7px 0 rgba(36,22,14,.32)) brightness(1.08); }
}
@media (max-width: 520px) {
  .loading-screen { gap: 20px; }
  .loading-cookies { gap: 2px; }
  .loading-cookie { filter: drop-shadow(1.5px 2px 0 rgba(36,22,14,.24)); }
  p { padding: 7px 13px; font-size: .88rem; }
}
@media (prefers-reduced-motion: reduce) {
  .loading-cookie { animation: none; }
}
</style>
