<script setup lang="ts">
/** 状态徽标：颜色 + 文字，禁止仅靠颜色传达语义（§13.1 / §18）。 */
defineProps<{
  tone: 'success' | 'warn' | 'block' | 'info'
  text: string
  dot?: boolean
}>()
</script>

<template>
  <span class="badge" :class="`badge--${tone}`">
    <span v-if="dot" class="badge__dot" aria-hidden="true" />
    <span class="badge__text">{{ text }}</span>
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  border: 1px solid transparent;
  white-space: nowrap;
}
.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
.badge--success {
  color: var(--status-pass-fg);
  background: var(--status-pass-bg);
  border-color: rgba(59, 203, 131, 0.3);
}
.badge--warn {
  color: var(--status-warn-fg);
  background: var(--status-warn-bg);
  border-color: rgba(245, 165, 36, 0.32);
}
.badge--block {
  color: var(--status-block-fg);
  background: var(--status-block-bg);
  border-color: rgba(240, 93, 111, 0.4);
}
.badge--info {
  color: var(--status-info-fg);
  background: var(--status-info-bg);
  border-color: rgba(92, 184, 255, 0.3);
}
</style>
