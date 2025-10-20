<template>
  <BaseModal :visible="visible" title="OKX 操作日志" size="large" @close="closeModal">
    <div class="log-container">
      <div class="log-list" v-if="logs.length > 0">
        <div v-for="(log, index) in logs" :key="log.id" class="log-item">
          <div class="log-id">#{{ log.id }}</div>
          <div class="log-time">{{ formatTime(log.timestamp) }}</div>
          <div class="log-content">
            <div class="log-action">
              {{ log.action }}
              <button class="detail-btn" @click="showLogDetail(log)" title="查看详情">📋</button>
            </div>
            <div
              class="log-details"
              v-if="log.details"
              v-html="formatLogDetails(log.details, log.type)"
            ></div>
          </div>
          <div class="log-ip">{{ log.ip }}</div>
        </div>
      </div>

      <div v-else class="empty-logs">
        <div class="empty-icon">📝</div>
        <div class="empty-text">暂无操作日志</div>
      </div>
    </div>

    <template #footer-left>
      <div class="log-stats">
        <span class="log-count">共 {{ logs.length }} 条记录（显示最新500条）</span>
        <div class="btn-clear-logs" @click="clearLogs" v-if="showClearLogs && logs.length > 0">
          清空日志
        </div>
      </div>
    </template>
  </BaseModal>

  <!-- 日志详情弹窗 -->
  <BaseModal
    :visible="showDetailModal"
    title="日志详情"
    size="medium"
    @close="closeDetailModal"
    :showFooter="false"
  >
    <div class="log-detail-content" v-if="selectedLog">
      <div class="detail-item-group">
        <div class="detail-item">
          <span class="detail-label">编号:</span>
          <span class="detail-value">{{ selectedLog.id }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">操作类型:</span>
          <span class="detail-value">{{ selectedLog.action }}</span>
        </div>
      </div>
      <div class="detail-item-group">
        <div class="detail-item">
          <span class="detail-label">时间:</span>
          <span class="detail-value">{{ formatTime(selectedLog.timestamp) }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">IP地址:</span>
          <span class="detail-value">{{ selectedLog.ip }}</span>
        </div>
      </div>
      <div class="detail-item" v-if="selectedLog.details">
        <span class="detail-label">详细信息:</span>
        <div class="detail-content">
          <!-- 记录修改详情 -->
          <div
            v-if="
              selectedLog.type === 'addRecord' ||
              selectedLog.type === 'editRecord' ||
              selectedLog.type === 'clearRecord'
            "
            class="record-detail"
          >
            <!-- 新格式：批量操作（包含 accounts 数组） -->
            <div v-if="detailData.accounts && detailData.accounts.length > 0">
              <div class="info-row">
                <span class="info-label">日期：</span>
                <span class="info-value">{{ detailData.date }}</span>
              </div>
              <div
                v-for="(accountChange, index) in detailData.accounts"
                :key="index"
                class="account-change-group"
              >
                <div class="account-change-header">
                  <span class="account-name">{{ accountChange.account }}</span>
                  <span
                    class="change-type"
                    :class="{
                      'type-add': accountChange.type === 'add',
                      'type-edit': accountChange.type === 'edit',
                      'type-clear': accountChange.type === 'clear',
                    }"
                  >
                    {{
                      accountChange.type === 'add'
                        ? '新增'
                        : accountChange.type === 'edit'
                          ? '修改'
                          : '清空'
                    }}
                  </span>
                </div>

                <!-- 对比表格（修改操作） -->
                <div
                  v-if="accountChange.type === 'edit' && accountChange.oldData"
                  class="comparison-table"
                >
                  <table>
                    <thead>
                      <tr>
                        <th>参数</th>
                        <th class="old-col">旧值</th>
                        <th class="new-col">新值</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        :class="{
                          'changed-row': !areCoinsEqual(
                            accountChange.oldData?.coin,
                            accountChange.newData?.coin,
                          ),
                        }"
                      >
                        <td>币种</td>
                        <td class="old-col">{{ formatCoins(accountChange.oldData?.coin) }}</td>
                        <td class="new-col">{{ formatCoins(accountChange.newData?.coin) }}</td>
                      </tr>
                      <tr
                        :class="{
                          'changed-row':
                            (accountChange.oldData?.fee || 0) !== accountChange.newData?.fee,
                        }"
                      >
                        <td>手续费</td>
                        <td class="old-col">{{ accountChange.oldData?.fee || 0 }} U</td>
                        <td class="new-col">{{ accountChange.newData?.fee || 0 }} U</td>
                      </tr>
                      <tr
                        :class="{
                          'changed-row':
                            (accountChange.oldData?.remark || '') !==
                            (accountChange.newData?.remark || ''),
                        }"
                      >
                        <td>备注</td>
                        <td class="old-col">{{ accountChange.oldData?.remark || '-' }}</td>
                        <td class="new-col">{{ accountChange.newData?.remark || '-' }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 新增/清空记录 -->
                <div v-else class="simple-record">
                  <div class="info-row">
                    <span class="info-label">币种：</span>
                    <span class="info-value">{{
                      formatCoins(
                        accountChange.type === 'clear'
                          ? accountChange.oldData?.coin
                          : accountChange.newData?.coin,
                      )
                    }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">手续费：</span>
                    <span class="info-value"
                      >{{
                        accountChange.type === 'clear'
                          ? accountChange.oldData?.fee || 0
                          : accountChange.newData?.fee || 0
                      }}
                      U</span
                    >
                  </div>
                  <div class="info-row" v-if="accountChange.newData?.remark">
                    <span class="info-label">备注：</span>
                    <span class="info-value">{{ accountChange.newData.remark }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 修改账号列表 -->
          <div
            v-else-if="
              ['addAccounts', 'delAccounts', 'orderAccounts', 'editAccounts'].includes(
                selectedLog.type,
              )
            "
            class="edit-accounts"
          >
            <table class="accounts-table">
              <thead>
                <tr>
                  <th>旧账号</th>
                  <th v-if="selectedLog.type !== 'orderAccounts'">
                    {{
                      selectedLog.type === 'addAccounts'
                        ? '新增账号'
                        : selectedLog.type === 'delAccounts'
                          ? '删除账号'
                          : '修改账号'
                    }}
                  </th>
                  <th>新账号</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div v-if="detailData.oldAccounts?.length" class="account-list">
                      {{ detailData.oldAccounts.join(',') }}
                    </div>
                    <div v-else class="empty-text">-</div>
                  </td>
                  <td v-if="selectedLog.type !== 'orderAccounts'">
                    <div v-if="detailData.addAccounts?.length" class="account-list add">
                      {{ detailData.addAccounts.join(',') }}
                    </div>

                    <div v-if="detailData.deleteAccounts?.length" class="account-list delete">
                      {{ detailData.deleteAccounts.join(',') }}
                    </div>
                    <div
                      v-if="!detailData.addAccounts?.length && !detailData.deleteAccounts?.length"
                      class="empty-text"
                    >
                      -
                    </div>
                  </td>
                  <td>
                    <div v-if="detailData.newAccounts?.length" class="account-list">
                      {{ detailData.newAccounts.join(',') }}
                    </div>
                    <div v-else class="empty-text">-</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 其他类型日志 -->
          <div v-else class="plain-details">
            <pre>{{ selectedLog.details }}</pre>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import type { LogEntry } from '@/types'
import { formatTime } from '@/utils/format'

// 获取 store
const appStore = useAppStore()

interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// 日志记录
const logs = computed(() => {
  const allLogs = appStore.okx.logs || []
  return allLogs.slice(0, 500)
})

// 详情弹窗状态
const showDetailModal = ref(false)
const selectedLog = ref<LogEntry | null>(null)

// 配置控制
const showClearLogs = computed(() => appStore.okx.config?.showClearLogs)

// 解析详情数据
const detailData = computed(() => {
  if (!selectedLog.value?.details) return {}
  try {
    return JSON.parse(selectedLog.value.details)
  } catch {
    return {}
  }
})

// Emits
const emit = defineEmits<{
  close: []
}>()

// 格式化币种信息
const formatCoins = (coins: any) => {
  if (!coins || coins.length === 0) return '-'
  return coins.map((coin: any) => `${coin.name}（${coin.amount}U）`).join(', ')
}

// 比较币种是否相等
const areCoinsEqual = (oldCoins: any, newCoins: any) => {
  if (!oldCoins && !newCoins) return true
  if (!oldCoins || !newCoins) return false
  if (oldCoins.length !== newCoins.length) return false

  return JSON.stringify(oldCoins) === JSON.stringify(newCoins)
}

// 格式化日志详情
const formatLogDetails = (details: string, type: string) => {
  try {
    const data = JSON.parse(details)

    // 修改账号列表
    if (type === 'delAccounts') {
      return `删除账号: ${data.deleteAccounts.join(',') || '未知'}`
    } else if (type === 'addAccounts') {
      return `新增账号: ${data.addAccounts.join(',') || '未知'}`
    } else if (type === 'renameAccounts') {
      return `重命名账号: ${
        Object.entries(data.renameAccounts)
          .map(([oldName, newName]) => `${oldName} -> ${newName}`)
          .join(',') || '未知'
      }`
    } else if (type === 'orderAccounts') {
      return `修改账号顺序: ${data.oldAccounts.join(',') || '未知'} -> ${data.newAccounts.join(',') || '未知'}`
    } else if (type === 'editAccounts') {
      let text = ''
      if (data.addAccounts.length > 0) {
        text += `新增账号: ${data.addAccounts.join(',') || '未知'}`
      }
      if (data.deleteAccounts.length > 0) {
        text += `删除账号: ${data.deleteAccounts.join(',') || '未知'}`
      }
      return text
    } else if (['clearRecord', 'addRecord', 'editRecord'].includes(type)) {
      let text =
        type === 'clearRecord' ? '清空账号' : type === 'addRecord' ? '新增账号' : '修改账号'
      const accountNames = data.accounts.map((item: any) => item.account).join(', ')
      return `${data.date} - ${text}: ${accountNames || '未知'}`
    }

    return data
  } catch {
    return details
  }
}

// 显示日志详情
const showLogDetail = (log: LogEntry) => {
  selectedLog.value = log
  showDetailModal.value = true
}

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedLog.value = null
}

// 清空日志
const clearLogs = async () => {
  appStore.log.clearLogs('okx')
  window.GlobalPlugin.toast.success('日志已清空')
}

// 关闭弹窗
const closeModal = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.log-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.btn-clear-logs {
  background: var(--error);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s ease;
  display: inline-block;

  &:hover:not(:disabled) {
    opacity: 0.8;
  }

  &:disabled {
    background: var(--bg-tertiary);
    color: var(--text-muted);
    cursor: not-allowed;
  }
}

.log-list {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;

  .log-item {
    display: grid;
    grid-template-columns: 60px 100px 1fr 120px;
    gap: 16px;
    padding: 12px 0;
    border-bottom: 1px solid var(--border-color);
    align-items: start;

    &:last-child {
      border-bottom: none;
    }

    .log-id {
      font-size: 12px;
      color: var(--text-muted);
      font-family: 'Courier New', monospace;
      font-weight: 600;
      text-align: center;
      background: var(--bg-tertiary);
      border-radius: 4px;
      padding: 2px 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .log-time {
      font-size: 12px;
      color: var(--text-muted);
      font-family: 'Courier New', monospace;
    }

    .log-content {
      .log-action {
        font-size: 14px;
        color: var(--text-primary);
        font-weight: 500;
        margin-bottom: 4px;
        display: flex;
        align-items: center;

        .detail-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.3s ease;
          opacity: 0.6;

          &:hover {
            opacity: 1;
            background: var(--bg-secondary);
          }
        }
      }

      .log-details {
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.4;
      }
    }

    .log-ip {
      font-size: 12px;
      color: var(--text-muted);
      font-family: 'Courier New', monospace;
      text-align: right;
    }
  }
}

// 日志详情弹窗样式
.log-detail-content {
  .detail-item-group {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-item {
    margin-bottom: 16px;

    .detail-label {
      font-weight: 600;
      color: var(--text-primary);
      margin-right: 8px;
    }

    .detail-value {
      color: var(--text-secondary);
    }

    .detail-content {
      margin-top: 8px;
      padding: 12px;
      background: var(--bg-secondary);
      border-radius: 6px;
      border: 1px solid var(--border-color);

      .comparison {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;

        .old-data,
        .new-data {
          .label {
            font-weight: 600;
            margin-bottom: 8px;
            display: block;
          }

          .data-item {
            margin-bottom: 4px;
            font-size: 13px;
            padding: 2px 0;
          }
        }

        .old-data {
          .label {
            color: var(--error);
          }

          .data-item {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
            padding: 4px 8px;
            border-radius: 3px;
          }
        }

        .new-data {
          .label {
            color: var(--success);
          }

          .data-item {
            background: rgba(34, 197, 94, 0.1);
            color: var(--success);
            padding: 4px 8px;
            border-radius: 3px;
          }
        }
      }

      .simple-data {
        .data-item {
          margin-bottom: 4px;
          font-size: 13px;
          padding: 4px 8px;
          background: var(--bg-tertiary);
          border-radius: 3px;
        }
      }

      // 账号变更分组
      .account-change-group {
        margin-bottom: 20px;
        padding: 12px;
        background: var(--bg-secondary);
        border-radius: 8px;
        border: 1px solid var(--border-color);

        &:last-child {
          margin-bottom: 0;
        }
      }

      .account-change-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--border-color);

        .account-name {
          font-weight: 600;
          font-size: 14px;
          color: var(--text-primary);
        }

        .change-type {
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;

          &.type-add {
            background: rgba(34, 197, 94, 0.1);
            color: var(--success);
          }

          &.type-edit {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
          }

          &.type-clear {
            background: rgba(239, 68, 68, 0.1);
            color: var(--error);
          }
        }
      }

      .simple-record {
        .info-row {
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      // 表格样式
      .comparison-table {
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;

          thead {
            th {
              padding: 8px;
              font-weight: 600;
              border-bottom: 1px solid var(--border-color);
              text-align: left;

              &.new-col {
                background: rgba(34, 197, 94, 0.1);
                color: var(--success);
              }
            }
          }

          tbody {
            tr {
              border-bottom: 1px solid var(--border-color);

              &:last-child {
                border-bottom: none;
              }

              td {
                padding: 8px;

                &.new-col {
                  background: rgba(34, 197, 94, 0.05);
                  color: var(--success);
                }
              }

              // 配置有变化时的样式
              &.changed-row {
                td {
                  color: var(--error);
                  font-weight: 600;
                }
              }
            }
          }
        }

        // 空投信息样式
        .airdrop-section,
        .remark-section {
          margin-top: 16px;

          .section-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-primary);
          }
        }

        .airdrop-comparison,
        .remark-comparison {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;

          .airdrop-column,
          .remark-column {
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 8px;
            background: var(--bg-secondary);

            .column-label {
              display: block;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 6px;
              padding: 4px 8px;
              border-radius: 3px;

              &.old-col {
                background: rgba(239, 68, 68, 0.1);
                color: var(--error);
              }

              &.new-col {
                background: rgba(34, 197, 94, 0.1);
                color: var(--success);
              }
            }

            .airdrop-list {
              display: flex;
              flex-direction: column;
              gap: 6px;

              .airdrop-item {
                display: flex;
                flex-direction: column;
                gap: 2px;
                padding: 6px 8px;
                background: var(--bg-tertiary);
                border-radius: 4px;
                border-left: 3px solid var(--primary);

                .coin-name {
                  font-weight: 600;
                  font-size: 13px;
                  color: var(--text-primary);
                }

                .coin-detail {
                  font-size: 12px;
                  color: var(--text-secondary);
                }
              }
            }

            .empty-airdrop {
              padding: 12px 8px;
              text-align: center;
              color: var(--text-muted);
              font-size: 12px;
            }

            .remark-content {
              padding: 8px;
              background: var(--bg-tertiary);
              border-radius: 4px;
              font-size: 13px;
              color: var(--text-secondary);
              min-height: 40px;
              white-space: pre-wrap;
              word-break: break-word;
            }
          }
        }
      }
    }
  }

  // 账号修改表格样式
  .edit-accounts {
    .accounts-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;

      thead {
        th {
          padding: 12px;
          font-weight: 600;
          border: 1px solid var(--border-color);
          background: var(--bg-secondary);
          text-align: center;
          color: var(--text-primary);
        }
      }

      tbody {
        td {
          padding: 12px;
          border: 1px solid var(--border-color);
          vertical-align: top;

          .account-list {
            display: flex;
            flex-direction: column;
            gap: 6px;

            &.add,
            &.delete {
              padding: 6px 10px;
              border-radius: 4px;
              font-size: 13px;
            }

            &.add {
              background: rgba(34, 197, 94, 0.1);
              color: var(--success);
              border-left: 3px solid var(--success);
              margin-bottom: 6px;
            }

            &.delete {
              background: rgba(239, 68, 68, 0.1);
              color: var(--error);
              border-left: 3px solid var(--error);
            }
          }

          .empty-text {
            text-align: center;
            color: var(--text-muted);
            font-size: 13px;
          }
        }
      }
    }
  }
}

.empty-logs {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);

  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-text {
    font-size: 16px;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .log-list .log-item {
    grid-template-columns: 1fr;
    gap: 8px;

    .log-id,
    .log-time,
    .log-ip {
      font-size: 14px;
    }

    .log-ip {
      text-align: left;
    }
  }
}
</style>
