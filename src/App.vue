<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import AppHeader from './components/AppHeader.vue'
import HeroSection from './components/HeroSection.vue'
import QuickReport from './components/QuickReport.vue'
import ProgressDashboard from './components/ProgressDashboard.vue'
import EncouragementCard from './components/EncouragementCard.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import LoginScreen from './components/LoginScreen.vue'
import LoginPrompt from './components/LoginPrompt.vue'
import ProfileSetup from './components/ProfileSetup.vue'
import GroupsPage from './components/GroupsPage.vue'
import UserProfile from './components/UserProfile.vue'
import { isFirebaseConfigured } from './firebase.js'
import { getMyGroups, getProfile, loginWithGoogle, logout, saveProfile, setFavoriteCard, submitReport, watchAuth, watchFavoriteCards, watchMyReports } from './services/firebaseService.js'

const initialRoute = readRoute()
const authReady = ref(!isFirebaseConfigured)
const user = ref(null)
const profile = ref(null)
const currentView = ref(['home', 'login'].includes(initialRoute.view) ? initialRoute.view : 'home')
const reports = ref([])
const groups = ref([])
const latestReport = ref(null)
const favoriteCards = ref([])
const loginBusy = ref(false)
const savingProfile = ref(false)
const submittingReport = ref(false)
const groupsLoading = ref(false)
const loginError = ref('')
const profileError = ref('')
const reportError = ref('')
const favoriteError = ref('')
const favoriteBusy = ref(false)
const isEditingProfile = ref(false)
const highlightLatestUpdate = ref(false)
const loginPromptOpen = ref(false)
const pendingView = ref(!['home', 'login', 'setup'].includes(initialRoute.view) ? initialRoute.view : null)
const pendingRoute = ref(!['home', 'login', 'setup'].includes(initialRoute.view) ? initialRoute : null)
const loginRequested = ref(false)
const pendingJoinCode = ref(new URLSearchParams(window.location.search).get('join')?.trim().toUpperCase() || '')
const initialGroupId = ref(initialRoute.groupId || '')
const initialGroupMode = ref(initialRoute.groupMode || 'list')
const initialProgressMode = ref(initialRoute.progressMode || 'personal')
const savedLoginDestination = ref(sessionStorage.getItem('soka-cookie-login-destination') || '')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
let stopAuth = null
let stopReports = null
let stopFavorites = null

const myReports = computed(() => reports.value.filter((report) => report.userId === user.value?.uid))
const pendingDestinationLabel = computed(() => ({ report: '回報唱題', progress: '查看進度', groups: '查看或加入群組', profile: '查看個人資料' }[pendingView.value] || '使用這項功能'))

function readRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)
  if (!parts.length) return { view: 'home' }
  if (parts[0] === 'groups') {
    if (parts[1] === 'new') return { view: 'groups', groupMode: 'create' }
    if (parts[1] === 'join') return { view: 'groups', groupMode: 'join' }
    if (parts[1]) return { view: 'groups', groupMode: parts[2] === 'edit' ? 'edit' : 'detail', groupId: parts[1] }
    return { view: 'groups', groupMode: 'list' }
  }
  if (parts[0] === 'profile') return { view: 'profile', editProfile: parts[1] === 'edit' }
  if (parts[0] === 'progress') return { view: 'progress', progressMode: parts[1] === 'groups' ? 'groups' : 'personal' }
  if (parts[0] === 'success') return { view: 'encouragement' }
  if (['home', 'login', 'report', 'progress', 'setup'].includes(parts[0])) return { view: parts[0] }
  return { view: 'home' }
}

function routeHash(route) {
  if (route.view === 'home') return '#/'
  if (route.view === 'encouragement') return '#/success'
  if (route.view === 'setup') return '#/setup'
  if (route.view === 'profile') return route.editProfile ? '#/profile/edit' : '#/profile'
  if (route.view === 'progress') return route.progressMode === 'groups' ? '#/progress/groups' : '#/progress/personal'
  if (route.view !== 'groups') return `#/${route.view}`
  if (route.groupMode === 'create') return '#/groups/new'
  if (route.groupMode === 'join') return '#/groups/join'
  if (route.groupId) return `#/groups/${encodeURIComponent(route.groupId)}${route.groupMode === 'edit' ? '/edit' : ''}`
  return '#/groups'
}

