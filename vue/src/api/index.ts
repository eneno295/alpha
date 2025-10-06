import type { ProfitData, ApiResponse, UserConfig } from '@/types'

// API 管理文件 - 处理所有数据请求功能

// 用户BIN_ID映射
const binIdMap = new Map([
  ['ss', '68da884143b1c97be9543259'],
  ['ll', '68919b1aae596e708fc1da23'],
  ['mm', '68939dfbf7e7a370d1f59af1'],
  ['knine', '68919d64f7e7a370d1f412ca'],
  ['kayla', '68919d3bae596e708fc1dc8e'],
  ['echo', '68919d4fae596e708fc1dcb1'],
  ['adam', '6892fc5af7e7a370d1f50b35'],
  ['ces', '68b06dffd0ea881f4069538e'],
  ['Beth', '68e3a2f443b1c97be95c38c6']
])

// 从URL参数获取当前BIN_ID
const currentBinId = binIdMap.get(location.href.split('?')[1]) || null

// JSONBin 配置
const JSONBIN_CONFIG = {
  BIN_ID: localStorage.getItem('jsonbinId') || currentBinId || '6891ba4d7b4b8670d8ad8f65',
  MASTER_KEY: '$2a$10$3cSkdp7.76Y.JUeZ/ymCe.A6ZPUmIPfeF1hTH7ii9h13BeRMU/a0.',
  DATA_SOURCE: 'https://api.jsonbin.io/v3/b/'
}

// 从 JSONBin 获取数据
export async function fetchDataFromAPI(): Promise<ProfitData> {
  try {
    const url = `${JSONBIN_CONFIG.DATA_SOURCE}${JSONBIN_CONFIG.BIN_ID}`
    const headers = {
      'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
    }

    const response = await fetch(url, { headers })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result: ApiResponse = await response.json()
    console.log('✅ 从API获取数据成功')
    return result.record
  } catch (error) {
    console.error('❌ 从API获取数据失败:', error)
    throw error
  }
}

// 更新 JSONBin 中的数据
export async function updateDataInAPI(newData: ProfitData): Promise<boolean> {
  try {
    if (!JSONBIN_CONFIG.BIN_ID) {
      console.warn('⚠️ 没有配置 BIN_ID，无法发送到服务器')
      return false
    }

    const url = `${JSONBIN_CONFIG.DATA_SOURCE}${JSONBIN_CONFIG.BIN_ID}`
    const headers = {
      'Content-Type': 'application/json',
      'X-Master-Key': JSONBIN_CONFIG.MASTER_KEY
    }

    const res = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(newData)
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const result = await res.json()
    // console.log('✅ 数据更新成功:', result)

    return result
  } catch (error) {
    console.error('❌ 更新数据失败:', error)
    return false
  }
}

/**
 * 更新用户配置
 * @param userName 用户名
 * @param configKey 配置项
 * @param configValue 配置值
 * @param currentData 当前数据
 * @returns true/false 是否更新成功
 */
export async function updateUserConfig(
  userName: string,
  configKey: keyof UserConfig,
  configValue: UserConfig[keyof UserConfig],
  currentData: ProfitData,
): Promise<boolean> {
  try {
    ; (currentData.data[userName].config as any)[configKey] = configValue
    const res = await updateDataInAPI(currentData)

    if (res) {
      console.log(`✅ ${userName} 的 ${configKey} 配置更新成功:`, configValue)
      return res
    }
    return false
  } catch (error) {
    console.error(`❌ 更新用户配置失败:`, error)
    return false
  }
}

/**
 * 批量更新用户配置
 * @param userName 用户名
 * @param configs 配置对象
 * @param currentData 当前数据
 * @returns true/false 是否更新成功
 */
export async function updateUserConfigs(
  userName: string,
  configs: Partial<UserConfig>,
  currentData: ProfitData,
): Promise<boolean> {
  try {
    // 批量更新配置
    Object.entries(configs).forEach(([key, value]) => {
      ; (currentData.data[userName].config as any)[key] = value
    })

    // 只调用一次API
    const res = await updateDataInAPI(currentData)

    if (res) {
      console.log(`✅ ${userName} 的批量配置更新成功:`, configs)
      return res
    }
    return false
  } catch (error) {
    console.error(`❌ 批量更新用户配置失败:`, error)
    return false
  }
}

// 获取用户 IP 地址
export async function getUserIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data.ip || 'Unknown'
  } catch (error) {
    console.error('❌ 获取IP地址失败:', error)
    return 'Unknown'
  }
}

// 导出配置
export { JSONBIN_CONFIG, binIdMap } 