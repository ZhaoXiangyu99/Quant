<script setup lang="ts">
/** 「演示数据」标识：只要 source === "mock" 就必须可见（§Mock data rules）。 */
</script>

<template>
  <span class="demo-badge" title="当前为演示数据，不代表真实账户或行情">
    <span class="demo-badge__dot" aria-hidden="true" />
    演示数据
  </span>
</template>

<style scoped>
.demo-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;
  font-weight: 600;
  color: var(--status-warn-fg);
  background: var(--status-warn-bg);
  border: 1px solid rgba(245, 165, 36, 0.32);
}
.demo-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--status-warn-fg);
}
</style>
