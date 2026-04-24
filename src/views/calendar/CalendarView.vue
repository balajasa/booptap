<template>
  <div class="calendar-page">

    <!-- 標題 -->
    <div class="cal-header">
      <button class="month-btn" @click="prevMonth">&#8249;</button>
      <h2 class="month-title">{{ displayYear }}年{{ displayMonth }}月</h2>
      <button class="month-btn" @click="nextMonth">&#8250;</button>
    </div>

    <!-- 星期列 -->
    <div class="weekdays">
      <span v-for="d in weekdays" :key="d" class="weekday">{{ d }}</span>
    </div>

    <!-- 日期格子 -->
    <div class="days-grid">
      <div v-for="(cell, i) in calendarCells" :key="i" class="day-cell" :class="{
        'day-cell--empty': !cell.day,
        'day-cell--today': cell.isToday,
        'day-cell--has-checkin': cell.hasCheckin,
        'day-cell--selected': cell.dateKey === selectedDateKey,
      }" @click="cell.hasCheckin && selectDay(cell.dateKey!)">
        <template v-if="cell.day">
          <span class="day-number">{{ cell.day }}</span>
          <img v-if="cell.hasCheckin" src="@/assets/img/icon/calendar/paw-print.png" class="paw-stamp" alt="" />
          <span v-if="cell.isToday" class="today-bar" />
        </template>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckinStore } from '@/stores/useCheckinStore'

const router = useRouter()
const store = useCheckinStore()
const { loadCheckins } = store
const checkins = store.checkins

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth()) // 0-indexed

const displayYear = computed(() => viewYear.value)
const displayMonth = computed(() => viewMonth.value + 1)

const selectedDateKey = ref<string | null>(null)

// 有打卡記錄的日期 Set（key: YYYY-MM-DD，用當地時區）
const checkinDateSet = computed(() => {
  const set = new Set<string>()
  for (const item of checkins.value) {
    const key = toLocalDateKey(item.createdAt, item.timezone || 'Asia/Taipei')
    set.add(key)
  }
  return set
})

function toLocalDateKey(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function todayKey(): string {
  return toLocalDateKey(new Date(), Intl.DateTimeFormat().resolvedOptions().timeZone)
}

interface CalendarCell {
  day: number | null
  dateKey: string | null
  isToday: boolean
  hasCheckin: boolean
}

const calendarCells = computed<CalendarCell[]>(() => {
  const year = viewYear.value
  const month = viewMonth.value
  const firstDay = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const tKey = todayKey()

  const cells: CalendarCell[] = []

  // 前置空格
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, dateKey: null, isToday: false, hasCheckin: false })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateKey = toLocalDateKey(new Date(year, month, d), Intl.DateTimeFormat().resolvedOptions().timeZone)
    cells.push({
      day: d,
      dateKey,
      isToday: dateKey === tKey,
      hasCheckin: checkinDateSet.value.has(dateKey),
    })
  }

  return cells
})

function prevMonth() {
  if (viewMonth.value === 0) {
    viewYear.value--
    viewMonth.value = 11
  } else {
    viewMonth.value--
  }
}

function nextMonth() {
  if (viewMonth.value === 11) {
    viewYear.value++
    viewMonth.value = 0
  } else {
    viewMonth.value++
  }
}

function selectDay(dateKey: string) {
  selectedDateKey.value = dateKey
  router.push({ name: 'Collection', query: { date: dateKey } })
}

onMounted(() => {
  if (checkins.value.length === 0) loadCheckins()
})
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.calendar-page
  display: flex
  flex-direction: column
  padding: 20px 16px 0
  height: 100%
  background-color: #FFFFFB
  background-image: linear-gradient(rgba(155, 155, 130, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(155, 155, 130, 0.15) 1px, transparent 1px)
  background-size: 24px 24px

// 頂部月份切換
.cal-header
  display: flex
  align-items: center
  justify-content: space-between
  margin-bottom: 16px
  padding: 0 4px

.month-title
  margin: 0
  color: $spot-text-primary
  font-weight: bold
  font-size: 20px
  font-family: 'Hachi Maru Pop', cursive

.month-btn
  display: flex
  align-items: center
  justify-content: center
  width: 36px
  height: 36px
  border: none
  border-radius: 50%
  background: none
  color: $spot-text-primary
  font-size: 28px
  line-height: 1
  cursor: pointer
  transition: background 0.15s

  &:active
    background: $camera-border-light

// 星期列
.weekdays
  display: grid
  margin-bottom: 4px

  grid-template-columns: repeat(7, 1fr)

.weekday
  padding: 4px 0
  color: $camera-text-muted
  text-align: center
  font-size: 12px

// 日期格子
.days-grid
  display: grid

  grid-template-columns: repeat(7, 1fr)
  grid-auto-rows: 80px
  gap: 2px

.day-cell
  position: relative
  display: flex
  align-items: center
  flex-direction: column
  justify-content: center
  border-radius: 8px
  cursor: default

  &--has-checkin
    cursor: pointer

  &--selected::before
    position: absolute
    top: 50%
    left: 50%
    z-index: 0
    width: 40px
    height: 40px
    border-radius: 8px
    background: rgba($country-tab-border, 0.12)
    content: ''
    transform: translate(-50%, -50%)

.day-number
  position: relative
  z-index: 1
  color: $camera-text-primary
  font-size: 14px
  line-height: 1

  .day-cell--has-checkin &
    color: #8B4513
    font-weight: bold

  .day-cell--today &
    color: $country-tab-border

.paw-stamp
  position: absolute
  top: 50%
  left: 50%
  width: 40px
  height: 40px
  opacity: 0.4
  transform: translate(-50%, -50%)
  pointer-events: none

  object-fit: contain

.today-bar
  position: absolute
  bottom: 4px
  left: 50%
  width: 16px
  height: 2px
  border-radius: 1px
  background: $country-tab-border
  transform: translateX(-50%)

</style>
