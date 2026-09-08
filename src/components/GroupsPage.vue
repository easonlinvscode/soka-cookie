<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import LuckyCookieJar from './LuckyCookieJar.vue'
import phoenixChick from '../assets/characters/phoenix-chick-final.png'
import littleLion from '../assets/characters/little-lion-final.png'
import luckyBear from '../assets/characters/lucky-bear-final.png'
import {
  createGroup,
  getGroupDetails,
  getInvitationSettings,
  getInvitePreview,
  joinGroupByCode,
  removeGroupMember,
  setGroupInvitationActive,
  updateGroup,
  updateGroupStatus,
} from '../services/firebaseService.js'

const props = defineProps({
  user: { type: Object, required: true },
  profile: { type: Object, required: true },
  groups: { type: Array, default: () => [] },
  loading: Boolean,
  initialJoinCode: { type: String, default: '' },
  initialGroupId: { type: String, default: '' },
  initialMode: { type: String, default: 'list' },
})
const emit = defineEmits(['refresh', 'report', 'route', 'join-code-consumed', 'initial-group-consumed'])
const mode = ref('list')
const busy = ref(false)
const error = ref('')
const message = ref('')
const selected = ref(null)
const details = reactive({ members: [], contributions: [] })
const joinCode = ref('')
const joinPreview = ref(null)
const invitationActive = ref(false)
const qrDataUrl = ref('')
const confirmAction = ref(null)
const today = new Date().toISOString().slice(0, 10)
const createForm = reactive({ name: '', description: '', targetType: 'chants', targetValue: '', endDate: today })
const editForm = reactive({ name: '', description: '', targetType: 'chants', targetValue: '', endDate: today })
const editing = ref(false)
const companionOptions = [
  { src: littleLion, name: '小獅子' },
  { src: luckyBear, name: '幸運小熊' },
  { src: phoenixChick, name: '小鳳雛' },
]
const groupCompanion = companionOptions[Math.floor(Math.random() * companionOptions.length)]

const createdGroups = computed(() => props.groups.filter((group) => group.ownerId === props.user.uid))
const joinedGroups = computed(() => props.groups.filter((group) => group.ownerId !== props.user.uid))
const isOwner = computed(() => selected.value?.ownerId === props.user.uid)
const isExpired = computed(() => selected.value?.status !== 'active' || (selected.value?.endDate?.toDate && selected.value.endDate.toDate() < new Date()))
const unitKey = computed(() => selected.value?.targetType === 'minutes' ? 'minutes' : 'chants')
const unitLabel = computed(() => unitKey.value === 'minutes' ? '分鐘' : '遍')
const total = computed(() => details.contributions.reduce((sum, item) => sum + Number(item[unitKey.value] || 0), 0))
const percentage = computed(() => selected.value ? Math.min(100, Math.round(total.value / Math.max(1, Number(selected.value.targetValue || 1)) * 100)) : 0)
const myContribution = computed(() => details.contributions.filter((item) => item.userId === props.user.uid).reduce((sum, item) => sum + Number(item[unitKey.value] || 0), 0))
const shareLink = computed(() => selected.value ? window.location.origin + import.meta.env.BASE_URL + '?join=' + selected.value.inviteCode : '')
const leaderboard = computed(() => {
  const members = new Map(details.members.map((member) => [member.id, member]))
  const scores = new Map()
  details.contributions.forEach((item) => scores.set(item.userId, (scores.get(item.userId) || 0) + Number(item[unitKey.value] || 0)))
  details.members.forEach((member) => { if (!scores.has(member.id)) scores.set(member.id, 0) })
  return [...scores.entries()]
    .map(([userId, amount]) => ({ userId, amount, name: members.get(userId)?.displayName || '已離開成員', active: members.has(userId) }))
    .sort((a, b) => b.amount - a.amount)
})

