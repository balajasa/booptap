<template>
  <div class="settings">

    <!-- 已登入 -->
    <template v-if="isLoggedIn">

      <!-- 個人簡介 -->
      <div class="profile">
        <div class="profile-avatar" @click="!isUploadingAvatar && fileInput?.click()">
          <img v-if="avatarURL" :src="avatarURL" alt="avatar" class="profile-avatar-img"
            :class="{ 'profile-avatar-img--loading': isUploadingAvatar }" />
          <div v-else class="profile-avatar-placeholder">
            <img src="@/assets/img/icon/navbar/camera.png" class="profile-avatar-camera" alt="" />
          </div>
          <div v-if="isUploadingAvatar" class="profile-avatar-spinner" />
          <div v-else class="profile-avatar-badge">
            <img src="@/assets/img/icon/navbar/camera.png" class="profile-avatar-badge-icon" alt="" />
          </div>
        </div>
        <input type="file" accept="image/*" ref="fileInput" class="file-input" @change="onAvatarChange" />
        <div class="profile-info">
          <p class="profile-title">{{ title }}</p>
          <p class="profile-name">{{ displayName }}</p>
        </div>
      </div>

      <div class="divider" />

      <!-- 設定列表 -->
      <div class="list">
        <button class="row">
          <img src="@/assets/img/icon/navbar/settings.png" class="row-icon" alt="" />
          <span class="row-label">帳號設定</span>
          <img src="@/assets/img/icon/common/arrow_forward_ios.png" class="row-arrow" alt="" />
        </button>

        <div class="divider" />

        <button class="row" @click="handleLogout">
          <img src="@/assets/img/icon/settings/door_back.png" class="row-icon" alt="" />
          <span class="row-label">登出</span>
        </button>
      </div>

    </template>

    <!-- 未登入 -->
    <template v-else>

      <div class="guest">
        <img src="@/assets/img/logo/booptap-logo.png" class="guest-avatar" alt="booptap" />
        <p class="guest-hint">登入以記錄你的足跡</p>
      </div>

      <div class="divider" />

      <div class="list">
        <button class="row" @click="goToLogin">
          <img src="@/assets/img/icon/navbar/settings.png" class="row-icon" alt="" />
          <span class="row-label">登入 / 註冊</span>
          <img src="@/assets/img/icon/common/arrow_forward_ios.png" class="row-arrow" alt="" />
        </button>
      </div>

    </template>

    <!-- 版本資訊 -->
    <div class="footer">
      <p class="footer-text">booptap v0.0.1</p>
      <p class="footer-text">© 2026</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue'
import { getUserTitle } from '@/composables/useUserTitle'
import { useRouter } from 'vue-router'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, getCountFromServer } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useDialog } from '@/composables/useDialog'
import type { UserProfile } from '@/types/user'

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const router = useRouter()
const dialog = useDialog()

const isLoggedIn = ref(false)
const displayName = ref('')
const avatarURL = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const checkinCount = ref(0)
const userRole = ref<UserProfile['role']>('user')

const title = computed(() => getUserTitle(userRole.value, checkinCount.value))

const unsubscribe = onAuthStateChanged(auth, async (user) => {
  if (user) {
    isLoggedIn.value = true
    const [userDoc, countSnapshot] = await Promise.all([
      getDoc(doc(db, 'users', user.uid)),
      getCountFromServer(collection(db, 'checkins_sp')),
    ])
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile
      displayName.value = data.userID
      avatarURL.value = data.photoURL ?? null
      userRole.value = data.role
    }
    checkinCount.value = countSnapshot.data().count
  } else {
    isLoggedIn.value = false
    displayName.value = ''
    avatarURL.value = null
    checkinCount.value = 0
    userRole.value = 'user'
  }
})

onUnmounted(() => unsubscribe())

const isUploadingAvatar = ref(false)

