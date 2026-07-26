<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch, computed } from 'vue'
import echarts from '@/shared/charts/echarts'
import type { EChartsOption } from '@/shared/charts/echarts'
import type { BenchmarkSeries } from '@/shared/api/types'
import { formatSignedPercent, formatPercent } from '@/shared/utils/format'
import { runningDrawdownAt } from '@/shared/utils/metrics'

const props = defineProps<{ series: BenchmarkSeries }>()

const RANGES = [
  { key: '1M', days: 21 },
  { key: '3M', days: 63 },
  { key: '6M', days: 126 },
  { key: 'YTD', days: 0 },
  { key: '1Y', days: 252 },
  { key: 'ALL', days: 9999 },
] as const

const activeRange = ref<string>('1Y')
const el = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function slicedPoints() {
  const pts = props.series.points
  if (activeRange.value === 'ALL') return pts
  if (activeRange.value === 'YTD') {
    const year = pts[pts.length - 1].date.slice(0, 4)
    return pts.filter((p) => p.date.slice(0, 4) === year)
  }
  const r = RANGES.find((x) => x.key === activeRange.value)
  const n = r ? r.days : pts.length
  return pts.slice(Math.max(0, pts.length - n))
}

function buildOption(): EChartsOption {
  const pts = slicedPoints()
  const dates = pts.map((p) => p.date)
  const portfolio = pts.map((p) => p.portfolio)
  const spy = pts.map((p) => p.spy)
  const qqq = pts.map((p) => p.qqq)
  return {
    backgroundColor: 'transparent',
    grid: { left: 48, right: 16, top: 16, bottom: 28 },
    legend: {
      data: ['组合净值', 'SPY', 'QQQ'],
      textStyle: { color: '#A9B6C8' },
      right: 8,
      top: 0,
      icon: 'roundRect',
      itemWidth: 12,
      itemHeight: 4,
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#142237',
      borderColor: '#24344A',
      textStyle: { color: '#F4F7FB', fontSize: 12 },
      formatter: (params: unknown) => {
        const arr = params as Array<{ axisValue: string; data: number; seriesName: string; dataIndex: number }>
        if (!arr.length) return ''
        const date = arr[0].axisValue
        const idx = arr[0].dataIndex ?? 0
        const get = (name: string) => arr.find((a) => a.seriesName === name)?.data ?? '—'
        const p = Number(get('组合净值'))
        const s = Number(get('SPY'))
        const excess = Number.isFinite(p) && Number.isFinite(s) ? p - s : NaN
        // 回撤仅用截至该日期的运行峰值，避免使用未来更高点（§复验 P2-6）
        const dd = runningDrawdownAt(portfolio, idx)
        const row = (name: string, v: number | string) =>
          `<div style="display:flex;justify-content:space-between;gap:16px"><span>${name}</span><span style="font-variant-numeric:tabular-nums">${typeof v === 'number' ? v.toFixed(2) : v}</span></div>`
        return [
          `<div style="margin-bottom:4px;color:#A9B6C8">${date}</div>`,
          row('组合净值', p),
          row('SPY', s),
          row('累计超额', Number.isFinite(excess) ? formatSignedPercent(excess) : '—'),
          row('当前回撤', Number.isFinite(dd) ? formatPercent(dd) : '—'),
        ].join('')
      },
    },
    xAxis: {
      type: 'category',
      data: dates,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#24344A' } },
      axisLabel: { color: '#738298', fontSize: 11, hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitLine: { lineStyle: { color: '#16233a' } },
      axisLabel: { color: '#738298', fontSize: 11 },
    },
    series: [
      {
        name: '组合净值',
        type: 'line',
        data: portfolio,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#4F8CFF', width: 2 },
        itemStyle: { color: '#4F8CFF' },
        markPoint: {
          symbol: 'circle',
          symbolSize: 6,
          data: [{ type: 'max', name: 'last' }],
          itemStyle: { color: '#4F8CFF' },
          label: { show: false },
        },
      },
      {
        name: 'SPY',
        type: 'line',
        data: spy,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#A985F9', width: 2 },
        itemStyle: { color: '#A985F9' },
      },
      {
        name: 'QQQ',
        type: 'line',
        data: qqq,
        smooth: true,
        showSymbol: false,
        lineStyle: { color: '#5CB8FF', width: 1.5, type: 'dashed' },
        itemStyle: { color: '#5CB8FF' },
      },
    ],
  }
}

function render() {
  if (!chart) return
  chart.setOption(buildOption(), true)
  // 更新副标题里的时间窗口与费用后标记
  subtitleText.value = `窗口 ${props.series.window} · ${props.series.afterFee ? '费用后' : '费用前'} · 累计超额 ${formatSignedPercent(props.series.cumulativeExcess)}`
}

const subtitleText = ref('')

watch(() => [props.series, activeRange.value], render, { deep: true })

onMounted(() => {
  if (el.value) {
    chart = echarts.init(el.value, undefined, { renderer: 'canvas' })
    render()
    window.addEventListener('resize', onResize)
  }
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
function onResize() {
  chart?.resize()
}

const cumulativeExcessText = computed(() => formatSignedPercent(props.series.cumulativeExcess))
</script>

<template>
  <div class="bench">
    <div class="bench__head">
      <div>
        <h3 class="section-title">净值与基准</h3>
        <p class="caption bench__sub">{{ subtitleText }}</p>
      </div>
      <div class="bench__ranges" role="group" aria-label="时间窗口">
        <button
          v-for="r in RANGES"
          :key="r.key"
          type="button"
          class="bench__range"
          :class="{ 'bench__range--active': activeRange === r.key }"
          :aria-pressed="activeRange === r.key"
          @click="activeRange = r.key"
        >
          {{ r.key }}
        </button>
      </div>
    </div>
    <div ref="el" class="bench__chart" role="img" aria-label="组合净值与基准归一化曲线" />
    <p class="caption bench__foot">
      组合累计超额 <strong :class="props.series.cumulativeExcess >= 0 ? 'pos' : 'neg'">{{ cumulativeExcessText }}</strong>
      · 当前回撤 {{ formatPercent(props.series.currentDrawdown) }} · 不显示预测价格或目标价
    </p>
  </div>
</template>

<style scoped>
.bench {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  height: 100%;
}
.bench__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.bench__sub {
  margin: 4px 0 0;
}
.bench__ranges {
  display: flex;
  gap: 4px;
}
.bench__range {
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-secondary);
  cursor: pointer;
}
.bench__range--active {
  background: rgba(79, 140, 255, 0.14);
  color: var(--text-primary);
  border-color: var(--brand-primary);
}
.bench__chart {
  width: 100%;
  height: 280px;
}
.bench__foot {
  margin: 0;
}
.pos {
  color: var(--text-primary);
}
.neg {
  color: var(--text-secondary);
}
</style>
