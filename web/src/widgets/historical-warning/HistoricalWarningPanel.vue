<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { WarningItem } from '@/shared/api/types'
import AppCard from '@/shared/ui/AppCard.vue'
import StatusBadge from '@/shared/ui/StatusBadge.vue'
import { WARNING_STATUS_LABEL, warningStatusTone } from '@/shared/utils/status'
import { formatMarketTime } from '@/shared/utils/format'

const props = defineProps<{ items: WarningItem[] }>()

const counts = computed(() => {
  const c = { PASS: 0, WARN: 0, HARD_BLOCK: 0 }
  for (const it of props.items) c[it.status] += 1
  return c
})
</script>

<template>
  <AppCard title="历史错误警告" emphasis="risk" subtitle="总览页最高风险权重 · 逐项可追溯证据">
    <div class="hw__summary">
      <span class="hw__summary-item tone-success">{{ counts.PASS }} 通过</span>
      <span class="hw__summary-item tone-warn">{{ counts.WARN }} 预警</span>
      <span class="hw__summary-item tone-block">{{ counts.HARD_BLOCK }} 硬阻断</span>
    </div>

    <ul class="hw__list">
      <li v-for="it in items" :key="it.key" class="hw__item" :class="`hw__item--${it.status.toLowerCase()}`">
        <div class="hw__item-main">
          <div class="hw__item-head">
            <span class="hw__item-label">{{ it.label }}</span>
            <StatusBadge :tone="warningStatusTone(it.status)" :text="WARNING_STATUS_LABEL[it.status]" dot />
          </div>
          <p class="hw__item-reason">{{ it.reason }}</p>
        </div>
        <div class="hw__item-meta">
          <span class="caption hw__item-time">{{ formatMarketTime(it.updatedAt) }}</span>
          <RouterLink :to="it.evidencePath" class="hw__evidence">证据 →</RouterLink>
        </div>
      </li>
    </ul>
  </AppCard>
</template>

<style scoped>
.hw__summary {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}
.hw__summary-item {
  font-size: 12px;
  font-weight: 600;
}
.tone-success {
  color: var(--success);
}
.tone-warn {
  color: var(--warning);
}
.tone-block {
  color: var(--danger);
}
.hw__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.hw__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 12px 0;
  border-top: 1px solid var(--border-default);
}
.hw__item:first-child {
  border-top: none;
}
.hw__item--hard_block {
  background: var(--status-block-bg);
  margin: 0 calc(-1 * var(--space-4));
  padding: 12px var(--space-4);
  border-top: none;
  border-left: 3px solid var(--danger);
}
.hw__item-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.hw__item-head {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
.hw__item-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.hw__item-reason {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.hw__item-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex: none;
}
.hw__evidence {
  font-size: 12px;
  font-weight: 600;
}
</style>
