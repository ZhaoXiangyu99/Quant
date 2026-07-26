<script setup lang="ts">
import { computed } from 'vue'
import { usePortfolioRiskQuery } from '@/shared/api/queries'
import AppCard from '@/shared/ui/AppCard.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import DemoDataBanner from '@/shared/ui/DemoDataBanner.vue'
import { formatMoney, formatPercent, formatMarketTime } from '@/shared/utils/format'
import { warningStatusTone, WARNING_STATUS_LABEL } from '@/shared/utils/status'
import type { ApiEnvelope, PortfolioRiskSummary } from '@/shared/api/schemas'

const { data: queryResult, isLoading, isError, error, refetch } = usePortfolioRiskQuery()

const envelope = computed(() => (queryResult.value as ApiEnvelope<PortfolioRiskSummary> | undefined) ?? null)
const data = computed(() => envelope.value?.data ?? null)
const isMock = computed(() => queryResult.value?.source === 'mock')

const riskBudget = computed(() => data.value?.riskBudget ?? null)
const exposure = computed(() => data.value?.exposure ?? null)
const concentrations = computed(() => data.value?.concentrations ?? [])
const themes = computed(() => data.value?.themes ?? [])
const sleeves = computed(() => data.value?.sleeves ?? [])
const dq = computed(() => data.value?.dataQuality ?? null)
const RECON_LABEL: Record<string, string> = { OK: '已对账', FAILED: '对账失败', PENDING: '对账中' }
</script>

