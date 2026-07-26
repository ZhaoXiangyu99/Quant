<script setup lang="ts">
import { RouterLink } from 'vue-router'
import type { StrategyLifecycleSummary } from '@/shared/api/types'
import AppCard from '@/shared/ui/AppCard.vue'

defineProps<{ lifecycle: StrategyLifecycleSummary[] }>()
</script>

<template>
  <AppCard title="策略生命周期" subtitle="研究 → 验证 → 模拟 → 影子 → 受限实盘 → 实盘 → 退役">
    <div class="lc">
      <template v-for="(s, i) in lifecycle" :key="s.stage">
        <RouterLink :to="`/research/strategies?stage=${s.stage}`" class="lc__stage" :class="{ 'lc__stage--retired': s.stage === 'retired' }">
          <span class="lc__count num">{{ s.count }}</span>
          <span class="lc__label">{{ s.label }}</span>
        </RouterLink>
        <span v-if="i < lifecycle.length - 1" class="lc__arrow" aria-hidden="true">→</span>
      </template>
    </div>
  </AppCard>
</template>

<style scoped>
.lc {
  display: flex;
  align-items: stretch;
  gap: 4px;
  flex-wrap: wrap;
}
.lc__stage {
  flex: 1;
  min-width: 84px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 8px;
  border-radius: var(--radius-control);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  text-decoration: none;
  color: var(--text-primary);
}
.lc__stage:hover {
  border-color: var(--brand-primary);
}
.lc__stage--retired {
  opacity: 0.6;
}
.lc__count {
  font-size: 22px;
  line-height: 28px;
  font-weight: 650;
  color: var(--brand-primary);
}
.lc__label {
  font-size: 12px;
  color: var(--text-secondary);
}
.lc__arrow {
  align-self: center;
  color: var(--text-muted);
}
</style>
