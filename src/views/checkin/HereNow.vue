<template>
  <div class="herenow">

    <!-- 標題 -->
    <h2 class="page-title">Here, Now, in CANADA</h2>

    <!-- 照片區塊 -->
    <div class="photo-block">
      <div class="photo-block-toolbar">
        <button class="photo-btn" @click="fileInput?.click()">
          <img src="@/assets/img/icon/navbar/camera.png" class="btn-icon" alt="" />
          {{ form.photo ? '重新選擇' : '選擇照片' }}
        </button>
      </div>
      <input type="file" accept="image/*" @change="onFileChange" ref="fileInput" class="file-input" />
      <img v-if="previewURL" :src="previewURL" class="photo-preview" alt="預覽" />
    </div>

    <!-- 心情 + Hashtag -->
    <div class="content-card">
      <textarea v-model="form.message" maxlength="500" rows="3" placeholder="分享此刻心情......" class="mood-input" />
      <div class="content-card-divider" />
      <input v-model="hashtagInput" type="text" maxlength="100" placeholder="#新增標籤" class="hashtag-input" />
    </div>

    <!-- 地點 + 時間 rows -->
    <div class="row-list">
      <button class="row" @click="toggleLocation" :disabled="locating">
        <img src="@/assets/img/icon/location_pin.png" class="row-icon" alt="" />
        <span class="row-label">
          <span v-if="locating">定位中...</span>
          <span v-else-if="locationAddress">{{ locationAddress }}</span>
          <span v-else-if="locationExpanded">收起地點</span>
          <span v-else>新增地點</span>
        </span>
        <img src="@/assets/img/icon/common/arrow_forward_ios.png" class="row-arrow"
          :class="{ 'row-arrow--open': locationExpanded }" alt="" />
      </button>

      <div v-if="locationExpanded" class="location-expanded">
        <div v-if="form.lat !== null" ref="mapEl" class="map"></div>
        <p v-if="form.lat !== null" class="map-hint">可拖曳標記微調位置</p>
        <input v-model="form.locationName" type="text" maxlength="50" placeholder="地點名稱" class="location-name-input" />
      </div>
    </div>

    <div class="row-list">
      <div class="time-group">
        <div class="row row--static">
          <span class="row-label row-label--muted">現在時間</span>
          <span class="row-value">{{ localTime }}</span>
        </div>
        <div class="row row--static">
          <span class="row-label row-label--muted">台灣時間</span>
          <span class="row-value">{{ taiwanTime }}</span>
        </div>
      </div>
    </div>

    <!-- 錯誤訊息 -->
    <p v-if="checkinStore.error" class="error-msg">{{ checkinStore.error }}</p>

    <!-- 打卡按鈕 -->
    <button class="submit-btn" @click="submit" :disabled="checkinStore.isSubmitting.value">
      {{ checkinStore.isSubmitting.value ? '上傳中...' : '分享' }}
    </button>

    <!-- 重置按鈕 -->
    <button class="reset-btn" @click="resetForm">
      重置
    </button>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useCheckinStore } from '@/stores/useCheckinStore'
import { fetchLocationName } from '@/services/checkin/checkinService'
import { useDialog } from '@/composables/useDialog'
import { auth } from '@/firebase'
import type { CheckinFormData } from '@/types/checkin/checkin'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow })

const router = useRouter()
const checkinStore = useCheckinStore()
const dialog = useDialog()

const form = ref<CheckinFormData>({
  message: '',
  hashtags: [],
  lat: null,
  lng: null,
  locationName: '',
  locationAddress: '',
  timezone: '',
  photo: null,
})

const hashtagInput = ref('')
const locating = ref(false)
const locationAddress = ref('')
const locationExpanded = ref(false)
const previewURL = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const mapEl = ref<HTMLElement | null>(null)

let mapInstance: L.Map | null = null
let marker: L.Marker | null = null

