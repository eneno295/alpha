<script setup lang="ts"></script>

<template>
  <div id="app">
    <router-view />
  </div>
</template>

<style>
:root {
  /* 颜色变量 */
  --primary: #3b82f6;
  --success: #22c55e;
  --warning: #f59e0b;
  --error: #ef4444;

  /* 背景色 */
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;

  /* 文字颜色 */
  --text-primary: #1e293b;
  --text-muted: #64748b;

  /* 边框颜色 */
  --border-color: #e2e8f0;

  /* 阴影 */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1),
    0 4px 6px -4px rgb(0 0 0 / 0.1);
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0f172a;
    --bg-secondary: #1e293b;
    --text-primary: #f1f5f9;
    --text-muted: #94a3b8;
    --border-color: #334155;
  }
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>
