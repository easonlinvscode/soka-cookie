# Vue 3 動態網站開發規格流程

## 1. 專案目標

建立一個以「日本零食包裝、兒童繪本、復古卡通、貼紙文化」為視覺靈感的互動式網站。

網站核心不是單純呈現資訊，而是營造：

- 歡樂
- 童趣
- 活潑
- 搞怪
- 高彩度
- 角色感
- 玩具感
- 零食包裝感
- 可以互動的卡通世界

同時必須保持：

- 資訊清楚
- 動畫流暢
- Responsive
- Mobile 可正常使用
- 不造成明顯效能問題
- 不影響基本操作

---

## 2. 前端技術

主要框架：

- Vue 3
- Composition API
- `<script setup>`
- JavaScript 或 TypeScript，依目前專案設定為主

動畫技術：

- CSS Animation
- CSS Transition
- GSAP
- GSAP ScrollTrigger
- canvas-confetti

第一階段不要加入：

- Lenis
- Rive
- Motion Vue

除非後續確認有實際需求。

---

## 3. 第一版安裝套件

```bash
npm install gsap canvas-confetti
```

ScrollTrigger 直接由 GSAP 引入：

```js
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
```

---

## 4. 動畫系統核心原則

不要所有動畫都使用同一套工具。

依照動畫性質選擇適合的技術，動畫分成 5 個層級。

### Level 1：Idle Animation

技術：

- CSS Animation

負責：

- 角色漂浮
- 星星旋轉
- 餅乾旋轉
- 愛心上下漂浮
- 小型 Wiggle
- Blink
- Marquee
- 背景裝飾持續動畫

不同角色的動畫時間不能完全相同，例如：

- Character A：3.7s
- Character B：4.3s
- Character C：5.1s
- Character D：4.8s

避免所有角色同步上下移動。

目的：讓網站即使沒有 Scroll 或 Hover，也保持生命感。

---

### Level 2：Interaction Animation

主要技術：

- CSS Transition
- GSAP

負責：

- Hover
- Press
- Click
- Character reaction
- Button feedback
- Card feedback

角色 Hover：

```text
scale: 1 → 1.08
rotation: 0 → ±3deg
translateY: 0 → -5px
```

角色 Click：

```text
Squash
↓
Bounce
↓
顯示 WOW / YUMMY
↓
產生 Particle
```

Button Hover：

```text
scale up
+
rotation
+
hard shadow position change
```

Button Click：

```text
scale down
↓
bounce back
```

---

### Level 3：Scene Animation

主要技術：

- GSAP Timeline

負責：

- Hero Opening
- Character Entrance
- Logo Entrance
- Typography Entrance
- CTA Entrance
- Section 特殊演出

Hero 必須使用 Timeline 思維設計，不要所有元素一起 Fade In。

建議順序：

```text
Page Load
↓
Background Reveal
↓
Logo Drop
↓
Main Title Bounce
↓
Character 1 Pop In
↓
Character 2 Slide In
↓
Character 3 Jump In
↓
Decorations Fly In
↓
CTA Bounce
↓
進入 Idle Animation
```

Hero 開場動畫總時間建議：

```text
1.5 ～ 2.5 秒
```

不要建立過長 Intro。

---

### Level 4：Scroll Animation

主要技術：

- GSAP ScrollTrigger

負責：

- Scroll Reveal
- Stagger
- Parallax
- Scrub
- Pin
- Section transition
- Character entrance

各區塊建議：

#### About Section

```text
文字 Pop In
角色從側邊出現
Speech Bubble Bounce
```

#### Character Section

Character Cards 使用 Stagger：

```text
Card 1
↓
Card 2
↓
Card 3
↓
Card 4
```

#### Snack Section

可以使用：

```text
Biscuit rotation
+
translateY
+
scale
```

#### Play Section

角色可以：

```text
left → center
right → center
bottom → center
```

不同方向進場。