function writeRoute(route, replace = false) {
  const nextHash = routeHash(route)
  if (window.location.hash === nextHash) return
  window.history[replace ? 'replaceState' : 'pushState']({ sokaCookie: true }, '', nextHash)
}

function activateRoute(route, { write = true, replace = false } = {}) {
  loginPromptOpen.value = false
  let redirected = false
  const protectedView = !['home', 'login', 'setup'].includes(route.view)
  if (protectedView && (!user.value || !profile.value?.profileComplete)) {
    pendingView.value = route.view
    pendingRoute.value = route
    currentView.value = 'home'
    loginPromptOpen.value = true
    return false
  }
  if (route.view === 'encouragement' && !latestReport.value) { route = { view: 'progress' }; redirected = true }
  if (route.view === 'login' && user.value?.uid && profile.value?.profileComplete) { route = { view: 'home' }; redirected = true }
  currentView.value = route.view === 'setup' ? 'home' : route.view
  isEditingProfile.value = route.view === 'profile' && Boolean(route.editProfile)
  if (route.view === 'groups') {
    initialGroupMode.value = route.groupMode || 'list'
    initialGroupId.value = route.groupId || ''
  } else {
    initialGroupMode.value = 'list'
    initialGroupId.value = ''
  }
  initialProgressMode.value = route.view === 'progress' && route.progressMode === 'groups' ? 'groups' : 'personal'
  if (write || redirected) writeRoute(route, replace || redirected)
  requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' }))
  return true
}

function handleHistoryNavigation() {
  activateRoute(readRoute(), { write: false })
}

async function refreshGroups() {
  if (!user.value || !profile.value?.profileComplete) return
  groupsLoading.value = true
  try { groups.value = await getMyGroups(user.value.uid) }
  finally { groupsLoading.value = false }
}

function startReports(uid) {
  stopReports?.()
  stopReports = watchMyReports(uid, (items) => { reports.value = items }, () => { reportError.value = '目前無法讀取個人進度，請稍後重試。' })
}

function startFavorites(uid) {
  stopFavorites?.()
  stopFavorites = watchFavoriteCards(uid, (items) => { favoriteCards.value = items }, () => { favoriteError.value = '目前無法讀取收藏卡片。' })
}

async function handleAuth(account) {
  const continueAfterLogin = loginRequested.value || Boolean(savedLoginDestination.value)
  authReady.value = false
  user.value = account
  stopReports?.()
  stopReports = null
  stopFavorites?.()
  stopFavorites = null
  reports.value = []
  groups.value = []
  favoriteCards.value = []
  latestReport.value = null
  if (!account) {
    profile.value = null
    const route = readRoute()
    currentView.value = route.view === 'login' ? 'login' : 'home'
    if (!['home', 'login', 'setup'].includes(route.view)) {
      pendingView.value = route.view
      pendingRoute.value = route
      loginPromptOpen.value = true
    }
    if (pendingJoinCode.value) {
      pendingView.value = 'groups'
      pendingRoute.value = { view: 'groups', groupMode: 'join' }
      loginPromptOpen.value = true
    }
    loginRequested.value = false
    authReady.value = true
    return
  }
  try {
    profile.value = await getProfile(account.uid)
    if (profile.value?.profileComplete) {
      startReports(account.uid)
      startFavorites(account.uid)
      await refreshGroups()
      if (pendingJoinCode.value) activateRoute({ view: 'groups', groupMode: 'join' }, { replace: true })
      else if (continueAfterLogin) activateRoute(pendingRoute.value || { view: pendingView.value || savedLoginDestination.value || 'report' }, { replace: true })
      else activateRoute(readRoute(), { write: false })
      pendingView.value = null
      pendingRoute.value = null
      savedLoginDestination.value = ''
      sessionStorage.removeItem('soka-cookie-login-destination')
    } else {
      writeRoute({ view: 'setup' }, true)
    }
  } catch (error) {
    loginError.value = error.message || '讀取個人資料失敗。'
  } finally {
    loginRequested.value = false
    authReady.value = true
  }
}

async function handleLogin() {
  loginBusy.value = true
  loginRequested.value = true
  savedLoginDestination.value = pendingJoinCode.value ? 'groups' : (pendingView.value || 'report')
  sessionStorage.setItem('soka-cookie-login-destination', savedLoginDestination.value)
  loginError.value = ''
  try { await loginWithGoogle() }
  catch (error) {
    loginRequested.value = false
    savedLoginDestination.value = ''
    sessionStorage.removeItem('soka-cookie-login-destination')
    loginError.value = error.message || 'Google 登入失敗，請稍後再試。'
  }
  finally { loginBusy.value = false }
}

