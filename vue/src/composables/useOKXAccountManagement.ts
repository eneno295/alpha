import { ref, computed } from 'vue'
import { useAppStore } from '@/stores/app'
import type { DateRecord, LogType } from '@/types'

/**
 * OKX 账号管理 Composable
 */
export function useOKXAccountManagement() {
  const appStore = useAppStore()

  // 待添加的账号列表
  const toAddAccounts = ref<string[]>([])

  // 待删除的账号列表
  const toDelAccounts = ref<string[]>([])

  // 待重命名的账号列表 { oldName: newName }
  const toRenameAccounts = ref<Record<string, string>>({})

  // 保存原始排序（用于检测排序变化）
  const originalOrder = ref<string[]>([])

  // 备份原始数据（用于取消时恢复）
  const originalDataBackup = ref<Record<string, { date: DateRecord[]; order: number }> | null>(null)

  // 初始化原始排序
  const initOriginalOrder = () => {
    if (!appStore.okx.data?.accounts) {
      originalOrder.value = []
      return
    }

    const accounts = Object.entries(appStore.okx.data.accounts)
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([name]) => name)

    originalOrder.value = [...accounts]
  }

  // 创建数据备份
  const createBackup = () => {
    if (!appStore.okx.data?.accounts) {
      originalDataBackup.value = null
      return
    }

    // 深拷贝账号数据
    originalDataBackup.value = JSON.parse(JSON.stringify(appStore.okx.data.accounts))
  }

  // 恢复数据备份
  const restoreBackup = () => {
    if (!originalDataBackup.value || !appStore.okx.data) {
      return
    }

    // 恢复备份的数据
    appStore.okx.data.accounts = JSON.parse(JSON.stringify(originalDataBackup.value))
    originalDataBackup.value = null
  }

  // 当前显示的账号列表（按 order 排序，排除待删除）
  const displayAccounts = computed(() => {
    if (!appStore.okx.data?.accounts) return []

    // 按 order 排序并过滤待删除的账号
    return Object.entries(appStore.okx.data.accounts)
      .filter(([name]) => !toDelAccounts.value.includes(name))
      .sort(([, a], [, b]) => a.order - b.order)
      .map(([name]) => name)
  })

  // 检查排序是否发生变化
  const isOrderChanged = computed(() => {
    const currentOrder = displayAccounts.value.filter((acc) => !toAddAccounts.value.includes(acc))
    if (currentOrder.length !== originalOrder.value.length) return false
    return currentOrder.some((acc, index) => acc !== originalOrder.value[index])
  })

  // 是否有改动
  const hasChanges = computed(() => {
    return (
      toAddAccounts.value.length > 0 ||
      toDelAccounts.value.length > 0 ||
      Object.keys(toRenameAccounts.value).length > 0 ||
      isOrderChanged.value
    )
  })

  // 获取账号记录数量
  const getAccountRecordCount = (account: string) => {
    const accountData = appStore.okx.data?.accounts?.[account]
    if (!accountData) return 0
    return accountData.date.length
  }

  // 新增账号
  const addAccount = (accountName: string) => {
    if (!accountName.trim()) return false

    const name = accountName.trim()

    // 检查是否已存在
    if (displayAccounts.value.includes(name)) {
      return false
    }

    // 计算新账号的 order
    const maxOrder = Object.values(appStore.okx.data?.accounts || {}).reduce(
      (max, acc) => Math.max(max, acc.order),
      -1,
    )

    // 创建账号数据
    if (!appStore.okx.data!.accounts[name]) {
      appStore.okx.data!.accounts[name] = {
        date: [],
        order: maxOrder + 1,
      }
    }

    // 添加到临时列表
    toAddAccounts.value.push(name)

    return true
  }

  // 删除账号
  const removeAccount = (account: string) => {
    // 如果是临时添加的账号，直接移除
    const tempIndex = toAddAccounts.value.indexOf(account)
    if (tempIndex > -1) {
      toAddAccounts.value.splice(tempIndex, 1)
      if (appStore.okx.data?.accounts[account]) {
        delete appStore.okx.data.accounts[account]
      }
      return
    }

    // 否则添加到待删除列表
    if (!toDelAccounts.value.includes(account)) {
      toDelAccounts.value.push(account)
    }
  }

  // 重命名账号
  const renameAccount = (oldName: string, newName: string): boolean => {
    if (!appStore.okx.data?.accounts[oldName]) {
      return false
    }

    // 复制旧账号的数据
    const accountData = { ...appStore.okx.data.accounts[oldName] }

    // 删除旧账号
    delete appStore.okx.data.accounts[oldName]

    // 创建新账号
    appStore.okx.data.accounts[newName] = accountData

    // 更新 toAddAccounts（如果旧名称在里面）
    const addIndex = toAddAccounts.value.indexOf(oldName)
    if (addIndex > -1) {
      toAddAccounts.value[addIndex] = newName
    }

    // 记录重命名操作
    toRenameAccounts.value[oldName] = newName

    return true
  }

  // 更新账号排序
  const updateAccountOrder = (accounts: string[]) => {
    accounts.forEach((accountName, idx) => {
      if (appStore.okx.data?.accounts[accountName]) {
        appStore.okx.data.accounts[accountName].order = idx
      }
    })
  }

  // 按 order 重新排序 accounts 对象
  const sortAccountsObject = () => {
    const sortedEntries = Object.entries(appStore.okx.data!.accounts).sort(
      ([, a], [, b]) => a.order - b.order,
    )

    const sortedAccounts: Record<string, { date: DateRecord[]; order: number }> = {}
    sortedEntries.forEach(([name, data]) => {
      sortedAccounts[name] = data
    })

    appStore.okx.data!.accounts = sortedAccounts
    return sortedEntries.map(([name]) => name)
  }

  // 判断操作类型
  const getActionType = (
    addCount: number,
    deleteCount: number,
    renameCount: number,
  ): { action: string; type: LogType } => {
    // 只有重命名操作
    if (renameCount > 0 && !addCount && !deleteCount) {
      return { action: '重命名账号', type: 'renameAccounts' }
    }
    // 只有新增操作
    if (addCount > 0 && !deleteCount && !renameCount) {
      return { action: '新增账号', type: 'addAccounts' }
    }
    // 只有删除操作
    if (deleteCount > 0 && !addCount && !renameCount) {
      return { action: '删除账号', type: 'delAccounts' }
    }
    // 只有排序操作
    if (!addCount && !deleteCount && !renameCount && isOrderChanged.value) {
      return { action: '修改账号排序', type: 'orderAccounts' }
    }
    // 混合操作
    return { action: '修改账号列表', type: 'editAccounts' }
  }

  // 保存更改
  const saveChanges = async () => {
    if (!appStore.okx.data?.accounts) {
      throw new Error('OKX 数据不存在')
    }

    if (!hasChanges.value) {
      return
    }

    // 获取旧账号列表
    const oldAccounts = [...originalOrder.value]

    // 处理删除的账号
    const deleteAccounts: string[] = []
    for (const account of toDelAccounts.value) {
      if (appStore.okx.data.accounts[account]) {
        delete appStore.okx.data.accounts[account]
      }
      deleteAccounts.push(account)
    }

    // 获取新增的账号列表
    const addAccounts = [...toAddAccounts.value]

    // 获取重命名的账号列表
    const renameAccounts = { ...toRenameAccounts.value }

    // 判断操作类型（在 sortAccountsObject 之前，避免影响 isOrderChanged）
    const action = getActionType(
      addAccounts.length,
      deleteAccounts.length,
      Object.keys(renameAccounts).length,
    )

    // 按 order 重新排序 accounts 对象
    const newAccounts = sortAccountsObject()

    // 添加日志
    await appStore.log.createLogEntry({
      action: action.action,
      type: action.type,
      details: JSON.stringify({
        oldAccounts,
        deleteAccounts,
        addAccounts,
        renameAccounts,
        newAccounts,
      }),
    })

    // 提交到服务器
    await appStore.api.updateData()

    // 保存成功后，清空备份和临时状态
    originalDataBackup.value = null
    reset()
  }

  // 初始化（打开弹窗时调用）
  const init = () => {
    createBackup()
    initOriginalOrder()
  }

  // 重置状态（关闭弹窗时调用）
  const reset = () => {
    toAddAccounts.value = []
    toDelAccounts.value = []
    toRenameAccounts.value = {}
    initOriginalOrder()
  }

  // 取消修改（恢复备份）
  const cancel = () => {
    restoreBackup()
    reset()
  }

  return {
    // 状态
    toAddAccounts,
    toDelAccounts,
    originalOrder,
    displayAccounts,
    isOrderChanged,
    hasChanges,

    // 方法
    init,
    reset,
    cancel,
    getAccountRecordCount,
    addAccount,
    removeAccount,
    renameAccount,
    updateAccountOrder,
    saveChanges,
  }
}

