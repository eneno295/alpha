<template>
  <BaseModal
    :visible="isVisible"
    title="快捷配置"
    size="medium"
    cancel-text="取消"
    confirm-text="保存"
    @close="closeModal"
    @confirm="saveConfig"
  >
    <form @submit.prevent="saveConfig">
      <!-- 快捷配置区域 -->
      <div class="score-row">
        <div class="form-group">
          <label>手续费</label>
          <input v-model="config.fastConfig.fee" type="number" step="0.01" placeholder="0.00" />
        </div>

        <div class="form-group">
          <label>刷的积分</label>
          <input v-model="config.fastConfig.todayScore" type="number" step="1" placeholder="0" />
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

    <template #footer-left>
      <button type="button" class="btn-clear" @click="clearConfig">清空</button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { useLoading } from '@/composables/useLoading'

// 获取 store
const appStore = useAppStore()

// Props
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
}>()

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
  const userConfig = appStore.binance.config
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
      // 更新配置并记录日志
      if (!appStore.currentUser) throw new Error('用户不存在')

      // 通过标准 action 批量更新（带日志与持久化；自动根据当前路由更新 gate/binance）
      await appStore.binance.updateUserConfigsAction(config.value)
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

/* 响应式设计 */
@media (max-width: 768px) {
  .score-row {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
