<script setup lang="ts">
import { computed, ref, watch, onUnmounted, nextTick, shallowRef } from 'vue'
import { useInstrumentsQuery, useCandlesQuery } from '@/shared/api/queries'
import echarts from '@/shared/charts/echarts-market'
import { computeBollingerBands, computeRsi, BB_DEFAULTS, RSI_DEFAULTS } from '@/shared/indicators/engine'
import AppCard from '@/shared/ui/AppCard.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import { formatMarketTime } from '@/shared/utils/format'
import { DEV_MARKET_CLOCK } from '@/shared/config/market-clock'
import type { Candle, Timeframe } from '@/shared/api/schemas'

/* ---- Instruments API (symbol search) ---- */
const symbolSearch = ref('')
const searchTriggered = computed(() => symbolSearch.value || undefined)
const { data: instrumentsQ } = useInstrumentsQuery(() => searchTriggered.value ?? '')
const instruments = computed(() => (instrumentsQ.value as any)?.data?.items ?? [])

/* ---- Active symbol & timeframe ---- */
const activeSymbol = ref('US:AAPL')
const activePeriod = ref<Timeframe>('1D')
const rangeKey = ref<'1D' | '5D' | '1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M')

const RANGE_CONFIG: Record<string, { days: number; limit: number }> = {
  '1D': { days: 1, limit: 100 },
  '5D': { days: 5, limit: 100 },
  '1M': { days: 30, limit: 200 },
  '3M': { days: 90, limit: 200 },
  '6M': { days: 180, limit: 300 },
  '1Y': { days: 365, limit: 500 },
  'ALL': { days: 730, limit: 1000 }, // 2 years, clearly distinct from 1Y
}

const mockBase = new Date(DEV_MARKET_CLOCK.baseIso)

const candleFrom = computed(() => {
  const cfg = RANGE_CONFIG[rangeKey.value]
  const d = new Date(mockBase)
  d.setUTCDate(d.getUTCDate() - cfg.days)
  return d.toISOString()
})

const candleTo = computed(() => mockBase.toISOString())
const candleLimit = computed(() => RANGE_CONFIG[rangeKey.value].limit)

/* ---- Indicators ---- */
const showBB = ref(false)
const showRSI = ref(false)
const bbPeriod = ref(BB_DEFAULTS.period)
const bbStdDev = ref(BB_DEFAULTS.stdDev)
const rsiPeriod = ref(RSI_DEFAULTS.period)

// Zod-style validation for indicator params
const bbPeriodErr = computed(() => {
  if (bbPeriod.value < 2 || bbPeriod.value > 200 || !Number.isInteger(bbPeriod.value)) return '2–200 整数'
  return ''
})
const bbStdDevErr = computed(() => {
  if (bbStdDev.value < 0.5 || bbStdDev.value > 5) return '0.5–5'
  return ''
})
const rsiPeriodErr = computed(() => {
  if (rsiPeriod.value < 2 || rsiPeriod.value > 200 || !Number.isInteger(rsiPeriod.value)) return '2–200 整数'
  return ''
})

/* ---- Candle data via query hook ---- */
const { data: candlesQ, isLoading, isError, error, refetch } = useCandlesQuery(
  () => activeSymbol.value,
  () => activePeriod.value,
  () => candleFrom.value,
  () => candleTo.value,
  () => candleLimit.value,
)

const envelope = computed(() => (candlesQ.value as any) ?? null)
const candles = computed<Candle[]>(() => envelope.value?.data?.candles ?? [])
const isMock = computed(() => envelope.value?.source === 'mock')
const candleDataStatus = computed(() => envelope.value?.dataStatus ?? 'HEALTHY')
const candleGapCount = computed(() =>
  envelope.value?.data?.candles ? countGaps(envelope.value.data.candles) : 0,
)
const candleSeries = computed(() => envelope.value?.data ?? null)

