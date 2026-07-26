<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppCard from '@/shared/ui/AppCard.vue'
import DemoDataBadge from '@/shared/ui/DemoDataBadge.vue'

const route = useRoute()
const title = computed(() => (route.meta.title as string) ?? '页面')
const milestone = computed(() => (route.meta.milestone as number) ?? 2)
</script>

<template>
  <div class="ph">
    <header class="ph__head">
      <h1 class="page-title">{{ title }}</h1>
      <p class="caption">该页面计划在 Milestone {{ milestone }} 实现（本里程碑为只读总览，不涉及交易动作）</p>
    </header>
    <AppCard :title="title">
      <div class="ph__body">
        <DemoDataBadge />
        <p class="ph__text">
          「{{ title }}」属于后续里程碑范围。Milestone 1 仅交付 App Shell 与只读
          <RouterLink to="/overview">总览</RouterLink>
          页面。该页面在此仅作为路由占位，不连接任何真实数据或交易集成。
        </p>
      </div>
    </AppCard>
  </div>
</template>

<style scoped>
.ph {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.ph__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ph__body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
.ph__text {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 22px;
}
</style>