interface LastCheckin {
  locationName: string
  localTime: string
  timezone: string
}
const lastCheckin = ref<LastCheckin | null>(null)
const taiwanTime = ref('')
const localTime = ref('')
let timer: ReturnType<typeof setInterval> | null = null

function updateTimes() {
  const now = new Date()
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  localTime.value = formatTime(now, timezone)
  taiwanTime.value = formatTime(now, 'Asia/Taipei')
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('zh-TW', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

async function updateLocation(lat: number, lng: number) {
  form.value.lat = lat
  form.value.lng = lng
  locationAddress.value = ''
  form.value.locationAddress = ''
  const name = await fetchLocationName(lat, lng)
  locationAddress.value = name
  form.value.locationAddress = name
}

async function initMap() {
  await nextTick()
  if (!mapEl.value || form.value.lat === null || form.value.lng === null) return

  if (mapInstance) {
    mapInstance.remove()
    mapInstance = null
  }

  mapInstance = L.map(mapEl.value).setView([form.value.lat, form.value.lng], 16)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(mapInstance)

  marker = L.marker([form.value.lat, form.value.lng], { draggable: true }).addTo(mapInstance)
  marker.on('dragend', async () => {
    const pos = marker!.getLatLng()
    await updateLocation(pos.lat, pos.lng)
  })
}

async function getLocation() {
  if (!navigator.geolocation) {
    alert('你的瀏覽器不支援 GPS 定位')
    return
  }
  locating.value = true
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      await updateLocation(pos.coords.latitude, pos.coords.longitude)
      locating.value = false
      await initMap()
    },
    () => {
      locating.value = false
    }
  )
}

async function toggleLocation() {
  if (locationExpanded.value) {
    locationExpanded.value = false
    return
  }
  locationExpanded.value = true
  if (form.value.lat === null) {
    await getLocation()
  } else {
    await nextTick()
    await initMap()
  }
}

function resetForm() {
  form.value = { message: '', hashtags: [], lat: null, lng: null, locationName: '', locationAddress: '', timezone: '', photo: null }
  previewURL.value = null
  if (fileInput.value) fileInput.value.value = ''
  hashtagInput.value = ''
  locationAddress.value = ''
  locationExpanded.value = false
  lastCheckin.value = null
  if (mapInstance) { mapInstance.remove(); mapInstance = null }
}

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const MAX = 1920
      const ratio = Math.min(1, MAX / img.width, MAX / img.height)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: 'image/jpeg' }) : file),
        'image/jpeg',
        0.9
      )
    }
    img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(file) }
    img.src = objectUrl
  })
}

async function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const compressed = await compressImage(file)
  form.value.photo = compressed
  previewURL.value = URL.createObjectURL(compressed)
}

