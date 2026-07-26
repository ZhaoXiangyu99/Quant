<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBacktestsQuery } from '@/shared/api/queries'
import type { BacktestFilter, LifecycleStage, BacktestStatus } from '@/shared/api/schemas'
import AppCard from '@/shared/ui/AppCard.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import { formatPercent, formatSignedPercent, formatMoney, formatMarketTime } from '@/shared/utils/format'
import { LIFECYCLE_LABEL } from '@/entities/strategy/lifecycle'
import type { ApiEnvelope, BacktestRunSummary } from '@/shared/api/schemas'

const router = useRouter()
const ALL_LIFECYCLE: LifecycleStage[] = ['research', 'validation', 'simulation', 'shadow', 'restricted_live', 'live', 'retired']
const ALL_STATUS: BacktestStatus[] = ['PASS', 'FAIL', 'RUNNING', 'NO_SIGNALS', 'OPEN_POSITION_ONLY']

const selLifecycle = ref<LifecycleStage[]>([])
const selStatus = ref<BacktestStatus[]>([])
const selPassPromotion = ref<boolean | undefined>(undefined)
const sortBy = ref<'runAt' | 'cagr' | 'maxDrawdown' | 'excessVsSpy' | 'sharpe'>('runAt')
const sortDir = ref<'asc' | 'desc'>('desc')
const compare = ref<string[]>([])

const filter = computed<BacktestFilter>(() => ({
  lifecycle: selLifecycle.value.length ? selLifecycle.value : undefined,
  status: selStatus.value.length ? selStatus.value : undefined,
  passPromotion: selPassPromotion.value,
  sortBy: sortBy.value,
  sortDir: sortDir.value,
  limit: 50,
  offset: 0,
}))

const { data: qr, isLoading, isError, error, refetch } = useBacktestsQuery(() => filter.value)
const envelope = computed(() => (qr.value as ApiEnvelope<{ items: BacktestRunSummary[]; total: number; limit: number; offset: number }> | undefined)?.data)
const items = computed(() => envelope.value?.items ?? [])
const total = computed(() => envelope.value?.total ?? 0)
const isMock = computed(() => (qr.value as ApiEnvelope<{ items: BacktestRunSummary[]; total: number; limit: number; offset: number }> | undefined)?.source === 'mock')

const comparedItems = computed(() => items.value.filter((r) => compare.value.includes(r.runId)))

function toggle(sel: unknown[], v: unknown) { if (sel.includes(v)) sel.splice(sel.indexOf(v), 1); else sel.push(v) }
function toggleCompare(runId: string) {
  if (compare.value.includes(runId)) compare.value = compare.value.filter((r) => r !== runId)
  else if (compare.value.length < 4) compare.value = [...compare.value, runId]
}
function goDetail(runId: string) { router.push(`/backtests/${runId}`) }

const STATUS_TONES: Record<BacktestStatus, 'success' | 'warn' | 'block' | 'info'> = {
  PASS: 'success', FAIL: 'block', RUNNING: 'info', NO_SIGNALS: 'warn', OPEN_POSITION_ONLY: 'warn',
}
const STATUS_LABELS: Record<BacktestStatus, string> = {
  PASS: '通过', FAIL: '未通过', RUNNING: '运行中', NO_SIGNALS: '无信号', OPEN_POSITION_ONLY: '仅持仓',
}

function toggleSort(f: typeof sortBy.value) {
  if (sortBy.value === f) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = f; sortDir.value = 'desc' }
}
</script>

