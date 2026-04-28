<template>
  <div class="account-settings">

    <!-- Header -->
    <div class="header">
      <button class="back-btn" @click="router.back()">
        <img src="@/assets/img/icon/common/arrow_back_ios.png" class="back-icon" alt="返回" />
      </button>
      <h1 class="header-title">帳號設定</h1>
    </div>

    <div class="body">

      <!-- 頭像 -->
      <div class="avatar-wrap" @click="!isUploadingAvatar && fileInput?.click()">
        <div class="avatar">
          <img v-if="avatarURL" :src="avatarURL" class="avatar-img"
            :class="{ 'avatar-img--loading': isUploadingAvatar }" alt="avatar" />
          <div v-else class="avatar-placeholder">
            <img src="@/assets/img/icon/navbar/camera.png" class="avatar-placeholder-icon" alt="" />
          </div>
          <div v-if="isUploadingAvatar" class="avatar-spinner" />
          <div v-else class="avatar-badge">
            <img src="@/assets/img/icon/navbar/camera.png" class="avatar-badge-icon" alt="" />
          </div>
        </div>
        <p class="avatar-hint">點擊更換照片</p>
      </div>
      <input type="file" accept="image/*" ref="fileInput" class="file-input" @change="onAvatarChange" />

      <!-- 表單 -->
      <div class="form">

        <!-- 顯示名稱 -->
        <div class="card">
          <div class="card-row">
            <span class="card-label">顯示名稱</span>
            <template v-if="isEditingName">
              <input v-model="userIDInput" type="text" maxlength="20" placeholder="輸入顯示名稱" class="card-input"
                ref="nameInput" />
              <button class="card-icon-btn" @click="save" :disabled="!hasChanges || isSaving">
                <img src="@/assets/img/icon/common/check_c.png" class="card-icon card-icon--check" alt="儲存" />
              </button>
              <button class="card-icon-btn card-icon-btn--cancel" @click="cancelEdit">
                <img src="@/assets/img/icon/common/close_c.png" class="card-icon card-icon--close" alt="取消" />
              </button>
            </template>
            <template v-else>
              <span class="card-value">{{ originalUserID }}</span>
              <button class="card-icon-btn" @click="startEdit">
                <img src="@/assets/img/icon/common/edit.png" class="card-icon" alt="編輯" />
              </button>
            </template>
          </div>
        </div>

        <!-- 電子郵件 -->
        <div class="card">
          <div class="card-row">
            <span class="card-label">電子郵件</span>
            <span class="card-value card-value--muted">{{ email }}</span>
          </div>
        </div>

      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import { useDialog } from '@/composables/useDialog'
import type { UserProfile } from '@/types/user'

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const router = useRouter()
const dialog = useDialog()

const email = ref('')
const userIDInput = ref('')
const originalUserID = ref('')
const avatarURL = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const nameInput = ref<HTMLInputElement | null>(null)
const isUploadingAvatar = ref(false)
const isSaving = ref(false)
const isEditingName = ref(false)

const hasChanges = computed(() => userIDInput.value.trim() !== originalUserID.value)

function startEdit() {
  isEditingName.value = true
  nextTick(() => nameInput.value?.focus())
}

function cancelEdit() {
  userIDInput.value = originalUserID.value
  isEditingName.value = false
}

const unsubscribe = onAuthStateChanged(auth, async (user) => {
  if (!user) { router.replace('/settings'); return }
  email.value = user.email ?? ''
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  if (userDoc.exists()) {
    const data = userDoc.data() as UserProfile
    userIDInput.value = data.userID
    originalUserID.value = data.userID
    avatarURL.value = data.photoURL ?? null
  }
})