#### CTA Section

```text
scale
+
bounce
+
character pop-up
```

---

### Level 5：Special Effect

第一版：

- canvas-confetti

未來選配：

- Lenis
- Rive

---

## 5. canvas-confetti 使用規則

canvas-confetti 不要只做普通彩紙。

配合網站世界觀設計成：

- Star
- Heart
- Circle
- Biscuit-like particle

適合出現在：

- 角色 Click
- 遊戲答對
- Score +1
- CTA Click
- Easter Egg

互動流程：

```text
User Click Character
↓
Character Bounce
↓
WOW!
↓
Particle Explosion
↓
Score +1
```

不要每個 Button 都產生 Confetti，Special Effect 必須保留驚喜感。

---

## 6. Hero Animation 規格

Hero 是全網站動畫最重要的區域。

Hero 不可以是一張完整圖片，每個角色與裝飾都必須拆成獨立 Layer。

結構概念：

```text
Hero
│
├── Background
├── Pattern
├── Star
├── Heart
├── Cookie
├── Main Title
├── Subtitle
├── Character Lion
├── Character Rabbit
├── Character Crocodile
├── Character Elephant
├── Character Giraffe
└── CTA
```

目的：

每個元素都能獨立控制：

- Position
- Rotation
- Scale
- Parallax
- Entrance
- Idle Animation

---

## 7. Hero Parallax

主要 Parallax 只需要在 Hero 使用。

Desktop 可以根據 Mouse Position 產生輕微移動。

例如：

- Background Decoration：3px
- Main Title：5px
- Middle Character：8px
- Foreground Character：12px
- Foreground Cookie：15px

形成景深感：

```text
Background
↓
Middle Ground
↓
Foreground
```

Parallax 必須輕微，不可造成閱讀困難或暈眩。

Mobile：

- 關閉 Mouse Parallax

---

## 8. Floating Animation

角色 Idle Animation 不要完全同步。

例如：

- Lion：3.7s
- Rabbit：4.3s
- Elephant：5.1s
- Crocodile：4.6s

可加入少量：

- translateY
- rotation

例如：

```text
0%
translateY(0)
rotate(-1deg)

50%
translateY(-10px)
rotate(1deg)

100%
translateY(0)
rotate(-1deg)
```

Movement 不要太大。

---

## 9. Marquee

Marquee 使用 CSS Animation 即可，不需要 GSAP。

文字例如：

```text
HAPPY ★ YUMMY ★ WILD ★ CRUNCH ★ FUN ★
```

設計：

- Yellow Background
- Black Chunky Typography
- Thick Border

速度保持固定。

---

## 10. Character Hover

Desktop Hover：

```text
scale(1.08)
+
rotate(±3deg)
+
translateY(-5px)
```

不同角色 Rotation 方向可以不同，避免所有角色使用完全相同動畫。

---

## 11. Character Click

部分角色加入 Easter Egg。

Click：

```text
Character squash
↓
Character jump
↓
WOW / YUMMY / HELLO
↓
Star / Biscuit particles
```

可加入：

```text
Score +1
```

或其他小型遊戲互動。

---

## 12. Scroll Reveal 原則

禁止所有 Section 都只使用：

```text
opacity: 0
↓
opacity: 1
```

動畫要符合卡通世界觀。

優先使用：

- Scale
- Rotation
- Translate
- Bounce
- Back easing
- Elastic feeling
- Stagger

例如：

```text
y: 80
scale: 0.8
rotation: -5
↓
y: 0
scale: 1
rotation: 0
```

---

## 13. GSAP Easing

動畫應偏 Cartoon / Playful。

推薦：

```text
back.out()
power2.out
power3.out
elastic.out()
bounce.out
```

Elastic / Bounce 不要濫用。

主要角色或重要 CTA 才使用較強烈 Bounce。

普通 Reveal 優先：

```text
power2.out
power3.out
back.out()
```

