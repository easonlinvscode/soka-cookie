<script setup>
import littleLion from '../assets/characters/little-lion-final.png'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'
import littleBear from '../assets/characters/lucky-bear-final.png'
import CookieParadeIcon from './CookieParadeIcon.vue'

defineProps({ loading: Boolean, error: String })
defineEmits(['login'])
const cookies = ['star', 'round', 'heart', 'flower', 'round', 'star', 'heart', 'flower']
</script>

<template>
  <main class="login-screen">
    <div class="login-cookies" aria-hidden="true">
      <span v-for="(cookie, index) in cookies" :key="`${cookie}-${index}`" :class="`cookie cookie-${index + 1}`">
        <CookieParadeIcon :type="cookie" :color-index="index" />
      </span>
    </div>
    <section class="login-card comic-panel">
      <h1>福運餅乾<br><strong>一起累積！</strong></h1>
      <p>使用 Google 帳號登入，保存每一次唱題與群組挑戰進度。</p>
      <button class="google-button" type="button" :disabled="loading" @click="$emit('login')">
        <span aria-hidden="true">G</span>
        {{ loading ? '登入中…' : '使用 Google 帳號登入' }}
      </button>
      <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      <small>登入後才能查看回報、進度與群組內容。</small>
    </section>
    <div class="login-mascots" aria-hidden="true">
      <img :src="littleLion" alt="">
      <img :src="phoenixChick" alt="">
      <img :src="littleBear" alt="">
    </div>
  </main>
</template>

<style scoped>
.login-screen{position:relative;min-height:100svh;display:grid;place-items:center;overflow:hidden;padding:48px 16px 155px;background-color:var(--pink);background-image:radial-gradient(rgba(255,255,255,.2) 3px,transparent 3px);background-size:28px 28px}.login-screen::before{content:'';position:absolute;inset:8% -20%;background:repeating-conic-gradient(from 5deg at 50% 52%,rgba(255,225,59,.15) 0 8deg,transparent 8deg 18deg)}.login-card{position:relative;z-index:3;width:min(560px,100%);padding:clamp(30px,6vw,54px);text-align:center;background:#fff3b3}.login-badge{display:inline-block;padding:6px 14px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);box-shadow:4px 4px 0 var(--ink);font-weight:1000}.login-card h1{margin:22px 0 16px;font-family:var(--font-display);font-size:clamp(2.65rem,8vw,4.9rem);line-height:.92}.login-card h1 strong{color:var(--pink)}.login-card>p{margin:0 auto 24px;max-width:420px;font-weight:800;line-height:1.7}.google-button{width:min(360px,100%);min-height:58px;padding:12px 20px;border:4px solid var(--ink);border-radius:999px;background:white;box-shadow:6px 6px 0 var(--ink);font-weight:1000;cursor:pointer}.google-button span{display:inline-grid;place-items:center;width:30px;height:30px;margin-right:9px;border-radius:50%;background:var(--blue);font-family:Arial,sans-serif}.google-button:disabled{opacity:.55;cursor:wait}.login-card small{display:block;margin-top:20px;color:var(--muted);font-weight:800}.error-message{margin-top:18px!important;margin-bottom:0!important;padding:10px;border:3px solid var(--ink);border-radius:14px;background:#ffe1ea;color:#9d003b}.login-mascots{position:absolute;z-index:2;bottom:-18px;left:50%;display:flex;align-items:end;gap:clamp(8px,5vw,48px);transform:translateX(-50%)}.login-mascots img{width:clamp(105px,15vw,165px);filter:drop-shadow(5px 7px 0 rgba(32,22,15,.85));animation:login-bounce 1.8s ease-in-out infinite alternate}.login-mascots img:nth-child(2){animation-delay:.25s}.login-mascots img:nth-child(3){animation-delay:.5s}.login-cookies{position:absolute;inset:0;z-index:1;pointer-events:none}.cookie{position:absolute;width:54px;filter:drop-shadow(3px 4px 0 rgba(32,22,15,.25));animation:cookie-float 2.2s ease-in-out infinite alternate}.cookie-1{left:5%;top:12%}.cookie-2{right:7%;top:14%}.cookie-3{left:12%;top:46%}.cookie-4{right:13%;top:44%}.cookie-5{left:28%;top:7%}.cookie-6{right:27%;top:8%}.cookie-7{left:5%;bottom:13%}.cookie-8{right:5%;bottom:14%}@keyframes login-bounce{to{transform:translateY(-18px) rotate(3deg)}}@keyframes cookie-float{to{transform:translateY(-13px) rotate(14deg) scale(1.07)}}@media(max-width:620px){.login-screen{padding-bottom:125px}.login-card{border-radius:28px}.cookie{width:38px}.cookie-3,.cookie-4,.cookie-5,.cookie-6{display:none}.login-mascots img{width:100px}.login-mascots{gap:2px}}
.login-screen{min-height:calc(100svh - 152px);padding-top:32px;padding-bottom:125px}
@media(max-width:620px){.login-screen{min-height:calc(100svh - 136px);padding-bottom:105px}}
</style>
