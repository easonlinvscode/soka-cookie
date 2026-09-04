<script setup>
import { computed, reactive, ref } from 'vue'
import gsap from 'gsap'
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import ReportFlow from './components/ReportFlow.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'
import EncouragementCard from './components/EncouragementCard.vue'
import { headquarters, quotes } from './data/content.js'

const currentView = ref('home')
const progress = reactive(Object.fromEntries(headquarters.map((hq) => [hq.id, { ...hq.initial }])) )
const activeDivision = ref('men')
const latestReport = ref(null)
const currentQuote = ref(quotes[0])
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

const districtMinutes = computed(() => Object.values(progress).reduce((sum, item) => sum + item.men + item.women, 0))

function startReport() {
  currentView.value = 'report'
  requestAnimationFrame(() => document.querySelector('#report-flow')?.scrollIntoView({ behavior: 'smooth' }))
}

function showProgress(division = activeDivision.value) {
  activeDivision.value = division
  currentView.value = 'progress'
  requestAnimationFrame(() => document.querySelector('#progress')?.scrollIntoView({ behavior: 'smooth' }))
}

function completeReport(report) {
  progress[report.headquarters][report.division] += report.minutes
  activeDivision.value = report.division
  latestReport.value = report
  currentQuote.value = quotes[Math.floor(Math.random() * quotes.length)]
  currentView.value = 'encouragement'
}

function enterView(el, done) {
  if (reducedMotion.matches) { done(); return }
  gsap.fromTo(el,
    { autoAlpha: 0, rotateX: -9, y: 34, clipPath: 'inset(0 0 100% 0)' },
    { autoAlpha: 1, rotateX: 0, y: 0, clipPath: 'inset(0 0 0% 0)', duration: .72, ease: 'power3.out', clearProps: 'all', onComplete: done },
  )
}

function leaveView(el, done) {
  if (reducedMotion.matches) { done(); return }
  gsap.to(el, { autoAlpha: 0, rotateX: 7, y: -22, duration: .28, ease: 'power2.in', onComplete: done })
}
</script>

<template>
  <div class="site-shell">
    <AppHeader @home="currentView = 'home'" @report="startReport" @progress="showProgress()" />

    <main class="view-frame">
      <Transition mode="out-in" :css="false" @enter="enterView" @leave="leaveView">
        <div :key="currentView" class="view-page">
          <HeroSection
            v-if="currentView === 'home'"
            :district-minutes="districtMinutes"
            @report="startReport"
            @progress="showProgress()"
          />

          <ReportFlow
            v-else-if="currentView === 'report'"
            id="report-flow"
            @cancel="currentView = 'home'"
            @complete="completeReport"
          />

          <EncouragementCard
            v-else-if="currentView === 'encouragement'"
            :report="latestReport"
            :quote="currentQuote"
            @progress="showProgress(latestReport.division)"
          />

          <ProgressDashboard
            v-else
            id="progress"
            v-model:division="activeDivision"
            :progress="progress"
            :latest-report="latestReport"
            @report="startReport"
          />
        </div>
      </Transition>
    </main>

    <footer class="footer-strip">
      <span>桃園西區</span>
      <span aria-hidden="true">★</span>
      <strong>福運餅乾大作戰</strong>
      <span aria-hidden="true">♥</span>
      <span>一起累積每一份努力</span>
    </footer>
  </div>
</template>

<style scoped>
.site-shell { min-height: 100vh; }
main { min-height: calc(100vh - 152px); }
.view-frame { overflow: hidden; perspective: 1200px; }
.view-page { min-height: inherit; transform-origin: top center; }
.footer-strip {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 20px;
  padding: 22px 16px;
  border-top: var(--stroke-heavy) solid var(--ink);
  background: var(--yellow);
  font-family: var(--font-display);
  font-weight: 900;
  text-align: center;
}
</style>
