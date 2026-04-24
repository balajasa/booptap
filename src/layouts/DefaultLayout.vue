<template>
  <div class="layout">
    <main class="layout-content">
      <RouterView />
    </main>
    <nav class="layout-nav">
      <RouterLink to="/collection" class="nav-item" active-class="nav-item--active">
        <img src="@/assets/img/icon/navbar/photo_library.png" class="nav-icon" alt="" />
        <span>相簿</span>
      </RouterLink>
      <RouterLink to="/calendar" class="nav-item" active-class="nav-item--active">
        <img src="@/assets/img/icon/navbar/calendar.png" class="nav-icon" alt="" />
        <span>日曆</span>
      </RouterLink>
      <RouterLink to="/herenow" class="nav-item" active-class="nav-item--active">
        <img src="@/assets/img/icon/navbar/add_photo.png" class="nav-icon" alt="" />
        <span>打卡</span>
      </RouterLink>
      <RouterLink to="/settings" class="nav-item" active-class="nav-item--active">
        <div v-if="isLoggedIn && avatarURL" class="nav-avatar-ring">
          <img :src="avatarURL" class="nav-avatar" alt="avatar" />
        </div>
        <img v-else src="@/assets/img/icon/navbar/settings.png" class="nav-icon" alt="" />
        <span>設定</span>
      </RouterLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { useAuthUser } from '@/composables/useAuthUser'

const { isLoggedIn, avatarURL } = useAuthUser()
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.layout
  display: flex
  flex-direction: column
  height: 100dvh

.layout-content
  overflow-y: auto
  flex: 1
  background: $camera-bg-primary


.layout-nav
  display: flex
  flex-shrink: 0
  background: #ffffff
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.08)

.nav-item
  display: flex
  align-items: center
  flex: 1
  flex-direction: column
  justify-content: center
  padding: 8px 0 12px
  color: $camera-text-muted
  text-decoration: none
  font-size: 11px
  transition: color 0.2s

  gap: 4px

  &--active
    color: $country-tab-border

.nav-icon
  width: 22px
  height: 22px
  opacity: 0.35
  filter: brightness(0)
  transition: opacity 0.2s, filter 0.2s

  object-fit: contain

  .nav-item--active &
    opacity: 1
    filter: brightness(0) saturate(100%) invert(19%) sepia(80%) saturate(1500%) hue-rotate(195deg) brightness(90%)

.nav-avatar-ring
  padding: 2px
  border-radius: 50%
  background: linear-gradient(135deg, #005CAF, #5BA8D9, #895B8A)
  opacity: 0.55
  transition: opacity 0.2s

  .nav-item--active &
    opacity: 1

.nav-avatar
  display: block
  width: 24px
  height: 24px
  border: 1.5px solid #ffffff
  border-radius: 50%

  object-fit: cover

</style>