---

## 14. Desktop / Mobile 動畫分開設計

不要直接把 Desktop 動畫套到 Mobile。

使用：

```js
gsap.matchMedia()
```

處理：

- Desktop
- Tablet
- Mobile
- prefers-reduced-motion

---

## 15. Desktop Animation

Desktop 可以使用：

- Mouse Parallax
- 大範圍 Character Entrance
- Rotation
- Larger Movement
- Hover
- Scroll Scrub
- Stagger

例如：

```text
Character

x: -150
rotation: -15
scale: 0.8

↓

x: 0
rotation: 0
scale: 1
```

---

## 16. Mobile Animation

Mobile 必須簡化。

不要：

- Mouse Parallax
- 過度 Scrub
- 大量 Floating
- 大距離 translate
- 過多同時動畫

例如 Desktop：

```text
y: 150
rotation: -20
```

Mobile 改：

```text
y: 50
rotation: -5
```

Mobile 仍需保持動畫，但必須更輕量。

---

## 17. Reduced Motion

必須處理：

```text
prefers-reduced-motion
```

降低或停用：

- Parallax
- Floating
- Large Translate
- Rotation
- Scroll Scrub

保留基本：

```text
opacity
small translate
```

確保 Accessibility。

---

## 18. Vue Component 架構

建議：

```text
src/
│
├── components/
│   ├── Header.vue
│   ├── HeroSection.vue
│   ├── MarqueeStrip.vue
│   ├── AboutSection.vue
│   ├── CharacterSection.vue
│   ├── CharacterCard.vue
│   ├── SnackSection.vue
│   ├── PlaySection.vue
│   ├── CTASection.vue
│   └── Footer.vue
│
├── components/
│   └── decorations/
│       ├── FloatingStar.vue
│       ├── FloatingHeart.vue
│       └── FloatingCookie.vue
│
├── composables/
│   ├── useHeroAnimation.js
│   ├── useScrollReveal.js
│   ├── useParallax.js
│   └── useConfetti.js
│
├── styles/
│   ├── variables.css
│   ├── animations.css
│   └── global.css
│
└── assets/
    ├── characters/
    ├── cookies/
    └── decorations/
```

實際結構可以依現有專案調整，不要為了符合此結構而破壞既有專案架構。

---

## 19. Animation Logic 不要全部放 Component

禁止：

```text
HeroSection.vue

Template
+
Style
+
300 行 GSAP
+
Mouse Event
+
ScrollTrigger
+
Confetti
```

全部寫在一起。

應拆成：

```text
HeroSection.vue
↓
useHeroAnimation()

Character.vue
↓
useCharacterInteraction()

PlaySection.vue
↓
useConfetti()
```

保持 Component 易讀。

---

## 20. GSAP Vue Lifecycle

GSAP 動畫必須配合 Vue Lifecycle。

建議使用：

```text
onMounted
onUnmounted
gsap.context()
```

Component Unmount 時必須清理 Animation / ScrollTrigger。

概念：

```js
let ctx

onMounted(() => {
  ctx = gsap.context(() => {
    // GSAP animations
  }, rootElement)
})

onUnmounted(() => {
  ctx?.revert()
})
```

避免：

- ScrollTrigger 重複
- Animation 重複
- Event Listener 殘留
- Memory Leak

---

## 21. CSS 與 GSAP 職責分離

### CSS 負責

```text
Idle
Floating
Wiggle
Rotate
Blink
Marquee
Simple Hover
Simple Transition
Background Pattern
```

### GSAP 負責

```text
Timeline
Entrance
Stagger
ScrollTrigger
Parallax
Complex Interaction
Sequence
Character Scene
```

### canvas-confetti 負責

```text
Particle
Celebration
Click Effect
Easter Egg
```

不要使用 GSAP 寫所有簡單 CSS Animation。

---

## 22. Animation Performance

動畫優先操作：

