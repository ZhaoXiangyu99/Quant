<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useBacktestDetailQuery } from '@/shared/api/queries'
import AppCard from '@/shared/ui/AppCard.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import { formatPercent, formatSignedPercent, formatMoney, formatMarketTime, formatDate } from '@/shared/utils/format'
import type { ApiEnvelope, BacktestRunDetail } from '@/shared/api/schemas'
import echarts from '@/shared/charts/echarts'
import { onMounted, onUnmounted, watch, nextTick } from 'vue'

const route = useRoute()
const runIdComputed = computed(() => route.params.runId as string)
const { data: qr, isLoading, isError, error, refetch } = useBacktestDetailQuery(() => runIdComputed.value)

const data = computed(() => (qr.value as ApiEnvelope<BacktestRunDetail> | undefined)?.data ?? null)
const isMock = computed(() => (qr.value as ApiEnvelope<BacktestRunDetail> | undefined)?.source === 'mock')

const TAB = ref<'nav' | 'trades' | 'ledger' | 'data' | 'exec'>('nav')
const CHART_MODE = ref<'chart' | 'table'>('chart')

const STATUS_TONES: Record<string, 'success' | 'warn' | 'block' | 'info'> = {
  PASS: 'success', FAIL: 'block', RUNNING: 'info', NO_SIGNALS: 'warn', OPEN_POSITION_ONLY: 'warn',
}
const STATUS_LABELS: Record<string, string> = {
  PASS: '通过', FAIL: '未通过', RUNNING: '运行中', NO_SIGNALS: '无信号', OPEN_POSITION_ONLY: '仅持仓',
}

/* ---- ECharts 净值 + 基准 曲线 ---- */
const chartRef = ref<HTMLDivElement | null>(null)
let chart: echarts.ECharts | null = null

function renderChart() {
  if (!chartRef.value || !data.value?.navSeries.length) return
  if (!chart) chart = echarts.init(chartRef.value)

  const dates = data.value.navSeries.map((p) => p.date)
  const nav = data.value.navSeries.map((p) => p.nav)
  const bm = data.value.navSeries.map((p) => p.benchmark)

  // 运行峰值回撤
  const dd: number[] = []
  let peak = -Infinity
  for (const v of nav) {
    if (v > peak) peak = v
    dd.push(peak > 0 ? ((v - peak) / peak) * 100 : 0)
  }

  chart.setOption({
    backgroundColor: 'transparent',
    grid: { top: 60, right: 80, bottom: 30, left: 60 },
    tooltip: { trigger: 'axis' },
    legend: { data: ['组合净值', '基准', '回撤%'], bottom: 0, textStyle: { color: '#a9b6c8', fontSize: 11 } },
    xAxis: { type: 'category', data: dates, axisLabel: { color: '#738298', fontSize: 10, formatter: (v: string) => v.slice(5) } },
    yAxis: [
      { type: 'value', axisLabel: { color: '#738298' }, splitLine: { lineStyle: { color: '#24344a' } } },
      { type: 'value', axisLabel: { color: '#738298', formatter: (v: number) => v.toFixed(0) + '%' }, splitLine: { show: false } },
    ],
    series: [
      { name: '组合净值', type: 'line', data: nav, smooth: true, lineStyle: { color: '#4f8cff', width: 2 }, symbol: 'none' },
      { name: '基准', type: 'line', data: bm, smooth: true, lineStyle: { color: '#a985f9', width: 1.5, type: 'dashed' }, symbol: 'none' },
      { name: '回撤%', type: 'line', yAxisIndex: 1, data: dd, areaStyle: { color: 'rgba(240,93,111,0.1)' }, lineStyle: { color: '#f05d6f', width: 1 }, symbol: 'none' },
    ],
  }, true)
}

watch([data, CHART_MODE], ([v, mode]) => { if (v && mode === 'chart') nextTick(renderChart) })
onMounted(() => nextTick(renderChart))
onUnmounted(() => { if (chart) { chart.dispose(); chart = null } })
</script>

