<script setup>
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  target: { type: Number, default: 1000 },
  variantKey: { type: String, required: true },
  celebrate: { type: Boolean, default: false },
  unitLabel: { type: String, default: '分鐘' },
})

const canvas = ref(null)
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const MAX_COOKIES = 36
const W = 440
const H = 540
let frameId = 0
let startTime = performance.now()
let dropStart = 0
let droppingIndex = -1
let replayStart = 0
let replayActive = false
let lastKey = props.variantKey
let lastCount = getCount(props.value)

const colors = ['#f5a13a', '#ffc84b', '#f28b34', '#ffb84f']

function getCount(value) {
  if (value <= 0) return 0
  return Math.min(MAX_COOKIES, Math.max(10, Math.ceil((value / props.target) * MAX_COOKIES)))
}

function seeded(index, salt = 0) {
  const x = Math.sin((index + 1) * 9187.13 + salt * 73.7) * 43758.5453
  return x - Math.floor(x)
}

const slots = Array.from({ length: MAX_COOKIES }, (_, index) => {
  const row = Math.floor(index / 6)
  const col = index % 6
  return {
    x: 88 + col * 52 + (row % 2) * 18 + (seeded(index, 2) - .5) * 12,
    y: 452 - row * 56 + (seeded(index, 3) - .5) * 8,
    r: 23 + seeded(index, 4) * 5,
    rotation: (seeded(index, 5) - .5) * .75,
    type: index % 4,
    phase: seeded(index, 6) * Math.PI * 2,
  }
})

function jarInterior(ctx) {
  ctx.beginPath()
  ctx.moveTo(103, 145)
  ctx.bezierCurveTo(82, 157, 65, 177, 60, 207)
  ctx.lineTo(68, 438)
  ctx.bezierCurveTo(70, 475, 91, 497, 126, 504)
  ctx.bezierCurveTo(188, 517, 252, 517, 314, 504)
  ctx.bezierCurveTo(349, 497, 370, 475, 372, 438)
  ctx.lineTo(380, 207)
  ctx.bezierCurveTo(375, 177, 358, 157, 337, 145)
  ctx.closePath()
}

