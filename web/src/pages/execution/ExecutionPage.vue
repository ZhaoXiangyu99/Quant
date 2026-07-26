<script setup lang="ts">
import { computed, ref } from 'vue'
import { useOrdersQuery } from '@/shared/api/queries'
import type { OrderFilter, OrderStatus } from '@/shared/api/schemas'
import AppCard from '@/shared/ui/AppCard.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import Amount from '@/shared/ui/Amount.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import { formatMoney, formatMarketTime } from '@/shared/utils/format'
import type { ApiEnvelope, OrderIntent, BrokerOrder, Fill, ReconciliationIssue } from '@/shared/api/schemas'

const ALL_STATUSES: OrderStatus[] = ['PROPOSED', 'AWAITING_APPROVAL', 'APPROVED', 'SUBMITTED', 'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED', 'REJECTED', 'RECONCILIATION_REQUIRED']
const selStatus = ref<OrderStatus[]>([])
const sortBy = ref<'updatedAt' | 'createdAt' | 'symbol'>('updatedAt')
const sortDir = ref<'asc' | 'desc'>('desc')

const filter = computed<OrderFilter>(() => ({
  status: selStatus.value.length ? selStatus.value : undefined,
  sortBy: sortBy.value,
  sortDir: sortDir.value,
  limit: 50,
  offset: 0,
}))

const { data: qr, isLoading, isError, error, refetch } = useOrdersQuery(() => filter.value)
const payload = computed(() => (qr.value as ApiEnvelope<{ intents: OrderIntent[]; brokerOrders: BrokerOrder[]; fills: Fill[]; reconciliationIssues: ReconciliationIssue[]; total: number; limit: number; offset: number }> | undefined)?.data)
const intents = computed(() => payload.value?.intents ?? [])
const brokerOrders = computed(() => payload.value?.brokerOrders ?? [])
const fills = computed(() => payload.value?.fills ?? [])
const reconIssues = computed(() => payload.value?.reconciliationIssues ?? [])
const total = computed(() => payload.value?.total ?? 0)
const isMock = computed(() => (qr.value as ApiEnvelope<{ intents: OrderIntent[]; brokerOrders: BrokerOrder[]; fills: Fill[]; reconciliationIssues: ReconciliationIssue[]; total: number; limit: number; offset: number }> | undefined)?.source === 'mock')

function toggle(sel: unknown[], v: unknown) { if (sel.includes(v)) sel.splice(sel.indexOf(v), 1); else sel.push(v) }

const STATUS_TONES: Record<OrderStatus, 'success' | 'warn' | 'block' | 'info'> = {
  PROPOSED: 'info', AWAITING_APPROVAL: 'info', APPROVED: 'info', SUBMITTED: 'info',
  PARTIALLY_FILLED: 'warn', FILLED: 'success', CANCELLED: 'warn', EXPIRED: 'warn',
  REJECTED: 'block', RECONCILIATION_REQUIRED: 'block',
}

function toggleSort(f: typeof sortBy.value) {
  if (sortBy.value === f) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortBy.value = f; sortDir.value = 'desc' }
}
</script>

