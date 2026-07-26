<script setup lang="ts">
import { computed } from 'vue'
import type { RiskSleeve } from '@/shared/api/types'
import AppCard from '@/shared/ui/AppCard.vue'
import { formatPercent } from '@/shared/utils/format'

const props = defineProps<{ sleeves: RiskSleeve[] }>()

interface Row extends RiskSleeve {
  marketInRange: boolean
  riskInRange: boolean
}
const rows = computed<Row[]>(() =>
  props.sleeves.map((s) => {
    const [lo, hi] = s.targetRange
    const mIn = !s.marketValuePctMissing && s.marketValuePct >= lo && s.marketValuePct <= hi
    const rIn = !s.riskBudgetPctMissing && s.riskBudgetPct >= lo && s.riskBudgetPct <= hi
    return { ...s, marketInRange: mIn, riskInRange: rIn }
  }),
)
</script>

<template>
  <AppCard title="风险敞口" subtitle="市值占比与风险预算占比为不同维度，禁止混用（§6.5）">
    <ul class="rs__list">
      <li v-for="s in rows" :key="s.key" class="rs__item" :class="{ 'rs__item--disabled': s.disabled }">
        <div class="rs__head">
          <span class="rs__label">
            {{ s.label }}
            <span v-if="s.disabled" class="rs__badge" title="首版禁用：特殊产品仓不在首期支持范围">首版禁用</span>
          </span>
          <span class="caption rs__target">目标 {{ s.targetRange[0] }}–{{ s.targetRange[1] }}%</span>
        </div>

        <div class="rs__metric">
          <span class="rs__metric-name">市值占比</span>
          <div class="rs__bar">
            <div
              class="rs__bar-fill rs__bar-fill--market"
              :class="{ 'rs__bar-fill--out': !s.marketInRange }"
              :style="{ width: (s.marketValuePctMissing ? 0 : Math.min(100, s.marketValuePct)) + '%' }"
            />
          </div>
          <span class="rs__metric-val num" :class="{ 'rs__out': !s.marketInRange }">
            <template v-if="s.disabled">首版禁用</template>
            <template v-else-if="s.marketValuePctMissing">缺少数据，无法计算</template>
            <template v-else>{{ formatPercent(s.marketValuePct) }}</template>
          </span>
        </div>

        <div class="rs__metric">
          <span class="rs__metric-name">风险预算占比</span>
          <div class="rs__bar">
            <div
              class="rs__bar-fill rs__bar-fill--risk"
              :class="{ 'rs__bar-fill--out': !s.riskInRange }"
              :style="{ width: (s.riskBudgetPctMissing ? 0 : Math.min(100, s.riskBudgetPct)) + '%' }"
            />
          </div>
          <span class="rs__metric-val num" :class="{ 'rs__out': !s.riskInRange }">
            <template v-if="s.disabled">首版禁用</template>
            <template v-else-if="s.riskBudgetPctMissing">缺少数据，无法计算</template>
            <template v-else>{{ formatPercent(s.riskBudgetPct) }}</template>
          </span>
        </div>
      </li>
    </ul>
  </AppCard>
</template>

<style scoped>
.rs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.rs__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.rs__label {
  font-size: 14px;
  font-weight: 600;
}
.rs__target {
  font-size: 12px;
}
.rs__badge {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--border-default);
  vertical-align: middle;
}
.rs__item--disabled {
  opacity: 0.75;
}
.rs__metric {
  display: grid;
  grid-template-columns: 88px 1fr 72px;
  align-items: center;
  gap: var(--space-3);
  margin-top: 6px;
}
.rs__metric-name {
  font-size: 12px;
  color: var(--text-secondary);
}
.rs__bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 999px;
  overflow: hidden;
}
.rs__bar-fill {
  height: 100%;
  border-radius: 999px;
}
.rs__bar-fill--market {
  background: var(--brand-primary);
}
.rs__bar-fill--risk {
  background: var(--benchmark);
}
.rs__bar-fill--out {
  background: var(--warning);
}
.rs__metric-val {
  font-size: 12px;
  text-align: right;
  color: var(--text-primary);
}
.rs__out {
  color: var(--warning);
}
</style>
