<template>
  <div class="collection">

    <!-- 載入中 / 錯誤 / 空白 -->
    <div v-if="isLoading" class="status-msg">載入中...</div>
    <div v-else-if="error" class="status-msg status-msg--error">{{ error }}</div>
    <div v-else-if="groupedDays.length === 0" class="status-msg">還沒有打卡記錄</div>

    <!-- 日記頁面 -->
    <div v-else class="diary">

      <!-- 導航列 -->
      <div v-if="currentDay" class="diary-nav">
        <div class="nav-btn-group">
          <button class="nav-btn" @click="firstDay" :disabled="currentIndex === 0">
            <img src="@/assets/img/icon/common/arrow_left_double.png" class="nav-icon" alt="第一頁" />
          </button>
          <button class="nav-btn" @click="prevDay" :disabled="currentIndex === 0">
            <img src="@/assets/img/icon/common/arrow_left_key.png" class="nav-icon" alt="上一頁" />
          </button>
        </div>
        <div class="nav-center">
          <p class="nav-day">Day {{ groupedDays.length - currentIndex }}</p>
        </div>
        <div class="nav-btn-group">
          <button class="nav-btn" @click="nextDay" :disabled="currentIndex === groupedDays.length - 1">
            <img src="@/assets/img/icon/common/arrow_right_key.png" class="nav-icon" alt="下一頁" />
          </button>
          <button class="nav-btn" @click="lastDay" :disabled="currentIndex === groupedDays.length - 1">
            <img src="@/assets/img/icon/common/arrow_right_double.png" class="nav-icon" alt="最後一頁" />
          </button>
        </div>
      </div>

      <!-- 頁面內容（flip 動畫） -->
      <div v-if="currentDay && currentCheckin" class="page-wrapper" :class="fadeClass" :key="currentIndex">

        <DiaryDecorations :seed="currentIndex * 100 + currentPhotoIndex" />

        <!-- 內容捲動區 -->
        <div class="page-content">

          <!-- 拍立得照片 -->
          <div class="polaroid">
            <img :src="optimizeImageUrl(currentCheckin.photoURL)" class="polaroid-photo" alt="打卡照片" />
          </div>

          <!-- 資訊 -->
          <div class="info">
            <div v-if="currentCheckin.message" class="info-message-wrap">
              <p class="info-message">{{ currentCheckin.message }}</p>
            </div>
            <div v-if="currentCheckin.hashtags?.length" class="info-hashtags">
              <span v-for="tag in currentCheckin.hashtags" :key="tag" class="info-tag">#{{ tag }}</span>
            </div>
            <div v-if="currentCheckin.locationName" class="info-row">
              <img src="@/assets/img/icon/location_pin.png" class="info-icon" alt="" />
              <span>{{ currentCheckin.locationName }}</span>
            </div>
            <div class="info-row info-row--times">
              <img src="@/assets/img/icon/near_me.png" class="info-icon info-icon--top" alt="" />
              <div class="info-times">
                <div class="info-time-row">
                  <span class="info-time-label">當地時間</span>
                  <span>{{ formatTime(currentCheckin.createdAt, currentCheckin.timezone) }} <span
                      class="info-time-offset">{{ getTimezoneOffset(currentCheckin.createdAt, currentCheckin.timezone)
                      }}</span></span>
                </div>
                <div class="info-time-row">
                  <span class="info-time-label">台灣時間</span>
                  <span>{{ formatTime(currentCheckin.createdAt, 'Asia/Taipei') }} <span
                      class="info-time-offset">UTC+8</span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 縮圖列（同一天多張才顯示） -->
          <div v-if="currentDay.checkins.length > 1" class="thumbnails-wrap">
            <div class="thumbnails">
              <button v-for="(item, i) in currentDay.checkins" :key="item.id" class="thumbnail-btn"
                :class="{ 'thumbnail-btn--active': i === currentPhotoIndex }" @click="currentPhotoIndex = i">
                <img :src="optimizeImageUrl(item.photoURL)" class="thumbnail-img" alt="" />
              </button>
            </div>
            <div v-if="currentDay.checkins.length > 5" class="thumbnails-fade" />
          </div>

        </div><!-- end page-content -->
      </div><!-- end page-wrapper -->
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { optimizeImageUrl } from '@/services/checkin/checkinService'
import type { Checkin } from '@/types/checkin/checkin'
import DiaryDecorations from '@/components/DiaryDecorations.vue'

const store = useCheckinStore()
const { isLoading, error, loadCheckins } = store
const checkins = store.checkins

interface DayGroup {
  dateKey: string
  dateLabel: string
  checkins: Checkin[]
}

// 按日期（當地時區）分組
const groupedDays = computed<DayGroup[]>(() => {
  const map = new Map<string, Checkin[]>()

  for (const item of checkins.value) {
    const key = new Intl.DateTimeFormat('zh-TW', {
      timeZone: item.timezone || 'Asia/Taipei',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(item.createdAt)

    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([key, items]) => ({
      dateKey: key,
      dateLabel: formatDateLabel(items[0]!.createdAt, items[0]!.timezone),
      checkins: items,
    }))
})

function formatDateLabel(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'Asia/Taipei',
    month: 'short',
    day: '2-digit',
  }).format(date).toUpperCase()
}

const currentIndex = ref(0)
const currentPhotoIndex = ref(0)
const fadeClass = ref('')

const currentDay = computed(() => groupedDays.value[currentIndex.value] ?? null)
const currentCheckin = computed(() => currentDay.value?.checkins[currentPhotoIndex.value] ?? null)

function triggerFade(callback: () => void) {
  fadeClass.value = 'fade-out'
  setTimeout(() => {
    callback()
    currentPhotoIndex.value = 0
    fadeClass.value = 'fade-in'
    setTimeout(() => { fadeClass.value = '' }, 300)
  }, 300)
}

