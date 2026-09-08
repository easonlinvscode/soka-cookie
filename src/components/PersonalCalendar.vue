<script setup>
import { computed, reactive, ref } from 'vue'
import { REPORT_EDIT_WINDOW_MS, updateReport, withdrawReport } from '../services/firebaseService.js'

const props = defineProps({
  user: { type: Object, required: true },
  profile: { type: Object, required: true },
  reports: { type: Array, default: () => [] },
  groups: { type: Array, default: () => [] },
})

const weekdays = ['一', '二', '三', '四', '五', '六', '日']
const today = new Date()
const calendarMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const periodMode = ref('month')
const selectedDateKey = ref(dateKey(today))
const customStart = ref(dateKey(new Date(today.getFullYear(), today.getMonth(), 1)))
const customEnd = ref(dateKey(today))
const editingReport = ref(null)
const withdrawingId = ref('')
const busy = ref(false)
const message = ref('')
const error = ref('')
const editForm = reactive({ unit: 'minutes', amount: '', groupIds: [] })

function timestampToDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateKey(value) {
  const date = value instanceof Date ? value : timestampToDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfWeek(value) {
  const date = new Date(value.getFullYear(), value.getMonth(), value.getDate())
  const offset = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - offset)
  return date
}

function endOfDay(value) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

function formatTime(value) {
  const date = timestampToDate(value)
  return date ? date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false }) : ''
}

const calendarLabel = computed(() => `${calendarMonth.value.getFullYear()} 年 ${calendarMonth.value.getMonth() + 1} 月`)
const dailyMap = computed(() => {
  const map = new Map()
  props.reports.forEach((report) => {
    const key = dateKey(report.createdAt)
    if (!key) return
    if (!map.has(key)) map.set(key, { minutes: 0, chants: 0, reports: [] })
    const day = map.get(key)
    day.minutes += Number(report.minutes || 0)
    day.chants += Number(report.chants || 0)
    day.reports.push(report)
  })
  return map
})

const calendarDays = computed(() => {
  const year = calendarMonth.value.getFullYear()
  const month = calendarMonth.value.getMonth()
  const first = new Date(year, month, 1)
  const start = new Date(year, month, 1 - ((first.getDay() + 6) % 7))
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    const key = dateKey(date)
    return {
      date,
      key,
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      today: key === dateKey(today),
      future: date > endOfDay(today),
      stats: dailyMap.value.get(key),
    }
  })
})

const periodRange = computed(() => {
  if (periodMode.value === 'week') {
    const start = startOfWeek(today)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start, end: endOfDay(end), label: '本週累積' }
  }
  if (periodMode.value === 'custom') {
    const start = customStart.value ? new Date(`${customStart.value}T00:00:00`) : new Date(0)
    const end = customEnd.value ? endOfDay(new Date(`${customEnd.value}T00:00:00`)) : endOfDay(today)
    return { start, end, label: '自訂期間累積' }
  }
  const start = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth(), 1)
  const end = endOfDay(new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + 1, 0))
  return { start, end, label: `${calendarMonth.value.getMonth() + 1} 月累積` }
})

