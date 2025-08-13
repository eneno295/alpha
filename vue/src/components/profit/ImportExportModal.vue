<template>
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3>导入导出</h3>
        <button class="modal-close" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="nav-tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'import' }"
            @click="activeTab = 'import'"
          >
            导入
          </button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'export' }"
            @click="activeTab = 'export'"
          >
            导出
          </button>
        </div>

        <!-- 导入面板 -->
        <div v-if="activeTab === 'import'" class="tab-content">
          <div class="import-section">
            <h4>📁 选择 JSON 文件</h4>
            <div
              class="file-drop-zone"
              @click="triggerFileInput"
              @drop="handleFileDrop"
              @dragover.prevent
            >
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                @change="handleFileSelect"
                style="display: none"
              />
              <div class="drop-zone-content">
                <span class="drop-icon">📄</span>
                <p>点击选择文件或拖拽到此处</p>
                <p class="file-hint">支持 .json 格式文件</p>
              </div>
            </div>
          </div>

          <div class="import-section">
            <h4>📋 或粘贴 JSON 数据</h4>
            <textarea
              v-model="jsonData"
              placeholder="在此粘贴 JSON 数据..."
              class="json-textarea"
            ></textarea>
          </div>

          <div class="import-section">
            <button class="template-btn" @click="useTemplateData">📝使用模板数据</button>
            <button class="import-btn" @click="importData" :disabled="!canImport">
              🚀导入数据
            </button>
          </div>
        </div>

        <!-- 导出面板 -->
        <div v-if="activeTab === 'export'" class="tab-content">
          <div class="export-section">
            <h4>📊 当前数据预览</h4>
            <div class="data-preview">
              <pre>{{ formattedData }}</pre>
            </div>
            <button class="export-btn" @click="exportData">💾导出成JSON</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useAppStore()
const activeTab = ref('import')
const jsonData = ref('')
const fileInput = ref<HTMLInputElement>()

// 計算是否可以導入
const canImport = computed(() => {
  return jsonData.value.trim().length > 0
})

// 格式化數據用於預覽
const formattedData = computed(() => {
  return JSON.stringify(store.profitData, null, 2)
})

// 關閉模態框
const closeModal = () => {
  emit('close')
}

// 觸發文件選擇
const triggerFileInput = () => {
  fileInput.value?.click()
}

// 處理文件選擇
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    readFile(file)
  }
}

// 處理文件拖拽
const handleFileDrop = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files[0]
  if (file && file.type === 'application/json') {
    readFile(file)
  }
}

// 讀取文件
const readFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    jsonData.value = content
  }
  reader.readAsText(file)
}

// 使用模板數據
const useTemplateData = () => {
  const templateData = {
    users: ['lan', 'sophie'],
    data: {
      lan: {
        config: {
          theme: 'light',
          calendarDisplayMode: 'claimable',
        },
        date: [],
      },
      sophie: {
        config: {
          theme: 'light',
          calendarDisplayMode: 'claimable',
        },
        date: [],
      },
    },
  }
  jsonData.value = JSON.stringify(templateData, null, 2)
}

// 導入數據
const importData = () => {
  try {
    const data = JSON.parse(jsonData.value)
    store.setProfitData(data)
    closeModal()
    // 重新加載頁面
    window.location.reload()
  } catch (error) {
    alert('JSON 格式錯誤，請檢查數據格式')
  }
}

// 導出數據
const exportData = () => {
  const dataStr = JSON.stringify(store.profitData, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'profit-data.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
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
  padding: 0;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  margin: 0;
  color: var(--text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.tab-btn:hover:not(.active) {
  background: var(--bg-primary);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.import-section,
.export-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-section h4,
.export-section h4 {
  margin: 0;
  color: var(--text-primary);
  font-size: 1rem;
}

.file-drop-zone {
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-drop-zone:hover {
  border-color: var(--primary);
  background: var(--bg-secondary);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.drop-icon {
  font-size: 2rem;
}

.file-hint {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin: 0;
}

.json-textarea {
  width: 100%;
  min-height: 150px;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: monospace;
  resize: vertical;
}

.template-btn,
.import-btn,
.export-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.template-btn {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.template-btn:hover {
  background: var(--bg-primary);
}

.import-btn,
.export-btn {
  background: var(--primary);
  color: white;
}

.import-btn:hover:not(:disabled),
.export-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

.import-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.data-preview {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.data-preview pre {
  margin: 0;
  color: var(--text-primary);
  font-family: monospace;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
