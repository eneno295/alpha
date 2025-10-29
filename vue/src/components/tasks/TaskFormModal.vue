<template>
  <BaseModal
    :visible="showAddTaskModal"
    :title="editingTask ? '编辑任务' : '添加任务'"
    size="medium"
    @close="closeAddTaskModal"
    @confirm="handleSave"
  >
    <form @submit.prevent="handleSave" class="task-form">
      <div class="form-group">
        <label>分类 *</label>
        <select v-model="formData.category" required>
          <option value="daily">每日任务</option>
          <option value="weekly">每周任务</option>
          <option value="monthly">每月任务</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div class="form-group">
        <label>任务标题 *</label>
        <input v-model="formData.title" type="text" placeholder="输入任务标题" required />
      </div>

      <div class="form-group">
        <label>任务描述</label>
        <textarea
          v-model="formData.description"
          placeholder="输入任务描述（可选）"
          rows="3"
        ></textarea>
      </div>

      <div class="form-group">
        <label>卡片颜色</label>
        <div class="color-picker">
          <div
            v-for="color in colorOptions"
            :key="color.value"
            :class="['color-option', { selected: formData.bgColor === color.value }]"
            :style="{ background: color.gradient }"
            @click="formData.bgColor = color.value"
            :title="color.name"
          >
            <span v-if="formData.bgColor === color.value" class="check-icon">✓</span>
          </div>
        </div>
      </div>
    </form>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTaskManagement } from '@/composables/useTaskManagement'

const { showAddTaskModal, editingTask, closeAddTaskModal, handleSaveTask } = useTaskManagement()

// 颜色选项
const colorOptions = [
  {
    value: 'default',
    name: '默认白色',
    gradient: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
  },
  { value: 'blue', name: '清新蓝', gradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)' },
  {
    value: 'purple',
    name: '优雅紫',
    gradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
  },
  { value: 'pink', name: '浪漫粉', gradient: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)' },
  { value: 'green', name: '活力绿', gradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)' },
  {
    value: 'yellow',
    name: '温暖黄',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
  },
  {
    value: 'orange',
    name: '活力橙',
    gradient: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
  },
  { value: 'gray', name: '简约灰', gradient: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' },
]

const formData = ref({
  title: '',
  description: '',
  category: 'daily' as 'daily' | 'weekly' | 'monthly' | 'custom',
  bgColor: 'default',
})

// 监听编辑任务变化
watch(
  editingTask,
  (task) => {
    if (task) {
      formData.value = {
        title: task.title,
        description: task.description || '',
        category: task.category,
        bgColor: task.bgColor || 'default',
      }
    } else {
      formData.value = {
        title: '',
        description: '',
        category: 'daily',
        bgColor: 'default',
      }
    }
  },
  { immediate: true },
)

// 监听弹窗关闭，确保清空表单
watch(showAddTaskModal, (isVisible) => {
  if (!isVisible) {
    // 弹窗关闭时清空表单
    formData.value = {
      title: '',
      description: '',
      category: 'daily',
      bgColor: 'default',
    }
  }
})

const handleSave = () => {
  if (!formData.value.title.trim()) {
    window.GlobalPlugin.toast.warning('请输入任务标题')
    return
  }
  handleSaveTask(formData.value)
}
</script>

<style lang="scss" scoped>
.task-form {
  .form-group {
    margin-bottom: 20px;

    label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: var(--text-primary);
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 12px;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 1rem;

      &:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }
    }

    textarea {
      resize: vertical;
      min-height: 80px;
    }

    .color-picker {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;

      .color-option {
        height: 50px;
        border-radius: 10px;
        cursor: pointer;
        border: 3px solid transparent;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.selected {
          border-color: #667eea;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
          transform: scale(1.05);
        }

        .check-icon {
          font-size: 1.5rem;
          font-weight: bold;
          color: #667eea;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}
</style>
