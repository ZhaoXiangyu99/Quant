<script setup lang="ts">
import { computed } from 'vue'
import type { Money } from '@/shared/api/types'
import { formatMoney } from '@/shared/utils/format'

const props = defineProps<{
  money: Money | undefined | null
  /** 缺失时（缺数据不猜测）展示固定文案（§9.2 / §16） */
  missing?: boolean
}>()

const MISSING_TEXT = '缺少数据，无法计算'
const display = computed(() => {
  if (props.missing) return MISSING_TEXT
  return formatMoney(props.money)
})
</script>

<template>
  <span class="amount num" :class="{ 'amount--missing': missing }">{{ display }}</span>
</template>

<style scoped>
.amount {
  font-variant-numeric: tabular-nums;
  font-feature-settings: 'tnum' 1;
  color: var(--text-primary);
}
.amount--missing {
  color: var(--text-muted);
  font-style: italic;
  font-size: 12px;
}
</style>
