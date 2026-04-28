<template>
  <div class="changelog">

    <div class="changelog-header">
      <button class="back-btn" @click="router.back()">
        <img src="@/assets/img/icon/common/arrow_back_ios.png" class="back-icon" alt="返回" />
      </button>
      <h1 class="changelog-title">更新日誌</h1>
    </div>

    <div class="changelog-list">

      <div v-for="entry in changelog" :key="entry.version" class="version-block">
        <div class="version-meta">
          <span class="version-number">{{ entry.version }}</span>
          <span class="version-date">{{ entry.date }}</span>
        </div>
        <div class="version-divider" />
        <ul class="version-items">
          <li v-for="item in entry.items" :key="item">{{ item }}</li>
        </ul>
      </div>

    </div>

    <div class="footer">
      <p class="footer-text">booptap v0.0.1 beta</p>
      <p class="footer-text">© 2026</p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import changelog from '@/data/changelog'

const router = useRouter()
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.changelog
  display: flex
  flex-direction: column
  box-sizing: border-box
  min-height: 100%

.changelog-header
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

.changelog-title
  margin: 0
  color: $camera-text-primary
  font-weight: 600
  font-size: 17px

.changelog-list
  display: flex
  flex-direction: column
  padding: 32px 36px 48px

  gap: 40px

.version-block
  display: flex
  flex-direction: column

  gap: 12px

.version-meta
  display: flex
  align-items: baseline

  gap: 10px

.version-number
  color: $camera-text-primary
  font-weight: 700
  font-size: 20px

.version-date
  color: $camera-text-secondary
  font-size: 15px

.version-divider
  height: 1px
  background: $camera-border-light

.version-items
  display: flex
  flex-direction: column
  margin: 0
  padding: 0
  list-style: none

  gap: 10px

  li
    display: flex
    align-items: flex-start
    color: $camera-text-primary
    font-size: 15px
    line-height: 1.5

    gap: 10px

    &::before
      content: '•'
      color: $camera-text-muted
      flex-shrink: 0

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