<template>
  <div class="page">
    <header class="page__head"><h1 class="page-title">订单执行</h1><p class="caption">只读展示：OrderIntent → BrokerOrder → Fill。无创建/提交/改单/撤单/批准/拒绝按钮</p></header>

    <DemoDataBanner v-if="isMock && !isLoading && intents.length" />

    <AppCard title="筛选">
      <div class="filters">
        <div class="fg"><span class="fl">状态：</span><button v-for="s in ALL_STATUSES" :key="s" class="chip" :class="{ 'chip--on': selStatus.includes(s) }" @click="toggle(selStatus, s)">{{ s }}</button></div>
        <span class="caption">共 {{ total }} 个订单意图</span>
      </div>
    </AppCard>

    <div v-if="isLoading && !intents.length"><StatePanel kind="loading" /></div>
    <div v-else-if="isError"><StatePanel kind="error" title="订单数据获取失败" :description="(error as Error)?.message"><template #actions><button class="btn-retry" @click="refetch()">重试</button></template></StatePanel></div>
    <div v-else-if="!intents.length"><StatePanel kind="empty" title="暂无符合筛选条件的订单" /></div>

    <template v-else>
      <!-- 对账异常 -->
      <AppCard v-if="reconIssues.length" title="对账异常" emphasis="risk">
        <div v-for="i in reconIssues" :key="i.intentId" class="recon-item">
          <StatusBadge :tone="i.severity === 'BLOCK' ? 'block' : 'warn'" :text="i.severity" />
          <span>{{ i.description }}</span>
          <span class="caption">{{ i.detail }}</span>
        </div>
      </AppCard>

      <!-- Layer 1: Order Intent -->
      <AppCard title="订单意图（Layer 1）" :subtitle="`${intents.length} / ${total}`">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th>幂等键</th>
                <th>TradePlan ID</th>
                <th>风险决策</th>
                <th>标的</th>
                <th>方向</th>
                <th>请求量</th>
                <th>限价</th>
                <th>参考价</th>
                <th>状态</th>
                <th>原因</th>
                <th>修改次数</th>
                <th class="sortable" @click="toggleSort('createdAt')">创建</th>
                <th class="sortable" @click="toggleSort('updatedAt')">更新</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in intents" :key="i.intentId">
                <td><code class="smallcode">{{ i.idempotencyKey.slice(0, 20) }}…</code></td>
                <td><code>{{ i.tradePlanId }}</code></td>
                <td><StatusBadge :tone="i.riskDecision === 'PASS' ? 'success' : i.riskDecision === 'WARN' ? 'warn' : 'block'" :text="i.riskDecision" /></td>
                <td>{{ i.symbol }}</td>
                <td>{{ i.direction === 'long' ? '多' : '空' }}</td>
                <td class="num">{{ i.requestedQty }}</td>
                <td class="num"><Amount :money="i.limitPrice" /></td>
                <td class="num"><Amount :money="i.referencePrice" /></td>
                <td><StatusBadge :tone="STATUS_TONES[i.status]" :text="i.status" /></td>
                <td>{{ i.reasonCode ?? '—' }}</td>
                <td class="num">{{ i.modificationCount }}</td>
                <td class="num">{{ formatMarketTime(i.createdAt) }}</td>
                <td class="num">{{ formatMarketTime(i.updatedAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- Layer 2: Broker Orders -->
      <AppCard title="券商订单（Layer 2）" subtitle="关联到 OrderIntent">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Intent ID</th><th>券商订单 ID</th><th>请求量</th><th>成交量</th><th>剩余量</th><th>成交均价</th><th>佣金</th><th>对账状态</th><th>状态</th><th>提交时间</th><th>最新更新时间</th><th>延迟描述</th><th>拒绝原因</th></tr></thead>
            <tbody>
              <tr v-for="bo in brokerOrders" :key="bo.intentId">
                <td><code>{{ bo.intentId }}</code></td>
                <td><code>{{ bo.brokerOrderId ?? '—' }}</code></td>
                <td class="num">{{ bo.requestedQty }}</td>
                <td class="num">{{ bo.filledQty }}</td>
                <td class="num">{{ bo.remainingQty }}</td>
                <td class="num"><Amount :money="bo.avgFillPrice" /></td>
                <td class="num">{{ bo.commission ? formatMoney(bo.commission) : '—' }}</td>
                <td>{{ bo.reconciliationStatus ?? '—' }}</td>
                <td><StatusBadge :tone="STATUS_TONES[bo.status]" :text="bo.status" /></td>
                <td class="num">{{ bo.submittedAt ? formatMarketTime(bo.submittedAt) : '—' }}</td>
                <td class="num">{{ bo.latestUpdateAt ? formatMarketTime(bo.latestUpdateAt) : '—' }}</td>
                <td>{{ bo.delayDescription ?? '—' }}</td>
                <td>{{ bo.rejectionReason ?? '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </AppCard>

      <!-- Layer 3: Fills -->
      <AppCard title="成交（Layer 3）" subtitle="关联到 BrokerOrder">
        <div class="tbl-wrap">
          <table class="tbl">
            <thead><tr><th>Fill ID</th><th>Broker Order ID</th><th>成交量</th><th>成交均价</th><th>佣金</th><th>成交时间</th><th>状态</th></tr></thead>
            <tbody>
              <tr v-for="f in fills" :key="f.brokerOrderId + '-' + (f.fillId ?? 'missing')">
                <td><code>{{ f.fillId ?? '—' }}</code></td>
                <td><code>{{ f.brokerOrderId }}</code></td>
                <td class="num">{{ f.filledQty }}</td>
                <td class="num"><Amount :money="f.avgFillPrice" /></td>
                <td class="num">{{ formatMoney(f.commission) }}</td>
                <td class="num">{{ f.occurredAt ? formatMarketTime(f.occurredAt) : '—' }}</td>
                <td><StatusBadge :tone="f.status === 'CONFIRMED' ? 'success' : 'block'" :text="f.status" /></td>
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
.fg { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.fl { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
.chip { background: var(--bg-card); border: 1px solid var(--border-default); border-radius: var(--radius-control); color: var(--text-secondary); font-size: 12px; padding: 2px 8px; cursor: pointer; min-height: 28px; }
.chip--on { background: rgba(79,140,255,0.15); border-color: var(--brand-primary); color: var(--brand-primary); }
.tbl-wrap { overflow-x: auto; }
.tbl { width: 100%; border-collapse: collapse; font-size: 12px; min-width: 800px; }
.tbl th, .tbl td { text-align: left; padding: 6px 8px; border-bottom: 1px solid var(--border-default); white-space: nowrap; }
.tbl th { color: var(--text-muted); font-weight: 600; }
.tbl td { color: var(--text-primary); }
.smallcode { font-size: 10px; }
.sortable { cursor: pointer; user-select: none; }
.sortable:hover { color: var(--brand-primary); }
.recon-item { display: flex; align-items: center; gap: var(--space-3); margin-bottom: 4px; font-size: 13px; }
.btn-retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
