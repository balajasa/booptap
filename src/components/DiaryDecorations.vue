<template>
  <div class="decorations" aria-hidden="true">
    <!-- 小裝飾 -->
    <div
      v-for="deco in decos"
      :key="deco.id"
      class="deco"
      :style="deco.style"
      v-html="deco.svg"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ seed: number }>()

function seededRandom(s: number) {
  const x = Math.sin(s) * 10000
  return x - Math.floor(x)
}

function pick<T>(arr: T[], s: number): T {
  return arr[Math.floor(seededRandom(s) * arr.length)]!
}

const SVGS = [
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>`,
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2l-1.4 1.4 6 3.5L6 13H4l-1 2 3 1 1 3 2-1v-2l3.5-3.4 3.5 6z"/></svg>`,
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2.5.5 6.5-2 8.5s-7 4.5-6 9.5z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>`,
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>`,
]

const DECO_POSITIONS = [
  { top: '4%', left: '8%' },
  { top: '4%', left: '55%' },
  { top: '4%', right: '6%' },
  { top: '15%', left: '20%' },
  { top: '15%', right: '15%' },
  { top: '28%', left: '5%' },
  { top: '28%', left: '40%' },
  { top: '28%', right: '8%' },
  { top: '42%', left: '12%' },
  { top: '42%', right: '20%' },
  { top: '56%', left: '6%' },
  { top: '56%', left: '50%' },
  { top: '56%', right: '5%' },
  { top: '70%', left: '25%' },
  { top: '70%', right: '12%' },
  { bottom: '10%', left: '8%' },
  { bottom: '10%', left: '45%' },
  { bottom: '10%', right: '6%' },
]

const COLORS = [
  '#7a9e7e', '#9e7a7a', '#7a7a9e', '#9e9a7a',
  '#7a9e9a', '#9e7a9a', '#8a8a7a', '#7a8a9e',
]

const decos = computed(() => {
  const s = props.seed
  const count = 4 + Math.floor(seededRandom(s * 3) * 4)

  const positions = [...DECO_POSITIONS]
    .sort(() => seededRandom(s + 99) - 0.5)
    .slice(0, count)

  return positions.map((pos, i) => {
    const svg = pick(SVGS, s + i * 11)
    const angle = (seededRandom(s + i * 23) * 40 - 20).toFixed(1)
    const opacity = (0.25 + seededRandom(s + i * 7) * 0.3).toFixed(2)

    return {
      id: `deco-${i}`,
      svg,
      style: {
        ...pos,
        transform: `rotate(${angle}deg)`,
        opacity,
        color: pick(COLORS, s + i * 5),
      },
    }
  })
})
</script>

<style lang="sass" scoped>
.decorations
  position: absolute
  inset: 0
  pointer-events: none
  z-index: 0

.deco
  position: absolute
  line-height: 1
</style>
