<script setup lang="ts">
import { RouterLink } from 'vue-router'

defineProps<{
  label: string
  /** 副信息（小字，如更新时间/口径说明） */
  sub?: string
  /** 点击跳转（§6.1 KPI 点击后进入对应页面） */
  to?: string
  /** 风险权重更高的卡片加左侧强调边框 */
  emphasis?: 'risk' | 'none'
}>()
</script>

<template>
  <RouterLink v-if="to" :to="to" class="kpi card" :class="{ 'kpi--risk': emphasis === 'risk' }">
    <p class="kpi__label">{{ label }}</p>
    <div class="kpi__value num"><slot /></div>
    <p v-if="sub || $slots.sub" class="kpi__sub">
      <slot name="sub">{{ sub }}</slot>
    </p>
  </RouterLink>
  <div v-else class="kpi card" :class="{ 'kpi--risk': emphasis === 'risk' }">
    <p class="kpi__label">{{ label }}</p>
    <div class="kpi__value num"><slot /></div>
    <p v-if="sub || $slots.sub" class="kpi__sub">
      <slot name="sub">{{ sub }}</slot>
    </p>
  </div>
</template>

<style scoped>
.kpi {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  color: inherit;
  min-height: 116px;
  transition: border-color 0.15s ease;
}
.kpi:hover {
  border-color: var(--brand-primary);
}
.kpi--risk {
  border-left: 3px solid var(--danger);
}
.kpi__label {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.kpi__value {
  font-size: 28px;
  line-height: 36px;
  font-weight: 650;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
}
.kpi__sub {
  margin: 0;
  font-size: 12px;
  color: var(--text-muted);
  line-height: 18px;
}
</style>
