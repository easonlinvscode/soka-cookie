<script setup>
defineEmits(['home', 'report', 'progress'])
</script>

<template>
  <header class="header">
    <button class="brand" type="button" @click="$emit('home')" aria-label="回到首頁">
      <span class="brand-cookie">★</span>
      <span>SOKA COOKIE</span>
    </button>
    <nav aria-label="主要選單">
      <button type="button" @click="$emit('home')">首頁</button>
      <button type="button" @click="$emit('progress')">目前進度</button>
      <button class="nav-cta" type="button" @click="$emit('report')">我要回報！</button>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: relative;
  z-index: 20;
  width: var(--page);
  min-height: 86px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--white);
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 900;
  text-align: left;
  cursor: pointer;
  text-shadow: 2px 2px 0 var(--ink);
}
.brand small { display: block; font-size: .7rem; letter-spacing: .12em; }
.brand-cookie {
  display: grid;
  place-items: center;
  width: 48px;
  aspect-ratio: 1;
  border: 3px solid var(--ink);
  border-radius: 48% 52% 42% 58%;
  background: var(--yellow);
  color: var(--pink);
  box-shadow: 3px 3px 0 var(--ink);
  transform: rotate(-8deg);
}
nav { display: flex; align-items: center; gap: 8px; }
nav button {
  padding: 10px 12px;
  border: 0;
  background: transparent;
  color: var(--white);
  font-weight: 900;
  cursor: pointer;
}
nav .nav-cta {
  margin-left: 6px;
  padding: 11px 18px;
  border: 3px solid var(--ink);
  border-radius: 999px;
  background: var(--yellow);
  color: var(--ink);
  box-shadow: 4px 4px 0 var(--ink);
}
@media (max-width: 680px) {
  .header { min-height: 72px; }
  nav button:not(.nav-cta) { display: none; }
  .brand { font-size: 1rem; }
  .brand-cookie { width: 40px; }
}
</style>
