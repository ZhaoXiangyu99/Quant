<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { NAV_ITEMS } from '@/shared/config/nav'
import Icon from '@/shared/ui/Icon.vue'
import { useOverviewQuery } from '@/shared/api/queries'
import { useUiStore } from '@/shared/state/ui'
import { SYSTEM_STATUS_LABEL, systemStatusTone } from '@/shared/utils/status'
import { formatDate } from '@/shared/utils/format'
import type { RuntimeEnv, ApiEnvelope, OverviewData } from '@/shared/api/schemas'

const route = useRoute()
const { data: queryData } = useOverviewQuery()
const ui = useUiStore()

const ENV_LABEL: Record<RuntimeEnv, string> = {
  research: '研究', simulation: '模拟', shadow: '影子', live: '实盘',
}

const overviewData = computed(() => (queryData.value as ApiEnvelope<OverviewData> | undefined)?.data ?? null)
const system = computed(() => overviewData.value?.system ?? null)
const envLabel = computed(() => (system.value ? ENV_LABEL[system.value.env] : '—'))
const statusLabel = computed(() => (system.value ? SYSTEM_STATUS_LABEL[system.value.status] : '—'))
const statusTone = computed(() => (system.value ? systemStatusTone(system.value.status) : 'info'))
const dataTime = computed(() => (overviewData.value ? formatDate(overviewData.value.account.updatedAt) : '—'))

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="sidebar" :class="{ 'sidebar--open': ui.mobileNavOpen }">
    <div class="sidebar__brand">
      <span class="sidebar__logo">Q</span>
      <div class="sidebar__brand-text">
        <strong>量化策略中枢</strong>
        <span class="caption">Quant Strategy Hub</span>
      </div>
    </div>
    <nav class="sidebar__nav" aria-label="主导航">
      <RouterLink v-for="item in NAV_ITEMS" :key="item.path" :to="item.path" class="sidebar__link" :class="{ 'sidebar__link--active': isActive(item.path) }" :aria-current="isActive(item.path) ? 'page' : undefined" :title="item.label" @click="ui.closeNav()">
        <Icon :name="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <footer class="sidebar__footer">
      <div class="sidebar__status" :class="`tone-${statusTone}`">
        <span class="sidebar__status-dot" aria-hidden="true" />
        <span class="sidebar__status-text">系统：{{ statusLabel }}</span>
      </div>
      <div class="sidebar__meta">
        <div class="sidebar__meta-row"><span class="caption">数据</span><span class="num">{{ dataTime }}</span></div>
        <div class="sidebar__meta-row"><span class="caption">环境</span><span class="sidebar__env">{{ envLabel }}</span></div>
      </div>
    </footer>
  </aside>
</template>

<style scoped>
.sidebar { width: var(--sidebar-width); flex: none; height: 100vh; position: sticky; top: 0; background: var(--bg-sidebar); border-right: 1px solid var(--border-default); display: flex; flex-direction: column; padding: var(--space-4) 0; }
.sidebar__brand { display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-4) var(--space-4); }
.sidebar__logo { width: 32px; height: 32px; border-radius: 8px; background: var(--brand-primary); color: #fff; font-weight: 700; display: grid; place-items: center; flex: none; }
.sidebar__brand-text { display: flex; flex-direction: column; line-height: 1.2; min-width: 0; }
.sidebar__brand-text strong { font-size: 14px; }
.sidebar__nav { display: flex; flex-direction: column; gap: 2px; padding: 0 var(--space-3); flex: 1; overflow-y: auto; }
.sidebar__link { display: flex; align-items: center; gap: var(--space-3); padding: 0 var(--space-3); height: 40px; border-radius: var(--radius-control); color: var(--text-secondary); font-size: 14px; font-weight: 500; white-space: nowrap; }
.sidebar__link:hover { background: rgba(255,255,255,0.04); color: var(--text-primary); }
.sidebar__link--active { background: rgba(79,140,255,0.14); color: var(--text-primary); box-shadow: inset 2px 0 0 var(--brand-primary); }
.sidebar__footer { margin-top: var(--space-4); padding: var(--space-3) var(--space-4) 0; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: var(--space-2); }
.sidebar__status { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.sidebar__status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; flex: none; }
.sidebar__meta { display: flex; flex-direction: column; gap: 4px; }
.sidebar__meta-row { display: flex; justify-content: space-between; font-size: 12px; }
.sidebar__env { color: var(--text-primary); font-weight: 600; }
.tone-success { color: var(--success); } .tone-warn { color: var(--warning); } .tone-block { color: var(--danger); } .tone-info { color: var(--info); }
@media (max-width: 1279px) and (min-width: 768px) { .sidebar { width: 72px; padding: var(--space-4) 0; } .sidebar__brand { justify-content: center; padding: 0 0 var(--space-4); } .sidebar__brand-text, .sidebar__nav span, .sidebar__meta { display: none; } .sidebar__link { justify-content: center; padding: 0; } .sidebar__footer { align-items: center; padding: var(--space-3) 0 0; } .sidebar__status-text { display: none; } }
@media (max-width: 767px) { .sidebar { position: fixed; top: 0; left: 0; z-index: var(--z-sidebar); width: var(--sidebar-width); transform: translateX(-100%); transition: transform 0.2s ease; box-shadow: 0 0 40px rgba(0,0,0,0.6); } .sidebar--open { transform: translateX(0); } }
</style>