<template>
  <div class="page">
    <header class="page__head">
      <h1 class="page-title">回测详情</h1>
      <p class="caption"><RouterLink to="/backtests" class="link">← 返回列表</RouterLink></p>
    </header>

    <div v-if="isLoading && !data"><StatePanel kind="loading" /></div>
    <div v-else-if="isError"><StatePanel kind="error" title="回测详情获取失败" :description="(error as Error)?.message"><template #actions><button class="btn-retry" @click="refetch()">重试</button></template></StatePanel></div>

    <template v-else-if="data">
      <DemoDataBanner v-if="isMock" />

      <!-- 顶部摘要 -->
      <div class="app-grid">
        <div class="col-12">
          <AppCard :title="data.strategyName" :subtitle="'Run ID: ' + data.runId + ' · ' + data.strategyVersion">
            <div class="summary">
              <div class="sm"><span class="sm__l">CAGR</span><span class="sm__v" :class="{ neg: data.cagr < 0 }">{{ formatSignedPercent(data.cagr) }}</span></div>
              <div class="sm"><span class="sm__l">最大回撤</span><span class="sm__v neg">{{ formatPercent(data.maxDrawdown) }}</span></div>
              <div class="sm"><span class="sm__l">对SPY超额</span><span class="sm__v">{{ formatSignedPercent(data.excessVsSpy) }}</span></div>
              <div class="sm"><span class="sm__l">Sharpe</span><span class="sm__v">{{ data.sharpe.toFixed(2) }}</span></div>
              <div class="sm"><span class="sm__l">Calmar</span><span class="sm__v">{{ data.calmar.toFixed(2) }}</span></div>
              <div class="sm"><span class="sm__l">换手</span><span class="sm__v">{{ data.turnover.toFixed(2) }}</span></div>
              <div class="sm"><span class="sm__l">费用与滑点</span><span class="sm__v">{{ formatMoney(data.commissionAndSlippage) }}</span></div>
              <div class="sm"><span class="sm__l">成交数</span><span class="sm__v">{{ data.tradeCount }}</span></div>
              <div class="sm"><span class="sm__l">同规则样本</span><span class="sm__v">{{ data.siblingSampleCount }}</span></div>
              <div class="sm"><span class="sm__l">最大盈利集中度</span><span class="sm__v">{{ formatPercent(data.maxWinnerConcentration) }}</span></div>
            </div>
            <div class="meta-row">
              <StatusBadge :tone="STATUS_TONES[data.status]" :text="STATUS_LABELS[data.status]" />
              <span v-if="data.openPositionOnly" class="tag">open-position-only</span>
              <span v-if="data.noSignals" class="tag">no-signals</span>
              <span class="caption">{{ data.afterFee ? '费用后' : '费用前' }} · 基准 {{ data.benchmark }} · {{ data.startDate }} – {{ data.endDate }}</span>
            </div>
          </AppCard>
        </div>
      </div>

      <!-- Tab 导航 -->
      <div class="tabs">
        <button :class="{ 'tab--on': TAB === 'nav' }" @click="TAB = 'nav'">净值与回撤</button>
        <button :class="{ 'tab--on': TAB === 'trades' }" @click="TAB = 'trades'">交易样本</button>
        <button :class="{ 'tab--on': TAB === 'ledger' }" @click="TAB = 'ledger'">订单账本</button>
        <button :class="{ 'tab--on': TAB === 'data' }" @click="TAB = 'data'">数据来源</button>
        <button :class="{ 'tab--on': TAB === 'exec' }" @click="TAB = 'exec'">执行假设</button>
      </div>

      <!-- 净值与回撤 -->
      <AppCard v-if="TAB === 'nav'" title="净值与回撤">
        <div class="chart-toggle">
          <button
            class="chart-toggle__btn"
            :class="{ 'chart-toggle__btn--on': CHART_MODE === 'chart' }"
            :aria-pressed="CHART_MODE === 'chart'"
            aria-label="显示图表"
            @click="CHART_MODE = 'chart'"
          >
            图表
          </button>
          <button
            class="chart-toggle__btn"
            :class="{ 'chart-toggle__btn--on': CHART_MODE === 'table' }"
            :aria-pressed="CHART_MODE === 'table'"
            aria-label="显示数据表"
            @click="CHART_MODE = 'table'"
          >
            数据表
          </button>
        </div>
        <div v-if="CHART_MODE === 'chart'" ref="chartRef" class="chart" />
        <div v-else class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>日期</th><th class="num">组合净值</th><th class="num">基准</th></tr></thead>
            <tbody>
              <tr v-for="p in data.navSeries" :key="p.date">
                <td>{{ p.date }}</td>
                <td class="num">{{ p.nav.toFixed(2) }}</td>
                <td class="num">{{ p.benchmark.toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- 交易样本 -->
      <AppCard v-if="TAB === 'trades'" title="交易样本">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Trade ID</th><th>标的</th><th>入场日</th><th>离场日</th><th>方向</th><th>入场价</th><th>离场价</th><th>PnL</th><th>PnL%</th><th>持仓日</th><th>原因</th></tr></thead>
            <tbody>
              <tr v-for="t in data.tradeSamples" :key="t.tradeId">
                <td><code>{{ t.tradeId }}</code></td>
                <td>{{ t.symbol }}</td>
                <td>{{ formatDate(t.entryDate) }}</td>
                <td>{{ t.exitDate ? formatDate(t.exitDate) : '—' }}</td>
                <td>{{ t.direction === 'long' ? '做多' : '做空' }}</td>
                <td class="num">{{ t.entryPrice }}</td>
                <td class="num">{{ t.exitPrice ?? '—' }}</td>
                <td class="num" :class="{ neg: Number(t.pnl.amount) < 0 }">{{ formatMoney(t.pnl) }}</td>
                <td class="num" :class="{ neg: t.pnlPct < 0 }">{{ formatSignedPercent(t.pnlPct) }}</td>
                <td class="num">{{ t.holdingDays ?? '—' }}</td>
                <td>{{ t.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- 订单账本 -->
      <AppCard v-if="TAB === 'ledger'" title="订单账本">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Order ID</th><th>标的</th><th>方向</th><th>请求量</th><th>成交量</th><th>状态</th><th>限价</th><th>成交均价</th><th>佣金</th><th>滑点</th><th>原因</th><th>时间</th></tr></thead>
            <tbody>
              <tr v-for="o in data.orderLedger" :key="o.orderId">
                <td><code>{{ o.orderId }}</code></td>
                <td>{{ o.symbol }}</td>
                <td>{{ o.direction === 'long' ? '多' : '空' }}</td>
                <td class="num">{{ o.requestedQty }}</td>
                <td class="num">{{ o.filledQty }}</td>
                <td><StatusBadge :tone="o.status === 'FILLED' ? 'success' : o.status === 'PARTIALLY_FILLED' ? 'warn' : 'block'" :text="o.status" /></td>
                <td class="num">{{ o.limitPrice }}</td>
                <td class="num">{{ o.avgFillPrice ?? '—' }}</td>
                <td class="num">{{ formatMoney(o.commission) }}</td>
                <td class="num">{{ formatPercent(o.slippage) }}</td>
                <td>{{ o.reasonCode ?? '—' }}</td>
                <td class="num">{{ formatMarketTime(o.occurredAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- 数据来源 -->
      <AppCard v-if="TAB === 'data'" title="数据来源">
        <table class="tbl">
          <caption class="sr-only">回测数据来源信息</caption>
          <tbody>
            <tr><td>code_hash</td><td><code>{{ data.codeHash }}</code></td></tr>
            <tr><td>config_hash</td><td><code>{{ data.configHash }}</code></td></tr>
            <tr><td>data_snapshot_id</td><td><code>{{ data.dataSnapshotId }}</code></td></tr>
            <tr><td>信号生成时间</td><td>{{ formatMarketTime(data.signalTimestamp) }}</td></tr>
            <tr><td>成交时序起点</td><td>{{ formatMarketTime(data.tradeTimestamp) }}</td></tr>
            <tr><td>数据时间</td><td>{{ formatMarketTime(data.dataTimestamp) }}</td></tr>
            <tr><td>运行时间</td><td>{{ formatMarketTime(data.runAt) }}</td></tr>
          </tbody>
        </table>
      </AppCard>

      <!-- 执行假设 -->
      <AppCard v-if="TAB === 'exec'" title="执行假设">
        <table class="tbl">
          <caption class="sr-only">回测执行假设参数</caption>
          <tbody>
            <tr><td>Commission / Slippage</td><td>{{ formatMoney(data.commissionAndSlippage) }} 总</td></tr>
            <tr><td>被拒绝订单</td><td class="num">{{ data.rejectedOrderCount }}</td></tr>
            <tr><td>延迟订单</td><td class="num">{{ data.delayedOrderCount }}</td></tr>
            <tr><td>未成交订单</td><td class="num">{{ data.unfilledOrderCount }}</td></tr>
            <tr><td>open-position-only</td><td>{{ data.openPositionOnly ? '是' : '否' }}</td></tr>
            <tr><td>no-signals</td><td>{{ data.noSignals ? '是' : '否' }}</td></tr>
            <tr><td>费用后</td><td>{{ data.afterFee ? '是' : '否' }}</td></tr>
            <tr><td>基准</td><td>{{ data.benchmark }}</td></tr>
          </tbody>
        </table>
      </AppCard>
    </template>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.page__head { display: flex; flex-direction: column; gap: 2px; }
.link { color: var(--brand-primary); font-size: 13px; }
.summary { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: var(--space-3); margin-bottom: var(--space-3); }
.sm { display: flex; flex-direction: column; gap: 2px; }
.sm__l { font-size: 11px; color: var(--text-muted); }
.sm__v { font-size: 18px; font-weight: 650; color: var(--text-primary); }
.neg { color: var(--danger); }
.meta-row { display: flex; align-items: center; gap: var(--space-3); flex-wrap: wrap; }
.tag { font-size: 11px; padding: 1px 6px; border-radius: 6px; background: var(--status-warn-bg); color: var(--status-warn-fg); font-weight: 600; }
.tabs { display: flex; gap: 4px; }
.tabs button { padding: 6px 16px; border-radius: 6px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; cursor: pointer; }
.tabs .tab--on { border-color: var(--brand-primary); color: var(--brand-primary); background: rgba(79,140,255,0.08); }
.chart { width: 100%; height: 380px; }
.chart-toggle { display: flex; gap: 4px; margin-bottom: var(--space-3); }
.chart-toggle__btn { padding: 4px 14px; border-radius: 6px; border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; cursor: pointer; }
.chart-toggle__btn--on { border-color: var(--brand-primary); color: var(--brand-primary); background: rgba(79,140,255,0.08); }
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th, .tbl td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border-default); }
.tbl th { color: var(--text-muted); font-weight: 600; font-size: 12px; }
.tbl td { color: var(--text-primary); }
.btn-retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
