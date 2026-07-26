<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStrategiesQuery } from '@/shared/api/queries'
import type { StrategyFilter, StrategyMarket, StrategyFrequency, LifecycleStage } from '@/shared/api/schemas'
import AppCard from '@/shared/ui/AppCard.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import { formatMarketTime } from '@/shared/utils/format'
import { LIFECYCLE_LABEL } from '@/entities/strategy/lifecycle'
import type { ApiEnvelope, StrategySummary } from '@/shared/api/schemas'

const MARKET_LABEL: Record<string, string> = { US: '美股', BTC: 'BTC' }
const FREQ_LABEL: Record<StrategyFrequency, string> = { daily: '日线', weekly: '周线', monthly: '月线' }
const ALL_LIFECYCLE: LifecycleStage[] = ['research', 'validation', 'simulation', 'shadow', 'restricted_live', 'live', 'retired']
const ALL_MARKET: StrategyMarket[] = ['US', 'BTC']
const ALL_FREQ: StrategyFrequency[] = ['daily', 'weekly', 'monthly']

const search = ref('')
const selLifecycle = ref<LifecycleStage[]>([])
const selMarket = ref<StrategyMarket[]>([])
const selFreq = ref<StrategyFrequency[]>([])
const sortBy = ref<'name' | 'updatedAt' | 'sampleCount' | 'lifecycle'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

const filter = computed<StrategyFilter>(() => ({
  lifecycle: selLifecycle.value.length ? selLifecycle.value : undefined,
  market: selMarket.value.length ? selMarket.value : undefined,
  frequency: selFreq.value.length ? selFreq.value : undefined,
  search: search.value || undefined,
  sortBy: sortBy.value,
  sortDir: sortDir.value,
  limit: 50,
  offset: 0,
}))

const { data: qr, isLoading, isError, error, refetch } = useStrategiesQuery(() => filter.value)
const envelope = computed(() => (qr.value as ApiEnvelope<{ items: StrategySummary[]; total: number; limit: number; offset: number }> | undefined)?.data)
const items = computed(() => envelope.value?.items ?? [])
const total = computed(() => envelope.value?.total ?? 0)
const isMock = computed(() => (qr.value as ApiEnvelope<{ items: StrategySummary[]; total: number; limit: number; offset: number }> | undefined)?.source === 'mock')

function toggle(sel: unknown[], v: unknown) {
  if (sel.includes(v)) sel.splice(sel.indexOf(v), 1)
  else sel.push(v)
}

function toggleSort(f: typeof sortBy.value) {
  if (sortBy.value === f) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = f; sortDir.value = 'asc' }
}
</script>

<template>
  <div class="page">
    <header class="page__head"><h1 class="page-title">策略列表</h1><p class="caption">只读查看，本阶段不得创建、修改、运行或部署</p></header>

    <DemoDataBanner v-if="isMock && !isLoading && items.length" />

    <!-- 筛选栏 -->
    <AppCard title="筛选与搜索">
      <div class="filters">
        <input v-model="search" type="text" class="inp" placeholder="搜索策略名称或 ID…" aria-label="搜索策略" />
        <div class="filter-group">
          <span class="filter-label">生命周期：</span>
          <button v-for="lc in ALL_LIFECYCLE" :key="lc" class="chip" :class="{ 'chip--on': selLifecycle.includes(lc) }" @click="toggle(selLifecycle, lc)">{{ LIFECYCLE_LABEL[lc] }}</button>
        </div>
        <div class="filter-group">
          <span class="filter-label">市场：</span>
          <button v-for="m in ALL_MARKET" :key="m" class="chip" :class="{ 'chip--on': selMarket.includes(m) }" @click="toggle(selMarket, m)">{{ MARKET_LABEL[m] }}</button>
        </div>
        <div class="filter-group">
          <span class="filter-label">频率：</span>
          <button v-for="f in ALL_FREQ" :key="f" class="chip" :class="{ 'chip--on': selFreq.includes(f) }" @click="toggle(selFreq, f)">{{ FREQ_LABEL[f] }}</button>
        </div>
        <span class="caption">共 {{ total }} 个策略</span>
      </div>
    </AppCard>

    <!-- 状态 -->
    <div v-if="isLoading && !items.length"><StatePanel kind="loading" /></div>
    <div v-else-if="isError"><StatePanel kind="error" title="策略列表获取失败" :description="(error as Error)?.message"><template #actions><button class="btn-retry" @click="refetch()">重试</button></template></StatePanel></div>
    <div v-else-if="!items.length"><StatePanel kind="empty" title="暂无符合筛选条件的策略" /></div>

    <!-- 表格 -->
    <AppCard v-else :title="`策略列表（${items.length} / ${total}）`">
      <div class="tbl-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th class="sortable" @click="toggleSort('name')">策略名称 {{ sortBy === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : '' }}</th>
              <th>strategy_id</th>
              <th>当前版本</th>
              <th class="sortable" @click="toggleSort('lifecycle')">生命周期</th>
              <th>市场</th>
              <th>频率</th>
              <th>基准</th>
              <th>方向</th>
              <th class="sortable" @click="toggleSort('sampleCount')">样本数</th>
              <th>最新样本外</th>
              <th>数据快照</th>
              <th class="sortable" @click="toggleSort('updatedAt')">更新时间</th>
              <th>阻断原因</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in items" :key="s.strategyId">
              <td><strong>{{ s.name }}</strong></td>
              <td><code>{{ s.strategyId }}</code></td>
              <td>{{ s.currentVersion }}</td>
              <td><StatusBadge :tone="s.lifecycle === 'live' || s.lifecycle === 'restricted_live' ? 'success' : s.lifecycle === 'retired' ? 'block' : 'info'" :text="LIFECYCLE_LABEL[s.lifecycle]" /></td>
              <td>{{ MARKET_LABEL[s.market] }}</td>
              <td>{{ FREQ_LABEL[s.frequency] }}</td>
              <td>{{ s.benchmark }}</td>
              <td>{{ s.allowedDirections.join(' / ') }}</td>
              <td class="num">{{ s.sampleCount }}</td>
              <td class="num">{{ s.latestOosResult ?? '—' }}</td>
              <td><code>{{ s.dataSnapshotId }}</code></td>
              <td class="num">{{ formatMarketTime(s.updatedAt) }}</td>
              <td>{{ s.blockReason ? '阻断：' + s.blockReason : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.page__head { display: flex; flex-direction: column; gap: 2px; }
.filters { display: flex; flex-wrap: wrap; gap: var(--space-3); align-items: center; }
.inp { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-control); color: var(--text-primary); padding: 6px 12px; font-size: 13px; min-width: 240px; }
.filter-group { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.filter-label { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.chip { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-control); color: var(--text-secondary); font-size: 12px; padding: 2px 8px; cursor: pointer; min-height: 28px; }
.chip--on { background: rgba(79,140,255,0.15); border-color: var(--brand-primary); color: var(--brand-primary); }
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 900px; }
.tbl th, .tbl td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border-default); white-space: nowrap; }
.tbl th { color: var(--text-muted); font-weight: 600; position: sticky; top: 0; background: var(--bg-card); }
.tbl td { color: var(--text-primary); }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--brand-primary); }
.btn-retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