function resetFeedback() { error.value = ''; message.value = '' }
function setMode(nextMode) {
  mode.value = nextMode
  editing.value = false
  if (nextMode === 'list') selected.value = null
  emit('route', { mode: nextMode })
}
function closeDetail() { setMode('list') }
function showDetail() {
  editing.value = false
  mode.value = 'detail'
  emit('route', { mode: 'detail', groupId: selected.value?.id })
}
function formatDate(timestamp) { return timestamp?.toDate ? timestamp.toDate().toLocaleDateString('zh-TW') : '' }
function dateInput(timestamp) {
  if (!timestamp?.toDate) return today
  const date = timestamp.toDate()
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}
function statusLabel(group) {
  if (group.status === 'archived') return '已封存'
  if (group.status === 'ended' || (group.endDate?.toDate && group.endDate.toDate() < new Date())) return '已結束'
  return '進行中'
}

async function handleCreate() {
  resetFeedback()
  if (createForm.name.trim().length < 2 || createForm.description.trim().length < 2 || !createForm.endDate) {
    error.value = '請完整填寫群組名稱、挑戰內容與完成日期。'; return
  }
  busy.value = true
  try {
    const result = await createGroup(props.user, props.profile, createForm)
    message.value = '群組建立完成，邀請碼是 ' + result.inviteCode
    await emit('refresh')
    setMode('list')
    Object.assign(createForm, { name: '', description: '', targetType: 'chants', targetValue: '', endDate: today })
  } catch (reason) { error.value = reason.message || '建立群組失敗。' }
  finally { busy.value = false }
}

async function previewCode(rawCode = joinCode.value) {
  resetFeedback()
  busy.value = true
  joinPreview.value = null
  try {
    joinCode.value = rawCode.trim().toUpperCase()
    joinPreview.value = await getInvitePreview(joinCode.value)
  } catch (reason) { error.value = reason.message || '讀取邀請失敗，請確認邀請碼。' }
  finally { busy.value = false }
}

async function confirmJoin() {
  resetFeedback(); busy.value = true
  try {
    const groupId = await joinGroupByCode(props.user, props.profile, joinCode.value)
    await emit('refresh')
    emit('join-code-consumed')
    joinPreview.value = null
    joinCode.value = ''
    await openGroup({ id: groupId })
    message.value = '已加入群組！'
  } catch (reason) { error.value = reason.message || '加入群組失敗，請確認邀請碼。' }
  finally { busy.value = false }
}

async function generateQr() {
  if (!shareLink.value) return
  const { default: QRCode } = await import('qrcode')
  qrDataUrl.value = await QRCode.toDataURL(shareLink.value, { width: 220, margin: 1, color: { dark: '#24160e', light: '#fff9e9' } })
}

async function openGroup(group, updateRoute = true) {
  resetFeedback(); busy.value = true
  try {
    const result = await getGroupDetails(group.id)
    selected.value = result.group
    details.members = result.members
    details.contributions = result.contributions
    const invitation = await getInvitationSettings(result.group.inviteCode)
    invitationActive.value = Boolean(invitation?.active)
    mode.value = 'detail'
    editing.value = false
    await nextTick()
    await generateQr()
    if (props.initialMode === 'edit' && !updateRoute) beginEdit(false)
    else if (updateRoute) emit('route', { mode: 'detail', groupId: result.group.id })
  } catch (reason) { error.value = reason.message || '讀取群組失敗。' }
  finally { busy.value = false }
}

function beginEdit(updateRoute = true) {
  Object.assign(editForm, {
    name: selected.value.name,
    description: selected.value.description,
    targetType: selected.value.targetType,
    targetValue: selected.value.targetValue,
    endDate: dateInput(selected.value.endDate),
  })
  editing.value = true
  if (updateRoute) emit('route', { mode: 'edit', groupId: selected.value.id })
}

async function saveEdit() {
  resetFeedback(); busy.value = true
  try {
    await updateGroup(props.user, selected.value, editForm)
    await emit('refresh')
    editing.value = false
    await openGroup(selected.value, false)
    message.value = '群組設定已更新。'
    emit('route', { mode: 'detail', groupId: selected.value.id })
  } catch (reason) { error.value = reason.message || '更新群組失敗。' }
  finally { busy.value = false }
}

