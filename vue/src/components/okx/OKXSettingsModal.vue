<template>
  <BaseModal
    :visible="visible"
    title="OKX 设置"
    size="medium"
    cancel-text="取消"
    confirm-text="保存"
    :confirm-disabled="!accountManagement.hasChanges.value"
    :confirm-loading="isSaving"
    @close="closeModal"
    @confirm="handleSave"
  >
    <div class="okx-settings">
      <!-- 账号管理区域 -->
      <div class="settings-section">
        <div class="section-header">
          <h3>账号管理</h3>
        </div>

        <!-- 新增账号表单 -->
        <div class="add-account-form">
          <form @submit.prevent="handleAddAccount">
            <div class="form-group">
              <label>账号名称</label>
              <div class="input-group">
                <input
                  v-model="newAccountName"
                  type="text"
                  placeholder="请输入账号名称"
                  class="form-input"
                />
                <button type="submit" class="btn-add" :disabled="!newAccountName.trim()">
                  新增账号
                </button>
              </div>
            </div>
          </form>
        </div>

        <!-- 账号列表 -->
        <div class="accounts-list">
          <div class="list-header">
            <h4>现有账号 ({{ accountManagement.displayAccounts.value.length }})</h4>
            <p style="color: var(--text-secondary); font-size: 12px">
              删除账号，则账号下的所有记录都会被删除
            </p>
          </div>

          <div v-if="accountManagement.displayAccounts.value.length === 0" class="empty-state">
            <div class="empty-icon">📝</div>
            <p>暂无账号，请添加您的第一个 OKX 账号</p>
          </div>

          <div v-else class="accounts-grid">
            <div
              v-for="(account, index) in accountManagement.displayAccounts.value"
              :key="account"
              class="account-item"
              draggable="true"
              @dragstart="dragSort.onDragStart(index)"
              @dragover.prevent="dragSort.onDragOver(index)"
              @drop="handleDrop(index)"
              @dragend="dragSort.onDragEnd"
              :class="{ dragging: dragSort.dragIndex.value === index }"
            >
              <div class="drag-handle" title="拖拽排序">⋮⋮</div>
              <div class="account-info">
                <div class="account-name-wrapper">
                  <input
                    v-if="editingAccount === account"
                    v-model="editingAccountName"
                    type="text"
                    class="account-name-input"
                    @blur="handleBlur(account)"
                    @keyup.enter="saveAccountName(account)"
                    @keyup.esc="cancelEdit"
                  />
                  <div
                    v-else
                    class="account-name"
                    @click="startEditAccount(account)"
                    style="cursor: pointer"
                  >
                    {{ account }}
                  </div>
                  <button
                    v-show="editingAccount !== account"
                    class="btn-edit"
                    @click="startEditAccount(account)"
                    title="编辑账号名"
                  >
                    ✏️
                  </button>
                </div>
                <div class="account-stats">
                  <span class="stat-item">
                    <span class="label">记录数:</span>
                    <span class="value">{{
                      accountManagement.getAccountRecordCount(account)
                    }}</span>
                  </span>
                </div>
              </div>
              <div class="account-actions">
                <button
                  class="btn-remove"
                  @click="accountManagement.removeAccount(account)"
                  title="删除账号"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useLoading } from '@/composables/useLoading'
import { useDragSort } from '@/composables/useDragSort'
import { useOKXAccountManagement } from '@/composables/useOKXAccountManagement'

// Props
interface Props {
  visible: boolean
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  close: []
  success: []
}>()

// Composables
const { withLoading } = useLoading()
const accountManagement = useOKXAccountManagement()
const dragSort = useDragSort<string>((accounts) => {
  accountManagement.updateAccountOrder(accounts)
})

// 表单数据
const newAccountName = ref('')
const isSaving = ref(false)

// 编辑账号相关
const editingAccount = ref<string | null>(null)
const editingAccountName = ref('')

// 新增账号
const handleAddAccount = () => {
  if (!newAccountName.value.trim()) return

  const success = accountManagement.addAccount(newAccountName.value)
  if (!success) {
    window.GlobalPlugin.toast.error('账号已存在')
    return
  }

  newAccountName.value = ''
}