async function onAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  avatarURL.value = URL.createObjectURL(file)
  isUploadingAvatar.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('folder', 'user_photo')

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    if (!res.ok) throw new Error('上傳失敗')

    const data = await res.json()
    const url = data.secure_url as string

    const user = auth.currentUser
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
      avatarURL.value = url
    }
  } catch {
    avatarURL.value = null
  } finally {
    isUploadingAvatar.value = false
  }
}

function goToLogin() {
  router.push('/login')
}

async function handleLogout() {
  const confirmed = await dialog.confirm({
    title: '登出',
    message: '確定要登出嗎？',
    confirmText: '登出',
    cancelText: '取消',
    blur: true,
  })
  if (!confirmed) return
  await signOut(auth)
  router.replace('/login')
}
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.settings
  display: flex
  flex-direction: column
  box-sizing: border-box
  margin: 0 auto
  padding: 42px 36px
  min-height: 100%
  max-width: 480px

// 已登入：個人簡介
.profile
  display: flex
  align-items: center
  padding: 8px 0 24px

  gap: 16px

.profile-avatar
  position: relative
  overflow: visible
  flex-shrink: 0
  width: 96px
  height: 96px
  border-radius: 50%
  background: $camera-border-light
  cursor: pointer

.profile-avatar-img
  width: 96px
  height: 96px
  border-radius: 50%

  object-fit: cover

  &--loading
    opacity: 0.4

.profile-avatar-spinner
  position: absolute
  top: 50%
  left: 50%
  margin: -12px 0 0 -12px
  width: 24px
  height: 24px
  border: 2px solid $camera-border-light
  border-top-color: $country-tab-border
  border-radius: 50%
  animation: spin 0.8s linear infinite

@keyframes spin
  to
    transform: rotate(360deg)

.profile-avatar-placeholder
  display: flex
  align-items: center
  justify-content: center
  width: 96px
  height: 96px
  border-radius: 50%
  background: $camera-border-light

.profile-avatar-camera
  width: 28px
  height: 28px
  opacity: 0.3
  filter: brightness(0)

  object-fit: contain

.profile-avatar-badge
  position: absolute
  right: 0
  bottom: 0
  display: flex
  align-items: center
  justify-content: center
  width: 26px
  height: 26px
  border: 2px solid #fff
  border-radius: 50%
  background: $country-tab-border

.profile-avatar-badge-icon
  width: 13px
  height: 13px
  filter: brightness(0) invert(1)

  object-fit: contain

.file-input
  display: none

.profile-name
  margin: 0
  color: $camera-text-primary
  font-weight: 700
  font-size: 18px

.profile-title
  margin: 4px 0 0
  color: $camera-text-muted
  font-size: 13px

// 未登入
.guest
  display: flex
  align-items: center
  flex-direction: column
  padding: 8px 0 24px

  gap: 16px

.guest-avatar
  width: 96px
  height: 96px
  border-radius: 50%

  object-fit: cover

.guest-hint
  margin: 0
  color: $camera-text-muted
  font-size: 14px

// 分隔線
.divider
  margin: 0 -4px
  height: 1px
  background: $camera-border-light

// 列表
.list
  display: flex
  flex-direction: column

.row
  display: flex
  align-items: center
  padding: 18px 4px
  width: 100%
  border: none
  background: none
  cursor: pointer
  transition: background 0.15s

  gap: 16px

  &:active
    background: $camera-border-muted

.row-icon
  flex-shrink: 0
  width: 22px
  height: 22px
  opacity: 0.6
  filter: brightness(0)

  object-fit: contain

.row-label
  flex: 1
  color: $camera-text-primary
  text-align: left
  font-size: 15px

.row-arrow
  flex-shrink: 0
  width: 16px
  height: 16px
  opacity: 0.25
  filter: brightness(0)

  object-fit: contain

// 版本資訊
.footer
  display: flex
  align-items: center
  flex-direction: column
  margin-top: auto
  padding-top: 32px

  gap: 2px

.footer-text
  margin: 0
  color: $camera-text-muted
  font-size: 12px
</style>
