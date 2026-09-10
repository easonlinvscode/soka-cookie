<script setup>
import { nextTick, onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits(['close', 'report'])
const closeButton = ref(null)
let previousOverflow = ''

function close() {
  emit('close')
}

function startReport() {
  emit('report')
}

function handleKeydown(event) {
  if (event.key === 'Escape') close()
}

onMounted(async () => {
  previousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  window.addEventListener('keydown', handleKeydown)
  await nextTick()
  closeButton.value?.focus()
})

onUnmounted(() => {
  document.body.style.overflow = previousOverflow
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div class="guide-overlay" role="presentation" @click.self="close">
      <section class="guide-dialog comic-panel" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <button ref="closeButton" class="guide-close" type="button" aria-label="關閉使用說明" @click="close">×</button>

        <header class="guide-heading">
          <span>1 MIN GUIDE</span>
          <h2 id="guide-title">一分鐘使用說明</h2>
          <p>登入、回報、累積進度，和夥伴一起裝滿福運餅乾罐！</p>
        </header>

        <div class="guide-steps">
          <article>
            <strong>1</strong>
            <div><h3>Google 登入</h3><p>第一次登入後，填寫姓名、部別與所屬本部。</p></div>
          </article>
          <article>
            <strong>2</strong>
            <div><h3>回報唱題</h3><p>選擇分鐘或遍數，輸入本次數量；也能勾選要計入的群組。</p></div>
          </article>
          <article>
            <strong>3</strong>
            <div><h3>查看進度</h3><p>查看個人累積、每日唱題日曆，以及群組完成率與成員排行。</p></div>
          </article>
          <article>
            <strong>4</strong>
            <div><h3>群組挑戰</h3><p>建立群組設定共同目標，或輸入八碼邀請碼加入夥伴。</p></div>
          </article>
          <article>
            <strong>5</strong>
            <div><h3>抽福運卡</h3><p>每完成一筆回報就能抽卡，喜歡的卡片可收藏到個人頁面。</p></div>
          </article>
        </div>

        <div class="quick-flow" aria-label="快速使用流程">
          <span>登入</span><i>→</i><span>回報</span><i>→</i><span>選群組</span><i>→</i><span>抽卡</span><i>→</i><span>看進度</span>
        </div>

        <div class="guide-actions">
          <button class="comic-button secondary" type="button" @click="close">我知道了</button>
          <button class="comic-button" type="button" @click="startReport">開始回報 GO!</button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
.guide-overlay{position:fixed;z-index:300;inset:0;display:grid;place-items:center;padding:20px;background:rgba(36,22,14,.68);backdrop-filter:blur(5px)}
.guide-dialog{position:relative;width:min(780px,100%);max-height:calc(100svh - 40px);overflow-y:auto;padding:clamp(26px,5vw,46px);background:#fff9e9;overscroll-behavior:contain}
.guide-close{position:absolute;z-index:2;top:15px;right:17px;display:grid;place-items:center;width:44px;height:44px;border:3px solid var(--ink);border-radius:50%;background:var(--yellow);box-shadow:4px 4px 0 var(--ink);font-size:1.7rem;font-weight:1000;line-height:1;cursor:pointer}
.guide-close:focus-visible{outline:4px solid var(--blue);outline-offset:2px}
.guide-heading{text-align:center}
.guide-heading>span{display:inline-block;padding:5px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--blue);box-shadow:3px 3px 0 var(--ink);font-weight:1000;letter-spacing:.08em;transform:rotate(-2deg)}
.guide-heading h2{margin:16px 0 8px;font-family:var(--font-display);font-size:clamp(2.1rem,6vw,3.6rem);line-height:1}
.guide-heading p{max-width:560px;margin:0 auto 24px;font-weight:800;line-height:1.65}
.guide-steps{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.guide-steps article{display:flex;align-items:flex-start;gap:13px;padding:16px;border:3px solid var(--ink);border-radius:18px;background:white;box-shadow:4px 4px 0 var(--ink)}
.guide-steps article:nth-child(3){grid-column:1/-1;background:#fff3b3}
.guide-steps article>strong{display:grid;place-items:center;flex:0 0 38px;height:38px;border:3px solid var(--ink);border-radius:50%;background:var(--yellow);color:var(--pink);font-family:var(--font-display);font-size:1.15rem}
.guide-steps h3{margin:0 0 4px;font-family:var(--font-display);font-size:1.18rem}
.guide-steps p{margin:0;color:#5e4b41;font-size:.92rem;font-weight:800;line-height:1.55}
.quick-flow{display:flex;align-items:center;justify-content:center;gap:8px;margin:24px 0 20px;padding:12px;border:3px dashed var(--ink);border-radius:16px;background:#dff7ff;font-weight:1000}
.quick-flow span{white-space:nowrap}.quick-flow i{color:var(--pink);font-style:normal}
.guide-actions{display:flex;justify-content:center;gap:12px}
@media(max-width:620px){
  .guide-overlay{padding:10px}
  .guide-dialog{max-height:calc(100svh - 20px);padding:24px 16px 20px;border-radius:26px}
  .guide-close{top:11px;right:12px;width:40px;height:40px;box-shadow:3px 3px 0 var(--ink)}
  .guide-heading{padding-inline:10px}.guide-heading h2{margin-top:14px}.guide-heading p{margin-bottom:18px;font-size:.92rem}
  .guide-steps{grid-template-columns:1fr;gap:9px}
  .guide-steps article:nth-child(3){grid-column:auto}
  .guide-steps article{padding:12px;box-shadow:3px 3px 0 var(--ink)}
  .guide-steps article>strong{flex-basis:34px;height:34px}.guide-steps h3{font-size:1.05rem}.guide-steps p{font-size:.86rem}
  .quick-flow{flex-wrap:wrap;gap:5px;margin:18px 0 16px;font-size:.82rem}
  .guide-actions{flex-direction:column-reverse}.guide-actions button{width:100%}
}
@media(prefers-reduced-motion:reduce){.guide-heading>span{transform:none}}
</style>
