<script setup>
defineProps({ profile: Object, authenticated: Boolean })
defineEmits(['home', 'report', 'progress', 'groups', 'profile', 'login'])
</script>

<template>
  <header class="header">
    <button class="brand" type="button" @click="$emit('home')" aria-label="回到首頁">
      <span class="brand-cookie">★</span>
      <span>SOKA COOKIE</span>
    </button>
    <nav aria-label="主要選單">
      <button class="home-link" type="button" @click="$emit('home')">首頁</button>
      <button type="button" @click="$emit('progress')">查看進度</button>
      <button type="button" @click="$emit('groups')">群組</button>
      <button v-if="authenticated" class="profile-link" type="button" @click="$emit('profile')">{{ profile?.displayName || '我的' }}</button>
      <button v-else class="login-link" type="button" @click="$emit('login')">登入</button>
      <button class="nav-cta" type="button" @click="$emit('report')">我要回報！</button>
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  isolation: isolate;
  width: var(--page);
  min-height: 86px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.header::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 0 calc((100vw - 100%) / -2);
  border-bottom: 3px solid rgba(32,22,15,.16);
  background: var(--pink);
  box-shadow: 0 5px 0 rgba(32,22,15,.08);
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
nav .login-link{padding:9px 16px;border:3px solid var(--ink);border-radius:999px;background:white;color:var(--ink);box-shadow:3px 3px 0 var(--ink)}
@media (max-width: 680px) {
  .header { min-height: 72px; gap: 6px; }
  nav { gap: 1px; }
  nav button { padding: 8px 6px; font-size: .8rem; }
  nav .nav-cta { margin-left: 2px; padding: 9px 10px; }
  nav .home-link, nav .profile-link { display: none; }
  .brand { font-size: .88rem; }
  .brand-cookie { width: 40px; }
}
@media (max-width: 430px) { .brand>span:last-child { display:none } }
</style>
