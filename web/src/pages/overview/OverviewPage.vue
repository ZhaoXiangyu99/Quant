<script setup lang="ts">
import { computed } from 'vue'
import { useOverviewQuery } from '@/shared/api/queries'
import AppCard from '@/shared/ui/AppCard.vue'
import KpiCard from '@/widgets/account-summary/KpiCard.vue'
import BenchmarkChart from '@/widgets/benchmark-chart/BenchmarkChart.vue'
import HistoricalWarningPanel from '@/widgets/historical-warning/HistoricalWarningPanel.vue'
import PendingApprovalTable from '@/widgets/approval-queue/PendingApprovalTable.vue'
import RiskSleeveCard from '@/widgets/risk-exposure/RiskSleeveCard.vue'
import StrategyLifecycleCard from '@/widgets/strategy-lifecycle/StrategyLifecycleCard.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import { isHardBlock } from '@/shared/utils/status'
import { formatMoney, formatPercent, formatSignedPercent, formatMarketTime } from '@/shared/utils/format'
import type { ApiEnvelope, OverviewData } from '@/shared/api/schemas'

const { data: queryResult, isLoading, isError, error, refetch } = useOverviewQuery()

const envelope = computed(() => (queryResult.value as ApiEnvelope<OverviewData> | undefined) ?? null)
const data = computed(() => envelope.value?.data ?? null)
const isMock = computed(() => envelope.value?.source === 'mock')
const system = computed(() => data.value?.system ?? null)
const account = computed(() => data.value?.account ?? null)
const riskBudget = computed(() => data.value?.riskBudget ?? null)
const benchmark = computed(() => data.value?.benchmark ?? null)
const marketTz = computed(() => system.value?.marketTimezone ?? 'America/New_York')

const hardBlock = computed(() => (system.value ? isHardBlock(system.value.status) : false))
const blockIssues = computed(() => system.value?.issues ?? [])
const dataQuality = computed(() => data.value?.dataQuality ?? null)
const RECON_LABEL: Record<string, string> = { OK: '已对账', FAILED: '对账失败', PENDING: '对账中' }
</script>

<template>
  <div class="overview">
    <header class="overview__head">
      <h1 class="page-title">总览</h1>
      <p class="caption">账户、策略、风险与系统状态 · 只读视图</p>
    </header>

    <!-- 加载态 -->
    <div v-if="isLoading && !data" class="app-grid">
      <div class="col-12">
        <StatePanel kind="loading" title="正在加载总览数据" description="从演示数据源读取账户、风险与策略快照…" />
      </div>
    </div>

    <!-- 错误态 -->
    <div v-else-if="isError" class="app-grid">
      <div class="col-12">
        <StatePanel kind="error" title="数据获取失败" :description="(error as Error)?.message || '未知错误'">
          <template #actions>
            <button class="overview__retry" type="button" @click="refetch()">重试</button>
          </template>
        </StatePanel>
      </div>
    </div>

    <!-- 数据态 -->
    <template v-else-if="data">
      <DemoDataBanner v-if="isMock" class="overview__banner" />

      <div v-if="hardBlock" class="col-12 overview__block">
        <StatePanel kind="blocked" :title="system!.status === 'ACCOUNTING_BLOCKED' ? '对账失败：已阻断' : '风险硬阻断：已阻断'">
          <template #actions>
            <span class="caption">{{ blockIssues.map((i) => i.label).join('、') || '禁止新增风险' }}</span>
          </template>
        </StatePanel>
      </div>

      <div class="app-grid overview__grid">
        <div class="col-3">
          <KpiCard label="账户净值" to="/risk" sub="">
            {{ formatMoney(account!.nav) }}
            <template #sub>{{ formatSignedPercent(account!.dayChangePct) }} · {{ formatMoney(account!.dayChange) }} · 更新 {{ formatMarketTime(account!.updatedAt, marketTz) }}</template>
          </KpiCard>
        </div>
        <div class="col-3">
          <KpiCard label="主动风险预算" to="/risk" emphasis="risk">
            <template v-if="riskBudget && !riskBudget.missing">剩余 {{ formatMoney(riskBudget.remaining) }}</template>
            <template v-else>缺少数据，无法计算</template>
            <template #sub>
              <template v-if="riskBudget && !riskBudget.missing">已用 {{ formatMoney(riskBudget.used) }} · 占净值 剩余 {{ formatPercent(riskBudget.remainingPctOfNav) }} / 已用 {{ formatPercent(riskBudget.usedPctOfNav) }} · 上限 {{ riskBudget.policyLimitPctOfNav }}%</template>
              <template v-else>对账阻断，风险预算暂停计算</template>
            </template>
          </KpiCard>
        </div>
        <div class="col-3">
          <KpiCard label="相对 SPY" to="/backtests">
            {{ formatSignedPercent(benchmark!.cumulativeExcess) }}
            <template #sub>窗口 {{ benchmark!.window }} · {{ benchmark!.afterFee ? '费用后' : '费用前' }}</template>
          </KpiCard>
        </div>
        <div class="col-3">
          <KpiCard label="数据健康" to="/settings">
            {{ dataQuality ? dataQuality.healthPct : '—' }}%
            <template #sub>
              <template v-if="dataQuality">完整 {{ dataQuality.completenessPct }}% · 及时 {{ dataQuality.timelinessPct }}% · {{ RECON_LABEL[dataQuality.reconciliation] }} · 异常 {{ dataQuality.anomalyCount }}</template>
              <template v-else>数据质量不可用</template>
            </template>
          </KpiCard>
        </div>
        <div class="col-8">
          <AppCard title="净值与基准" subtitle="组合 / SPY / QQQ 归一化曲线（费用后）">
            <BenchmarkChart :series="benchmark!" />
          </AppCard>
        </div>
        <div class="col-4">
          <RiskSleeveCard :sleeves="data.sleeves" />
        </div>
        <div class="col-12">
          <HistoricalWarningPanel :items="data.warnings" />
        </div>
        <div class="col-12">
          <AppCard title="待审批信号" subtitle="仅查看与进入审批，不在总览直接下单">
            <PendingApprovalTable :signals="data.pendingSignals" :market-timezone="marketTz" />
          </AppCard>
        </div>
        <div class="col-12">
          <StrategyLifecycleCard :lifecycle="data.lifecycle" />
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.overview { display: flex; flex-direction: column; gap: var(--space-4); }
.overview__head { display: flex; flex-direction: column; gap: 2px; }
.overview__banner { width: 100%; }
.overview__block { width: 100%; }
.overview__grid { margin-top: 0; }
.overview__retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