async function copyText(value, success) {
  await navigator.clipboard?.writeText(value)
  message.value = success
}

async function shareInvitation() {
  if (navigator.share) {
    await navigator.share({ title: selected.value.name, text: '邀請你加入「' + selected.value.name + '」唱題挑戰', url: shareLink.value })
  } else {
    await copyText(shareLink.value, '邀請連結已複製。')
  }
}

async function toggleInvitation() {
  resetFeedback(); busy.value = true
  try {
    await setGroupInvitationActive(props.user, selected.value, !invitationActive.value)
    invitationActive.value = !invitationActive.value
    message.value = invitationActive.value ? '群組邀請已重新開啟。' : '群組邀請已關閉。'
  } catch (reason) { error.value = reason.message || '邀請設定更新失敗。' }
  finally { busy.value = false }
}

async function runConfirmedAction() {
  const action = confirmAction.value
  if (!action) return
  resetFeedback(); busy.value = true
  try {
    let successMessage = ''
    if (action.type === 'remove') {
      await removeGroupMember(props.user, selected.value, action.member.id)
      successMessage = action.member.displayName + ' 已移出群組。'
    } else {
      await updateGroupStatus(props.user, selected.value, action.type)
      successMessage = action.type === 'ended' ? '群組挑戰已提前結束。' : '群組已封存。'
    }
    confirmAction.value = null
    await emit('refresh')
    await openGroup(selected.value)
    message.value = successMessage
  } catch (reason) { error.value = reason.message || '群組操作失敗。' }
  finally { busy.value = false }
}

watch(() => props.initialJoinCode, (code) => {
  if (!code) return
  mode.value = 'join'
  previewCode(code)
}, { immediate: true })

watch(() => props.initialMode, (nextMode) => {
  if (['list', 'create', 'join'].includes(nextMode)) {
    mode.value = nextMode
    editing.value = false
    if (nextMode === 'list') selected.value = null
    return
  }
  if (nextMode === 'detail' && selected.value) {
    mode.value = 'detail'
    editing.value = false
  }
  if (nextMode === 'edit' && selected.value) beginEdit(false)
}, { immediate: true })

watch(() => props.initialGroupId, async (groupId) => {
  if (!groupId) return
  if (selected.value?.id === groupId) {
    mode.value = 'detail'
    if (props.initialMode === 'edit') beginEdit(false)
    emit('initial-group-consumed')
    return
  }
  try {
    await openGroup({ id: groupId }, false)
  } finally {
    emit('initial-group-consumed')
  }
}, { immediate: true })
</script>

