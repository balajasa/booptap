<template>
  <div class="login">

    <button class="login-close" @click="router.back()">
      <span class="login-close-icon">×</span>
    </button>

    <div class="login-brand">
      <img src="@/assets/img/logo/cat-logo.png" class="login-logo" alt="booptap" />
      <p class="login-app-name">booptap</p>
    </div>

    <h1 class="login-title">歡迎回來</h1>

    <form class="login-form" @submit.prevent="handleLogin">

      <div class="field">
        <input v-model="form.email" type="email" placeholder="Email" class="field-input"
          :class="{ 'field-input--error': errors.email }" autocomplete="email" />
        <p v-if="errors.email" class="field-error">{{ errors.email }}</p>
      </div>

      <div class="field">
        <input v-model="form.password" type="password" placeholder="密碼" class="field-input"
          :class="{ 'field-input--error': errors.password }" autocomplete="current-password" />
        <p v-if="errors.password" class="field-error">{{ errors.password }}</p>
      </div>

      <p v-if="errors.general" class="login-error-general">{{ errors.general }}</p>

      <button type="submit" class="login-btn" :disabled="isLoading">
        {{ isLoading ? '登入中...' : '登入' }}
      </button>

    </form>

    <p class="login-privacy">
      登入即代表你同意我們的
      <a href="#" class="login-privacy-link">服務條款</a>
      與
      <a href="#" class="login-privacy-link">隱私權政策</a>
    </p>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/firebase'
import type { UserProfile } from '@/types/user'

const router = useRouter()

const isLoading = ref(false)

const form = reactive({
  email: '',
  password: '',
})

const errors = reactive<{ email?: string; password?: string; general?: string }>({})

function showError(message: string) {
  errors.general = message
  setTimeout(() => { delete errors.general }, 5000)
}

async function handleLogin() {
  delete errors.general
  isLoading.value = true

  try {
    const credential = await signInWithEmailAndPassword(auth, form.email, form.password)
    const uid = credential.user.uid

    const userDoc = await getDoc(doc(db, 'users', uid))
    if (!userDoc.exists()) {
      await auth.signOut()
      showError('帳號不存在')
      return
    }

    const userData = userDoc.data() as UserProfile
    if (userData.role === 'member') {
      await auth.signOut()
      showError('此帳號無法登入')
      return
    }

    if (userData.status === 'disabled') {
      await auth.signOut()
      showError('此帳號已停用')
      return
    }

    if (window.history.length > 1) {
      router.back()
    } else {
      router.replace('/collection')
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
        case 'auth/invalid-email':
          showError('Email 或密碼錯誤')
          break
        case 'auth/too-many-requests':
          showError('嘗試次數過多，請稍後再試')
          break
        case 'auth/network-request-failed':
          showError('網路連線失敗，請檢查網路')
          break
        default:
          showError('登入失敗，請稍後再試')
      }
    } else {
      showError('登入失敗，請稍後再試')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.login
  display: flex
  align-items: center
  flex-direction: column
  box-sizing: border-box
  padding: 24px 24px 48px
  min-height: 100dvh
  background: $camera-bg-primary

.login-close
  display: flex
  align-items: center
  align-self: flex-end
  justify-content: center
  width: 36px
  height: 36px
  border: none
  border-radius: 50%
  background: none
  cursor: pointer
  transition: background 0.15s

  &:active
    background: $camera-border-muted

.login-close-icon
  color: $camera-text-primary
  font-size: 24px
  line-height: 1

.login-brand
  display: flex
  align-items: center
  flex-direction: column
  margin-top: 48px

  gap: 12px

.login-logo
  width: 72px
  height: 72px

  object-fit: contain

.login-app-name
  margin: 0
  color: $camera-text-primary
  letter-spacing: 0.04em
  font-weight: 700
  font-size: 18px

.login-title
  margin: 32px 0 0
  color: $camera-text-primary
  font-weight: 700
  font-size: 24px

.login-form
  display: flex
  flex-direction: column
  margin-top: 32px
  max-width: 400px
  width: 100%

  gap: 16px

.field
  display: flex
  flex-direction: column

  gap: 6px

.field-input
  box-sizing: border-box
  padding: 14px 16px
  width: 100%
  outline: none
  border: 1.5px solid $camera-border-primary
  border-radius: 12px
  background: $camera-bg-primary
  color: $camera-text-primary
  font-size: 16px
  transition: border-color 0.15s

  &::placeholder
    color: $camera-text-muted

  &:focus
    border-color: $camera-accent

  &--error
    border-color: $camera-error

.field-error
  margin: 0
  padding-left: 4px
  color: $camera-error
  font-size: 13px

.login-error-general
  margin: 0
  color: $camera-error
  text-align: center
  font-size: 14px

.login-btn
  margin-top: 8px
  padding: 16px
  width: 100%
  border: none
  border-radius: 12px
  background: $country-tab-border
  color: $camera-text-white
  font-weight: 700
  font-size: 16px
  cursor: pointer
  transition: background 0.15s

  &:active:not(:disabled)
    background: rgba(0, 92, 175, 0.85)

  &:disabled
    opacity: 0.45
    cursor: not-allowed

.login-privacy
  margin: auto 0 0
  padding-top: 32px
  color: $camera-text-muted
  text-align: center
  font-size: 12px

.login-privacy-link
  color: $camera-text-secondary
  text-decoration: underline
</style>
