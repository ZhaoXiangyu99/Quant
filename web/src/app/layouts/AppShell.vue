<script setup lang="ts">
import { computed } from 'vue'
import Sidebar from './Sidebar.vue'
import AppHeader from './AppHeader.vue'
import DevStatePanel from '@/shared/ui/DevStatePanel.vue'
import { useUiStore } from '@/shared/state/ui'

// DEV-only 审查开关面板：生产构建不渲染（import.meta 在脚本中求值，避免在模板表达式中使用）
const isDev = import.meta.env.DEV
const ui = useUiStore()
const showBackdrop = computed(() => ui.mobileNavOpen)
</script>

<template>
  <div class="shell">
    <Sidebar class="shell__sidebar" />
    <div
      v-if="showBackdrop"
      class="shell__backdrop"
      aria-hidden="true"
      @click="ui.closeNav()"
    />
    <div class="shell__main">
      <AppHeader class="shell__header" />
      <main class="shell__content">
        <RouterView />
      </main>
    </div>
    <DevStatePanel v-if="isDev" />
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-canvas);
}
.shell__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.shell__content {
  flex: 1;
  padding: var(--page-padding);
  min-width: 0;
}
.shell__backdrop {
  display: none;
}
@media (max-width: 767px) {
  .shell__backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-sidebar) - 1);
    background: rgba(0, 0, 0, 0.5);
  }
}
</style>