<template>
  <section class="groups-page">
    <div class="groups-wrap">
      <header class="page-heading">
        <span>COOKIE TEAM</span><h1>群組挑戰</h1>
        <p>和夥伴一起設定目標，每次回報時自由選擇要計入的群組。</p>
      </header>

      <p v-if="message" class="notice success" role="status">{{ message }}</p>
      <p v-if="error" class="notice error" role="alert">{{ error }}</p>

      <div v-if="mode === 'list'" class="group-layout">
        <aside class="group-actions comic-panel">
          <h2>開始一個挑戰</h2>
          <button class="comic-button" type="button" @click="resetFeedback();setMode('create')">＋ 建立群組</button>
          <button class="comic-button secondary" type="button" @click="resetFeedback();joinPreview=null;setMode('join')">輸入邀請碼</button>
        </aside>
        <div class="group-lists">
          <section class="group-section comic-panel">
            <h2>我建立的群組 <span>{{ createdGroups.length }}</span></h2>
            <div v-if="createdGroups.length" class="cards">
              <button v-for="group in createdGroups" :key="group.id" type="button" @click="openGroup(group)">
                <strong>{{ group.name }}</strong><small>{{ statusLabel(group) }} · {{ formatDate(group.endDate) }} 完成</small>
              </button>
            </div>
            <p v-else class="empty">還沒有建立群組。</p>
          </section>
          <section class="group-section comic-panel">
            <h2>我加入的群組 <span>{{ joinedGroups.length }}</span></h2>
            <div v-if="joinedGroups.length" class="cards">
              <button v-for="group in joinedGroups" :key="group.id" type="button" @click="openGroup(group)">
                <strong>{{ group.name }}</strong><small>{{ statusLabel(group) }} · {{ formatDate(group.endDate) }} 完成</small>
              </button>
            </div>
            <p v-else class="empty">尚未加入任何群組。</p>
          </section>
        </div>
      </div>

      <article v-else-if="mode === 'create'" class="form-card comic-panel">
        <button class="back" type="button" @click="setMode('list')">← 返回群組</button>
        <h2>建立新群組</h2>
        <form @submit.prevent="handleCreate">
          <label>群組名稱<input v-model="createForm.name" maxlength="30" placeholder="例如：幸福前進隊"></label>
          <label>挑戰內容<textarea v-model="createForm.description" maxlength="160" rows="3" placeholder="寫下大家要一起完成的挑戰"></textarea></label>
          <fieldset>
            <legend>目標單位</legend>
            <div class="target-tabs">
              <label :class="{active:createForm.targetType==='chants'}">
                <input v-model="createForm.targetType" type="radio" name="create-target-type" value="chants">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-copy"><strong>遍數</strong><small>以唱題遍數累積</small></span>
              </label>
              <label :class="{active:createForm.targetType==='minutes'}">
                <input v-model="createForm.targetType" type="radio" name="create-target-type" value="minutes">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-copy"><strong>分鐘數</strong><small>以唱題時間累積</small></span>
              </label>
            </div>
          </fieldset>
          <label>目標數量<input v-model.number="createForm.targetValue" type="number" min="1" step="1" inputmode="numeric" placeholder="請輸入正整數"></label>
          <label>完成日期<input v-model="createForm.endDate" type="date" :min="today"></label>
          <button class="comic-button pink" type="submit" :disabled="busy">{{ busy ? '建立中…' : '建立群組並產生邀請碼' }}</button>
        </form>
      </article>

      <article v-else-if="mode === 'join'" class="form-card compact comic-panel">
        <button class="back" type="button" @click="joinPreview=null;emit('join-code-consumed');setMode('list')">← 返回群組</button>
        <h2>加入群組</h2>
        <form v-if="!joinPreview" @submit.prevent="previewCode()">
          <label>邀請碼<input v-model="joinCode" maxlength="8" autocomplete="off" placeholder="例如：ABC234XY" @input="joinCode=joinCode.toUpperCase()"></label>
          <button class="comic-button" type="submit" :disabled="busy || joinCode.length !== 8">{{ busy ? '驗證中…' : '查看群組' }}</button>
        </form>
        <div v-else class="join-preview">
          <span>邀請你加入</span><h3>{{ joinPreview.name }}</h3><p>{{ joinPreview.description }}</p>
          <div><strong>挑戰目標</strong><span>{{ joinPreview.targetValue.toLocaleString() }} {{ joinPreview.targetType==='minutes'?'分鐘':'遍' }}</span></div>
          <div><strong>完成日期</strong><span>{{ formatDate(joinPreview.endDate) }}</span></div>
          <div class="join-actions"><button class="comic-button secondary" type="button" @click="joinPreview=null">重新輸入</button><button class="comic-button" type="button" :disabled="busy" @click="confirmJoin">確認加入</button></div>
        </div>
      </article>

      <article v-else-if="selected" class="detail-card comic-panel">
        <template v-if="!editing">
          <div class="detail-toolbar">
            <button class="back" type="button" @click="closeDetail">← 返回群組</button>
            <button v-if="isOwner && !isExpired" class="edit-button" type="button" @click="beginEdit">修改設定</button>
          </div>
          <div class="detail-title"><h2>{{ selected.name }}</h2><span :class="{expired:isExpired}">{{ statusLabel(selected) }}</span></div>
          <p class="description">{{ selected.description }}</p>
          <div class="group-overview">
            <div class="group-jar-stage">
              <LuckyCookieJar
                :value="total"
                :target="Number(selected.targetValue || 1)"
                :variant-key="`group-${selected.id}`"
                :unit-label="unitLabel"
              />
              <img class="group-jar-companion" :src="groupCompanion.src" :alt="`${groupCompanion.name}在餅乾罐旁替群組加油`">
            </div>
            <div class="group-overview-copy">
              <div class="detail-stats"><div><span>完成日期</span><strong>{{ formatDate(selected.endDate) }}</strong></div><div><span>我的貢獻</span><strong>{{ myContribution.toLocaleString() }} {{ unitLabel }}</strong></div><div><span>成員人數</span><strong>{{ details.members.length }} 人</strong></div></div>
              <div class="group-meter progress-breathe"><i :style="{width:percentage+'%'}"></i></div>
              <div class="meter-copy"><strong>{{ total.toLocaleString() }}／{{ selected.targetValue.toLocaleString() }} {{ unitLabel }}</strong><span>{{ percentage }}%</span></div>
            </div>
          </div>

          <section class="leaderboard">
            <h3>成員貢獻排行</h3>
            <ol><li v-for="(member,index) in leaderboard" :key="member.userId" :class="{mine:member.userId===user.uid,inactive:!member.active}"><span class="rank">{{ index+1 }}</span><strong>{{ member.name }}</strong><span>{{ member.amount.toLocaleString() }} {{ unitLabel }}</span></li></ol>
          </section>

          <section v-if="!isExpired" class="invitation-panel">
            <div class="invite-copy"><span>邀請碼</span><strong>{{ selected.inviteCode }}</strong><small>{{ invitationActive ? '邀請開放中' : '邀請已關閉' }}</small></div>
            <img v-if="qrDataUrl && invitationActive" :src="qrDataUrl" alt="群組邀請 QR Code">
            <div class="invite-actions">
              <button type="button" :disabled="!invitationActive" @click="copyText(selected.inviteCode,'邀請碼已複製。')">複製代碼</button>
              <button type="button" :disabled="!invitationActive" @click="copyText(shareLink,'邀請連結已複製。')">複製連結</button>
              <button type="button" :disabled="!invitationActive" @click="shareInvitation">分享邀請</button>
            </div>
          </section>

          <section v-if="isOwner" class="owner-panel">
            <h3>群主管理</h3>
            <div class="owner-actions">
              <button v-if="!isExpired" type="button" @click="toggleInvitation">{{ invitationActive ? '關閉邀請' : '重新開啟邀請' }}</button>
              <button v-if="selected.status==='active'" type="button" @click="confirmAction={type:'ended'}">提前結束</button>
              <button v-if="selected.status!=='archived'" type="button" @click="confirmAction={type:'archived'}">封存群組</button>
            </div>
            <h4>成員管理</h4>
            <div class="member-management"><div v-for="member in details.members" :key="member.id"><span>{{ member.displayName }}<small>{{ member.role==='owner'?'建立者':'成員' }}</small></span><button v-if="member.id!==user.uid" type="button" @click="confirmAction={type:'remove',member}">移除</button></div></div>
          </section>

          <div v-if="confirmAction" class="confirm-box">
            <p v-if="confirmAction.type==='remove'">確定要將「{{ confirmAction.member.displayName }}」移出群組嗎？過去的貢獻會保留。</p>
            <p v-else-if="confirmAction.type==='ended'">確定提前結束挑戰？結束後不再接受新的群組回報。</p>
            <p v-else>確定封存群組？內容仍會保留查看。</p>
            <button type="button" @click="confirmAction=null">取消</button><button class="danger" type="button" :disabled="busy" @click="runConfirmedAction">確定</button>
          </div>
          <button v-if="!isExpired" class="comic-button pink" type="button" @click="$emit('report')">前往回報</button>
          <p v-else class="readonly">群組已結束，內容會保留查看，但不再接受新的群組回報。</p>
        </template>
        <form v-else class="edit-form" @submit.prevent="saveEdit">
          <button class="back" type="button" @click="showDetail">← 返回群組內容</button>
          <h2>修改群組設定</h2>
          <label>群組名稱<input v-model="editForm.name" maxlength="30"></label>
          <label>挑戰內容<textarea v-model="editForm.description" maxlength="160" rows="3"></textarea></label>
          <fieldset>
            <legend>目標單位</legend>
            <div class="target-tabs">
              <label :class="{active:editForm.targetType==='chants'}">
                <input v-model="editForm.targetType" type="radio" name="edit-target-type" value="chants">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-copy"><strong>遍數</strong><small>以唱題遍數累積</small></span>
              </label>
              <label :class="{active:editForm.targetType==='minutes'}">
                <input v-model="editForm.targetType" type="radio" name="edit-target-type" value="minutes">
                <span class="target-check" aria-hidden="true"></span>
                <span class="target-copy"><strong>分鐘數</strong><small>以唱題時間累積</small></span>
              </label>
            </div>
          </fieldset>
          <label>目標數量<input v-model.number="editForm.targetValue" type="number" min="1" step="1"></label>
          <label>完成日期<input v-model="editForm.endDate" type="date" :min="today"></label>
          <div class="edit-actions"><button class="comic-button secondary" type="button" @click="showDetail">取消</button><button class="comic-button" type="submit" :disabled="busy">儲存修改</button></div>
        </form>
      </article>
    </div>
  </section>