async function submit() {
  if (!auth.currentUser) {
    const confirmed = await dialog.confirm({
      title: '請登入',
      message: '打卡需要登入帳號才能儲存你的足跡',
      confirmText: '登入',
      cancelText: '取消',
      blur: true,
    })
    if (confirmed) router.push('/login')
    return
  }

  lastCheckin.value = null
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    form.value.hashtags = hashtagInput.value
      .split(/\s+/)
      .map(t => t.replace(/^#/, '').trim())
      .filter(t => t.length > 0)
    await checkinStore.submitCheckin(form.value)
    const now = new Date()
    const localTime = formatTime(now, timezone)
    lastCheckin.value = {
      locationName: form.value.locationName,
      localTime,
      timezone,
    }
    form.value = {
      message: '',
      hashtags: [],
      lat: form.value.lat,
      lng: form.value.lng,
      locationName: form.value.locationName,
      locationAddress: form.value.locationAddress,
      timezone: '',
      photo: null,
    }
    previewURL.value = null
    if (fileInput.value) fileInput.value.value = ''
    hashtagInput.value = ''
    await dialog.alert({
      title: '打卡成功',
      message: `${form.value.locationName || locationAddress.value || '未知地點'}\n${localTime}`,
      confirmText: '好的',
    })
    router.push({ name: 'Collection' })
  } catch {
    // error 已由 store 處理
  }
}

onMounted(() => {
  updateTimes()
  timer = setInterval(updateTimes, 1000)
})
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

$caramel: #C07D45

.herenow
  display: flex
  flex-direction: column
  box-sizing: border-box
  margin: 0 auto
  padding: 42px 36px
  min-height: 100%
  max-width: 480px
  background-color: #FAF8F3
  background-image: repeating-linear-gradient(transparent, transparent 31px, rgba(180, 160, 130, 0.18) 31px, rgba(180, 160, 130, 0.18) 32px)
  background-attachment: local

  gap: 14px

// 照片區塊
.photo-block
  display: flex
  flex-direction: column

  gap: 8px

.file-input
  display: none

.photo-btn
  display: flex
  align-items: center
  flex-direction: column
  justify-content: center
  padding: 20px 0
  width: 100%
  border: 1.5px dashed rgba(180, 160, 130, 0.6)
  border-radius: 8px
  background: rgba(255, 255, 255, 0.8)
  color: $camera-text-muted
  font-size: 13px
  cursor: pointer
  transition: border-color 0.2s, background 0.2s

  gap: 8px

  &:active
    background: rgba(255, 255, 255, 0.95)

.btn-icon
  width: 24px
  height: 24px
  opacity: 0.35
  filter: brightness(0)

  object-fit: contain

.neutral-icon
  width: 18px
  height: 18px
  opacity: 0.75
  filter: grayscale(1) brightness(0) invert(1) brightness(0.55)

  object-fit: contain

.reset-btn
  padding: 8px 0
  width: 100%
  border: 1.5px solid rgba(160, 140, 110, 0.5)
  border-radius: 12px
  background: rgba(255, 255, 255, 0.6)
  color: $camera-text-secondary
  text-align: center
  font-size: 14px
  cursor: pointer
  transition: color 0.2s, border-color 0.2s, background 0.2s

  &:active
    border-color: $camera-text-secondary
    background: rgba(255, 255, 255, 0.8)
    color: $camera-text-primary

.time-group
  display: flex
  flex-direction: column

  .row
    padding: 8px 0

// Row 樣式
.row-list
  display: flex
  flex-direction: column
  padding: 0 12px
  border-radius: 8px
  background: rgba(255, 255, 255, 0.92)

.row
  display: flex
  align-items: center
  padding: 16px 0
  width: 100%
  border: none
  background: none
  cursor: pointer
  transition: opacity 0.15s

  gap: 12px

  &:active
    opacity: 0.6

  &--static
    cursor: default

    &:active
      opacity: 1

.row-icon
  flex-shrink: 0
  width: 20px
  height: 20px
  opacity: 0.65
  filter: brightness(0)

  object-fit: contain

.row-label
  flex: 1
  color: $camera-text-primary
  text-align: left
  font-size: 15px

  &--muted
    color: $camera-text-secondary
    font-size: 13px

.row-value
  color: $camera-text-primary
  font-weight: 500
  font-size: 13px

.row-arrow
  flex-shrink: 0
  width: 16px
  height: 16px
  opacity: 0.25
  filter: brightness(0)
  transition: transform 0.2s

  object-fit: contain

  &--open
    transform: rotate(90deg)

.divider
  height: 1px
  background: $camera-border-light

.photo-preview
  max-height: 320px
  width: 100%
  border-radius: 12px

  object-fit: cover

// 頁面標題
.page-title
  margin: 0
  color: $spot-text-primary
  text-align: left
  font-weight: normal
  font-size: 26px
  font-family: 'Itim', cursive
  line-height: 1.3

// 共用標題
.field-group
  display: flex
  flex-direction: column

  gap: 6px

.field-label
  color: $camera-text-primary
  font-weight: 500
  font-size: 13px

// 心情 + Hashtag
.content-card
  display: flex
  flex-direction: column
  padding: 0 12px
  border-radius: 8px
  background: rgba(255, 255, 255, 0.92)

.content-card-divider
  height: 1px
  background: rgba(180, 160, 130, 0.2)

.mood-input
  box-sizing: border-box
  padding: 12px 0
  width: 100%
  border: none
  border-bottom: 1.5px solid rgba(180, 160, 130, 0.35)
  background: rgba(255, 255, 255, 0.75)
  color: $camera-text-primary
  font-size: 15px
  line-height: 1.6
  resize: none
  transition: border-color 0.2s, box-shadow 0.2s

  &::placeholder
    color: rgba(160, 140, 110, 0.6)

  &:focus
    outline: none
    border-bottom-color: $caramel
    box-shadow: 0 2px 0 rgba(192, 125, 69, 0.15)

.hashtag-input
  box-sizing: border-box
  padding: 12px 0
  width: 100%
  border: none
  border-bottom: 1.5px solid rgba(180, 160, 130, 0.35)
  background: rgba(255, 255, 255, 0.75)
  color: $camera-text-primary
  font-size: 15px
  transition: border-color 0.2s, box-shadow 0.2s

  &::placeholder
    color: rgba(160, 140, 110, 0.6)

  &:focus
    outline: none
    border-bottom-color: $caramel
    box-shadow: 0 2px 0 rgba(192, 125, 69, 0.15)

// 地點區塊
.location-block
  display: flex
  flex-direction: column

  gap: 16px

.add-location-btn
  display: flex
  align-items: center
  justify-content: space-between
  box-sizing: border-box
  padding: 8px 16px
  width: 100%
  border: 1.5px solid $camera-border-light
  border-radius: 12px
  background: #ffffff
  color: $camera-neutral
  font-weight: 600
  font-size: 15px
  cursor: pointer
  transition: border-color 0.2s, color 0.2s

  &:hover:not(:disabled)
    border-color: rgba($country-tab-border, 0.5)
    color: $country-tab-border

  &:disabled
    opacity: 0.5
    cursor: not-allowed

.arrow-icon
  width: 18px
  height: 18px
  opacity: 0.4
  transition: transform 0.2s
  &--open
    transform: rotate(90deg)

.location-expanded
  display: flex
  flex-direction: column

  gap: 8px

.map
  overflow: hidden
  width: 100%
  height: 220px
  border-radius: 12px

.map-hint
  margin: 0
  color: $camera-text-light
  font-size: 12px

.location-name-input
  box-sizing: border-box
  padding: 8px 16px
  width: 100%
  border: 1.5px solid $camera-border-light
  border-radius: 12px
  background: #ffffff
  color: $camera-text-primary
  font-size: 14px
  transition: border-color 0.2s

  &::placeholder
    color: $camera-text-muted

  &:focus
    outline: none
    border-color: rgba($country-tab-border, 0.5)

.address-row
  display: flex
  align-items: center
  color: $camera-text-secondary
  font-size: 13px

  gap: 8px

  &--loading
    color: $camera-text-muted

.address-icon
  flex-shrink: 0
  width: 16px
  height: 16px

  object-fit: contain

.address-text
  line-height: 1.4

// 時間區塊
.time-block
  display: flex
  flex-direction: column

  gap: 4px

.time-row
  display: flex
  align-items: center
  justify-content: space-between

.time-label
  color: $camera-text-secondary
  font-size: 13px

.time-value
  color: $camera-text-primary
  font-size: 13px

// 錯誤
.error-msg
  margin: 0
  color: #D32F2F
  font-size: 13px

// 打卡按鈕
.submit-btn
  padding: 8px 16px
  width: 100%
  border: none
  border-radius: 12px
  background: $country-tab-border
  color: #fff
  letter-spacing: 0.5px
  font-weight: 700
  font-size: 16px
  cursor: pointer
  transition: background 0.2s, opacity 0.2s

  &:hover:not(:disabled)
    background: rgba(0, 92, 175, 0.85)

  &:disabled
    opacity: 0.45
    cursor: not-allowed
</style>