```text
transform
opacity
```

例如：

- translate
- scale
- rotate
- opacity

避免大量動畫：

- width
- height
- top
- left
- margin
- padding

因為可能造成 Layout Reflow。

角色定位可以使用：

```text
position: absolute
```

但動畫本身優先使用：

```text
transform
```

---

## 23. 圖片素材

角色素材最好使用：

- SVG
- WebP
- PNG Transparent

不要將整個 Hero 合併成單張圖片。

因為角色需要：

- Hover
- Click
- Parallax
- Scroll
- Floating
- Responsive reposition

所以角色必須是獨立素材。

---

# 24. Animation Development Workflow

嚴格按照以下順序開發。

## Phase 1：Static UI

先完成：

```text
Header
Hero
Marquee
About
Characters
Snacks
Play
CTA
Footer
```

先不要加入複雜動畫。

優先完成：

- Typography
- Color
- Layout
- Character positioning
- Desktop
- Mobile
- Responsive

確認靜態畫面本身已經成立。

---

## Phase 2：CSS Idle Animation

加入：

```text
Floating
Rotate
Wiggle
Blink
Marquee
Hover
```

讓畫面開始有基本生命感。

---

## Phase 3：Hero GSAP Timeline

加入：

```text
Background
↓
Logo
↓
Title
↓
Characters
↓
Decoration
↓
CTA
```

建立完整 Opening Scene。

---

## Phase 4：ScrollTrigger

依序完成：

```text
About
↓
Characters
↓
Snacks
↓
Play
↓
CTA
```

Scroll Reveal。

不要一次寫完整網站所有 Scroll Animation。

一個 Section 完成並測試後，再進下一個。

---

## Phase 5：Character Interaction

加入：

```text
Hover
Click
Bounce
Reaction
```

---

## Phase 6：Special Effect

加入：

```text
canvas-confetti
Star
Heart
Biscuit Particle
WOW
Score
```

---

## Phase 7：Responsive Animation

重新檢查：

```text
Desktop
Tablet
Mobile
```

Mobile 動畫不可只是 Desktop 縮小版。

---

## Phase 8：Performance

檢查：

- FPS
- Scroll smoothness
- Mobile Safari
- Chrome
- Memory
- ScrollTrigger cleanup
- Image size
- Concurrent animations

移除沒有必要的動畫。

---

## Phase 9：Smooth Scroll Evaluation

完成上述全部功能後，再評估：

```text
Lenis
```

先比較：

```text
Native Scroll
vs.
Lenis
```

只有確實提升體驗才加入。

不要因為流行而加入 Smooth Scroll。

---

## 25. Lenis 未來加入條件

只有以下情況才考慮：

- Scroll storytelling 比重很高
- Native Scroll 感覺太生硬
- GSAP ScrollTrigger 整合穩定
- Mobile Safari 測試正常
- 不影響 Accessibility

否則維持 Native Scroll。

---

## 26. Rive 未來加入條件

第一版不要使用。

只有角色需要：

```text
Idle
Blink
Hover
Click
Eat
Happy
Sad
Wave
```

等複雜角色 State 時才評估 Rive。

例如：

```text
Character
│
├── Idle
├── Hover
├── Click
├── Happy
├── Eat
└── Wave
```

這時再建立 State Machine。

---

## 27. 不建議第一版加入 Motion Vue

GSAP 已經負責：

- Timeline
- Scroll
- Hover
- Scale
- Rotation
- Spring-like animation

因此第一版不要同時加入 Motion Vue。

避免形成：

```text
Component A → CSS
Component B → GSAP
Component C → Motion
Component D → GSAP
```

造成動畫邏輯分散。

如果未來大量需要：

- Layout Animation
- AnimatePresence
- Gesture
- State-driven animation

才重新評估 Motion Vue。

---

## 28. Animation Design 原則

動畫不是為了：

> 讓所有東西都動。