function firstDay() {
  if (currentIndex.value === 0) return
  triggerFade(() => { currentIndex.value = 0 })
}

function prevDay() {
  if (currentIndex.value === 0) return
  triggerFade(() => { currentIndex.value-- })
}

function nextDay() {
  if (currentIndex.value === groupedDays.value.length - 1) return
  triggerFade(() => { currentIndex.value++ })
}

function lastDay() {
  if (currentIndex.value === groupedDays.value.length - 1) return
  triggerFade(() => { currentIndex.value = groupedDays.value.length - 1 })
}

function getTimezoneOffset(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  })
  const parts = formatter.formatToParts(date)
  return parts.find(p => p.type === 'timeZoneName')?.value ?? ''
}

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: timezone || 'Asia/Taipei',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

onMounted(() => {
  loadCheckins()
})
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.collection
  display: flex
  overflow: hidden
  flex-direction: column
  height: 100%

.status-msg
  padding: 48px 36px
  color: $camera-text-secondary
  font-size: 14px
  &--error
    color: $camera-error

// 日記容器
.diary
  display: flex
  flex-direction: column
  height: 100%
  // 方格紙背景
  background-color: #FFFFFB
  background-image: linear-gradient(rgba(155, 155, 130, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(155, 155, 130, 0.15) 1px, transparent 1px)
  background-size: 24px 24px

// 導航列
.diary-nav
  display: flex
  align-items: center
  flex-shrink: 0
  justify-content: space-between
  padding: 16px 24px 8px
  background: #F7F7F1

.nav-btn-group
  display: flex
  align-items: center

  gap: 2px

.nav-btn
  display: flex
  align-items: center
  justify-content: center
  width: 36px
  height: 36px
  border: none
  border-radius: 50%
  background: none
  cursor: pointer
  transition: background 0.15s

  &:active:not(:disabled)
    background: $camera-border-light

  &:disabled
    opacity: 0.25
    cursor: not-allowed

.nav-icon
  width: 20px
  height: 20px
  filter: brightness(0)

  object-fit: contain

.nav-center
  display: flex
  align-items: center
  flex-direction: column

  gap: 2px

.nav-date
  margin: 0
  color: $camera-text-muted
  font-size: 14px
  font-family: 'Schoolbell', cursive
  line-height: 1

.nav-day
  margin: 0
  color: $spot-text-primary
  font-weight: bold
  font-size: 26px
  font-family: 'Hachi Maru Pop', cursive
  line-height: 1.2

// 頁面內容
.page-wrapper
  position: relative
  display: flex
  overflow: hidden
  flex: 1
  flex-direction: column
  margin: 0 auto
  max-width: 480px
  width: 100%

.page-content
  position: relative
  z-index: 1
  display: flex
  overflow-y: auto
  flex: 1
  flex-direction: column
  padding: 24px 28px

  gap: 16px

// Fade 動畫
.fade-out
  animation: fadeOut 0.3s ease forwards

.fade-in
  animation: fadeIn 0.3s ease forwards

@keyframes fadeOut
  from
    opacity: 1
  to
    opacity: 0

@keyframes fadeIn
  from
    opacity: 0
  to
    opacity: 1

// 拍立得
.polaroid
  position: relative
  align-self: center
  flex-shrink: 0
  padding: 12px 12px 36px
  max-width: 320px
  width: 85%
  background: white
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15)

.polaroid-photo
  display: block
  width: 100%
  background: white

  aspect-ratio: 1
  object-fit: contain

// 資訊
.info
  display: flex
  align-self: center
  flex-direction: column
  margin-top: 8px
  max-width: 320px
  width: 85%

  gap: 8px

.info-row
  display: flex
  align-items: center
  color: $camera-text-secondary
  font-size: 13px

  gap: 6px

.info-icon
  flex-shrink: 0
  width: 14px
  height: 14px
  opacity: 0.5
  filter: brightness(0)

  object-fit: contain

.info-icon--top
  align-self: flex-start

.info-times
  display: flex
  flex-direction: column

  gap: 2px

.info-time-row
  display: flex
  color: $camera-text-secondary
  font-size: 13px

  gap: 6px

.info-time-label
  flex-shrink: 0

.info-time-offset
  font-size: 12px

.info-note
  margin-bottom: 4px
  padding: 10px 12px
  border-left: 3px solid $country-tab-border
  border-radius: 2px
  background: rgba(255, 255, 255, 0.7)

.info-message-wrap
  margin-bottom: 8px

.info-message
  margin: 0
  color: $camera-text-primary
  font-size: 14px
  line-height: 1.6

.info-hashtags
  display: flex
  flex-wrap: wrap
  margin-top: 4px

  gap: 6px

.info-tag
  color: $country-tab-border
  font-size: 13px

// 縮圖列
.thumbnails-wrap
  position: relative
  margin-top: auto

.thumbnails
  display: flex
  overflow-x: auto
  padding-bottom: 4px

  gap: 8px
  scrollbar-width: none
  &::-webkit-scrollbar
    display: none

.thumbnails-fade
  position: absolute
  top: 0
  right: 0
  width: 48px
  height: 100%
  background: linear-gradient(to right, transparent, #FFFFFB)
  pointer-events: none

.thumbnail-btn
  flex-shrink: 0
  padding: 3px
  width: 56px
  height: 56px
  border: 2px solid transparent
  border-radius: 6px
  background: white
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1)
  cursor: pointer
  transition: border-color 0.15s

  &--active
    border-color: $country-tab-border

.thumbnail-img
  width: 100%
  height: 100%
  border-radius: 3px

  object-fit: cover

</style>