async function handleSaveProfile(values) {
  const wasEditing = isEditingProfile.value
  savingProfile.value = true
  profileError.value = ''
  try {
    profile.value = await saveProfile(user.value, values)
    isEditingProfile.value = false
    startReports(user.value.uid)
    startFavorites(user.value.uid)
    await refreshGroups()
    const destination = wasEditing
      ? { view: 'profile' }
      : pendingJoinCode.value
        ? { view: 'groups', groupMode: 'join' }
        : pendingRoute.value || { view: pendingView.value || savedLoginDestination.value || 'report' }
    activateRoute(destination, { replace: true })
    pendingView.value = null
    pendingRoute.value = null
    savedLoginDestination.value = ''
    sessionStorage.removeItem('soka-cookie-login-destination')
  } catch (error) { profileError.value = error.message || '儲存資料失敗。' }
  finally { savingProfile.value = false }
}

async function handleReport(values) {
  if (submittingReport.value) return
  submittingReport.value = true
  reportError.value = ''
  try {
    latestReport.value = await submitReport(user.value, profile.value, values)
    highlightLatestUpdate.value = true
    activateRoute({ view: 'encouragement' })
  } catch (error) { reportError.value = error.message || '回報失敗，請稍後再試。' }
  finally { submittingReport.value = false }
}

async function handleFavorite(card, favorite) {
  if (favoriteBusy.value) return
  favoriteBusy.value = true
  favoriteError.value = ''
  const previous = [...favoriteCards.value]
  const cardId = card.cardId || card.id
  const favoriteId = card.favoriteId || `${cardId}--${card.mascot}`
  favoriteCards.value = favorite
    ? [...previous.filter((item) => item.favoriteId !== favoriteId), { favoriteId, cardId, mascot: card.mascot }]
    : previous.filter((item) => item.favoriteId !== favoriteId)
  try {
    await setFavoriteCard(user.value.uid, card, favorite)
  } catch (error) {
    favoriteCards.value = previous
    favoriteError.value = error.message || '收藏失敗，請稍後再試。'
  } finally {
    favoriteBusy.value = false
  }
}

function navigate(view) {
  activateRoute({ view, ...(view === 'groups' ? { groupMode: 'list' } : {}) })
}

function openGroupFromProgress(groupId) {
  if (!groupId) {
    navigate('groups')
    return
  }
  activateRoute({ view: 'groups', groupMode: 'detail', groupId })
}

function openLoginPage() {
  loginPromptOpen.value = false
  activateRoute({ view: 'login' })
}

function handleGroupRoute({ mode = 'list', groupId = '' }) {
  activateRoute({ view: 'groups', groupMode: mode, groupId })
}

function handleProgressRoute(mode) {
  activateRoute({ view: 'progress', progressMode: mode })
}

function editProfile() {
  activateRoute({ view: 'profile', editProfile: true })
}

function cancelProfileEdit() {
  activateRoute({ view: 'profile' }, { replace: true })
}

function clearJoinCode() {
  pendingJoinCode.value = ''
  const url = new URL(window.location.href)
  url.searchParams.delete('join')
  window.history.replaceState({}, '', url)
}

function showProgress(highlight = false) {
  highlightLatestUpdate.value = highlight
  navigate('progress')
}

async function handleLogout() {
  savedLoginDestination.value = ''
  sessionStorage.removeItem('soka-cookie-login-destination')
  await logout()
  activateRoute({ view: 'home' }, { replace: true })
}

function enterView(el, done) {
  if (reducedMotion.matches) { done(); return }
  gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: .48, ease: 'power3.out', clearProps: 'all', onComplete: done })
}
function leaveView(el, done) {
  if (reducedMotion.matches) { done(); return }
  gsap.to(el, { autoAlpha: 0, y: -14, duration: .2, ease: 'power2.in', onComplete: done })
}

onMounted(() => {
  if (!window.location.hash) writeRoute({ view: 'home' }, true)
  window.addEventListener('popstate', handleHistoryNavigation)
  if (isFirebaseConfigured) stopAuth = watchAuth(handleAuth)
})
onUnmounted(() => {
  window.removeEventListener('popstate', handleHistoryNavigation)
  stopAuth?.()
  stopReports?.()
  stopFavorites?.()
})
</script>

