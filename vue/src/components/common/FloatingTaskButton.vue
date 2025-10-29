<template>
  <div class="floating-task-button" @click="handleClick">
    <div class="button-content">
      <div class="icon">{{ isTaskPage ? '←' : '📋' }}</div>
      <div class="text">{{ isTaskPage ? '返回' : '任务' }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const isTaskPage = computed(() => route.name === 'tasks')

const handleClick = () => {
  if (isTaskPage.value) {
    // 在任务页面，点击返回首页
    router.push({ path: '/', query: route.query })
  } else {
    // 在其他页面，点击跳转到任务页面
    router.push({ path: 'tasks', query: route.query })
  }
}
</script>

<style lang="scss" scoped>
.floating-task-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 1000;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .button-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 16px 20px;
    border-radius: 50px;
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 14px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);

    .icon {
      font-size: 18px;
    }

    .text {
      white-space: nowrap;
    }
  }

  &:hover {
    transform: translateY(-2px) scale(1.05);

    .button-content {
      background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
    }
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .floating-task-button {
    bottom: 20px;
    right: 20px;

    .button-content {
      padding: 12px 16px;
      font-size: 12px;

      .icon {
        font-size: 16px;
      }

      .text {
        display: none; // 小屏幕只显示图标
      }
    }
  }
}
</style>