const periodReports = computed(() => props.reports.filter((report) => {
  const date = timestampToDate(report.createdAt)
  return date && date >= periodRange.value.start && date <= periodRange.value.end
}))
const periodMinutes = computed(() => periodReports.value.reduce((sum, item) => sum + Number(item.minutes || 0), 0))
const periodChants = computed(() => periodReports.value.reduce((sum, item) => sum + Number(item.chants || 0), 0))
const periodDays = computed(() => new Set(periodReports.value.map((item) => dateKey(item.createdAt))).size)
const currentStreak = computed(() => {
  const active = new Set(props.reports.map((item) => dateKey(item.createdAt)).filter(Boolean))
  if (!active.size) return 0
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (!active.has(dateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (active.has(dateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
})
const selectedDay = computed(() => dailyMap.value.get(selectedDateKey.value) || { minutes: 0, chants: 0, reports: [] })
const selectedReports = computed(() => [...selectedDay.value.reports].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
const activeGroups = computed(() => props.groups.filter((group) => group.status === 'active' && (!group.endDate?.toDate || group.endDate.toDate() >= new Date())))
const availableEditGroups = computed(() => props.groups.filter((group) => activeGroups.value.some((item) => item.id === group.id) || editForm.groupIds.includes(group.id)))

function changeMonth(step) {
  calendarMonth.value = new Date(calendarMonth.value.getFullYear(), calendarMonth.value.getMonth() + step, 1)
  selectedDateKey.value = dateKey(calendarMonth.value)
}

function selectDay(day) {
  if (day.future) return
  selectedDateKey.value = day.key
}

function canEdit(report) {
  const createdAt = timestampToDate(report.createdAt)
  return Boolean(createdAt && Date.now() - createdAt.getTime() <= REPORT_EDIT_WINDOW_MS)
}

function beginEdit(report) {
  message.value = ''
  error.value = ''
  withdrawingId.value = ''
  editingReport.value = report
  const joinedGroupIds = new Set(props.groups.map((group) => group.id))
  Object.assign(editForm, {
    unit: report.sourceUnit || 'minutes',
    amount: report.sourceAmount || (report.sourceUnit === 'chants' ? report.chants : report.minutes),
    groupIds: (report.groupIds || []).filter((groupId) => joinedGroupIds.has(groupId)),
  })
}

async function saveEdit() {
  const amount = Number(editForm.amount)
  if (!Number.isInteger(amount) || amount <= 0) { error.value = '請輸入大於 0 的整數。'; return }
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    await updateReport(props.user, props.profile, editingReport.value, {
      unit: editForm.unit,
      amount,
      groupIds: [...editForm.groupIds],
    })
    editingReport.value = null
    message.value = '回報已更新，個人與群組進度會一起重新計算。'
  } catch (reason) { error.value = reason.message || '修改回報失敗，請稍後再試。' }
  finally { busy.value = false }
}

async function confirmWithdraw(report) {
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    await withdrawReport(props.user, report)
    withdrawingId.value = ''
    message.value = '這筆回報已撤回。'
  } catch (reason) { error.value = reason.message || '撤回回報失敗，請稍後再試。' }
  finally { busy.value = false }
}
</script>

<template>
  <article class="calendar-panel comic-panel" :class="profile.division">
    <header class="calendar-heading">
      <div><span>CHANTING CALENDAR</span><h2>我的唱題月曆</h2></div>
      <div class="period-tabs" role="tablist" aria-label="統計期間">
        <button v-for="item in [{id:'week',label:'本週'},{id:'month',label:'本月'},{id:'custom',label:'自訂日期'}]" :key="item.id" type="button" :class="{active:periodMode===item.id}" @click="periodMode=item.id">{{ item.label }}</button>
      </div>
    </header>

    <div v-if="periodMode === 'custom'" class="custom-range">
      <label>開始日期<input v-model="customStart" type="date" :max="customEnd || dateKey(today)"></label>
      <span>至</span>
      <label>結束日期<input v-model="customEnd" type="date" :min="customStart" :max="dateKey(today)"></label>
    </div>

    <div class="period-summary">
      <div><span>{{ periodRange.label }}</span><strong>{{ periodMinutes.toLocaleString() }}</strong><small>分鐘</small></div>
      <div><span>{{ periodRange.label }}</span><strong>{{ periodChants.toLocaleString() }}</strong><small>遍</small></div>
      <div><span>回報天數</span><strong>{{ periodDays }}</strong><small>天</small></div>
      <div><span>目前連續</span><strong>{{ currentStreak }}</strong><small>天</small></div>
    </div>

    <div class="month-toolbar">
      <button type="button" aria-label="上一個月" @click="changeMonth(-1)">←</button>
      <h3>{{ calendarLabel }}</h3>
      <button type="button" aria-label="下一個月" @click="changeMonth(1)">→</button>
    </div>
    <div class="weekdays" aria-hidden="true"><span v-for="day in weekdays" :key="day">{{ day }}</span></div>
    <div class="calendar-grid">
      <button v-for="day in calendarDays" :key="day.key" type="button" :disabled="day.future" :class="{outside:!day.inMonth,today:day.today,active:Boolean(day.stats),selected:selectedDateKey===day.key}" :aria-label="`${day.key}${day.stats ? `，${day.stats.chants} 遍，${day.stats.minutes} 分鐘` : '，沒有回報'}`" @click="selectDay(day)">
        <span class="day-number">{{ day.day }}</span>
        <template v-if="day.stats"><strong>{{ day.stats.chants.toLocaleString() }} 遍</strong><small>{{ day.stats.minutes.toLocaleString() }} 分鐘</small></template>
      </button>
    </div>

    <section class="day-detail">
      <header><div><span>單日紀錄</span><h3>{{ selectedDateKey }}</h3></div><div><strong>{{ selectedDay.chants.toLocaleString() }} 遍</strong><small>{{ selectedDay.minutes.toLocaleString() }} 分鐘</small></div></header>
      <p v-if="message" class="feedback success" role="status">{{ message }}</p>
      <p v-if="error" class="feedback error" role="alert">{{ error }}</p>
      <p v-if="!selectedReports.length" class="empty-day">這一天還沒有回報紀錄。</p>
      <div v-else class="report-list">
        <article v-for="report in selectedReports" :key="report.id" class="report-item">
          <template v-if="editingReport?.id !== report.id">
            <div class="report-main"><span>{{ formatTime(report.createdAt) }}</span><strong>{{ report.sourceAmount?.toLocaleString() }} {{ report.sourceUnit === 'chants' ? '遍' : '分鐘' }}</strong><small>換算 {{ report.chants.toLocaleString() }} 遍／{{ report.minutes.toLocaleString() }} 分鐘</small></div>
            <div v-if="canEdit(report)" class="report-actions">
              <button type="button" @click="beginEdit(report)">修改</button>
              <button type="button" class="danger" @click="withdrawingId=report.id">撤回</button>
            </div>
            <span v-else class="locked">已完成</span>
            <div v-if="withdrawingId===report.id" class="withdraw-confirm"><span>確定撤回這筆回報？</span><button type="button" @click="withdrawingId=''">取消</button><button type="button" class="danger" :disabled="busy" @click="confirmWithdraw(report)">確定撤回</button></div>
          </template>
          <form v-else class="edit-report" @submit.prevent="saveEdit">
            <div class="edit-units"><label><input v-model="editForm.unit" type="radio" value="minutes">分鐘</label><label><input v-model="editForm.unit" type="radio" value="chants">遍數</label></div>
            <label>回報數量<input v-model.number="editForm.amount" type="number" min="1" step="1" inputmode="numeric"></label>
            <fieldset v-if="availableEditGroups.length"><legend>計入群組</legend><div class="edit-groups"><label v-for="group in availableEditGroups" :key="group.id"><input v-model="editForm.groupIds" type="checkbox" :value="group.id">{{ group.name }}<small v-if="!activeGroups.some((item)=>item.id===group.id)">（已結束）</small></label></div></fieldset>
            <div class="edit-buttons"><button type="button" @click="editingReport=null">取消</button><button type="submit" :disabled="busy">儲存修改</button></div>
          </form>
        </article>
      </div>
      <p class="edit-note">每筆回報送出後 30 分鐘內可以修改或撤回。</p>
    </section>
  </article>
</template>

<style scoped>
.calendar-panel{margin-top:20px;padding:clamp(18px,4vw,34px);background:#fff9e9}.calendar-heading{display:flex;justify-content:space-between;align-items:end;gap:18px}.calendar-heading>div>span{display:inline-block;padding:4px 9px;border:2px solid var(--ink);border-radius:999px;background:var(--blue);font-size:.76rem;font-weight:1000}.women .calendar-heading>div>span{background:var(--pink);color:white}.calendar-heading h2{margin:8px 0 0;font-family:var(--font-display);font-size:clamp(1.8rem,4vw,2.6rem)}.period-tabs{display:flex;gap:7px}.period-tabs button,.month-toolbar button,.report-actions button,.edit-buttons button,.withdraw-confirm button{padding:8px 12px;border:3px solid var(--ink);border-radius:999px;background:white;font-weight:1000;cursor:pointer}.period-tabs button.active{background:var(--yellow);box-shadow:3px 3px 0 var(--ink)}.custom-range{display:flex;align-items:end;justify-content:center;gap:12px;margin-top:18px;padding:13px;border:3px dashed var(--ink);border-radius:16px;background:#fff3b3}.custom-range label{display:grid;gap:5px;font-weight:900}.custom-range input{padding:8px;border:2px solid var(--ink);border-radius:10px;background:white;font:inherit}.period-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin:20px 0}.period-summary div{padding:12px;border:3px solid var(--ink);border-radius:15px;background:white}.period-summary span,.period-summary strong,.period-summary small{display:block}.period-summary span{color:var(--muted);font-size:.76rem;font-weight:800}.period-summary strong{margin-top:3px;color:var(--pink);font-family:var(--font-display);font-size:1.7rem}.period-summary small{font-weight:900}.month-toolbar{display:flex;align-items:center;justify-content:center;gap:22px;margin:18px 0 10px}.month-toolbar h3{min-width:170px;margin:0;font-family:var(--font-display);font-size:1.35rem;text-align:center}.month-toolbar button{width:42px;height:38px;padding:0}.weekdays,.calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}.weekdays span{padding:5px;text-align:center;font-weight:1000}.calendar-grid>button{position:relative;min-height:92px;padding:7px 5px;border:2px solid rgba(36,22,14,.32);border-radius:13px;background:white;color:var(--ink);cursor:pointer}.calendar-grid>button.outside{opacity:.38}.calendar-grid>button:disabled{opacity:.22;cursor:not-allowed}.calendar-grid>button.today{background:var(--yellow)}.calendar-grid>button.selected{outline:4px solid rgba(36,22,14,.16)}.day-number{display:grid;place-items:center;width:30px;height:30px;margin:0 auto 4px;border-radius:50%;font-weight:1000}.calendar-grid>button.active .day-number{border:4px solid var(--blue);background:white}.women .calendar-grid>button.active .day-number{border-color:var(--pink)}.calendar-grid strong,.calendar-grid small{display:block;line-height:1.3}.calendar-grid strong{font-size:.72rem}.calendar-grid small{color:var(--muted);font-size:.66rem}.day-detail{margin-top:22px;padding-top:20px;border-top:3px dashed rgba(36,22,14,.45)}.day-detail>header{display:flex;justify-content:space-between;align-items:end;gap:16px}.day-detail>header span,.day-detail>header small{display:block;color:var(--muted);font-size:.78rem;font-weight:800}.day-detail h3{margin:3px 0 0;font-family:var(--font-display);font-size:1.45rem}.day-detail>header>div:last-child{text-align:right}.day-detail>header>div:last-child strong{display:block;color:var(--pink);font-size:1.2rem}.empty-day,.feedback{padding:12px;border:3px dashed var(--ink);border-radius:14px;background:#fff3b3;font-weight:800}.feedback.success{background:#dff6d8}.feedback.error{background:#ffe1ea;color:#9d003b}.report-list{display:grid;gap:9px;margin-top:14px}.report-item{display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;padding:12px;border:3px solid var(--ink);border-radius:14px;background:white}.report-main span,.report-main strong,.report-main small{display:block}.report-main span{color:var(--muted);font-size:.76rem;font-weight:800}.report-main strong{margin:2px 0}.report-main small{font-size:.78rem}.report-actions{display:flex;gap:6px}.report-actions .danger,.withdraw-confirm .danger{background:var(--pink);color:white}.locked{padding:5px 9px;border-radius:999px;background:#eee2d0;color:var(--muted);font-size:.75rem;font-weight:900}.withdraw-confirm{grid-column:1/-1;display:flex;align-items:center;justify-content:flex-end;gap:8px;padding-top:10px;border-top:2px dashed var(--ink);font-weight:900}.edit-report{grid-column:1/-1;display:grid;gap:12px}.edit-units,.edit-groups,.edit-buttons{display:flex;flex-wrap:wrap;gap:8px}.edit-units label,.edit-groups label{padding:7px 10px;border:2px solid var(--ink);border-radius:999px;background:#fff3b3;font-weight:900}.edit-report>label{display:grid;gap:5px;font-weight:900}.edit-report>label input{padding:10px;border:3px solid var(--ink);border-radius:11px;font:inherit}.edit-report fieldset{margin:0;padding:0;border:0}.edit-report legend{margin-bottom:7px;font-weight:900}.edit-buttons{justify-content:flex-end}.edit-buttons button:last-child{background:var(--yellow)}.edit-note{margin:12px 0 0;color:var(--muted);font-size:.78rem;font-weight:800;text-align:right}
@media(max-width:760px){.calendar-heading{align-items:start;flex-direction:column}.period-tabs{width:100%}.period-tabs button{flex:1}.period-summary{grid-template-columns:repeat(2,1fr)}.calendar-grid>button{min-height:74px}.calendar-grid small{display:none}.report-item{grid-template-columns:1fr}.report-actions{justify-content:flex-start}.locked{justify-self:start}}
@media(max-width:520px){.calendar-panel{border-radius:28px}.custom-range{align-items:stretch;flex-direction:column}.custom-range>span{text-align:center}.period-tabs button{padding:7px 5px;font-size:.78rem}.period-summary{gap:6px}.period-summary div{min-width:0;padding:9px}.period-summary strong{overflow:hidden;font-size:1.4rem;text-overflow:ellipsis}.weekdays,.calendar-grid{gap:3px}.calendar-grid>button{min-width:0;min-height:62px;padding:4px 1px;border-radius:9px;overflow:hidden}.day-number{width:26px;height:26px;margin-bottom:2px}.calendar-grid>button.active .day-number{border-width:3px}.calendar-grid strong{overflow:hidden;font-size:.61rem;letter-spacing:-.03em;text-overflow:ellipsis;white-space:nowrap}.day-detail>header{align-items:start}.withdraw-confirm{align-items:stretch;flex-direction:column}.withdraw-confirm button{width:100%}}
</style>
