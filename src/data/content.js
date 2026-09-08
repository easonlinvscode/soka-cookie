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

export const TARGET_PER_TEAM = 1000
