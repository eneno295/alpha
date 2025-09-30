<template>
  <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
    <div class="modal-content" :class="contentClass" @click.stop>
      <!-- 头部 -->
      <div v-if="showHeader" class="modal-header">
        <h3 v-if="title" class="modal-title">{{ title }}</h3>
        <button v-if="showCloseButton" class="modal-close" @click="handleClose">
          <span>×</span>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="modal-body" :class="bodyClass">
        <slot></slot>
      </div>

      <!-- 底部按钮 -->
      <div v-if="showFooter" class="modal-footer">
        <slot name="footer">
          <div class="footer-left">
            <slot name="footer-left"></slot>
          </div>
          <div class="footer-right">
            <slot name="footer-right">
              <button class="btn-cancel" @click="handleClose">取消</button>
              <button class="btn-confirm" @click="handleConfirm">确认</button>
            </slot>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  title?: string
  showHeader?: boolean
  showFooter?: boolean
  showCloseButton?: boolean
  closeOnOverlay?: boolean
  size?: 'small' | 'medium' | 'large' | 'full'
  contentClass?: string
  bodyClass?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'confirm'): void
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showFooter: true,
  showCloseButton: true,
  closeOnOverlay: true,
  size: 'medium',
})

const emit = defineEmits<Emits>()

// 计算内容区域样式类
const contentClass = computed(() => {
  const classes = []
  if (props.size) {
    classes.push(`modal-${props.size}`)
  }
  if (props.contentClass) {
    classes.push(props.contentClass)
  }
  return classes.join(' ')
})

// 处理遮罩层点击
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// 处理关闭
const handleClose = () => {
  emit('close')
}

// 处理确认
const handleConfirm = () => {
  emit('confirm')
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  width: 90%;
  max-height: 85vh;
  overflow-y: auto;
  animation: modalSlideIn 0.3s ease;
  display: flex;
  flex-direction: column;

  &.modal-small {
    max-width: 400px;
  }

  &.modal-medium {
    max-width: 500px;
  }

  &.modal-large {
    max-width: 700px;
  }

  &.modal-full {
    max-width: 90vw;
    max-height: 90vh;
  }
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);

  .modal-title {
    margin: 0;
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 24px;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;

    &:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }
  }
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);

  .footer-right {
    display: flex;
    gap: 10px;

    .btn-cancel {
      background: var(--gradient-button);
      color: var(--text-muted);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        opacity: 0.8;
      }
    }

    .btn-confirm {
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        opacity: 0.8;
      }
    }
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
}
</style>
