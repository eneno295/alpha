<template>
  <!-- 设置弹窗 -->
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>快捷配置</h3>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <form @submit.prevent="saveConfig">
          <!-- 快捷配置区域 -->
          <div class="score-row">
            <div class="form-group">
              <label>手续费</label>
              <input v-model="config.fastConfig.fee" type="number" step="0.01" placeholder="0.00" />
            </div>

            <div class="form-group">
              <label>刷的积分</label>
              <input
                v-model="config.fastConfig.todayScore"
                type="number"
                step="1"
                placeholder="0"
              />
            </div>
          </div>

          <!-- 功能开关区域 -->
          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="config.fastConfig.autoCalcCurScore" type="checkbox" />
              <span class="checkmark"></span>
              自动计算当前积分
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="config.showSimulationScore" type="checkbox" />
              <span class="checkmark"></span>
              模拟积分功能
            </label>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="config.showThemeIcon" type="checkbox" />
              <span class="checkmark"></span>
              主题切换
            </label>
          </div>

          <!-- <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input v-model="config.showImportExportIcon" type="checkbox" />
              <span class="checkmark"></span>
              导入导出功能
            </label>
          </div> -->
        </form>
      </div>

      <div class="modal-footer">
        <div class="footer-left">
          <button type="button" class="btn-clear" @click="clearConfig">清空</button>
        </div>
        <div class="footer-right">
          <button type="button" class="btn-cancel" @click="closeModal">取消</button>
          <button type="button" class="btn-save" @click="saveConfig">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'

// Props
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

// Store
const store = useAppStore()

// 加载状态
const { withLoading } = useLoading()

// 响应式数据
const isVisible = computed(() => props.visible)

// 配置数据
const config = ref({
  fastConfig: {
    fee: '',
    todayScore: '',
    autoCalcCurScore: false,
  },
  showSimulationScore: false,
  showThemeIcon: false,
  showImportExportIcon: false,
})

// 加载配置
const loadConfig = () => {
  const userConfig = store.currentUser?.config
  if (!userConfig) return

  // 加载fastConfig配置
  if (userConfig.fastConfig) {
    config.value.fastConfig = {
      fee: userConfig.fastConfig.fee || '',
      todayScore: userConfig.fastConfig.todayScore || '',
      autoCalcCurScore: userConfig.fastConfig.autoCalcCurScore || false,
    }
  }

  // 加载用户配置
  config.value.showSimulationScore = userConfig.showSimulationScore || false
  config.value.showThemeIcon = userConfig.showThemeIcon || false
  config.value.showImportExportIcon = userConfig.showImportExportIcon || false
}

// 保存配置
const saveConfig = async () => {
  try {
    await withLoading(async () => {
      const userName = store.currentUser?.config?.userName
      if (!userName) {
        throw new Error('未找到用户信息')
      }

      // 批量更新所有配置
      const configsToUpdate = {
        fastConfig: config.value.fastConfig,
        showSimulationScore: config.value.showSimulationScore,
        showThemeIcon: config.value.showThemeIcon,
        showImportExportIcon: config.value.showImportExportIcon,
      }

      const success = await store.updateUserConfigsAction(userName, configsToUpdate)
      if (!success) {
        throw new Error('配置保存失败')
      }
    }, '保存配置中...')

    // 关闭弹窗
    closeModal()

    // 显示成功提示
    window.GlobalPlugin.toast.success('配置已保存', '所有设置已成功保存')
  } catch (error) {
    console.error('配置保存失败:', error)
    const errorMessage = error instanceof Error ? error.message : '请检查网络连接后重试'
    window.GlobalPlugin.toast.error('保存失败', errorMessage)
  }
}

// 清空配置
const clearConfig = () => {
  config.value = {
    fastConfig: {
      fee: '',
      todayScore: '',
      autoCalcCurScore: false,
    },
    showSimulationScore: false,
    showThemeIcon: false,
    showImportExportIcon: false,
  }
  window.GlobalPlugin.toast.info('配置已清空', '所有配置已重置为默认值')
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 监听弹窗显示状态，加载配置
watch(isVisible, (newVisible) => {
  if (newVisible) {
    loadConfig()
  }
})
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
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);

  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
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
  padding: 24px;

  .score-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 20px;
  }

  .form-group {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }

    input[type='number'] {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      font-size: 14px;
      background: var(--bg-primary);
      color: var(--text-primary);
      transition: border-color 0.3s ease;

      &:focus {
        outline: none;
        border-color: var(--primary);
      }
    }
  }

  .checkbox-group {
    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: 400;

      input[type='checkbox'] {
        margin-right: 12px;
        width: 18px;
        height: 18px;
        accent-color: var(--primary);
      }

      .checkmark {
        margin-left: 8px;
      }
    }
  }
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);

  .footer-left {
    .btn-clear {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }
  }

  .footer-right {
    display: flex;
    gap: 12px;

    .btn-cancel {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--bg-secondary);
      }
    }

    .btn-save {
      background: var(--primary);
      border: none;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s ease;

      &:hover {
        background: var(--primary-dark);
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

  .score-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }
}
</style>
