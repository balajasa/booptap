<template>
  <div v-if="dialogState.hasOpenDialog" class="dialog-provider">
    <div v-for="(dialog, index) in dialogState.dialogs" :key="dialog.id" class="dialog-instance"
      :style="{ zIndex: 1000 + index }">
      <div class="dialog-overlay" :class="{ 'dialog-overlay--blur': getBlur(dialog) }" @click="handleOverlayClick(dialog)">
        <div class="dialog-box" @click.stop>

          <div v-if="getDialogTitle(dialog)" class="dialog-title">
            {{ getDialogTitle(dialog) }}
          </div>

          <div v-if="getDialogMessage(dialog)" class="dialog-message">
            {{ getDialogMessage(dialog) }}
          </div>

          <div class="dialog-actions">
            <button v-if="dialog.type === 'confirm'" class="dialog-btn dialog-btn--cancel"
              @click="handleCancel(dialog.id)" :disabled="dialog.loading">
              {{ getCancelText(dialog) }}
            </button>
            <button class="dialog-btn dialog-btn--confirm" @click="handleConfirm(dialog.id)"
              :disabled="dialog.loading">
              {{ dialog.loading ? '處理中...' : getConfirmText(dialog) }}
            </button>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useDialog } from '@/composables/useDialog'
import type { DialogInstance, ConfirmDialogOptions, AlertDialogOptions } from '@/types/common/dialog'

const { state: dialogState, _internal } = useDialog()
const { handleConfirm, handleCancel, handleClose } = _internal

const getDialogTitle = (dialog: DialogInstance): string => {
  const options = dialog.options as ConfirmDialogOptions | AlertDialogOptions
  return options.title || ''
}

const getDialogMessage = (dialog: DialogInstance): string => {
  const options = dialog.options as ConfirmDialogOptions | AlertDialogOptions
  return options.message || ''
}

const getConfirmText = (dialog: DialogInstance): string => {
  const options = dialog.options as ConfirmDialogOptions | AlertDialogOptions
  return options.confirmText || '確認'
}

const getCancelText = (dialog: DialogInstance): string => {
  const options = dialog.options as ConfirmDialogOptions
  return options.cancelText || '取消'
}

const getBlur = (dialog: DialogInstance): boolean => {
  const options = dialog.options as { blur?: boolean }
  return options.blur === true
}

const canCloseOnOverlay = (dialog: DialogInstance): boolean => {
  const options = dialog.options as { closeOnOverlay?: boolean }
  return options.closeOnOverlay !== false
}

const handleOverlayClick = (dialog: DialogInstance): void => {
  if (canCloseOnOverlay(dialog) && !dialog.loading) {
    handleClose(dialog.id)
  }
}

const handleEscapeKey = (event: KeyboardEvent): void => {
  if (event.key === 'Escape' && dialogState.hasOpenDialog) {
    const lastDialog = dialogState.dialogs[dialogState.dialogs.length - 1]
    if (lastDialog && canCloseOnOverlay(lastDialog) && !lastDialog.loading) {
      handleClose(lastDialog.id)
    }
  }
}

onMounted(() => document.addEventListener('keydown', handleEscapeKey))
onUnmounted(() => document.removeEventListener('keydown', handleEscapeKey))
</script>

<style lang="sass" scoped>
@use '@/styles/variables' as *

.dialog-provider
  position: fixed
  top: 0
  left: 0
  width: 100vw
  height: 100vh
  z-index: 9000
  pointer-events: none

.dialog-instance
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100%
  pointer-events: auto

.dialog-overlay
  position: fixed
  top: 0
  left: 0
  display: flex
  align-items: center
  justify-content: center
  padding: 24px
  width: 100vw
  height: 100vh
  background: $camera-bg-modal
  animation: fadeIn 0.2s ease-out

  &--blur
    background: rgba(0, 0, 0, 0.4)
    backdrop-filter: blur(8px)
    -webkit-backdrop-filter: blur(8px)

@keyframes fadeIn
  from
    opacity: 0
  to
    opacity: 1

.dialog-box
  box-sizing: border-box
  padding: 24px
  width: 100%
  max-width: 320px
  border-radius: 16px
  background: $camera-bg-primary
  box-shadow: 0 8px 32px $camera-shadow-strong
  animation: fadeInScale 0.2s ease-out
  display: flex
  flex-direction: column
  gap: 12px

@keyframes fadeInScale
  from
    opacity: 0
    transform: scale(0.9)
  to
    opacity: 1
    transform: scale(1)

.dialog-title
  color: $camera-text-primary
  font-weight: 700
  font-size: 17px

.dialog-message
  color: $camera-text-secondary
  font-size: 14px
  line-height: 1.6

.dialog-actions
  display: flex
  margin-top: 8px
  gap: 8px

.dialog-btn
  flex: 1
  padding: 12px
  border: none
  border-radius: 10px
  font-size: 15px
  font-weight: 600
  cursor: pointer
  transition: opacity 0.15s

  &:disabled
    opacity: 0.45
    cursor: not-allowed

  &--cancel
    background: $camera-border-light
    color: $camera-text-primary

    &:active:not(:disabled)
      opacity: 0.7

  &--confirm
    background: $country-tab-border
    color: $camera-text-white

    &:active:not(:disabled)
      opacity: 0.85
</style>
