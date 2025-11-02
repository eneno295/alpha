<template>
  <div class="section-header">
    <h2>
      今日任务
      <span class="task-progress">({{ completedCount }}/{{ totalCount }})</span>
    </h2>
    <div class="filter-tabs">
      <button
        v-for="category in categories"
        :key="category.value"
        :class="['filter-tab', { active: modelValue === category.value }]"
        @click="$emit('update:modelValue', category.value)"
      >
        {{ category.label }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  completedCount: number
  totalCount: number
  modelValue: string
}>()

defineEmits(['update:modelValue'])

const categories = [
  { label: '全部待完成', value: 'pending' },
  { label: '全部', value: 'all' },
  { label: '每日', value: 'daily' },
  { label: '连续完成', value: 'duration' },
  { label: '到期完成', value: 'deadline' },
]
</script>

<style lang="scss" scoped>
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 0 10px;

  h2 {
    font-size: 1.8rem;
    margin: 0;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: 0.5px;
    font-family:
      -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB',
      'Microsoft YaHei', sans-serif;

    .task-progress {
      color: var(--text-secondary);
      font-size: 1.1rem;
      font-weight: 400;
      margin-left: 8px;
    }
  }

  .filter-tabs {
    display: flex;
    gap: 10px;
    background: white;
    padding: 6px;
    border-radius: 50px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);

    .filter-tab {
      padding: 10px 20px;
      border: none;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 50px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 0.95rem;
      font-weight: 500;

      &.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        transform: scale(1.02);
      }

      &:hover:not(.active) {
        background: rgba(102, 126, 234, 0.1);
        color: #667eea;
      }
    }
  }
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    gap: 20px;
    align-items: stretch;
    padding: 0;

    h2 {
      font-size: 1.5rem;
      text-align: center;
    }

    .filter-tabs {
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;

      .filter-tab {
        padding: 8px 16px;
        font-size: 0.9rem;
      }
    }
  }
}
</style>