<template>
  <div class="page">
    <header class="page__head"><h1 class="page-title">回测列表</h1><p class="caption">只读查看，最多比较 4 个运行</p></header>

    <DemoDataBanner v-if="isMock && !isLoading && items.length" />

    <AppCard title="筛选">
      <div class="filters">
        <div class="filter-group"><span class="fl">生命周期：</span><button v-for="lc in ALL_LIFECYCLE" :key="lc" class="chip" :class="{ 'chip--on': selLifecycle.includes(lc) }" @click="toggle(selLifecycle, lc)">{{ LIFECYCLE_LABEL[lc] }}</button></div>
        <div class="filter-group"><span class="fl">状态：</span><button v-for="s in ALL_STATUS" :key="s" class="chip" :class="{ 'chip--on': selStatus.includes(s) }" @click="toggle(selStatus, s)">{{ STATUS_LABELS[s] }}</button></div>
        <div class="filter-group">
          <span class="fl">晋级：</span>
          <button class="chip" :class="{ 'chip--on': selPassPromotion === true }" @click="selPassPromotion = selPassPromotion === true ? undefined : true">通过</button>
          <button class="chip" :class="{ 'chip--on': selPassPromotion === false }" @click="selPassPromotion = selPassPromotion === false ? undefined : false">未通过</button>
        </div>
        <span class="caption">共 {{ total }} 个运行</span>
      </div>
    </AppCard>

    <div v-if="isLoading && !items.length"><StatePanel kind="loading" /></div>
    <div v-else-if="isError"><StatePanel kind="error" title="回测列表获取失败" :description="(error as Error)?.message"><template #actions><button class="btn-retry" @click="refetch()">重试</button></template></StatePanel></div>
    <div v-else-if="!items.length"><StatePanel kind="empty" title="暂无符合筛选条件的回测运行" /></div>

    <template v-else>
      <!-- 比较区 -->
      <AppCard v-if="comparedItems.length > 0" :title="`比较（${comparedItems.length}/4）`">
        <div class="compare-grid">
          <div v-for="r in comparedItems" :key="'c' + r.runId" class="compare-item">
            <p><strong>{{ r.strategyName }}</strong> <code>{{ r.runId }}</code></p>
            <table class="cmp-tbl">
              <caption class="sr-only">回测比较摘要</caption>
              <tbody>
                <tr><td>CAGR</td><td class="num">{{ formatSignedPercent(r.cagr) }}</td></tr>
                <tr><td>最大回撤</td><td class="num" :class="{ neg: r.maxDrawdown < 0 }">{{ formatPercent(r.maxDrawdown) }}</td></tr>
                <tr><td>对 SPY 超额</td><td class="num">{{ formatSignedPercent(r.excessVsSpy) }}</td></tr>
                <tr><td>Sharpe</td><td class="num">{{ r.sharpe.toFixed(2) }}</td></tr>
                <tr><td>费用</td><td class="num">{{ formatMoney(r.commissionAndSlippage) }}</td></tr>
                <tr><td>成交数</td><td class="num">{{ r.tradeCount }}</td></tr>
                <tr><td>样本数</td><td class="num">{{ r.siblingSampleCount }}</td></tr>
                <tr><td>晋级</td><td><StatusBadge :tone="r.passPromotion ? 'success' : 'info'" :text="r.passPromotion ? '通过' : '未通过'" /></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </AppCard>

      <!-- 列表 -->
      <AppCard :title="`运行列表（${items.length} / ${total}）`">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>比较</th>
                <th>run_id</th>
                <th>策略</th>
                <th>版本</th>
                <th>数据快照</th>
                <th class="sortable" @click="toggleSort('runAt')">运行时间</th>
                <th>状态</th>
                <th class="sortable" @click="toggleSort('cagr')">CAGR</th>
                <th class="sortable" @click="toggleSort('maxDrawdown')">最大回撤</th>
                <th class="sortable" @click="toggleSort('excessVsSpy')">对SPY超额</th>
                <th class="sortable" @click="toggleSort('sharpe')">Sharpe</th>
                <th>费用</th>
                <th>成交数</th>
                <th>样本数</th>
                <th>晋级</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in items" :key="r.runId">
                <td><input type="checkbox" :checked="compare.includes(r.runId)" :disabled="compare.length >= 4 && !compare.includes(r.runId)" @change="toggleCompare(r.runId)" /></td>
                <td><button class="link" @click="goDetail(r.runId)">{{ r.runId }}</button></td>
                <td>{{ r.strategyName }}</td>
                <td>{{ r.strategyVersion }}</td>
                <td><code>{{ r.dataSnapshotId }}</code></td>
                <td class="num">{{ formatMarketTime(r.runAt) }}</td>
                <td><StatusBadge :tone="STATUS_TONES[r.status]" :text="STATUS_LABELS[r.status]" /></td>
                <td class="num" :class="{ neg: r.cagr < 0 }">{{ formatSignedPercent(r.cagr) }}</td>
                <td class="num" :class="{ neg: r.maxDrawdown < 0 }">{{ formatPercent(r.maxDrawdown) }}</td>
                <td class="num">{{ formatSignedPercent(r.excessVsSpy) }}</td>
                <td class="num">{{ r.sharpe.toFixed(2) }}</td>
                <td class="num">{{ formatMoney(r.commissionAndSlippage) }}</td>
                <td class="num">{{ r.tradeCount }}</td>
                <td class="num">{{ r.siblingSampleCount }}</td>
                <td><StatusBadge :tone="r.passPromotion ? 'success' : 'info'" :text="r.passPromotion ? '通过' : '未通过'" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>
    </template>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.page__head { display: flex; flex-direction: column; gap: 2px; }
.filters { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
.filter-group { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.fl { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.chip { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-control); color: var(--text-secondary); font-size: 12px; padding: 2px 8px; cursor: pointer; min-height: 28px; }
.chip--on { background: rgba(79,140,255,0.15); border-color: var(--brand-primary); color: var(--brand-primary); }
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 1000px; }
.tbl th, .tbl td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border-default); white-space: nowrap; }
.tbl th { color: var(--text-muted); font-weight: 600; }
.tbl td { color: var(--text-primary); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--brand-primary); }
.link { background: none; border: none; color: var(--brand-primary); cursor: pointer; font-size: 12px; text-decoration: underline; }
.neg { color: var(--danger); }
.compare-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: var(--space-3); }
.compare-item { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-card); padding: var(--space-3); }
.compare-item p { margin: 0 0 8px; font-size: 13px; }
.cmp-tbl { width: 100%; font-size: 12px; border-collapse: collapse; }
.cmp-tbl td { padding: 2px 4px; border-bottom: 1px solid var(--border-default); }
.btn-retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