</template>

<style scoped>
.groups-page{min-height:calc(100svh - 86px);padding:28px 0 65px;background-color:var(--blue);background-image:radial-gradient(rgba(255,255,255,.32) 3px,transparent 3px);background-size:30px 30px}.groups-wrap{width:min(1050px,calc(100% - 24px));margin:auto}.page-heading{text-align:center}.page-heading>span{display:inline-block;padding:5px 12px;border:3px solid var(--ink);border-radius:999px;background:var(--yellow);font-weight:1000}.page-heading h1{margin:10px 0 5px;font-family:var(--font-display);font-size:clamp(2.2rem,6vw,3.7rem)}.page-heading p{margin:0 auto 24px;max-width:620px;font-weight:800}.group-layout{display:grid;grid-template-columns:280px 1fr;align-items:start;gap:18px}.group-actions,.group-section,.form-card,.detail-card{padding:24px;border-radius:28px}.group-actions{display:grid;gap:13px;position:sticky;top:12px}.group-actions h2,.group-section h2{margin:0 0 5px;font-family:var(--font-display)}.group-lists{display:grid;gap:18px}.group-section h2{display:flex;justify-content:space-between}.group-section h2 span{display:grid;place-items:center;width:32px;height:32px;border:2px solid var(--ink);border-radius:50%;background:var(--yellow);font-size:.9rem}.cards{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:14px}.cards button{min-height:78px;padding:12px;border:3px solid var(--ink);border-radius:15px;background:white;box-shadow:3px 3px 0 var(--ink);text-align:left;cursor:pointer}.cards strong,.cards small{display:block}.cards small{margin-top:5px;color:var(--muted);font-size:.75rem}.empty{color:var(--muted);font-weight:800}.form-card,.detail-card{width:min(820px,100%);margin:auto}.form-card.compact{width:min(580px,100%)}.back,.edit-button{padding:7px 11px;border:2px solid var(--ink);border-radius:999px;background:white;font-weight:900;cursor:pointer}.form-card h2,.detail-card h2{margin:18px 0;font-family:var(--font-display);font-size:clamp(1.8rem,5vw,2.7rem)}form{display:grid;gap:18px}form label,legend{display:grid;gap:7px;font-weight:1000}form input,form textarea{width:100%;padding:11px 13px;border:3px solid var(--ink);border-radius:13px;background:white;font:inherit;font-weight:800}fieldset{margin:0;padding:0;border:0}.target-tabs{display:grid;grid-template-columns:1fr 1fr;gap:10px}.target-tabs label{display:flex;justify-content:center;padding:11px;border:3px solid var(--ink);border-radius:999px;background:white}.notice{width:min(820px,100%);margin:0 auto 16px;padding:11px 15px;border:3px solid var(--ink);border-radius:14px;font-weight:900}.notice.success{background:var(--yellow)}.notice.error{background:#ffe1ea;color:#9d003b}.detail-title{display:flex;justify-content:space-between;align-items:flex-start;gap:15px}.detail-title span{display:inline-block;padding:4px 9px;border:2px solid var(--ink);border-radius:999px;background:var(--green);color:white;font-size:.8rem;font-weight:1000}.detail-title span.expired{background:var(--muted)}.description{font-weight:800;line-height:1.7}.group-meter{height:28px;margin-top:22px;overflow:hidden;border:4px solid var(--ink);border-radius:999px;background:white}.group-meter i{display:block;height:100%;background:repeating-linear-gradient(135deg,var(--pink) 0 12px,var(--yellow) 12px 24px)}.meter-copy{display:flex;justify-content:space-between;margin-top:7px}.meter-copy span{color:var(--pink);font-weight:1000}.detail-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:22px}.detail-stats div{padding:12px;border:3px solid var(--ink);border-radius:14px;background:white}.detail-stats span,.detail-stats strong{display:block}.detail-stats span{color:var(--muted);font-size:.78rem}.leaderboard,.owner-panel,.invitation-panel{margin:22px 0;padding:18px;border:3px solid var(--ink);border-radius:18px;background:#fff3b3}.leaderboard h3,.owner-panel h3{margin:0 0 12px;font-family:var(--font-display)}.leaderboard ol{display:grid;gap:7px;margin:0;padding:0;list-style:none}.leaderboard li{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:10px;padding:9px 11px;border:2px solid var(--ink);border-radius:12px;background:white}.leaderboard li.mine{background:var(--yellow)}.leaderboard li.inactive{opacity:.62}.rank{display:grid;place-items:center;width:30px;height:30px;border:2px solid var(--ink);border-radius:50%;background:var(--blue);font-weight:1000}.invitation-panel{display:grid;grid-template-columns:1fr auto;align-items:center;gap:16px}.invite-copy span,.invite-copy strong,.invite-copy small{display:block}.invite-copy strong{margin:4px 0;font-family:monospace;font-size:1.55rem;letter-spacing:.1em}.invite-copy small{color:var(--muted);font-weight:800}.invitation-panel img{width:150px;border:3px solid var(--ink);border-radius:12px;background:white}.invite-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}.invite-actions button,.owner-actions button,.member-management button,.confirm-box button{padding:8px 11px;border:2px solid var(--ink);border-radius:999px;background:white;font-weight:900;cursor:pointer}.invite-actions button:disabled{opacity:.4}.owner-actions{display:flex;flex-wrap:wrap;gap:8px}.owner-panel h4{margin:20px 0 8px}.member-management{display:grid;gap:7px}.member-management>div{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 11px;border:2px solid var(--ink);border-radius:12px;background:white}.member-management small{margin-left:8px;color:var(--muted)}.member-management button{color:var(--pink)}.confirm-box{margin:18px 0;padding:14px;border:3px dashed var(--ink);border-radius:16px;background:#ffe1ea;text-align:right}.confirm-box p{text-align:left;font-weight:900}.confirm-box button{margin-left:8px}.confirm-box .danger{background:var(--pink);color:white}.join-preview>span{display:inline-block;padding:4px 9px;border:2px solid var(--ink);border-radius:999px;background:var(--blue);font-weight:900}.join-preview h3{margin:14px 0 8px;font-family:var(--font-display);font-size:2rem}.join-preview>div:not(.join-actions){display:flex;justify-content:space-between;margin-top:10px;padding:11px;border:2px solid var(--ink);border-radius:12px;background:white}.join-actions{display:flex;gap:10px;margin-top:20px}.join-actions button{flex:1}.readonly{padding:12px;border:3px dashed var(--ink);border-radius:14px;background:#eee2d0;font-weight:800}.edit-actions{display:flex;justify-content:flex-end;gap:12px}
.target-tabs label{position:relative;align-items:center;justify-content:flex-start;gap:12px;min-height:72px;padding:11px 14px;cursor:pointer;transition:background .18s ease,transform .18s ease,box-shadow .18s ease}.target-tabs input{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none}.target-check{display:grid;flex:0 0 auto;width:27px;height:27px;border:3px solid var(--ink);border-radius:50%;background:white}.target-tabs label.active{background:var(--yellow);box-shadow:4px 4px 0 var(--ink);transform:translate(-2px,-2px)}.target-tabs label.active .target-check::after{content:'';width:13px;height:13px;margin:auto;border-radius:50%;background:var(--pink)}.target-tabs label:focus-within{outline:none;box-shadow:inset 0 0 0 3px var(--blue),4px 4px 0 var(--ink)}.target-copy{display:grid;gap:2px}.target-copy strong{font-family:var(--font-display);font-size:1.05rem}.target-copy small{color:var(--muted);font-size:.76rem}.detail-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px}.detail-title{justify-content:flex-start;align-items:center}.detail-title h2{margin-right:10px}.group-overview{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(330px,1.1fr);align-items:center;gap:24px;margin:16px 0 8px}.group-jar-stage{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;min-width:0}.group-jar-stage :deep(.cookie-jar){width:min(100%,250px)}.group-jar-companion{position:relative;width:90px;margin:0 0 20px 6px;filter:drop-shadow(5px 7px 0 rgba(32,22,15,.82));transform-origin:50% 90%;animation:group-companion-bob 1.8s ease-in-out infinite alternate}.group-overview-copy{min-width:0}.group-overview-copy .detail-stats{margin-top:0}.group-overview-copy .group-meter{margin-top:16px}@keyframes group-companion-bob{to{transform:translateY(-10px) rotate(3deg)}}
@media(max-width:760px){.groups-page{min-height:calc(100svh - 72px)}.group-layout{grid-template-columns:1fr}.group-actions{position:static}.cards{grid-template-columns:1fr}.group-overview{grid-template-columns:1fr}.group-jar-stage{width:min(360px,100%);margin:auto}.detail-stats{grid-template-columns:1fr}.detail-title{align-items:center}.invitation-panel{grid-template-columns:1fr;text-align:center}.invitation-panel img{justify-self:center}.invite-actions{justify-content:center}.leaderboard li{grid-template-columns:34px 1fr auto}.edit-actions{flex-direction:column-reverse}.edit-actions button{width:100%}}
@media(max-width:500px){.group-jar-stage :deep(.cookie-jar){width:min(100%,225px)}.group-jar-companion{width:74px;margin-bottom:16px}.leaderboard,.owner-panel,.invitation-panel{padding:13px}.leaderboard li{grid-template-columns:30px 1fr}.leaderboard li>span:last-child{grid-column:2}.join-actions{flex-direction:column}.detail-card{padding:18px}}
@media(prefers-reduced-motion:reduce){.group-jar-companion{animation:none}}
.groups-page{min-height:calc(100svh - 152px);padding-top:18px;padding-bottom:32px}.page-heading h1{margin-top:8px}.page-heading p{margin-bottom:16px}.group-actions{top:98px}
.edit-form>.back{justify-self:start;width:max-content;max-width:100%}
.edit-form fieldset>legend{margin-bottom:10px}.edit-form .target-tabs{width:min(580px,100%)}.edit-form .target-tabs label{min-height:56px;padding:7px 12px;gap:10px}.edit-form .target-check{width:24px;height:24px}.edit-form .target-tabs label.active .target-check::after{width:11px;height:11px}
@media(max-width:760px){.groups-page{min-height:calc(100svh - 136px);padding-top:12px;padding-bottom:24px}.group-actions{top:auto}}
.group-jar-stage{grid-template-columns:minmax(0,1fr) minmax(0,250px) minmax(0,1fr);column-gap:8px}.group-jar-stage :deep(.cookie-jar){grid-column:2;width:100%}.group-jar-companion{grid-column:1;grid-row:1;justify-self:end;width:78px;margin-right:0}
@media(max-width:500px){.group-jar-stage{grid-template-columns:minmax(0,1fr) minmax(0,210px) minmax(0,1fr)}.group-jar-stage :deep(.cookie-jar){width:100%}.group-jar-companion{width:58px}}
</style>
