<template>
  <section class="card">
    <h1>网格策略估算器</h1>
    <p class="sub">支持等差/等比两种网格模式：先算总投入，再按网格模式估算单网格数量。</p>

    <div class="grid">
      <div class="field">
        <label>投资金额（USDT）</label>
        <input v-model.number="form.investAmount" type="number" step="0.01" />
      </div>
      <div class="field">
        <label>策略倍数（x）</label>
        <input v-model.number="form.multiplier" type="number" step="0.1" />
      </div>
      <div class="field">
        <label>网格数量</label>
        <input v-model.number="form.grids" type="number" step="1" />
      </div>
      <div class="field">
        <label>每天成交网格（次）</label>
        <input v-model.number="form.dailyFilledGrids" type="number" step="1" />
      </div>
      <div class="field">
        <label>策略区间下限（USDT）</label>
        <input v-model.number="form.rangeLow" type="number" step="0.01" />
      </div>
      <div class="field">
        <label>策略区间上限（USDT）</label>
        <input v-model.number="form.rangeHigh" type="number" step="0.01" />
      </div>
      <div class="field">
        <label>预估价位（USDT）</label>
        <input v-model.number="form.estimatePrice" type="number" step="0.01" />
      </div>
      <div class="field">
        <label>预估价位每格差价（USDT）</label>
        <input v-model.number="form.estimateGridDiff" type="number" step="0.01" />
      </div>
    </div>

    <details class="advanced-card">
      <summary>高级参数（不常修改）</summary>
      <div class="grid advanced-grid">
        <div class="field">
          <label>预留率（%）</label>
          <input v-model.number="form.reserveRate" type="number" step="0.01" />
        </div>
        <div class="field">
          <label>网格模式</label>
          <select v-model="form.gridMode">
            <option value="arithmetic">等差</option>
            <option value="geometric">等比</option>
          </select>
        </div>
        <div class="field">
          <label>平台</label>
          <select
            :value="selectedPlatformKey"
            @change="
              $emit('update:selectedPlatformKey', ($event.target as HTMLSelectElement).value)
            "
          >
            <option v-for="platform in platformKeys" :key="platform" :value="platform">
              {{ riskConfig[platform].label }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>币种</label>
          <select
            :value="selectedSymbolKey"
            @change="$emit('update:selectedSymbolKey', ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="symbol in symbolKeys" :key="symbol" :value="symbol">
              {{ symbol }}
            </option>
          </select>
        </div>
        <div class="field">
          <label>挂单费率 Maker（%）</label>
          <input v-model.number="form.makerFeeRate" type="number" step="0.01" />
        </div>
        <div class="field">
          <label>吃单费率 Taker（%）</label>
          <input v-model.number="form.takerFeeRate" type="number" step="0.01" />
        </div>
        <div class="field full">
          <label>维持保证金率分档（格式：仓位上限:MMR%，逗号分隔）</label>
          <textarea v-model="form.mmrTiers"></textarea>
        </div>
        <div class="field full">
          <label>预留率快捷配置</label>
          <div class="preset-line">
            <button
              v-for="preset in reserveRatePresets"
              :key="preset.key"
              class="preset-btn"
              type="button"
              @click="form.reserveRate = preset.value"
            >
              {{ preset.label }}
            </button>
          </div>
        </div>
      </div>
    </details>

    <div class="tip preset-line">
      <span>模拟数据：</span>
      <button
        v-for="preset in simulationPresets"
        :key="preset.key"
        class="preset-btn"
        type="button"
        @click="$emit('apply-simulation', preset.key)"
      >
        {{ preset.label }}
      </button>
    </div>

    <p class="tip">{{ hint }}</p>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import type { ReserveRatePreset, RiskConfig, SimulationPreset, SimulationPresetKey } from '../type'

defineProps({
  form: { type: Object as PropType<Record<string, any>>, required: true },
  selectedPlatformKey: { type: String, required: true },
  selectedSymbolKey: { type: String, required: true },
  platformKeys: { type: Array as PropType<string[]>, required: true },
  symbolKeys: { type: Array as PropType<string[]>, required: true },
  riskConfig: { type: Object as PropType<RiskConfig>, required: true },
  reserveRatePresets: { type: Array as PropType<ReserveRatePreset[]>, required: true },
  simulationPresets: { type: Array as PropType<SimulationPreset[]>, required: true },
  hint: { type: String, required: true },
})

defineEmits<{
  (e: 'update:selectedPlatformKey', value: string): void
  (e: 'update:selectedSymbolKey', value: string): void
  (e: 'apply-simulation', key: SimulationPresetKey): void
}>()
</script>

<style lang="scss" scoped>
.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent), var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

h1 {
  margin: 0 0 6px;
  font-size: 22px;
}

.sub {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 13px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.advanced-card {
  margin-top: 12px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
}

.advanced-card > summary {
  cursor: pointer;
  color: var(--muted);
  font-size: 13px;
  user-select: none;
}

.advanced-grid {
  margin-top: 10px;
}

.field {
  background: var(--card-2);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 10px;
}

label {
  display: block;
  font-size: 12px;
  color: var(--muted);
  margin-bottom: 6px;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 11px;
  font-size: 14px;
  outline: none;
}

textarea {
  resize: vertical;
  min-height: 74px;
  line-height: 1.35;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
}

button {
  border: 1px solid var(--line);
  color: var(--text);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02));
  padding: 9px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 13px;
}

.tip {
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.preset-line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.preset-btn {
  padding: 6px 10px;
  font-size: 12px;
}

.full {
  grid-column: 1 / -1;
}
</style>
