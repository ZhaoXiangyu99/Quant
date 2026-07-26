<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  kind: 'loading' | 'error' | 'empty' | 'blocked' | 'degraded'
  title?: string
  description?: string
}>()

const ICONS: Record<string, string> = {
  loading: '◌',
  error: '!',
  empty: '∅',
  blocked: '⛔',
  degraded: '⚠',
}

const tone = computed(() => {
  if (props.kind === 'blocked') return 'block'
  if (props.kind === 'error') return 'block'
  if (props.kind === 'degraded') return 'warn'
  if (props.kind === 'empty') return 'info'
  return 'info'
})

const DEFAULT_TITLE: Record<string, string> = {
  loading: '加载中',
  error: '数据获取失败',
  empty: '暂无数据',
  blocked: '已阻断',
  degraded: '数据降级',
}
</script>

<template>
  <div class="state-panel" :class="`state-panel--${tone}`" role="status">
    <div class="state-panel__icon" aria-hidden="true">{{ ICONS[kind] }}</div>
    <div class="state-panel__text">
      <p class="state-panel__title">{{ title ?? DEFAULT_TITLE[kind] }}</p>
      <p v-if="description" class="state-panel__desc">{{ description }}</p>
      <div v-if="$slots.actions" class="state-panel__actions">
        <slot name="actions" />
      </div>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.state-panel {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-default);
  background: var(--bg-card);
}
.state-panel--block,
.state-panel--error {
  border-color: rgba(240, 93, 111, 0.4);
  background: var(--status-block-bg);
}
.state-panel--warn {
  border-color: rgba(245, 165, 36, 0.32);
  background: var(--status-warn-bg);
}
.state-panel__icon {
  font-size: 22px;
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.04);
  flex: none;
}
.state-panel--block .state-panel__icon,
.state-panel--error .state-panel__icon {
  color: var(--danger);
}
.state-panel--warn .state-panel__icon {
  color: var(--warning);
}
.state-panel__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.state-panel__title {
  margin: 0;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary);
}
.state-panel__desc {
  margin: 0;
  font-size: 13px;
  color: var(--text-secondary);
}
.state-panel__actions {
  margin-top: 8px;
}
</style>
