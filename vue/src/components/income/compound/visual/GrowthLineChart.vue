<template>
  <svg class="chart" :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#6ea8ff" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#6ea8ff" stop-opacity="0.02" />
      </linearGradient>
    </defs>

    <g class="grid">
      <line
        v-for="(y, i) in yTicks"
        :key="'gy' + i"
        :x1="pad.l"
        :y1="yToSvg(y)"
        :x2="W - pad.r"
        :y2="yToSvg(y)"
      />
      <line
        v-for="(t, i) in xTicks"
        :key="'gx' + i"
        :x1="xToSvg(t)"
        :y1="pad.t"
        :x2="xToSvg(t)"
        :y2="H - pad.b"
      />
    </g>

    <text
      v-for="(y, i) in yTicks"
      :key="'yl' + i"
      class="axis-label"
      :x="pad.l - 8"
      :y="yToSvg(y) + 4"
      text-anchor="end"
    >
      {{ formatAxis(y) }}
    </text>

    <text
      v-for="(t, i) in xTicks"
      :key="'xl' + i"
      class="axis-label x-label"
      :x="xToSvg(t)"
      :y="H - 8"
      text-anchor="middle"
    >
      {{ formatXAxis(t) }}
    </text>

    <path v-if="areaD" class="area" :d="areaD" />
    <path class="curve" :d="pathD" fill="none" />

    <circle class="dot" :cx="dotX" :cy="dotY" r="6" />
    <g :transform="`translate(${bubbleX}, ${bubbleY})`">
      <rect class="bubble" x="-58" y="-28" width="116" height="26" rx="8" />
      <text class="bubble-text" x="0" y="-10" text-anchor="middle">{{ endLabel }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type ChartPoint = { x: number; y: number }

const props = defineProps<{
  points: ChartPoint[]
  endLabel: string
}>()

const W = 420
const H = 280
const pad = { t: 36, r: 24, b: 36, l: 56 }

function formatAxis(v: number): string {
  if (v >= 10000) return `${Math.round(v / 1000)}k`
  return String(Math.round(v))
}

function formatXAxis(t: number): string {
  return Number.isInteger(t) ? String(t) : t.toFixed(1)
}

const endX = computed(() => props.points[props.points.length - 1]?.x ?? 0)
const endY = computed(() => props.points[props.points.length - 1]?.y ?? 0)
const xMax = computed(() => Math.max(endX.value, 1))
const startY = computed(() => props.points[0]?.y ?? 0)

const yMin = computed(() => {
  const vals = props.points.map((p) => p.y)
  if (!vals.length) return 0
  return Math.max(0, Math.min(...vals, startY.value) * 0.85)
})

const yMax = computed(() => {
  const vals = props.points.map((p) => p.y)
  if (!vals.length) return 1
  return Math.max(...vals, startY.value) * 1.08 || 1
})

const yTicks = computed(() => {
  const min = yMin.value
  const max = yMax.value
  const step = (max - min) / 4
  return [0, 1, 2, 3, 4].map((i) => min + step * i)
})

const xTicks = computed(() => {
  const n = xMax.value
  if (n <= 5) return Array.from({ length: n + 1 }, (_, i) => i)
  const step = Math.max(1, Math.ceil(n / 5))
  const ticks: number[] = []
  for (let t = 0; t <= n; t += step) ticks.push(t)
  if (ticks[ticks.length - 1] !== n) ticks.push(n)
  return ticks
})

function xToSvg(t: number): number {
  const span = W - pad.l - pad.r
  return pad.l + (t / xMax.value) * span
}

function yToSvg(v: number): number {
  const span = H - pad.t - pad.b
  const min = yMin.value
  const max = yMax.value
  const ratio = max === min ? 0 : (v - min) / (max - min)
  return H - pad.b - ratio * span
}

const svgPoints = computed(() =>
  props.points.map((p) => ({
    x: xToSvg(p.x),
    y: yToSvg(p.y),
  })),
)

const pathD = computed(() => {
  const pts = svgPoints.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
})

const areaD = computed(() => {
  const pts = svgPoints.value
  if (!pts.length) return ''
  const baseY = H - pad.b
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const first = pts[0]
  return `${line} L ${last.x.toFixed(1)} ${baseY} L ${first.x.toFixed(1)} ${baseY} Z`
})

const dotX = computed(() => xToSvg(endX.value))
const dotY = computed(() => yToSvg(endY.value))

const bubbleX = computed(() => {
  const x = dotX.value
  return Math.min(W - pad.r - 60, Math.max(pad.l + 60, x))
})

const bubbleY = computed(() => Math.max(pad.t + 8, dotY.value - 8))
</script>

<style lang="scss" scoped>
.chart {
  width: 100%;
  height: auto;
  display: block;
}

.grid line {
  stroke: rgba(255, 255, 255, 0.08);
  stroke-width: 1;
}

.axis-label {
  fill: var(--muted);
  font-size: 10px;
}

.x-label {
  font-size: 9px;
}

.area {
  fill: url(#areaFill);
}

.curve {
  stroke: #6ea8ff;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dot {
  fill: #6ea8ff;
  stroke: #0b1020;
  stroke-width: 2;
}

.bubble {
  fill: #3b82f6;
}

.bubble-text {
  fill: #fff;
  font-size: 11px;
  font-weight: 700;
}
</style>
