<template>
  <div class="okx-page">
    <!-- 背景装饰 -->
    <div class="background-decoration">
      <div class="gradient-orb orb-1"></div>
      <div class="gradient-orb orb-2"></div>
      <div class="gradient-orb orb-3"></div>
    </div>

    <!-- 头部导航 -->
    <OKXHeader />

    <!-- 统计卡片 -->
    <OKXStatsCards />

    <!-- 日历组件 -->
    <OKXCalendar @open-modal="openAddRecordModal" />

    <!-- 添加记录弹窗 -->
    <OKXAddRecordModal
      :visible="showAddRecordModal"
      :selectedDate="selectedDate"
      :isEditing="isEditing"
      @close="closeAddRecordModal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import OKXHeader from '@/components/okx/OKXHeader.vue'
import OKXStatsCards from '@/components/okx/OKXStatsCards.vue'
import OKXCalendar from '@/components/okx/OKXCalendar.vue'
import OKXAddRecordModal from '@/components/okx/OKXAddRecordModal.vue'
import GradientText from '@/components/common/GradientText.vue'

// 添加记录弹窗状态
const showAddRecordModal = ref(false)
const selectedDate = ref('')
const isEditing = ref(false)

// 添加记录弹窗方法
const openAddRecordModal = (date: string) => {
  selectedDate.value = date
  // 检查该日期是否有数据，有数据就是编辑模式，没有数据就是新建模式
  const hasData = Boolean(date) // 简化逻辑，实际应该检查数据
  isEditing.value = hasData
  showAddRecordModal.value = true
}

const closeAddRecordModal = () => {
  showAddRecordModal.value = false
  selectedDate.value = ''
  isEditing.value = false
}

// 暴露方法给子组件使用
defineExpose({
  openAddRecordModal,
  closeAddRecordModal,
})
</script>

<style lang="scss" scoped>
.okx-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  position: relative;
  overflow: hidden;

  // 背景装饰
  .background-decoration {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 0;

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(60px);
      opacity: 0.3;
      animation: float 6s ease-in-out infinite;

      &.orb-1 {
        width: 300px;
        height: 300px;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        top: 10%;
        left: 10%;
        animation-delay: 0s;
      }

      &.orb-2 {
        width: 200px;
        height: 200px;
        background: linear-gradient(45deg, #45b7d1, #96c93d);
        top: 60%;
        right: 15%;
        animation-delay: 2s;
      }

      &.orb-3 {
        width: 250px;
        height: 250px;
        background: linear-gradient(45deg, #f093fb, #f5576c);
        bottom: 20%;
        left: 50%;
        animation-delay: 4s;
      }
    }
  }

  // 响应式设计
  @media (max-width: 768px) {
    .background-decoration {
      .gradient-orb {
        filter: blur(40px);

        &.orb-1 {
          width: 200px;
          height: 200px;
        }

        &.orb-2 {
          width: 150px;
          height: 150px;
        }

        &.orb-3 {
          width: 180px;
          height: 180px;
        }
      }
    }
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}
</style>
