<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { SignalCandidate } from '@/shared/api/types'
import Amount from '@/shared/ui/Amount.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import StatePanel from '@/shared/ui/StatePanel.vue'
import {
  WARNING_STATUS_LABEL,
  warningStatusTone,
  PLAN_STATUS_LABEL,
  POSITION_TYPE_LABEL,
  ENTRY_TYPE_LABEL,
  SIGNAL_DIRECTION_LABEL,
} from '@/shared/utils/status'
import { formatPercent, formatMarketTime } from '@/shared/utils/format'

const props = defineProps<{ signals: SignalCandidate[]; marketTimezone?: string }>()

function planTone(status: SignalCandidate['planStatus']): 'success' | 'warn' | 'block' | 'info' {
  if (status === 'APPROVED') return 'success'
  if (status === 'REJECTED') return 'block'
  if (status === 'EXPIRED') return 'info'
  return 'warn'
}
</script>

<template>
  <div>
    <div v-if="signals.length" class="apt-scroll">
      <table class="apt">
        <thead>
          <tr>
            <th>标的</th>
            <th>策略</th>
            <th>版本</th>
            <th>仓位</th>
            <th>首次/再入场</th>
            <th>信号</th>
            <th class="num">最大亏损金额</th>
            <th class="num">最大亏损占净值</th>
            <th class="num">同主题合并风险</th>
            <th>最早执行时间</th>
            <th>风险状态</th>
            <th>计划状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in signals" :key="s.symbol + s.strategy + s.strategyVersion">
            <td class="apt__symbol">{{ s.symbol }}</td>
            <td>{{ s.strategy }}</td>
            <td class="caption">{{ s.strategyVersion }}</td>
            <td>{{ POSITION_TYPE_LABEL[s.positionType] }}</td>
            <td>{{ ENTRY_TYPE_LABEL[s.entryType] }}</td>
            <td>{{ SIGNAL_DIRECTION_LABEL[s.signal] }}</td>
            <td class="num">
              <Amount :money="s.maxLossAmount" :missing="s.missingMaxLoss" />
            </td>
            <td class="num">
              <span v-if="s.missingMaxLoss" class="apt__missing">缺少数据，无法计算</span>
              <span v-else class="num">{{ formatPercent(s.maxLossPctOfNav) }}</span>
            </td>
            <td class="num">
              <Amount :money="s.combinedThemeRisk" :missing="s.missingCombinedRisk" />
            </td>
            <td class="caption apt__time">{{ formatMarketTime(s.earliestExecutionTime, props.marketTimezone) }}</td>
            <td>
              <StatusBadge :tone="warningStatusTone(s.riskStatus)" :text="WARNING_STATUS_LABEL[s.riskStatus]" dot />
            </td>
            <td>
              <StatusBadge :tone="planTone(s.planStatus)" :text="PLAN_STATUS_LABEL[s.planStatus]" />
            </td>
            <td class="apt__actions">
              <RouterLink :to="`/approvals?plan=${s.symbol}`" class="apt__link">查看计划</RouterLink>
              <RouterLink :to="`/approvals?plan=${s.symbol}`" class="apt__link">进入审批</RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <StatePanel
      v-else
      kind="empty"
      title="无待审批信号"
      description="当前没有等待人工审批的交易计划。"
    />
    <p class="caption apt__note">
      总览页仅允许「查看计划 / 进入审批」，不提供直接买入、卖出或批准按钮（§6.4）。
    </p>
  </div>
</template>

<style scoped>
.apt-scroll {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  /* 容器内部横向滚动，绝不把 document 撑宽（§复验：不横向溢出） */
  -webkit-overflow-scrolling: touch;
}
.apt {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;
  line-height: 20px;
}
.apt th,
.apt td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-default);
  white-space: nowrap;
}
.apt th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  position: sticky;
  top: 0;
  background: var(--bg-card);
}
.apt td.num,
.apt th.num {
  text-align: right;
}
.apt__symbol {
  font-weight: 700;
  color: var(--text-primary);
}
.apt__missing {
  color: var(--text-muted);
  font-style: italic;
  font-size: 12px;
}
.apt__actions {
  display: flex;
  gap: 12px;
}
.apt__link {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.apt__note {
  margin: 12px 0 0;
}
</style>
