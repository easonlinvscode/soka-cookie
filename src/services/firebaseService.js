import {
  GoogleAuthProvider,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db, requireFirebase } from '../firebase.js'

const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export const REPORT_EDIT_WINDOW_MS = 30 * 60 * 1000

function ensurePositiveInteger(value, label) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) throw new Error(`${label}必須是大於 0 的整數。`)
  return number
}

function reportAmounts(unit, rawAmount) {
  const amount = ensurePositiveInteger(rawAmount, unit === 'minutes' ? '分鐘數' : '遍數')
  return {
    amount,
    minutes: unit === 'minutes' ? amount : Math.max(1, Math.round(amount / 60)),
    chants: unit === 'chants' ? amount : amount * 60,
  }
}

function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function endOfDay(dateString) {
  const value = new Date(`${dateString}T23:59:59`)
  if (Number.isNaN(value.getTime())) throw new Error('請選擇有效的完成日期。')
  return Timestamp.fromDate(value)
}

function timestampToDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value.toDate === 'function') return value.toDate()
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000)
  return null
}

function ensureEditable(report, uid) {
  if (report.userId !== uid) throw new Error('你只能修改自己的回報。')
  const createdAt = timestampToDate(report.createdAt)
  if (!createdAt || Date.now() - createdAt.getTime() > REPORT_EDIT_WINDOW_MS) {
    throw new Error('這筆回報已超過 30 分鐘，無法修改或撤回。')
  }
}

function groupPreviewPayload(values) {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    targetType: values.targetType,
    targetValue: Number(values.targetValue),
  }
}

export function watchAuth(callback) {
  if (!auth) return () => callback(null)
  getRedirectResult(auth).catch(() => {})
  return onAuthStateChanged(auth, callback)
}

export async function loginWithGoogle() {
  requireFirebase()
  try {
    return await signInWithPopup(auth, googleProvider)
  } catch (error) {
    if (['auth/popup-blocked', 'auth/cancelled-popup-request', 'auth/operation-not-supported-in-this-environment'].includes(error.code)) {
      return signInWithRedirect(auth, googleProvider)
    }
    throw error
  }
}

export async function logout() {
  requireFirebase()
  await signOut(auth)
}

export async function getProfile(uid) {
  requireFirebase()
  const snapshot = await getDoc(doc(db, 'users', uid))
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null
}

export async function saveProfile(user, profile) {
  requireFirebase()
  const userRef = doc(db, 'users', user.uid)
  const existing = await getDoc(userRef)
  const payload = {
    displayName: profile.displayName.trim(),
    email: user.email || '',
    photoURL: user.photoURL || '',
    division: profile.division,
    circleId: 'taoyuan-2',
    districtId: 'taoyuan-west',
    affiliationId: profile.affiliationId,
    profileComplete: true,
    updatedAt: serverTimestamp(),
  }
  const batch = writeBatch(db)
  batch.set(userRef, existing.exists() ? payload : { ...payload, createdAt: serverTimestamp() }, { merge: true })
  await batch.commit()
  return getProfile(user.uid)
}

export function watchMyReports(uid, callback, onError) {
  requireFirebase()
  const ownReports = query(collection(db, 'reports'), where('userId', '==', uid))
  return onSnapshot(ownReports, (snapshot) => {
    const items = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((item) => item.status !== 'deleted')
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    callback(items)
  }, onError)
}

export function watchFavoriteCards(uid, callback, onError) {
  requireFirebase()
  return onSnapshot(collection(db, 'users', uid, 'favoriteCards'), (snapshot) => {
    callback(snapshot.docs.map((item) => item.id))
  }, onError)
}

export async function setFavoriteCard(uid, cardId, favorite) {
  requireFirebase()
  if (!/^[a-z0-9-]{2,50}$/.test(cardId)) throw new Error('卡片資料不正確。')
  const favoriteRef = doc(db, 'users', uid, 'favoriteCards', cardId)
  if (favorite) {
    await setDoc(favoriteRef, { cardId, createdAt: serverTimestamp() })
  } else {
    await deleteDoc(favoriteRef)
  }
}

export async function getMyReports(uid) {
  requireFirebase()
  const snapshot = await getDocs(query(collection(db, 'reports'), where('userId', '==', uid)))
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((item) => item.status !== 'deleted')
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}

