import type { Frequency } from './types'

export type CompoundPresetValues = {
  principal: number
  annualRate: number
  years: number
  contribution: number
  frequency: Frequency
  withdrawAfterYears: number // 第几年开始每月提取；0 = 不提取，1 = 第 1 年
  withdrawMonthly: number // 每月提取金额（USDT），0 表示不提取
}

export type CompoundPreset = {
  key: string
  label: string
  values: CompoundPresetValues
}

export type CompoundPresetGroup = {
  group: string
  presets: CompoundPreset[]
}

const base = {
  annualRate: 20,
  years: 3,
  frequency: 'month' as Frequency,
  withdrawAfterYears: 0,
  withdrawMonthly: 0,
}

/** 完整计算 / 复利拖动共用模拟数据（拖动模式忽略 contribution） */
export const simulationPresets: CompoundPresetGroup[] = [
  {
    group: '基础',
    presets: [
      {
        key: '1w',
        label: '1万 / 20% / 3年 / 月',
        values: { ...base, principal: 10000, contribution: 0 },
      },
      {
        key: '2w',
        label: '2万 / 20% / 3年 / 月',
        values: { ...base, principal: 20000, contribution: 0 },
      },
      {
        key: '3w',
        label: '3万 / 20% / 3年 / 月',
        values: { ...base, principal: 30000, contribution: 0 },
      },
    ],
  },
  {
    group: '定投',
    presets: [
      {
        key: 'dca-1w',
        label: '1万 / 20% / 3年 / 月定投500',
        values: { ...base, principal: 10000, contribution: 500 },
      },
      {
        key: 'dca-2w',
        label: '2万 / 20% / 3年 / 月定投1000',
        values: { ...base, principal: 20000, contribution: 1000 },
      },
      {
        key: 'dca-3w',
        label: '3万 / 20% / 3年 / 月定投1500',
        values: { ...base, principal: 30000, contribution: 1500 },
      },
    ],
  },
]

export function findPreset(key: string): CompoundPreset | undefined {
  return simulationPresets.flatMap((g) => g.presets).find((p) => p.key === key)
}

/** 第一个模拟预设，作为完整计算 / 复利拖动的初始值 */
export const defaultPresetValues: CompoundPresetValues =
  simulationPresets[0].presets[0].values

