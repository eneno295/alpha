<template>
  <div class="full-grid">
    <section class="card">
      <h1>复利计算器</h1>
      <p class="sub">按初始本金 + 定期定投，估算复利增长；支持不同复利频率。</p>

      <div class="grid">
        <div class="field">
          <label>初始本金（USDT）</label>
          <input v-model.number="form.principal" type="number" step="0.01" />
        </div>
        <div class="field">
          <label>年化收益率（%）</label>
          <input v-model.number="form.annualRate" type="number" step="0.01" />
        </div>
        <div class="field">
          <label>投资年数</label>
          <input v-model.number="form.years" type="number" step="1" />
        </div>
        <div class="field">
          <label>复利频率</label>
          <select v-model="form.frequency">
            <option v-for="opt in frequencyOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="field full">
          <label>每期定投（每{{ freqLabel }}，USDT，可为 0）</label>
          <input v-model.number="form.contribution" type="number" step="0.01" />
        </div>
      </div>

      <p class="tip">{{ result.hint }}</p>
      <SimPresets @apply="applyPreset" />
    </section>

    <ResultPanel :result="result" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from 'vue'
import ResultPanel from '../shared/ResultPanel.vue'
import SimPresets from '../shared/SimPresets.vue'
import { calcWithContribution, frequencyOptions, getFrequencyLabel } from '../calc'
import { findPreset, defaultPresetValues } from '../presets'

const form = reactive({ ...defaultPresetValues })

const freqLabel = computed(() => getFrequencyLabel(form.frequency))

const result = computed(() =>
  calcWithContribution({
    principal: form.principal,
    annualRate: form.annualRate,
    years: form.years,
    contribution: form.contribution,
    frequency: form.frequency,
  }),
)

function applyPreset(key: string) {
  const preset = findPreset(key)
  if (!preset) return
  Object.assign(form, preset.values)
}
</script>

<style lang="scss" scoped>
.full-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 16px;
}

@media (max-width: 920px) {
  .full-grid {
    grid-template-columns: 1fr;
  }
}

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
select {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(0, 0, 0, 0.15);
  color: var(--text);
  border-radius: 10px;
  padding: 10px 11px;
  font-size: 14px;
  outline: none;
}

.tip {
  margin-top: 12px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.full {
  grid-column: 1 / -1;
}
</style>
