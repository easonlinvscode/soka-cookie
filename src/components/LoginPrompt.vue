<script setup>
defineProps({ destinationLabel: { type: String, default: '使用這項功能' } })
defineEmits(['close', 'login'])
</script>

<template>
  <div class="login-prompt" role="presentation" @click.self="$emit('close')">
    <section class="prompt-card comic-panel" role="dialog" aria-modal="true" aria-labelledby="login-prompt-title">
      <button class="close-button" type="button" aria-label="關閉登入提醒" @click="$emit('close')">×</button>
      <span class="cookie-mark" aria-hidden="true">★</span>
      <h2 id="login-prompt-title">尚未登入</h2>
      <p>請先前往登入頁面，登入後才能{{ destinationLabel }}。</p>
      <div class="prompt-actions">
        <button class="comic-button secondary" type="button" @click="$emit('close')">留在首頁</button>
        <button class="comic-button" type="button" @click="$emit('login')">前往登入</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-prompt{position:fixed;z-index:100;inset:0;display:grid;place-items:center;padding:18px;background:rgba(36,22,14,.64);backdrop-filter:blur(4px)}.prompt-card{position:relative;width:min(500px,100%);padding:clamp(28px,6vw,46px);background:#fff3b3;text-align:center}.close-button{position:absolute;top:13px;right:15px;width:38px;height:38px;border:3px solid var(--ink);border-radius:50%;background:white;font-size:1.5rem;font-weight:1000;line-height:1;cursor:pointer}.cookie-mark{display:grid;place-items:center;width:70px;height:70px;margin:0 auto;border:4px solid var(--ink);border-radius:48% 52% 44% 56%;background:var(--yellow);color:var(--pink);box-shadow:5px 5px 0 var(--ink);font-size:2rem;transform:rotate(-8deg)}h2{margin:20px 0 8px;font-family:var(--font-display);font-size:clamp(2rem,6vw,3rem)}p{margin:0 auto 24px;max-width:360px;font-weight:800;line-height:1.7}.prompt-actions{display:flex;justify-content:center;gap:12px}.prompt-actions button{min-width:150px}@media(max-width:520px){.prompt-card{border-radius:28px}.prompt-actions{flex-direction:column-reverse}.prompt-actions button{width:100%}}
</style>