export async function submitReport(user, profile, report) {
  requireFirebase()
  const { amount, minutes, chants } = reportAmounts(report.unit, report.amount)
  const selectedGroups = [...new Set(report.groupIds || [])]
  const submissionId = report.submissionId || crypto.randomUUID()
  const reportRef = doc(db, 'reports', submissionId)
  const submissionRef = doc(db, 'users', user.uid, 'submissionKeys', submissionId)
  const reportData = {
    userId: user.uid,
    division: profile.division,
    circleId: profile.circleId,
    districtId: profile.districtId,
    affiliationId: profile.affiliationId,
    minutes,
    chants,
    sourceUnit: report.unit,
    sourceAmount: amount,
    groupIds: selectedGroups,
    status: 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const result = await runTransaction(db, async (transaction) => {
    const existingSubmission = await transaction.get(submissionRef)
    if (existingSubmission.exists()) {
      return { id: existingSubmission.data().reportId, ...reportData, createdAt: new Date(), updatedAt: new Date(), duplicate: true }
    }

    transaction.set(reportRef, reportData)
    transaction.set(submissionRef, { reportId: reportRef.id, createdAt: serverTimestamp() })
    selectedGroups.forEach((groupId) => {
      transaction.set(doc(db, 'groups', groupId, 'contributions', reportRef.id), {
        reportId: reportRef.id,
        userId: user.uid,
        displayName: profile.displayName,
        minutes,
        chants,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
    return { id: reportRef.id, ...reportData, createdAt: new Date(), updatedAt: new Date() }
  })
  return result
}

export async function updateReport(user, profile, original, values) {
  requireFirebase()
  ensureEditable(original, user.uid)
  const { amount, minutes, chants } = reportAmounts(values.unit, values.amount)
  const nextGroups = [...new Set(values.groupIds || [])]
  const previousGroups = [...new Set(original.groupIds || [])]
  const allGroups = new Set([...previousGroups, ...nextGroups])
  const reportRef = doc(db, 'reports', original.id)
  const batch = writeBatch(db)
  batch.update(reportRef, {
    minutes,
    chants,
    sourceUnit: values.unit,
    sourceAmount: amount,
    groupIds: nextGroups,
    status: 'active',
    updatedAt: serverTimestamp(),
  })

  allGroups.forEach((groupId) => {
    const contributionRef = doc(db, 'groups', groupId, 'contributions', original.id)
    if (!nextGroups.includes(groupId)) {
      batch.delete(contributionRef)
      return
    }
    batch.set(contributionRef, {
      reportId: original.id,
      userId: user.uid,
      displayName: profile.displayName,
      minutes,
      chants,
      createdAt: original.createdAt,
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

export async function withdrawReport(user, report) {
  requireFirebase()
  ensureEditable(report, user.uid)
  const batch = writeBatch(db)
  batch.update(doc(db, 'reports', report.id), { status: 'deleted', updatedAt: serverTimestamp() })
  ;(report.groupIds || []).forEach((groupId) => batch.delete(doc(db, 'groups', groupId, 'contributions', report.id)))
  await batch.commit()
}

export async function getMyGroups(uid) {
  requireFirebase()
  const memberships = await getDocs(collection(db, 'users', uid, 'groups'))
  const groups = await Promise.all(memberships.docs.map(async (membership) => {
    const groupSnapshot = await getDoc(doc(db, 'groups', membership.id))
    return groupSnapshot.exists()
      ? { id: groupSnapshot.id, ...groupSnapshot.data(), status: groupSnapshot.data().status || 'active', membership: membership.data() }
      : null
  }))
  return groups.filter(Boolean).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
}

export async function getGroupDetails(groupId) {
  requireFirebase()
  const [groupSnapshot, membersSnapshot, contributionsSnapshot] = await Promise.all([
    getDoc(doc(db, 'groups', groupId)),
    getDocs(collection(db, 'groups', groupId, 'members')),
    getDocs(collection(db, 'groups', groupId, 'contributions')),
  ])
  if (!groupSnapshot.exists()) throw new Error('找不到這個群組。')
  return {
    group: { id: groupSnapshot.id, ...groupSnapshot.data(), status: groupSnapshot.data().status || 'active' },
    members: membersSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
    contributions: contributionsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })),
  }
}

export async function getInvitePreview(rawCode) {
  requireFirebase()
  const code = rawCode.trim().toUpperCase()
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) throw new Error('邀請碼格式不正確。')
  const snapshot = await getDoc(doc(db, 'inviteCodes', code))
  if (!snapshot.exists()) throw new Error('找不到這個邀請碼。')
  const invitation = snapshot.data()
  const endDate = timestampToDate(invitation.endDate)
  if (!invitation.active || (endDate && endDate < new Date())) throw new Error('這個邀請已經關閉或到期。')
  return { code, ...invitation }
}

export async function getInvitationSettings(rawCode) {
  requireFirebase()
  const code = rawCode.trim().toUpperCase()
  const snapshot = await getDoc(doc(db, 'inviteCodes', code))
  return snapshot.exists() ? { code, ...snapshot.data() } : null
}

export async function createGroup(user, profile, values) {
  requireFirebase()
  const targetValue = ensurePositiveInteger(values.targetValue, '目標數量')
  const groupRef = doc(collection(db, 'groups'))

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = inviteCode()
    const codeRef = doc(db, 'inviteCodes', code)
    try {
      await runTransaction(db, async (transaction) => {
        const codeSnapshot = await transaction.get(codeRef)
        if (codeSnapshot.exists()) throw new Error('INVITE_CODE_COLLISION')
        const endDate = endOfDay(values.endDate)
        transaction.set(groupRef, {
          name: values.name.trim(),
          description: values.description.trim(),
          targetType: values.targetType,
          targetValue,
          endDate,
          ownerId: user.uid,
          inviteCode: code,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        transaction.set(codeRef, {
          groupId: groupRef.id,
          ownerId: user.uid,
          active: true,
          endDate,
          ...groupPreviewPayload({ ...values, targetValue }),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        transaction.set(doc(db, 'groups', groupRef.id, 'members', user.uid), {
          userId: user.uid,
          displayName: profile.displayName,
          role: 'owner',
          inviteCode: code,
          joinedAt: serverTimestamp(),
        })
        transaction.set(doc(db, 'users', user.uid, 'groups', groupRef.id), {
          groupId: groupRef.id,
          role: 'owner',
          joinedAt: serverTimestamp(),
        })
      })
      return { id: groupRef.id, inviteCode: code }
    } catch (error) {
      if (error.message !== 'INVITE_CODE_COLLISION' || attempt === 4) throw error
    }
  }
  throw new Error('暫時無法產生邀請碼，請稍後再試。')
}

export async function joinGroupByCode(user, profile, rawCode) {
  requireFirebase()
  const code = rawCode.trim().toUpperCase()
  if (!/^[A-HJ-NP-Z2-9]{8}$/.test(code)) throw new Error('邀請碼格式不正確。')
  const codeRef = doc(db, 'inviteCodes', code)

  return runTransaction(db, async (transaction) => {
    const invitation = await transaction.get(codeRef)
    if (!invitation.exists() || !invitation.data().active) throw new Error('找不到有效的邀請碼。')
    if (invitation.data().endDate?.toDate() < new Date()) throw new Error('這個群組已經到期。')
    const groupId = invitation.data().groupId
    const memberRef = doc(db, 'groups', groupId, 'members', user.uid)
    const member = await transaction.get(memberRef)
    if (!member.exists()) {
      transaction.set(memberRef, {
        userId: user.uid,
        displayName: profile.displayName,
        role: 'member',
        inviteCode: code,
        joinedAt: serverTimestamp(),
      })
      transaction.set(doc(db, 'users', user.uid, 'groups', groupId), {
        groupId,
        role: 'member',
        joinedAt: serverTimestamp(),
      })
    }
    return groupId
  })
}

export async function updateGroup(user, group, values) {
  requireFirebase()
  if (group.ownerId !== user.uid) throw new Error('只有群組建立者可以修改內容。')
  const targetValue = ensurePositiveInteger(values.targetValue, '目標數量')
  const endDate = endOfDay(values.endDate)
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', group.id), {
    name: values.name.trim(),
    description: values.description.trim(),
    targetType: values.targetType,
    targetValue,
    endDate,
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(db, 'inviteCodes', group.inviteCode), {
    endDate,
    ...groupPreviewPayload({ ...values, targetValue }),
    updatedAt: serverTimestamp(),
  })
  await batch.commit()
}

export async function setGroupInvitationActive(user, group, active) {
  requireFirebase()
  if (group.ownerId !== user.uid) throw new Error('只有群組建立者可以調整邀請設定。')
  await writeBatch(db)
    .update(doc(db, 'inviteCodes', group.inviteCode), {
      active: Boolean(active),
      endDate: group.endDate,
      ...groupPreviewPayload(group),
      updatedAt: serverTimestamp(),
    })
    .commit()
}

export async function removeGroupMember(user, group, memberId) {
  requireFirebase()
  if (group.ownerId !== user.uid) throw new Error('只有群組建立者可以移除成員。')
  if (memberId === user.uid) throw new Error('建立者不能移除自己。')
  const batch = writeBatch(db)
  batch.delete(doc(db, 'groups', group.id, 'members', memberId))
  batch.delete(doc(db, 'users', memberId, 'groups', group.id))
  await batch.commit()
}

export async function updateGroupStatus(user, group, status) {
  requireFirebase()
  if (group.ownerId !== user.uid) throw new Error('只有群組建立者可以調整群組狀態。')
  if (!['active', 'ended', 'archived'].includes(status)) throw new Error('群組狀態不正確。')
  const batch = writeBatch(db)
  batch.update(doc(db, 'groups', group.id), { status, updatedAt: serverTimestamp() })
  if (status !== 'active') {
    batch.update(doc(db, 'inviteCodes', group.inviteCode), {
      active: false,
      endDate: group.endDate,
      ...groupPreviewPayload(group),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
}
