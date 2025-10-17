<template>
  <div class="gradient-text" :style="style">
    {{ text }}
  </div>
</template>

<script setup lang="ts">
interface Props {
  text: string
  style?: {}
}

const props = defineProps<Props>()
</script>

<style lang="scss" scoped>
.gradient-text {
  display: inline-block;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4, #45b7d1);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 38px;
  font-weight: 900;
  letter-spacing: 4px;
  animation: gradientShift 3s ease-in-out infinite;
}

@keyframes gradientShift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}
</style>