function countGaps(cs: Candle[]): number {
  if (cs.length < 2) return 0
  let gaps = 0
  const periodMs: Record<string, number> = {
    '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1D': 86400000, '1W': 604800000,
  }
  const ms = periodMs[activePeriod.value] ?? 86400000

  for (let i = 1; i < cs.length; i++) {
    const prevTime = new Date(cs[i - 1].timestamp)
    const currTime = new Date(cs[i].timestamp)
    const dt = currTime.getTime() - prevTime.getTime()
    if (dt <= ms * 2) continue

    // 检查缺口是否由自然休市（周末/盘后）导致
    // 遍历 prev 和 curr 之间所有预期蜡烛位，只要存在一个有效交易时间，就是真实缺口
    let expected = new Date(prevTime.getTime() + ms)
    let isNaturalGap = true
    while (expected.getTime() < currTime.getTime()) {
      if (isValidCandleTimestamp(expected, activePeriod.value)) {
        isNaturalGap = false
        break
      }
      expected = new Date(expected.getTime() + ms)
    }

    if (!isNaturalGap) gaps++
  }
  return gaps
}

function isValidCandleTimestamp(date: Date, period: string): boolean {
  const day = date.getUTCDay()
  // 跳过周末
  if (day === 0 || day === 6) return false

  if (period === '1D' || period === '1W') return true

  // 日内蜡烛检查 EDT 交易时段 (EDT = UTC-4)
  const edt = new Date(date.getTime() - 4 * 3600000)
  const h = edt.getUTCHours()
  const m = edt.getUTCMinutes()

  // 09:30 EDT 之前
  if (h < 9 || (h === 9 && m < 30)) return false

  switch (period) {
    case '1m':
      return h < 16
    case '5m':
      return h < 16 && !(h === 15 && m > 55)
    case '15m':
      return h < 16 && !(h === 15 && m > 45)
    case '1h':
      return m === 30 && h >= 9 && h <= 15
    case '4h':
      return m === 30 && (h === 9 || h === 13)
    default:
      return true
  }
}

/* ---- Computed indicator results ---- */
const closes = computed(() => candles.value.map((c) => c.close))
const validBB = computed(() => showBB.value && !bbPeriodErr.value && !bbStdDevErr.value)
const validRSI = computed(() => showRSI.value && !rsiPeriodErr.value)

const bbResults = computed(() =>
  validBB.value ? computeBollingerBands(closes.value, bbPeriod.value, bbStdDev.value) : [],
)
const rsiResults = computed(() =>
  validRSI.value ? computeRsi(closes.value, rsiPeriod.value) : [],
)

/* ---- View mode ---- */
const viewMode = ref<'chart' | 'table'>('chart')

/* ---- ECharts lifecycle ---- */
const chartRef = shallowRef<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null
let resizeHandler: (() => void) | null = null

function disposeChart() {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler)
    resizeHandler = null
  }
  if (chart) {
    chart.dispose()
    chart = null
  }
}

