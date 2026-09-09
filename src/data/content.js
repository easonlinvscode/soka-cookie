export const divisions = [
  { id: 'men', label: '男子部', color: 'blue', icon: '★' },
  { id: 'women', label: '女子部', color: 'pink', icon: '♥' },
]

export const headquarters = [
  { id: 'central', label: '中央本部', color: '#b996e8', initial: { men: 0, women: 0 } },
  { id: 'west-coast', label: '西濱本部', color: '#ff8a34', initial: { men: 0, women: 0 } },
  { id: 'yangxin', label: '楊新本部', color: '#58c766', initial: { men: 0, women: 0 } },
  { id: 'zhongyuan', label: '中原本部', color: '#f50469', initial: { men: 0, women: 0 } },
]

export const affiliations = [
  { id: 'circle', label: '圈級', color: '#ffe13b' },
  { id: 'district', label: '區級', color: '#54c8ef' },
  ...headquarters.map(({ id, label, color }) => ({ id, label, color })),
]

export const circles = [{ id: 'taoyuan-2', label: '桃園二圈' }]
export const districts = [{ id: 'taoyuan-west', label: '桃園西區' }]

export const quotes = [
  {
    category: '日蓮大聖人御金言',
    quote: '冬必為春。',
    source: '《妙一尼御前御書》',
    encourage: '每一次堅持，都在讓春天更靠近。今天的努力也閃閃發亮！',
  },
  {
    category: '日蓮大聖人御金言',
    quote: '櫻梅桃李，各有其體。',
    source: '《御義口傳》',
    encourage: '用自己的方式前進，就是最獨一無二的勝利。',
  },
  {
    category: '池田大作先生指導',
    quote: '一天的勝利累積起來，就是一生的勝利。',
    source: '',
    encourage: '今天的每一分鐘，都是通往共同目標的重要一步！',
  },
]

export const rewardCards = [
  {
    id: 'winter-to-spring',
    kind: '御文',
    title: '冬必為春',
    message: '冬必為春。',
    source: '《妙一尼御前御書》',
    note: '再冷的冬天也會迎來春天，今天的努力正在累積改變。',
    mascot: 'lion',
    theme: 'blue',
  },
  {
    id: 'cherry-plum-peach-damson',
    kind: '御文',
    title: '做最好的自己',
    message: '櫻梅桃李，各有其體。',
    source: '《御義口傳》',
    note: '不用和別人比較，你的步伐本身就有獨一無二的光芒。',
    mascot: 'bear',
    theme: 'yellow',
  },
  {
    id: 'one-day-victory',
    kind: '鼓勵',
    title: '今天也勝利',
    message: '一天的勝利累積起來，就是一生的勝利。',
    source: '',
    note: '你完成的每一遍、每一分鐘，都算數。',
    mascot: 'phoenix',
    theme: 'pink',
  },
  {
    id: 'steady-light',
    kind: '鼓勵',
    title: '穩穩發光',
    message: '不用一次走很遠，持續前進就很了不起。',
    source: '',
    note: '把今天的小小堅持，變成明天更有力量的自己。',
    mascot: 'lion',
    theme: 'blue',
  },
  {
    id: 'brave-heart',
    kind: '鼓勵',
    title: '勇氣加滿',
    message: '願意再次開始，就是勇氣最閃亮的樣子。',
    source: '',
    note: '帶著笑容向前，福運也會一步一步靠近。',
    mascot: 'bear',
    theme: 'yellow',
  },
  {
    id: 'good-fortune-today',
    kind: '鼓勵',
    title: '福運累積中',
    message: '看似平凡的努力，正在悄悄創造不平凡的未來。',
    source: '',
    note: '今天的唱題已經化成一塊閃閃發亮的幸運餅乾。',
    mascot: 'phoenix',
    theme: 'pink',
  },
  {
    id: 'together-forward',
    kind: '鼓勵',
    title: '一起向前',
    message: '一個人的堅持，也能成為大家前進的力量。',
    source: '',
    note: '謝謝你把今天的努力放進共同的餅乾罐。',
    mascot: 'lion',
    theme: 'blue',
  },
  {
    id: 'smile-power',
    kind: '鼓勵',
    title: '笑容能量',
    message: '帶著希望唱下去，心中的太陽就不會熄滅。',
    source: '',
    note: '休息一下、深呼吸，再帶著好心情出發。',
    mascot: 'bear',
    theme: 'yellow',
  },
  {
    id: 'new-flight',
    kind: '鼓勵',
    title: '展翅新出發',
    message: '每一次挑戰，都是讓生命展開新翅膀的機會。',
    source: '',
    note: '你已經跨出今天最重要的一步，繼續保持！',
    mascot: 'phoenix',
    theme: 'pink',
  },
]

export const TARGET_PER_TEAM = 1000
