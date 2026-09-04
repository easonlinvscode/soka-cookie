<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'round' },
  colorIndex: { type: Number, default: 0 },
})

const colors = ['#f5a13a', '#ffc84b', '#f28b34', '#ffb84f']
const fill = computed(() => colors[props.colorIndex % colors.length])

function radialPoints(count, outer, inner) {
  return Array.from({ length: count * 2 }, (_, index) => {
    const angle = -Math.PI / 2 + index * Math.PI / count
    const radius = index % 2 === 0 ? outer : inner
    return `${Math.cos(angle) * radius},${Math.sin(angle) * radius}`
  }).join(' ')
}

const starPoints = radialPoints(5, 27, 13.5)
const flowerPoints = radialPoints(8, 26, 18.72)
</script>

<template>
  <svg viewBox="-34 -34 68 68" aria-hidden="true">
    <polygon v-if="type === 'star'" :points="starPoints" :fill="fill" class="cookie-shape" />
    <path v-else-if="type === 'heart'" d="M0 24 C-32 5 -29-18 -13-20 C-5-21 0-14 0-8 C0-14 5-21 13-20 C29-18 32 5 0 24Z" :fill="fill" class="cookie-shape" />
    <polygon v-else-if="type === 'flower'" :points="flowerPoints" :fill="fill" class="cookie-shape" />
    <circle v-else r="25" :fill="fill" class="cookie-shape" />

    <g class="chips">
      <circle cx="-10" cy="-8" r="2.3" />
      <circle cx="9" cy="-11" r="2.3" />
      <circle cx="-5" cy="10" r="2.3" />
      <circle cx="12" cy="8" r="2.3" />
    </g>
    <ellipse cx="-10" cy="-13" rx="6" ry="2.5" transform="rotate(-35 -10 -13)" class="highlight" />
  </svg>
</template>

<style scoped>
svg { display: block; width: 100%; height: 100%; overflow: visible; }
.cookie-shape { stroke: #24160e; stroke-width: 4; stroke-linejoin: round; }
.chips { fill: #b85e21; }
.highlight { fill: rgba(255,255,255,.52); }
</style>