<template>
  <div class="page">
    <header class="page__head">
      <h1 class="page-title">组合风险</h1>
      <p class="caption">账户净值 · 暴露 · 集中度 · 主题风险 · 回撤 · 数据质量 · 硬阻断</p>
    </header>

    <div v-if="isLoading && !data" class="app-grid"><div class="col-12"><StatePanel kind="loading" /></div></div>
    <div v-else-if="isError" class="app-grid"><div class="col-12"><StatePanel kind="error" title="风险数据获取失败" :description="(error as Error)?.message"><template #actions><button class="btn-retry" @click="refetch()">重试</button></template></StatePanel></div></div>

    <template v-else-if="data">
      <DemoDataBanner v-if="isMock" />

      <div v-if="data.hardBlock" class="page__block"><StatePanel kind="blocked" title="硬阻断" :description="data.hardBlockReasons.join('；')" /></div>

      <!-- Row 1: NAV / Cash / Time -->
      <div class="app-grid">
        <div class="col-6">
          <AppCard title="账户净值与现金" :subtitle="`更新于 ${formatMarketTime(data.updatedAt)}`">
            <div class="kpis">
              <div class="kpi"><span class="kpi__label">净值</span><span class="kpi__val num">{{ formatMoney(data.nav) }}</span></div>
              <div class="kpi"><span class="kpi__label">现金</span><span class="kpi__val num">{{ formatMoney(data.cash) }}</span></div>
            </div>
          </AppCard>
        </div>
        <div class="col-6">
          <AppCard title="主动风险预算" subtitle="已用 / 剩余 / 上限；对账失败时置 missing" emphasis="risk">
            <div v-if="riskBudget && !riskBudget.missing" class="kpis">
              <div class="kpi"><span class="kpi__label">已用</span><span class="kpi__val num">{{ formatMoney(riskBudget.used) }} ({{ formatPercent(riskBudget.usedPctOfNav) }})</span></div>
              <div class="kpi"><span class="kpi__label">剩余</span><span class="kpi__val num">{{ formatMoney(riskBudget.remaining) }} ({{ formatPercent(riskBudget.remainingPctOfNav) }})</span></div>
              <div class="kpi"><span class="kpi__label">上限</span><span class="kpi__val num">{{ riskBudget.policyLimitPctOfNav }}% 净值</span></div>
            </div>
            <StatePanel v-else kind="blocked" title="缺少数据，无法计算" description="对账失败，风险预算暂停计算" />
          </AppCard>
        </div>
      </div>

      <!-- Row 2: Exposure + Drawdown -->
      <div class="app-grid">
        <div class="col-6">
          <AppCard title="暴露" subtitle="市值占比与风险预算占比使用不同标签，禁止混用">
            <template v-if="exposure && !exposure.missing">
              <table class="tbl">
                <thead><tr><th>指标</th><th>值</th></tr></thead>
                <tbody>
                  <tr><td>Gross Exposure</td><td class="num">{{ formatPercent(exposure.grossExposure) }}</td></tr>
                  <tr><td>Net Exposure</td><td class="num">{{ formatPercent(exposure.netExposure) }}</td></tr>
                  <tr><td>多头暴露</td><td class="num">{{ formatPercent(exposure.longExposure) }}</td></tr>
                  <tr><td>空头暴露</td><td class="num">{{ formatPercent(exposure.shortExposure) }}</td></tr>
                  <tr><td>现金占净值</td><td class="num">{{ formatPercent(exposure.cashPctOfNav) }}</td></tr>
                </tbody>
              </table>
            </template>
            <StatePanel v-else kind="blocked" title="缺少数据，无法计算" />
          </AppCard>
        </div>
        <div class="col-6">
          <AppCard title="回撤" subtitle="当前 / 峰值回撤">
            <div class="kpis">
              <div class="kpi"><span class="kpi__label">当前回撤</span><span class="kpi__val num" :class="{ 'kpi__val--neg': data.currentDrawdown < 0 }">{{ formatPercent(data.currentDrawdown) }}</span></div>
              <div class="kpi"><span class="kpi__label">峰值回撤</span><span class="kpi__val num" :class="{ 'kpi__val--neg': data.peakDrawdown < 0 }">{{ formatPercent(data.peakDrawdown) }}</span></div>
            </div>
          </AppCard>
        </div>
      </div>

      <!-- Row 3: 资金桶 -->
      <div class="app-grid">
        <div class="col-12">
          <AppCard title="资金桶" subtitle="市值占比 vs 风险预算占比；核心/主动/现金/特殊产品仓">
            <table class="tbl">
              <thead><tr><th>资金桶</th><th>市值占比</th><th>风险预算占比</th><th>目标区间</th><th>状态</th></tr></thead>
              <tbody>
                <tr v-for="s in sleeves" :key="s.key">
                  <td>{{ s.label }}</td>
                  <td class="num">{{ s.marketValuePctMissing ? '缺少数据' : formatPercent(s.marketValuePct) }}</td>
                  <td class="num">{{ s.riskBudgetPctMissing ? '缺少数据' : formatPercent(s.riskBudgetPct) }}</td>
                  <td class="num">{{ s.targetRange[0] }}% – {{ s.targetRange[1] }}%</td>
                  <td><StatusBadge v-if="s.disabled" tone="info" text="首版禁用" /></td>
                </tr>
              </tbody>
            </table>
          </AppCard>
        </div>
      </div>

      <!-- Row 4: 集中度 + 主题风险 -->
      <div class="app-grid">
        <div class="col-6">
          <AppCard title="单标的集中度" subtitle="市值占比与风险预算占比">
            <div v-if="concentrations.length">
              <table class="tbl">
                <thead><tr><th>标的</th><th>市值%</th><th>风险%</th><th>仓</th><th>状态</th></tr></thead>
                <tbody>
                  <tr v-for="c in concentrations" :key="c.symbol">
                    <td><strong>{{ c.symbol }}</strong><br><span class="caption">{{ c.description }}</span></td>
                    <td class="num">{{ c.missing ? '缺少数据' : formatPercent(c.marketValuePct) }}</td>
                    <td class="num">{{ c.missing ? '缺少数据' : formatPercent(c.riskBudgetPct) }}</td>
                    <td>{{ c.sleeve === 'core' ? '核心' : c.sleeve === 'active' ? '主动' : '特殊' }}</td>
                    <td><StatusBadge :tone="warningStatusTone(c.status)" :text="WARNING_STATUS_LABEL[c.status]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <StatePanel v-else kind="empty" title="暂无集中度数据" />
          </AppCard>
        </div>
        <div class="col-6">
          <AppCard title="主题合并风险" subtitle="同主题仓位合并计算">
            <div v-if="themes.length">
              <table class="tbl">
                <thead><tr><th>主题</th><th>合并市值%</th><th>合并风险%</th><th>成员</th><th>状态</th></tr></thead>
                <tbody>
                  <tr v-for="t in themes" :key="t.theme">
                    <td><strong>{{ t.theme }}</strong><br><span class="caption">{{ t.description }}</span></td>
                    <td class="num">{{ t.missing ? '缺少数据' : formatPercent(t.combinedMarketValuePct) }}</td>
                    <td class="num">{{ t.missing ? '缺少数据' : formatPercent(t.combinedRiskBudgetPct) }}</td>
                    <td class="num">{{ t.memberCount }}</td>
                    <td><StatusBadge :tone="warningStatusTone(t.status)" :text="WARNING_STATUS_LABEL[t.status]" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <StatePanel v-else kind="empty" title="暂无主题数据" />
          </AppCard>
        </div>
      </div>

      <!-- Row 5: 数据质量 + 阻断 -->
      <div class="app-grid">
        <div class="col-6">
          <AppCard title="数据质量与对账" subtitle="独立口径，不混用风险">
            <div v-if="dq">
              <table class="tbl">
                <thead><tr><th>指标</th><th>值</th></tr></thead>
                <tbody>
                  <tr><td>数据完整性</td><td class="num">{{ dq.completenessPct }}%</td></tr>
                  <tr><td>数据及时性</td><td class="num">{{ dq.timelinessPct }}%</td></tr>
                  <tr><td>对账状态</td><td><StatusBadge :tone="dq.reconciliation === 'OK' ? 'success' : dq.reconciliation === 'PENDING' ? 'warn' : 'block'" :text="RECON_LABEL[dq.reconciliation]" /></td></tr>
                  <tr><td>异常数量</td><td class="num">{{ dq.anomalyCount }}</td></tr>
                  <tr><td>综合健康度</td><td class="num" :class="{ 'kpi__val--neg': dq.healthPct < 80 }">{{ dq.healthPct }}%</td></tr>
                </tbody>
              </table>
            </div>
            <StatePanel v-else kind="empty" title="数据质量不可用" />
          </AppCard>
        </div>
        <div class="col-6">
          <AppCard title="当前硬阻断" emphasis="risk">
            <div v-if="data.hardBlock">
              <StatePanel kind="blocked" title="已触发硬阻断">
                <ul style="margin:4px 0 0;padding-left:16px;"><li v-for="r in data.hardBlockReasons" :key="r" style="font-size:13px;color:var(--danger);margin-bottom:4px;">{{ r }}</li></ul>
              </StatePanel>
            </div>
            <StatePanel v-else kind="empty" title="无硬阻断" description="当前无阻断；仅展示停止状态" />
          </AppCard>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { display: flex; flex-direction: column; gap: var(--space-4); }
.page__head { display: flex; flex-direction: column; gap: 2px; }
.page__block { width: 100%; }
.kpis { display: flex; gap: var(--space-4); flex-wrap: wrap; }
.kpi { display: flex; flex-direction: column; gap: 2px; }
.kpi__label { font-size: 12px; color: var(--text-muted); }
.kpi__val { font-size: 18px; font-weight: 650; color: var(--text-primary); }
.kpi__val--neg { color: var(--danger); }
.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl th, .tbl td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--border-default); vertical-align: top; }
.tbl th { color: var(--text-muted); font-weight: 600; font-size: 12px; }
.tbl td { color: var(--text-primary); }
.btn-retry { height: 36px; padding: 0 16px; border-radius: var(--radius-control); border: 1px solid var(--brand-primary); background: var(--brand-primary); color: #fff; font-weight: 600; cursor: pointer; }
</style>