function starPath(ctx, outer, inner) {
  ctx.beginPath()
  for (let i = 0; i < 10; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 5
    const radius = i % 2 === 0 ? outer : inner
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function heartPath(ctx, r) {
  ctx.beginPath()
  ctx.moveTo(0, r * .86)
  ctx.bezierCurveTo(-r * 1.25, r * .1, -r * 1.12, -r * .72, -r * .5, -r * .75)
  ctx.bezierCurveTo(-r * .16, -r * .78, 0, -r * .48, 0, -r * .28)
  ctx.bezierCurveTo(0, -r * .48, r * .16, -r * .78, r * .5, -r * .75)
  ctx.bezierCurveTo(r * 1.12, -r * .72, r * 1.25, r * .1, 0, r * .86)
  ctx.closePath()
}

function flowerPath(ctx, r) {
  ctx.beginPath()
  for (let i = 0; i < 16; i += 1) {
    const angle = -Math.PI / 2 + i * Math.PI / 8
    const radius = i % 2 === 0 ? r : r * .72
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
  }
  ctx.closePath()
}

function drawCookie(ctx, slot, index, t, dropping = false) {
  const canFloat = !dropping && !reducedMotion.matches
  const floatX = canFloat ? Math.sin(t * .72 + slot.phase) * 1.1 : 0
  const floatY = canFloat ? Math.sin(t * 1.08 + slot.phase) * 2.6 : 0
  const floatRotation = canFloat ? Math.sin(t * .8 + slot.phase) * .025 : 0
  const sparkle = reducedMotion.matches ? .8 : .78 + Math.sin(t * 1.4 + slot.phase) * .05
  ctx.save()
  ctx.translate(slot.x + floatX, slot.y + floatY)
  ctx.rotate(slot.rotation + floatRotation)
  ctx.globalAlpha = sparkle
  ctx.shadowColor = 'rgba(82, 38, 12, .25)'
  ctx.shadowBlur = dropping ? 14 : 5
  ctx.shadowOffsetY = dropping ? 9 : 3
  ctx.fillStyle = colors[index % colors.length]
  ctx.strokeStyle = '#24160e'
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'

  if (slot.type === 0) starPath(ctx, slot.r, slot.r * .5)
  else if (slot.type === 1) heartPath(ctx, slot.r * .92)
  else if (slot.type === 2) flowerPath(ctx, slot.r)
  else {
    ctx.beginPath()
    ctx.arc(0, 0, slot.r, 0, Math.PI * 2)
  }
  ctx.fill()
  ctx.stroke()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = '#b85e21'
  for (let dot = 0; dot < 4; dot += 1) {
    const angle = slot.phase + dot * 1.7
    ctx.beginPath()
    ctx.arc(Math.cos(angle) * slot.r * .42, Math.sin(angle) * slot.r * .38, 2.2, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.fillStyle = 'rgba(255,255,255,.52)'
  ctx.beginPath()
  ctx.ellipse(-slot.r * .28, -slot.r * .3, slot.r * .16, slot.r * .08, -.7, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawJar(ctx, count, timestamp) {
  const t = (timestamp - startTime) / 1000
  const wasReplayActive = replayActive
  const replayElapsed = Math.max(0, timestamp - replayStart)
  const replayDuration = Math.max(720, (count - 1) * 48 + 720)
  const closingWindow = replayDuration - replayElapsed
  const jarShake = wasReplayActive && closingWindow > 0 && closingWindow < 260
    ? Math.sin(replayElapsed * .085) * 3.5 * (closingWindow / 260)
    : 0
  let lidLift = 0
  if (wasReplayActive) {
    const opening = Math.min(1, replayElapsed / 260)
    const closing = closingWindow < 260 ? Math.max(0, closingWindow / 260) : 1
    lidLift = 31 * opening * closing
  }
  ctx.clearRect(0, 0, W, H)
  ctx.save()
  ctx.translate(jarShake, 0)

  ctx.save()
  jarInterior(ctx)
  ctx.fillStyle = 'rgba(239, 253, 255, .72)'
  ctx.fill()
  ctx.clip()

  if (replayActive) {
    let finished = true
    for (let i = 0; i < count; i += 1) {
      const delay = i * 48
      const raw = Math.min(1, Math.max(0, (timestamp - replayStart - delay) / 720))
      if (raw < 1) finished = false
      if (raw <= 0) continue
      const bounce = raw < .75
        ? 1 - Math.pow(1 - raw / .75, 3)
        : 1 + Math.sin((raw - .75) / .25 * Math.PI) * .06 * (1 - raw)
      const target = slots[i]
      const animated = { ...target, y: -70 + (target.y + 70) * bounce, rotation: target.rotation + (1 - raw) * (i % 2 ? 4 : -4) }
      drawCookie(ctx, animated, i, t, true)
    }
    if (finished) replayActive = false
  } else {
    const stableCount = droppingIndex >= 0 ? Math.min(count, droppingIndex) : count
    for (let i = 0; i < stableCount; i += 1) drawCookie(ctx, slots[i], i, t)
  }

  if (!replayActive && droppingIndex >= 0 && droppingIndex < count) {
    const elapsed = timestamp - dropStart
    const duration = 900
    const raw = Math.min(1, elapsed / duration)
    const bounce = raw < .72
      ? 1 - Math.pow(1 - raw / .72, 3)
      : 1 + Math.sin((raw - .72) / .28 * Math.PI) * .09 * (1 - raw)
    const target = slots[droppingIndex]
    const animated = { ...target, y: -45 + (target.y + 45) * bounce, rotation: target.rotation + (1 - raw) * 4.5 }
    drawCookie(ctx, animated, droppingIndex, t, true)
    if (raw >= 1) droppingIndex = -1
  }
  ctx.restore()

  jarInterior(ctx)
  ctx.strokeStyle = '#24160e'
  ctx.lineWidth = 9
  ctx.lineJoin = 'round'
  ctx.stroke()

  const glass = ctx.createLinearGradient(40, 0, 400, 0)
  glass.addColorStop(0, 'rgba(255,255,255,.86)')
  glass.addColorStop(.18, 'rgba(255,255,255,.28)')
  glass.addColorStop(.76, 'rgba(255,255,255,.12)')
  glass.addColorStop(1, 'rgba(125,214,236,.2)')
  jarInterior(ctx)
  ctx.fillStyle = glass
  ctx.fill()

  // Thick glass foot, inspired by a classic apothecary cookie jar.
  ctx.strokeStyle = 'rgba(36, 22, 14, .72)'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(82, 472)
  ctx.bezierCurveTo(128, 510, 312, 510, 358, 472)
  ctx.stroke()
  ctx.strokeStyle = 'rgba(255,255,255,.62)'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(101, 483)
  ctx.bezierCurveTo(154, 506, 286, 506, 339, 483)
  ctx.stroke()

  // Transparent glass lid, dome and central grip.
  ctx.save()
  ctx.translate(0, -lidLift)
  ctx.shadowColor = 'rgba(36, 22, 14, .2)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 8

  const lidGlass = ctx.createLinearGradient(0, 45, 0, 155)
  lidGlass.addColorStop(0, 'rgba(255,255,255,.92)')
  lidGlass.addColorStop(.5, 'rgba(212,241,247,.5)')
  lidGlass.addColorStop(1, 'rgba(151,210,224,.58)')
  ctx.fillStyle = lidGlass
  ctx.strokeStyle = '#24160e'
  ctx.lineWidth = 7
  ctx.beginPath()
  ctx.moveTo(76, 116)
  ctx.bezierCurveTo(94, 96, 137, 82, 183, 76)
  ctx.bezierCurveTo(201, 73, 239, 73, 257, 76)
  ctx.bezierCurveTo(303, 82, 346, 96, 364, 116)
  ctx.bezierCurveTo(351, 135, 307, 148, 220, 150)
  ctx.bezierCurveTo(133, 148, 89, 135, 76, 116)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.shadowColor = 'transparent'
  ctx.fillStyle = 'rgba(220,246,251,.72)'
  ctx.beginPath()
  ctx.ellipse(220, 119, 148, 29, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = lidGlass
  ctx.beginPath()
  ctx.roundRect(194, 39, 52, 45, 14)
  ctx.fill()
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(220, 35, 51, 17, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  ctx.strokeStyle = 'rgba(255,255,255,.8)'
  ctx.lineWidth = 5
  ctx.beginPath()
  ctx.moveTo(99, 110)
  ctx.bezierCurveTo(131, 91, 169, 85, 205, 82)
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(206, 30, 23, 6, -.08, Math.PI, Math.PI * 1.9)
  ctx.stroke()
  ctx.restore()

  // Glass mouth remains visible beneath the lid.
  ctx.strokeStyle = 'rgba(36, 22, 14, .82)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.ellipse(220, 149, 119, 14, 0, 0, Math.PI)
  ctx.stroke()

  ctx.fillStyle = 'rgba(255,255,255,.52)'
  ctx.beginPath()
  ctx.roundRect(78, 194, 17, 196, 9)
  ctx.fill()

  if (props.value >= props.target) {
    ctx.save()
    ctx.translate(382, 55)
    ctx.rotate(-.04)
    ctx.fillStyle = '#ffe13b'
    ctx.strokeStyle = '#24160e'
    ctx.lineWidth = 5
    starPath(ctx, 32, 15)
    ctx.fill(); ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

function loop(timestamp) {
  const context = canvas.value?.getContext('2d')
  if (!context) return
  drawJar(context, getCount(props.value), timestamp)
  frameId = requestAnimationFrame(loop)
}

function resizeCanvas() {
  if (!canvas.value) return
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.value.width = W * ratio
  canvas.value.height = H * ratio
  canvas.value.getContext('2d').setTransform(ratio, 0, 0, ratio, 0, 0)
}

watch(() => [props.value, props.variantKey], async ([value, key]) => {
  await nextTick()
  const count = getCount(value)
  if (key !== lastKey && count > 0 && !reducedMotion.matches) {
    replayActive = true
    replayStart = performance.now()
    droppingIndex = -1
  } else if (key === lastKey && count > lastCount && !reducedMotion.matches) {
    droppingIndex = Math.min(count - 1, MAX_COOKIES - 1)
    dropStart = performance.now()
  } else {
    droppingIndex = -1
  }
  lastKey = key
  lastCount = count
})

onMounted(() => {
  resizeCanvas()
  if (lastCount > 0 && !reducedMotion.matches) {
    replayActive = true
    replayStart = performance.now()
  }
  window.addEventListener('resize', resizeCanvas)
  frameId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  cancelAnimationFrame(frameId)
  window.removeEventListener('resize', resizeCanvas)
})
</script>

<template>
  <canvas
    ref="canvas"
    class="cookie-jar"
    role="img"
    :aria-label="`福運餅乾收藏罐，目前累積 ${value} ${unitLabel}，完成 ${Math.round(value / target * 100)}%`"
  ></canvas>
</template>

<style scoped>
.cookie-jar {
  display: block;
  width: min(100%, 440px);
  height: auto;
  margin-inline: auto;
  aspect-ratio: 440 / 540;
  filter: drop-shadow(12px 14px 0 rgba(32, 22, 15, .95));
}
</style>
