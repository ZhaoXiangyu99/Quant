<script setup lang="ts">
import DemoDataBadge from '@/shared/ui/DemoDataBadge.vue'
</script>

<template>
  <div class="demo-banner" role="note">
    <DemoDataBadge />
    <span class="demo-banner__text">
      当前为演示数据，不代表真实账户、行情或风险结论；前端不计算权威风险（§Mock data rules / §非协商产品规则）。
    </span>
  </div>
</template>

<style scoped>
.demo-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 10px 14px;
  border-radius: var(--radius-card);
  border: 1px solid rgba(245, 165, 36, 0.32);
  background: var(--status-warn-bg);
}
.demo-banner__text {
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
