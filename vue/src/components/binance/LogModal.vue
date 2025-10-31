<template>
  <BaseModal
    :visible="visible"
    :title="`${platformLabel} 操作日志`"
    size="large"
    @close="closeModal"
  >
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
            v-if="selectedLog.type === 'addRecord' || selectedLog.type === 'editRecord'"
            class="record-detail"
          >
            <div v-if="detailData.oldData && detailData.newData" class="comparison-table">
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
                      'changed-row':
                        (detailData.oldData.curScore || 0) !== detailData.newData.curScore,
                    }"
                  >
                    <td>当前积分</td>
                    <td class="old-col">{{ detailData.oldData.curScore || 0 }}</td>
                    <td class="new-col">{{ detailData.newData.curScore }}</td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row':
                        (detailData.oldData.todayScore || 0) !== detailData.newData.todayScore,
                    }"
                  >
                    <td>今日积分</td>
                    <td class="old-col">{{ detailData.oldData.todayScore || 0 }}</td>
                    <td class="new-col">{{ detailData.newData.todayScore }}</td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row':
                        (detailData.oldData.consumptionScore || 0) !==
                        detailData.newData.consumptionScore,
                    }"
                  >
                    <td>消耗积分</td>
                    <td class="old-col">{{ detailData.oldData.consumptionScore || 0 }}</td>
                    <td class="new-col">{{ detailData.newData.consumptionScore }}</td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row': (detailData.oldData.fee || 0) !== detailData.newData.fee,
                    }"
                  >
                    <td>手续费</td>
                    <td class="old-col">{{ detailData.oldData.fee || 0 }}</td>
                    <td class="new-col">{{ detailData.newData.fee }}</td>
                  </tr>
                </tbody>
              </table>

              <!-- 空投信息 -->
              <div class="airdrop-section">
                <h4 class="section-title">空投信息</h4>
                <div class="airdrop-comparison">
                  <div class="airdrop-column">
                    <span class="column-label old-col">旧值</span>
                    <div
                      v-if="detailData.oldData.coin && detailData.oldData.coin.length > 0"
                      class="airdrop-list"
                    >
                      <div
                        v-for="(coin, index) in detailData.oldData.coin"
                        :key="`old-${index}`"
                        class="airdrop-item"
                      >
                        <span class="coin-name">{{ coin.name || '未命名' }}</span>
                        <span class="coin-detail">金额: {{ coin.amount || 0 }}</span>
                        <span class="coin-detail">积分: {{ coin.score || 0 }}</span>
                      </div>
                    </div>
                    <div v-else class="empty-airdrop">无空投</div>
                  </div>
                  <div class="airdrop-column">
                    <span class="column-label new-col">新值</span>
                    <div
                      v-if="detailData.newData.coin && detailData.newData.coin.length > 0"
                      class="airdrop-list"
                    >
                      <div
                        v-for="(coin, index) in detailData.newData.coin"
                        :key="`new-${index}`"
                        class="airdrop-item"
                      >
                        <span class="coin-name">{{ coin.name || '未命名' }}</span>
                        <span class="coin-detail">金额: {{ coin.amount || 0 }}</span>
                        <span class="coin-detail">积分: {{ coin.score || 0 }}</span>
                      </div>
                    </div>
                    <div v-else class="empty-airdrop">无空投</div>
                  </div>
                </div>
              </div>

              <!-- 备注信息 -->
              <div class="remark-section">
                <h4 class="section-title">备注</h4>
                <div class="remark-comparison">
                  <div class="remark-column">
                    <span class="column-label old-col">旧值</span>
                    <div class="remark-content">
                      {{ detailData.oldData.remark || '无备注' }}
                    </div>
                  </div>
                  <div class="remark-column">
                    <span class="column-label new-col">新值</span>
                    <div class="remark-content">
                      {{ detailData.newData.remark || '无备注' }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="simple-data">
              <div class="data-item">日期: {{ detailData.newData.date }}</div>
              <div class="data-item">当前积分: {{ detailData.newData.curScore }}</div>
              <div class="data-item">今日积分: {{ detailData.newData.todayScore }}</div>
            </div>
          </div>

          <!-- 配置修改详情 -->
          <div v-else-if="selectedLog.type === 'editConfigs'" class="config-detail">
            <div v-if="detailData.oldData && detailData.newData" class="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>参数</th>
                    <th class="old-col">旧配置</th>
                    <th class="new-col">新配置</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    :class="{
                      'changed-row':
                        detailData.oldData.fastConfig?.fee !== detailData.newData.fastConfig?.fee,
                    }"
                  >
                    <td>手续费</td>
                    <td class="old-col">{{ detailData.oldData.fastConfig?.fee || '未设置' }}</td>
                    <td class="new-col">{{ detailData.newData.fastConfig?.fee || '未设置' }}</td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row':
                        detailData.oldData.fastConfig?.todayScore !==
                        detailData.newData.fastConfig?.todayScore,
                    }"
                  >
                    <td>今日积分</td>
                    <td class="old-col">
                      {{ detailData.oldData.fastConfig?.todayScore || '未设置' }}
                    </td>
                    <td class="new-col">
                      {{ detailData.newData.fastConfig?.todayScore || '未设置' }}
                    </td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row':
                        detailData.oldData.fastConfig?.autoCalcCurScore !==
                        detailData.newData.fastConfig?.autoCalcCurScore,
                    }"
                  >
                    <td>自动计算</td>
                    <td class="old-col">
                      {{ detailData.oldData.fastConfig?.autoCalcCurScore ? '开启' : '关闭' }}
                    </td>
                    <td class="new-col">
                      {{ detailData.newData.fastConfig?.autoCalcCurScore ? '开启' : '关闭' }}
                    </td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row':
                        detailData.oldData.showSimulationScore !==
                        detailData.newData.showSimulationScore,
                    }"
                  >
                    <td>模拟积分</td>
                    <td class="old-col">
                      {{ detailData.oldData.showSimulationScore ? '开启' : '关闭' }}
                    </td>
                    <td class="new-col">
                      {{ detailData.newData.showSimulationScore ? '开启' : '关闭' }}
                    </td>
                  </tr>
                  <tr
                    :class="{
                      'changed-row':
                        detailData.oldData.showThemeIcon !== detailData.newData.showThemeIcon,
                    }"
                  >
                    <td>主题切换</td>
                    <td class="old-col">
                      {{ detailData.oldData.showThemeIcon ? '开启' : '关闭' }}
                    </td>
                    <td class="new-col">
                      {{ detailData.newData.showThemeIcon ? '开启' : '关闭' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 配置修改详情 -->
          <div v-else-if="selectedLog.type === 'editConfig'" class="config-detail">
            <div v-if="detailData.oldData && detailData.newData" class="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>参数</th>
                    <th class="old-col">旧配置</th>
                    <th class="new-col">新配置</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{{ detailData.oldData.name }}</td>
                    <td class="old-col">{{ detailData.oldData.value || '未设置' }}</td>
                    <td class="new-col">{{ detailData.newData.value || '未设置' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 其他类型 -->
          <div v-else class="simple-data">
            {{ selectedLog.details }}
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

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 获取日志列表（最多显示前500条）
const platform = computed(() => appStore.getPlatform())
const platformLabel = computed(() =>
  platform.value === 'gate' ? 'Gate' : platform.value === 'okx' ? 'OKX' : 'Binance',
)

// 使用 binance 模块的映射获取日志（在 gate 路由时会自动映射到 gate 数据）
const logs = computed(() => {
  const allLogs = appStore.binance.logs || []
  return allLogs.slice(0, 500)
})

// 显示清空日志按钮
const showClearLogs = computed(() => appStore.binance.config?.showClearLogs)

// 详情弹窗状态
const showDetailModal = ref(false)
const selectedLog = ref<LogEntry | null>(null)
const detailData = ref<any>(null)

// 关闭弹窗
const closeModal = () => {
  emit('close')
}

// 显示日志详情
const showLogDetail = (log: LogEntry) => {
  selectedLog.value = log

  // 解析详情数据
  if (log.details) {
    try {
      detailData.value = JSON.parse(log.details)
    } catch (error) {
      detailData.value = null
    }
  } else {
    detailData.value = null
  }

  showDetailModal.value = true
}

// 关闭详情弹窗
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedLog.value = null
  detailData.value = null
}

// 格式化日志详情，解析JSON并显示对比
const formatLogDetails = (details: string, type: string) => {
  if (!details) return ''

  try {
    const data = JSON.parse(details)

    if (type === 'addRecord' || type === 'editRecord') {
      // 修改记录，显示对比
      return `${data.newData.date} - 当前积分：${data.newData.curScore}，今日刷的积分：${data.newData.todayScore}`
    } else if (type === 'editConfigs') {
      return `手续费：${data.newData.fastConfig.fee || '未设置'}，今日刷的积分：${data.newData.fastConfig.todayScore || '未设置'}`
    } else if (type === 'editConfig') {
      return `旧值：${data.oldData.value}，新值：${data.newData.value}`
    }

    return details
  } catch (error) {
    // 如果不是JSON格式，直接显示原文本
    return details
  }
}

// 清空日志
const clearLogs = () => {
  appStore.log.clearLogs(platform.value)
  window.GlobalPlugin.toast.success('日志已清空')
}
</script>

<style lang="scss" scoped>
.log-container {
  min-height: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.log-header {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);

  .log-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .log-count {
      font-size: 14px;
      color: var(--text-secondary);
      font-weight: 500;
    }
  }
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