function buildOption() {
  const dates = candles.value.map((c) => c.timestamp)
  const ohlc = candles.value.map((c) => [c.open, c.close, c.low, c.high])
  const vols = candles.value.map((c) => c.volume)
  const bb = bbResults.value
  const rsi = rsiResults.value
  const hasBB = bb.length > 0
  const hasRSI = rsi.length > 0

  const xAxis: any[] = []
  const yAxis: any[] = []
  const grid: any[] = []
  const series: any[] = []

  const axisLabelFormatter = (v: string) => {
    if (activePeriod.value === '1D' || activePeriod.value === '1W') return v.slice(5, 10)
    const d = new Date(v)
    return d.toISOString().slice(11, 16) + 'Z'
  }

  // Grid 0: K-line + BB
  grid.push({ left: 12, right: 70, top: 40, bottom: hasRSI ? '45%' : 60 })
  xAxis.push({
    type: 'category', data: dates, gridIndex: 0,
    axisLabel: { color: '#738298', fontSize: 10, formatter: axisLabelFormatter },
  })
  yAxis.push({ type: 'value', scale: true, axisLabel: { color: '#738298', fontSize: 10 }, gridIndex: 0 })

  series.push({
    name: 'K线', type: 'candlestick', xAxisIndex: 0, yAxisIndex: 0,
    data: ohlc,
    itemStyle: { color: '#3bcb83', color0: '#f05d6f', borderColor: '#3bcb83', borderColor0: '#f05d6f' },
  })

  if (hasBB) {
    series.push({ name: 'BB上', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: bb.map((b) => b.upper), lineStyle: { color: 'rgba(79,140,255,0.4)', width: 1 }, symbol: 'none' })
    series.push({ name: 'BB中', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: bb.map((b) => b.middle), lineStyle: { color: 'rgba(79,140,255,0.7)', width: 1 }, symbol: 'none' })
    series.push({ name: 'BB下', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: bb.map((b) => b.lower), lineStyle: { color: 'rgba(79,140,255,0.4)', width: 1 }, symbol: 'none' })
  }

  // Grid 1: Volume (own xAxis + yAxis)
  grid.push({ left: 12, right: 70, top: hasRSI ? '60%' : '80%', height: hasRSI ? '10%' : '12%' })
  xAxis.push({
    type: 'category', data: dates, gridIndex: 1,
    axisLabel: { show: false },
  })
  yAxis.push({ type: 'value', axisLabel: { color: '#738298', fontSize: 9 }, gridIndex: 1, splitLine: { show: false } })
  series.push({
    name: 'Vol', type: 'bar', xAxisIndex: 1, yAxisIndex: 1,
    data: vols.map((v, i) => [i, v, ohlc[i]?.[1] >= ohlc[i]?.[0] ? 1 : -1]),
    itemStyle: { color: (p: any) => p.data[2] > 0 ? 'rgba(59,203,131,0.4)' : 'rgba(240,93,111,0.4)' },
  })

  // Grid 2: RSI (own xAxis + yAxis)
  const totalGrids = hasRSI ? 3 : 2
  if (hasRSI) {
    grid.push({ left: 12, right: 70, bottom: 20, height: '12%' })
    xAxis.push({
      type: 'category', data: dates, gridIndex: 2,
      axisLabel: { color: '#738298', fontSize: 9, formatter: axisLabelFormatter },
    })
    yAxis.push({ type: 'value', min: 0, max: 100, axisLabel: { color: '#738298', fontSize: 9 }, gridIndex: 2, splitLine: { show: false } })
    series.push({
      name: 'RSI', type: 'line', xAxisIndex: 2, yAxisIndex: 2,
      data: rsi.map((r) => r.value),
      lineStyle: { color: '#a985f9', width: 1.5 }, symbol: 'none',
      markLine: {
        silent: true, symbol: 'none',
        lineStyle: { type: 'dashed', color: '#738298', width: 1 },
        data: [
          { yAxis: 70, label: { show: true, formatter: '70', color: '#738298', fontSize: 10 } },
          { yAxis: 30, label: { show: true, formatter: '30', color: '#738298', fontSize: 10 } },
        ],
      },
    })
  }

  const allAxes = Array.from({ length: totalGrids }, (_, i) => i)
  return {
    backgroundColor: 'transparent',
    grid, xAxis, yAxis, series,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        link: allAxes.map((i) => ({ xAxisIndex: i })),
      },
      backgroundColor: 'rgba(16,28,45,0.95)',
      borderColor: '#24344a',
      textStyle: { color: '#f4f7fb', fontSize: 12 },
      formatter: (params: any) => {
        const k = params.find((p: any) => p.seriesName === 'K线' || p.seriesName === 'K线')
        if (!k) return ''
        const d = k.data
        return `${k.axisValue}<br/>O: ${d[0]}  H: ${d[3]}  L: ${d[2]}  C: ${d[1]}<br/>涨跌幅: ${((d[1] - d[0]) / d[0] * 100).toFixed(2)}%`
      },
    },
    dataZoom: [
      { type: 'inside', xAxisIndex: allAxes },
      { type: 'slider', xAxisIndex: allAxes, bottom: 5, height: 15, backgroundColor: 'transparent', dataBackground: { lineStyle: { color: '#738298' }, areaStyle: { color: 'rgba(115,130,152,0.1)' } } },
    ],
  } as any
}

function renderChart() {
  if (!chartRef.value || candles.value.length === 0) {
    disposeChart()
    return
  }
  if (!chart) {
    chart = echarts.init(chartRef.value)
    resizeHandler = () => chart?.resize()
    window.addEventListener('resize', resizeHandler)
  }
  chart.setOption(buildOption(), true)
}