而是建立：

```text
Character Personality
+
Visual Hierarchy
+
Storytelling
+
Feedback
+
Surprise
```

每一個 Animation 都必須回答：

```text
Why does this move?
```

例如：

### Lion

```text
Bounce
Jump
Rotation
```

### Elephant

```text
Slow Floating
Small Rotation
```

### Rabbit

```text
Fast Hop
Quick Bounce
```

### Giraffe

```text
Slow Sway
```

角色動畫應反映角色個性。

---

## 29. Animation Density

畫面中不可以所有元素都同時劇烈移動。

### Primary Motion

一次最多 1～2 個。

例如：

- Hero Character Entrance
- Main CTA

### Secondary Motion

例如：

- Floating
- Star rotation

### Ambient Motion

非常小：

- Background decorations

使用者視線應該知道現在應該看哪裡。

---

## 30. 最終動畫技術組合

第一版：

```text
Vue 3
│
├── CSS Animation
│   ├── Floating
│   ├── Rotate
│   ├── Wiggle
│   ├── Hover
│   └── Marquee
│
├── GSAP
│   ├── Hero Timeline
│   ├── Character Entrance
│   ├── Interaction
│   └── Complex Animation
│
├── GSAP ScrollTrigger
│   ├── Reveal
│   ├── Stagger
│   ├── Parallax
│   ├── Scrub
│   └── Pin
│
└── canvas-confetti
    ├── Star
    ├── Heart
    ├── Biscuit
    └── Celebration
```

未來才考慮：

```text
Lenis
↓
Smooth Scroll

Rive
↓
Character State Animation

Motion Vue
↓
State / Layout / Gesture Animation
```

---

## 31. 開發優先順序

請嚴格按照以下順序：

```text
01 Static Vue UI
↓
02 Responsive Layout
↓
03 CSS Idle Animation
↓
04 GSAP Hero Timeline
↓
05 GSAP ScrollTrigger
↓
06 Hover / Click Interaction
↓
07 canvas-confetti
↓
08 Mobile Animation
↓
09 Accessibility
↓
10 Performance Optimization
↓
11 Lenis Evaluation
↓
12 Rive Evaluation
```

---

## 32. AI Coding 規則

在 Coding 前：

1. 先閱讀目前專案結構。
2. 不要直接修改大量既有檔案。
3. 先列出預計修改與新增的檔案。
4. 先確認現有 CSS / Component 架構。
5. 盡量延續目前專案 Coding Style。
6. 不要自行安裝不必要套件。
7. 不要一次實作所有動畫。
8. Animation 必須分階段完成。
9. 每完成一個 Phase 先確認沒有錯誤。
10. Desktop 與 Mobile 都必須測試。

---

## 33. 禁止事項

不要：

- 所有東西都 Fade In
- 每個元素都用 GSAP
- 每個 Section 都使用 Parallax
- 所有角色同步 Floating
- 大量使用 Bounce
- 一開始加入 Lenis
- 一開始加入 Rive
- 同時加入多個重複 Animation Library
- Hero 做成一張完整圖片
- Desktop Animation 原封不動套到 Mobile
- 忽略 prefers-reduced-motion
- Component Unmount 時不清理 ScrollTrigger
- 為了動畫破壞 Responsive Layout
- 為了視覺效果犧牲操作性

---

## 34. 最終體驗目標

使用者打開網站時應感覺：

```text
這不是一個普通 Landing Page。

而是一個會動、
可以玩的、
充滿角色的、
日本零食包裝卡通世界。
```

Animation 必須具備：

- Cartoon
- Spring
- Bounce
- Playful
- Surprise
- Personality

但不能：

- 過度
- 混亂
- 卡頓
- 影響閱讀
- 讓使用者暈眩

最終目標：

```text
Visual Design
+
Character
+
Motion
+
Interaction
+
Storytelling
```

共同形成完整的 Web Experience。