onUnmounted(() => unsubscribe())

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
    await dialog.confirm({
      title: '上傳失敗',
      message: '頭像上傳失敗，請稍後再試',
      confirmText: '確定',
      cancelText: '',
      blur: true,
    })
    avatarURL.value = null
  } finally {
    isUploadingAvatar.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

async function save() {
  const newUserID = userIDInput.value.trim()
  if (!newUserID || isSaving.value) return

  isSaving.value = true
  try {
    const user = auth.currentUser
    if (!user) return
    await updateDoc(doc(db, 'users', user.uid), { userID: newUserID })
    originalUserID.value = newUserID
    isEditingName.value = false
  } catch {
    await dialog.confirm({
      title: '儲存失敗',
      message: '儲存失敗，請稍後再試',
      confirmText: '確定',
      cancelText: '',
      blur: true,
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.account-settings
  display: flex
  flex-direction: column
  box-sizing: border-box
  min-height: 100%
  background: $camera-bg-primary

// Header
.header
  display: flex
  align-items: center
  flex-shrink: 0
  padding: 16px 20px
  border-bottom: 1px solid $camera-border-light

  gap: 4px

.back-btn
  display: flex
  align-items: center
  justify-content: center
  padding: 4px
  width: 36px
  height: 36px
  border: none
  border-radius: 50%
  background: none
  cursor: pointer
  transition: background 0.15s

  &:active
    background: $camera-border-light

.back-icon
  width: 18px
  height: 18px
  filter: brightness(0)

  object-fit: contain

.header-title
  margin: 0
  color: $camera-text-primary
  font-weight: 600
  font-size: 17px

// Body
.body
  display: flex
  overflow-y: auto
  align-items: center
  align-self: center
  flex: 1
  flex-direction: column
  box-sizing: border-box
  padding: 36px 36px 48px
  max-width: 480px
  width: 100%

  gap: 32px

// 頭像
.avatar-wrap
  display: flex
  align-items: center
  flex-direction: column
  cursor: pointer

  gap: 10px

.avatar
  position: relative
  width: 96px
  height: 96px

.avatar-img
  width: 96px
  height: 96px
  border-radius: 50%

  object-fit: cover

  &--loading
    opacity: 0.4

.avatar-placeholder
  display: flex
  align-items: center
  justify-content: center
  width: 96px
  height: 96px
  border-radius: 50%
  background: $camera-border-light

.avatar-placeholder-icon
  width: 28px
  height: 28px
  opacity: 0.3
  filter: brightness(0)

  object-fit: contain

.avatar-spinner
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

.avatar-badge
  position: absolute
  right: 0
  bottom: 0
  display: flex
  align-items: center
  justify-content: center
  width: 26px
  height: 26px
  border: 2px solid $camera-bg-primary
  border-radius: 50%
  background: $country-tab-border

.avatar-badge-icon
  width: 13px
  height: 13px
  filter: brightness(0) invert(1)

  object-fit: contain

.avatar-hint
  margin: 0
  color: $camera-text-muted
  font-size: 12px

.file-input
  display: none

// 表單
.form
  display: flex
  flex-direction: column
  width: 100%

  gap: 12px

// 卡片
.card
  overflow: hidden
  border-radius: 12px
  background: #fff
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06)

.card-row
  display: flex
  align-items: center
  padding: 14px 16px

  gap: 12px

.card-label
  flex-shrink: 0
  // min-width: 60px
  color: $camera-text-secondary
  font-size: 14px

.card-value
  flex: 1
  color: $camera-text-primary
  font-size: 15px

  &--muted
    color: $camera-text-muted

.card-input
  flex: 1
  padding: 0
  max-width: 152px
  border: none
  background: transparent
  color: $camera-text-primary
  font-size: 15px

  &::placeholder
    color: $camera-text-muted

  &:focus
    outline: none

.card-icon-btn
  display: flex
  align-items: center
  flex-shrink: 0
  justify-content: center
  padding: 4px
  border: none
  background: none
  cursor: pointer

.card-icon
  width: 18px
  height: 18px
  filter: brightness(0)

  object-fit: contain

  &--check,
  &--close
    filter: none
</style>
