<template>
  <div class="visual-wrap">
    <section class="playground card">
      <div class="playground-left">
        <p class="formula-title">FV = PV(1 + r/m)<sup>n·m</sup></p>
        <p class="formula-live">
          FV = {{ formatLocaleNumber(calc.principal, 0) }}(1 +
          {{ formatLocaleNumber(calc.periodicRate, 4) }})<sup>{{ calc.totalPeriods }}</sup> =
          <strong>${{ formatLocaleNumber(calc.fv) }}</strong>
        </p>

        <div class="freq-row">
          <span class="freq-label">复利频率</span>
          <SegmentTabs v-model="frequency" :tabs="frequencyTabs" size="sm" />
        </div>

        <div class="sliders">
          <ParamSlider v-model="pv" label="PV" unit="$" :min="0" :max="200000" :step="100" />
          <ParamSlider v-model="rate" label="r" unit="%" :min="0" :max="80" :step="1" />
          <ParamSlider v-model="years" label="n" unit="年" :min="1" :max="40" :step="1" />
        </div>

        <p class="tip">
          按{{ calc.freqLabel }}复利：年化利率分摊到每期，利息并入本金后继续计息。拖动滑块实时更新公式与曲线。
        </p>
        <SimPresets @apply="applyPreset" />
      </div>

      <div class="playground-right">
        <GrowthLineChart
          :points="calc.points"
          :end-label="`$${formatLocaleNumber(calc.fv)}`"
        />
      </div>
    </section>

    <ResultPanel :result="calc.result" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import SegmentTabs from '@/components/income/SegmentTabs.vue'
import { formatLocaleNumber } from '@/utils/format'
import ResultPanel from '../shared/ResultPanel.vue'
import SimPresets from '../shared/SimPresets.vue'
import GrowthLineChart from './GrowthLineChart.vue'
import ParamSlider from './ParamSlider.vue'
import { calcNoContribution, frequencyTabs } from '../calc'
import { findPreset, defaultPresetValues } from '../presets'
import type { Frequency } from '../types'

const pv = ref(defaultPresetValues.principal)
const rate = ref(defaultPresetValues.annualRate)
const years = ref(defaultPresetValues.years)
const frequency = ref<Frequency>(defaultPresetValues.frequency)

const calc = computed(() =>
  calcNoContribution({
    principal: pv.value,
    annualRate: rate.value,
    years: years.value,
    frequency: frequency.value,
  }),
)

function applyPreset(key: string) {
  const preset = findPreset(key)
  if (!preset) return
  pv.value = preset.values.principal
  rate.value = preset.values.annualRate
  years.value = preset.values.years
  frequency.value = preset.values.frequency
}
</script>

<style lang="scss" scoped>
.visual-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent), var(--card);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px;
  backdrop-filter: blur(8px);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
}

.playground {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: 12px;
  padding: 18px;
}

@media (max-width: 920px) {
  .playground {
    grid-template-columns: 1fr;
  }
}

.formula-title {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.formula-live {
  margin: 0 0 14px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.55;
  word-break: break-word;

  strong {
    color: var(--ok);
    font-size: 15px;
  }
}

.freq-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.freq-label {
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tip {
  margin: 16px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.playground-right {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 8px;
  min-height: 280px;
  display: flex;
  align-items: center;
}
</style>
