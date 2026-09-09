<script setup>
import { ref } from 'vue'

defineProps({ profile: Object, authenticated: Boolean })
const emit = defineEmits(['home', 'report', 'progress', 'groups', 'profile', 'login'])
const menuOpen = ref(false)

function selectItem(item) {
  menuOpen.value = false
  emit(item)
}
</script>

<template>
  <header class="header" @keydown.esc="menuOpen=false">
    <button class="brand" type="button" @click="selectItem('home')" aria-label="回到首頁">
      <span class="brand-cookie">★</span>
      <span>SOKA COOKIE</span>
    </button>
    <button class="menu-toggle" type="button" aria-controls="main-navigation" :aria-expanded="menuOpen" :aria-label="menuOpen ? '關閉選單' : '開啟選單'" @click="menuOpen=!menuOpen">
      <span></span><span></span><span></span>
    </button>
    <nav id="main-navigation" :class="{ open: menuOpen }" aria-label="主要選單">
      <button class="home-link" type="button" @click="selectItem('home')">首頁</button>
      <button type="button" @click="selectItem('progress')">查看進度</button>
      <button type="button" @click="selectItem('groups')">群組</button>
      <button v-if="authenticated" class="profile-link" type="button" @click="selectItem('profile')">{{ profile?.displayName || '個人檔案' }}</button>
      <button v-else class="login-link" type="button" @click="selectItem('login')">登入</button>
      <button class="nav-cta" type="button" @click="selectItem('report')">我要回報！</button>
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
.menu-toggle{display:none}
@media (max-width: 680px) {
  .header { min-height: 72px; gap: 8px; }
  .brand { font-size: .88rem; }
  .brand-cookie { width: 40px; }
  .menu-toggle{display:grid;place-content:center;gap:4px;width:44px;height:44px;padding:0;border:3px solid var(--ink);border-radius:13px;background:var(--yellow);box-shadow:3px 3px 0 var(--ink);cursor:pointer}
  .menu-toggle span{display:block;width:21px;height:3px;border-radius:99px;background:var(--ink);transition:transform .18s ease,opacity .18s ease}
  .menu-toggle[aria-expanded="true"] span:first-child{transform:translateY(7px) rotate(45deg)}
  .menu-toggle[aria-expanded="true"] span:nth-child(2){opacity:0}
  .menu-toggle[aria-expanded="true"] span:last-child{transform:translateY(-7px) rotate(-45deg)}
  nav{position:absolute;top:calc(100% + 8px);right:0;display:flex;flex-direction:column;align-items:stretch;gap:4px;width:min(250px,calc(100vw - 24px));padding:10px;border:3px solid var(--ink);border-radius:18px;background:var(--cream);box-shadow:7px 7px 0 var(--ink);opacity:0;visibility:hidden;pointer-events:none;transform:translateY(-8px) scale(.98);transform-origin:top right;transition:opacity .18s ease,transform .18s ease,visibility .18s ease}
  nav.open{opacity:1;visibility:visible;pointer-events:auto;transform:none}
  nav button{width:100%;padding:11px 12px;border-radius:10px;color:var(--ink);font-size:.95rem;text-align:left}
  nav button:hover,nav button:focus-visible{background:#fff3b3}
  nav .login-link{padding:10px 12px;box-shadow:none}
  nav .nav-cta{margin:5px 0 0;padding:11px 14px;text-align:center}
}
@media (max-width: 430px) { .brand{gap:7px;font-size:.78rem}.brand-cookie{width:38px;height:38px;flex:0 0 38px} }
</style>