watch([candles, showBB, showRSI, bbPeriod, bbStdDev, rsiPeriod, viewMode], () => {
  nextTick(() => {
    if (candles.value.length === 0 || viewMode.value !== 'chart') {
      disposeChart()
    } else {
      renderChart()
    }
  })
})

watch(activeSymbol, () => { disposeChart() })
watch(activePeriod, () => { disposeChart() })

onUnmounted(() => disposeChart())

/* ---- Period list ---- */
const PERIODS: Timeframe[] = ['1m', '5m', '15m', '1h', '4h', '1D', '1W']
const TIME_RANGES = ['1D', '5D', '1M', '3M', '6M', '1Y', 'ALL'] as const

/* ---- Symbol info from instruments ---- */
const activeInfo = computed(() => instruments.value.find((i: any) => i.canonicalSymbol === activeSymbol.value))

function onSymbolChange(e: Event) {
  activeSymbol.value = (e.target as HTMLSelectElement).value
}
</script>

<template>
  <div class="page">
    <header class="page__head">
      <h1 class="page-title">行情图表</h1>
      <p class="caption">K线 · 指标 · 只读研究 · {{ activeSymbol }}</p>
    </header>

    <DemoDataBanner v-if="isMock && !isLoading" />

    <!-- 工具栏 -->
    <AppCard title="工具栏">
      <div class="toolbar">
        <!-- Symbol 搜索/选择 -->
        <input
          class="inp"
          v-model="symbolSearch"
          list="symbol-list"
          placeholder="搜索美股/BTC…"
          aria-label="搜索品种"
          style="min-width: 180px;"
        />
        <datalist id="symbol-list">
          <option v-for="s in instruments" :key="s.canonicalSymbol" :value="s.canonicalSymbol">{{ s.displayName }} ({{ s.canonicalSymbol }})</option>
        </datalist>

        <select class="sel" :value="activeSymbol" @change="onSymbolChange" aria-label="选择品种">
          <option v-for="s in instruments" :key="s.canonicalSymbol" :value="s.canonicalSymbol">{{ s.displayName }}</option>
        </select>

        <!-- 周期 -->
        <div class="btn-group" role="group" aria-label="周期">
          <button v-for="p in PERIODS" :key="p" class="tb-btn" :class="{ active: activePeriod === p }" @click="activePeriod = p">{{ p }}</button>
        </div>

        <!-- 时间范围 -->
        <div class="btn-group" role="group" aria-label="时间范围">
          <button v-for="r in TIME_RANGES" :key="r" class="tb-btn" :class="{ active: rangeKey === r }" @click="rangeKey = r">{{ r }}</button>
        </div>

        <!-- 视图 -->
        <div class="btn-group">
          <button class="tb-btn" :class="{ active: viewMode === 'chart' }" @click="viewMode = 'chart'" aria-label="图表视图" :aria-pressed="viewMode === 'chart'">图表</button>
          <button class="tb-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'" aria-label="数据表视图" :aria-pressed="viewMode === 'table'">数据表</button>
        </div>

        <!-- 状态信息 -->
        <span class="caption" v-if="activeInfo">
          {{ activeInfo.timezone }} · {{ candleDataStatus }}
          <template v-if="candleGapCount > 0"> · 缺口 {{ candleGapCount }}</template>
          <template v-if="candleSeries"> · {{ candleSeries.dataStatus }} · {{ isMock ? 'Mock' : 'Live' }}</template>
        </span>
      </div>
    </AppCard>

    <!-- 指标配置 -->
    <AppCard title="指标">
      <div class="ind-row">
        <label class="chk"><input type="checkbox" v-model="showBB" /> Bollinger Bands</label>
        <template v-if="showBB">
          <label class="ind-lbl">Period <input type="number" v-model.number="bbPeriod" min="2" max="200" step="1" class="num-inp" /></label>
          <span v-if="bbPeriodErr" class="err">{{ bbPeriodErr }}</span>
          <label class="ind-lbl">StdDev <input type="number" v-model.number="bbStdDev" min="0.5" max="5" step="0.1" class="num-inp" /></label>
          <span v-if="bbStdDevErr" class="err">{{ bbStdDevErr }}</span>
        </template>
        <label class="chk"><input type="checkbox" v-model="showRSI" /> RSI</label>
        <template v-if="showRSI">
          <label class="ind-lbl">Period <input type="number" v-model.number="rsiPeriod" min="2" max="200" step="1" class="num-inp" /></label>
          <span v-if="rsiPeriodErr" class="err">{{ rsiPeriodErr }}</span>
        </template>
      </div>
    </AppCard>

    <!-- 加载 / 错误 -->
    <div v-if="isLoading && candles.length === 0"><StatePanel kind="loading" /></div>
    <div v-else-if="isError">
      <StatePanel kind="error" title="行情数据获取失败" :description="(error as Error)?.message">
        <template #actions><button class="btn-retry" @click="refetch()">重试</button></template>
      </StatePanel>
    </div>

    <!-- 数据展示 -->
    <template v-else-if="candles.length > 0">
      <!-- 图表视图 -->
      <AppCard v-if="viewMode === 'chart'" title="K线图">
        <div ref="chartRef" class="chart" />
      </AppCard>

      <!-- 数据表视图 -->
      <AppCard v-else :title="`数据表（${candles.length} 根 K 线）`">
        <div class="tbl-wrap">
          <table class="tbl">
            <caption class="sr-only">{{ activeSymbol }} {{ activePeriod }} 行情数据</caption>
            <thead>
              <tr>
                <th>时间</th><th>O</th><th>H</th><th>L</th><th>C</th><th>V</th>
                <th v-if="bbResults.length">BB上</th><th v-if="bbResults.length">BB中</th><th v-if="bbResults.length">BB下</th>
                <th v-if="rsiResults.length">RSI</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(c, i) in candles" :key="c.timestamp">
                <td>{{ formatMarketTime(c.timestamp, activeInfo?.timezone ?? 'America/New_York') }}</td>
                <td class="num">{{ c.open.toFixed(2) }} {{ c.currency }}</td>
                <td class="num">{{ c.high.toFixed(2) }}</td>
                <td class="num">{{ c.low.toFixed(2) }}</td>
                <td class="num">{{ c.close.toFixed(2) }}</td>
                <td class="num">{{ c.volume }}</td>
                <td v-if="bbResults.length" class="num">{{ bbResults[i]?.upper?.toFixed(2) ?? '—' }}</td>
                <td v-if="bbResults.length" class="num">{{ bbResults[i]?.middle?.toFixed(2) ?? '—' }}</td>
                <td v-if="bbResults.length" class="num">{{ bbResults[i]?.lower?.toFixed(2) ?? '—' }}</td>
                <td v-if="rsiResults.length" class="num">{{ rsiResults[i]?.value?.toFixed(1) ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
    <div v-else><StatePanel kind="empty" title="无行情数据" /></div>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.page__head { display: flex; flex-direction: column; gap: 2px; }
.toolbar { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
.inp { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-control); color: var(--text-primary); padding: 4px 10px; font-size: 13px; }
.sel { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-control); color: var(--text-primary); padding: 4px 10px; font-size: 13px; }
.btn-group { display: flex; gap: 2px; }
.tb-btn { padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); font-size: 12px; cursor: pointer; }
.tb-btn.active { border-color: var(--brand-primary); color: var(--brand-primary); background: rgba(79,140,255,0.1); }
.ind-row { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
.chk { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
.ind-lbl { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-muted); }
.num-inp { width: 55px; background: var(--bg-card); border: 1px solid var(--border-default); border-radius: 4px; color: var(--text-primary); padding: 2px 6px; font-size: 12px; }
.err { font-size: 11px; color: var(--danger); }
.chart { width: 100%; height: 600px; }
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; }
.tbl th, .tbl td { padding: 4px 8px; border-bottom: 1px solid var(--border-default); text-align: left; white-space: nowrap; }
.tbl th { color: var(--text-muted); font-weight: 600; font-size: 11px; }
.tbl td { color: var(--text-primary); }
.btn-retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
