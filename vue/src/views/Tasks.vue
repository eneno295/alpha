<template>
  <div class="tasks-page">
    <!-- 头部 -->
    <div class="page-header">
      <h1>✨ 任务管理中心</h1>
      <p class="page-subtitle">规划你的每日目标，提升专注与效率 ✨</p>
    </div>

    <!-- 操作栏 -->
    <TaskActionBar />

    <!-- 任务列表 -->
    <div class="tasks-section">
      <TaskSectionHeader
        v-model="selectedCategory"
        :completed-count="todayCompletedCount"
        :total-count="activeTasksCount"
      />

      <TaskList :tasks="filteredTasks" />
    </div>

    <!-- 弹窗 -->
    <TaskFormModal />
    <TaskManageModal />
    <TaskHistoryModal />
    <TaskRemarkModal />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useTaskManagement } from '@/composables/useTaskManagement'
import { useAppInitialization } from '@/composables/useAppInitialization'
import TaskActionBar from '@/components/tasks/TaskActionBar.vue'
import TaskSectionHeader from '@/components/tasks/TaskSectionHeader.vue'
import TaskList from '@/components/tasks/TaskList.vue'
import TaskFormModal from '@/components/tasks/TaskFormModal.vue'
import TaskManageModal from '@/components/tasks/TaskManageModal.vue'
import TaskHistoryModal from '@/components/tasks/TaskHistoryModal.vue'
import TaskRemarkModal from '@/components/tasks/TaskRemarkModal.vue'

const { selectedCategory, activeTasksCount, todayCompletedCount, filteredTasks, initialize } =
  useTaskManagement()

const { initializeApp, startRefreshTimer, stopRefreshTimer } = useAppInitialization()

onMounted(async () => {
  // 加载数据（首次显示弹窗，后续静默）
  await initializeApp()
  // 数据加载完成后，初始化任务
  await initialize()
  // 启动定时器
  startRefreshTimer(10)
})

onUnmounted(() => {
  stopRefreshTimer()
})
</script>

<style lang="scss" scoped>
.tasks-page {
  min-height: 100vh;
  background:
    radial-gradient(ellipse at top left, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at bottom right, rgba(168, 85, 247, 0.08) 0%, transparent 50%), #ffffff;
  color: var(--text-primary);
  padding: 40px 60px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 50px;

  h1 {
    font-size: 3.2rem;
    margin-bottom: 15px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 800;
    letter-spacing: 3px;
    font-family:
      -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB',
      'Microsoft YaHei', sans-serif;
    filter: drop-shadow(0 4px 12px rgba(102, 126, 234, 0.25));
  }

  .page-subtitle {
    color: var(--text-secondary);
    font-size: 1.2rem;
    font-weight: 400;
    letter-spacing: 1px;
    font-family:
      -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'PingFang SC', 'Hiragino Sans GB',
      'Microsoft YaHei', sans-serif;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
}

@media (max-width: 768px) {
  .tasks-page {
    padding: 20px;
  }

  .page-header {
    margin-bottom: 30px;

    h1 {
      font-size: 2.2rem;
    }

    .page-subtitle {
      font-size: 1rem;
    }
  }
}
</style>