<template>
  <LoadingScreen v-if="!authReady" />

  <main v-else-if="!isFirebaseConfigured" class="firebase-needed">
    <section class="comic-panel">
      <span>FIREBASE SETUP</span>
      <h1>差最後一小步</h1>
      <p>網站流程已準備好，完成 Firebase Spark 專案與網站設定後即可啟用 Google 登入。</p>
    </section>
  </main>

  <ProfileSetup
    v-else-if="user && (!profile?.profileComplete || isEditingProfile)"
    :user="user"
    :profile="profile"
    :saving="savingProfile"
    :error="profileError"
    :editing="isEditingProfile"
    @save="handleSaveProfile"
    @cancel="cancelProfileEdit"
  />

  <div v-else class="site-shell">
    <AppHeader :profile="profile" :authenticated="Boolean(user)" @home="navigate('home')" @report="navigate('report')" @progress="showProgress(false)" @groups="navigate('groups')" @profile="navigate('profile')" @login="navigate('login')" />
    <main class="view-frame">
      <Transition mode="out-in" :css="false" @enter="enterView" @leave="leaveView">
        <div :key="currentView" class="view-page">
          <HeroSection v-if="currentView==='home'" @report="navigate('report')" @progress="showProgress(false)" />
          <LoginScreen v-else-if="currentView==='login'" :loading="loginBusy" :error="loginError" @login="handleLogin" />
          <QuickReport v-else-if="currentView==='report' && user" :profile="profile" :groups="groups" :submitting="submittingReport" :error="reportError" @submit="handleReport" />
          <EncouragementCard v-else-if="currentView==='encouragement'" :report="latestReport" :favorite-cards="favoriteCards" :favorite-busy="favoriteBusy" :favorite-error="favoriteError" @favorite="handleFavorite" @progress="showProgress(true)" />
          <ProgressDashboard v-else-if="currentView==='progress' && user" :user="user" :profile="profile" :reports="myReports" :groups="groups" :groups-loading="groupsLoading" :latest-report="latestReport" :highlight-latest-update="highlightLatestUpdate" :initial-mode="initialProgressMode" @route="handleProgressRoute" @report="navigate('report')" @groups="openGroupFromProgress" />
          <GroupsPage v-else-if="currentView==='groups' && user" :user="user" :profile="profile" :groups="groups" :loading="groupsLoading" :initial-join-code="pendingJoinCode" :initial-group-id="initialGroupId" :initial-mode="initialGroupMode" @route="handleGroupRoute" @join-code-consumed="clearJoinCode" @refresh="refreshGroups" @report="navigate('report')" />
          <UserProfile v-else :profile="profile" :reports="myReports" :groups="groups" :favorite-cards="favoriteCards" :favorite-busy="favoriteBusy" :favorite-error="favoriteError" @favorite="handleFavorite" @edit="editProfile" @report="navigate('report')" @groups="navigate('groups')" @logout="handleLogout" />
        </div>
      </Transition>
    </main>
    <footer class="footer-strip"><span aria-hidden="true">★</span><strong>福運餅乾大作戰</strong><span aria-hidden="true">♥</span><span>一起累積每一份努力</span></footer>
    <LoginPrompt v-if="loginPromptOpen" :destination-label="pendingDestinationLabel" @close="loginPromptOpen=false" @login="openLoginPage" />
  </div>
</template>

<style scoped>
.site-shell{min-height:100vh}.view-frame{overflow:hidden;perspective:1200px}.view-page{min-height:calc(100vh - 86px);transform-origin:top center}.footer-strip{display:flex;flex-wrap:wrap;justify-content:center;gap:12px 20px;padding:18px 16px;border-top:var(--stroke-heavy) solid var(--ink);background:var(--yellow);font-family:var(--font-display);font-weight:900;text-align:center}.firebase-needed{min-height:100svh;display:grid;place-items:center;padding:20px;background:var(--blue)}.firebase-needed section{width:min(560px,100%);padding:42px;text-align:center}.firebase-needed span{display:inline-block;padding:5px 10px;border:3px solid var(--ink);border-radius:999px;background:var(--yellow);font-weight:1000}.firebase-needed h1{margin:16px 0 8px;font-family:var(--font-display);font-size:clamp(2.2rem,7vw,3.8rem)}.firebase-needed p{font-weight:800;line-height:1.7}
.view-page{min-height:0}
</style>