// 开始编辑账号名
const startEditAccount = (account: string) => {
  editingAccount.value = account
  editingAccountName.value = account
  // 等待 DOM 更新后聚焦输入框
  setTimeout(() => {
    const input = document.querySelector('.account-name-input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  }, 0)
}

// 处理失去焦点
const handleBlur = (oldName: string) => {
  // 使用 setTimeout 确保在其他事件（如 click）之后执行
  setTimeout(() => {
    saveAccountName(oldName)
  }, 100)
}

// 保存账号名
const saveAccountName = (oldName: string) => {
  // 如果不在编辑状态，直接返回
  if (editingAccount.value !== oldName) {
    return
  }

  const newName = editingAccountName.value.trim()

  // 如果名称为空，恢复原名称并退出编辑
  if (!newName) {
    editingAccount.value = null
    editingAccountName.value = ''
    return
  }

  // 如果名称没有改变，直接退出编辑
  if (newName === oldName) {
    editingAccount.value = null
    editingAccountName.value = ''
    return
  }

  // 检查新名称是否已存在
  if (accountManagement.displayAccounts.value.includes(newName)) {
    window.GlobalPlugin.toast.error('账号名称已存在')
    editingAccount.value = null
    editingAccountName.value = ''
    return
  }

  // 调用重命名方法
  const success = accountManagement.renameAccount(oldName, newName)
  if (!success) {
    window.GlobalPlugin.toast.error('重命名失败')
  }

  // 无论成功失败，都退出编辑状态
  editingAccount.value = null
  editingAccountName.value = ''
}

// 取消编辑
const cancelEdit = () => {
  editingAccount.value = null
  editingAccountName.value = ''
}

// 拖拽放下处理
const handleDrop = (index: number) => {
  dragSort.onDrop(accountManagement.displayAccounts.value, index)
}

// 保存所有修改
const handleSave = async () => {
  try {
    isSaving.value = true
    await withLoading(async () => {
      await accountManagement.saveChanges()
    }, '保存中...')

    emit('success')
    closeModal()
    window.GlobalPlugin.toast.success('设置保存成功')
  } catch (error) {
    console.error('保存失败:', error)
    window.GlobalPlugin.toast.error('保存失败，请重试')
  } finally {
    isSaving.value = false
  }
}

// 关闭弹窗
const closeModal = () => {
  // 取消所有未保存的修改，恢复到原始状态
  accountManagement.cancel()
  newAccountName.value = ''
  editingAccount.value = null
  editingAccountName.value = ''
  emit('close')
}

// 监听弹窗显示状态
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      // 打开弹窗时初始化（创建备份）
      newAccountName.value = ''
      editingAccount.value = null
      editingAccountName.value = ''
      accountManagement.init()
    }
  },
)
</script>

<style lang="scss" scoped>
.okx-settings {
  .settings-section {
    margin-bottom: 24px;

    .section-header {
      margin-bottom: 20px;

      h3 {
        margin: 0 0 8px 0;
        color: var(--text-primary);
        font-size: 18px;
        font-weight: 600;
      }

      .section-description {
        margin: 0;
        color: var(--text-secondary);
        font-size: 14px;
      }
    }

    .add-account-form {
      margin-bottom: 24px;
      padding: 20px;
      background: var(--bg-secondary);
      border-radius: 12px;
      border: 1px solid var(--border-color);

      .form-group {
        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-primary);
        }

        .input-group {
          display: flex;
          gap: 12px;

          .form-input {
            flex: 1;
            padding: 12px 16px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;

            &:focus {
              outline: none;
              border-color: var(--primary);
            }

            &:disabled {
              background: var(--bg-tertiary);
              color: var(--text-disabled);
            }
          }

          .btn-add {
            padding: 12px 20px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.3s ease;
            white-space: nowrap;

            &:hover:not(:disabled) {
              background: var(--primary-dark);
            }

            &:disabled {
              background: var(--bg-tertiary);
              color: var(--text-disabled);
              cursor: not-allowed;
            }
          }
        }
      }
    }

    .accounts-list {
      .list-header {
        margin-bottom: 16px;

        h4 {
          margin: 0;
          color: var(--text-primary);
          font-size: 16px;
          font-weight: 600;
        }
      }

      .empty-state {
        text-align: center;
        padding: 40px 20px;
        background: var(--bg-secondary);
        border-radius: 12px;
        border: 1px dashed var(--border-color);

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 14px;
        }
      }

      .accounts-grid {
        display: flex;
        flex-direction: column;
        gap: 12px;

        .account-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: move;

          &:hover {
            border-color: var(--primary);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }

          &.dragging {
            opacity: 0.5;
            border-color: var(--primary);
          }

          .drag-handle {
            cursor: grab;
            color: var(--text-muted);
            font-size: 18px;
            padding: 0 8px;
            margin-right: 12px;
            user-select: none;

            &:active {
              cursor: grabbing;
            }
          }

          .account-info {
            flex: 1;

            .account-name-wrapper {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 4px;

              .account-name {
                font-size: 16px;
                font-weight: 600;
                color: var(--text-primary);
              }

              .account-name-input {
                flex: 1;
                font-size: 16px;
                font-weight: 600;
                padding: 4px 8px;
                border: 2px solid var(--primary);
                border-radius: 4px;
                background: var(--bg-primary);
                color: var(--text-primary);
                outline: none;

                &:focus {
                  border-color: var(--primary);
                }
              }

              .btn-edit {
                background: none;
                border: none;
                cursor: pointer;
                font-size: 14px;
                padding: 4px;
                border-radius: 4px;
                transition: all 0.3s ease;
                opacity: 0.6;

                &:hover {
                  opacity: 1;
                  background: var(--bg-tertiary);
                }
              }
            }

            .account-stats {
              .stat-item {
                font-size: 14px;
                color: var(--text-secondary);

                .label {
                  margin-right: 4px;
                }

                .value {
                  font-weight: 500;
                  color: var(--text-primary);
                }
              }
            }
          }

          .account-actions {
            .btn-remove {
              width: 32px;
              height: 32px;
              background: var(--danger);
              color: white;
              border: none;
              border-radius: 6px;
              font-size: 16px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;

              &:hover:not(:disabled) {
                background: var(--danger-dark);
                transform: scale(1.05);
              }

              &:disabled {
                background: var(--bg-tertiary);
                color: var(--text-disabled);
                cursor: not-allowed;
                transform: none;
              }
            }
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .okx-settings {
    .settings-section {
      .add-account-form {
        .form-group {
          .input-group {
            flex-direction: column;

            .btn-add {
              width: 100%;
            }
          }
        }
      }

      .accounts-list {
        .accounts-grid {
          .account-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;

            .account-actions {
              align-self: flex-end;
            }
          }
        }
      }
    }
  }
}
</style>
