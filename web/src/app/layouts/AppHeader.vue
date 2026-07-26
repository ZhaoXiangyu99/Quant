<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from '@/shared/ui/Icon.vue'
import { useOverviewQuery } from '@/shared/api/queries'
import { useUiStore } from '@/shared/state/ui'
import { SYSTEM_STATUS_LABEL, systemStatusTone, isHardBlock } from '@/shared/utils/status'
import { formatDate, formatDelay } from '@/shared/utils/format'
import type { MarketSession, ApiEnvelope, OverviewData } from '@/shared/api/schemas'

const { data: queryData } = useOverviewQuery()
const ui = useUiStore()
const open = ref(false)

const SESSION_LABEL: Record<MarketSession, string> = {
  PRE: '盘前', REGULAR: '盘中', AFTER: '盘后', CLOSED: '休市',
}

const envelope = computed(() => (queryData.value as ApiEnvelope<OverviewData> | undefined)?.data ?? null)
const system = computed(() => envelope.value?.system ?? null)
const statusLabel = computed(() => (system.value ? SYSTEM_STATUS_LABEL[system.value.status] : '—'))
const statusTone = computed(() => (system.value ? systemStatusTone(system.value.status) : 'info'))
const isBlock = computed(() => (system.value ? isHardBlock(system.value.status) : false))
const sessionLabel = computed(() => (system.value ? SESSION_LABEL[system.value.usMarketSession] : '—'))
const marketDate = computed(() => (system.value ? formatDate(system.value.marketDate) : '—'))
const delay = computed(() => (system.value ? formatDelay(system.value.dataDelaySeconds) : '实时'))
const hardBlocks = computed(() => system.value?.hardBlocks ?? 0)
const issues = computed(() => system.value?.issues ?? [])
</script>

<template>
  <header class="header">
    <button class="header__menu" type="button" aria-label="切换导航" @click="ui.toggleNav()">
      <Icon name="menu" :size="20" />
    </button>
    <div class="header__market">
      <span class="num header__date">{{ marketDate }}</span>
      <span class="caption">美东时间</span>
      <span class="header__session" :class="`tone-${statusTone}`">{{ sessionLabel }}</span>
      <span class="header__delay" :class="{ 'header__delay--warn': system && system.dataDelaySeconds > 0 }">{{ delay }}</span>
    </div>
    <div class="header__right">
      <div class="header__status-wrap">
        <button class="header__status" :class="[`tone-${statusTone}`, { 'header__status--block': isBlock }]" type="button" :aria-expanded="open" @click="open = !open">
          <span class="header__status-dot" aria-hidden="true" />
          <span class="header__status-label">{{ statusLabel }}</span>
          <span v-if="hardBlocks > 0" class="header__status-count">{{ hardBlocks }}</span>
          <Icon name="chevron" :size="14" />
        </button>
        <div v-if="open" class="header__dropdown" role="menu">
          <p class="header__dropdown-title">系统问题（按优先级）</p>
          <ul v-if="issues.length" class="header__issues">
            <li v-for="(it, i) in issues" :key="i" class="header__issue">
              <span class="header__issue-label">{{ it.label }}</span>
              <span class="caption header__issue-detail">{{ it.detail }}</span>
            </li>
          </ul>
          <p v-else class="caption">无未解决问题</p>
        </div>
      </div>
      <button class="header__icon-btn" type="button" aria-label="通知">
        <Icon name="bell" :size="18" />
        <span v-if="hardBlocks > 0" class="header__bell-dot" aria-hidden="true" />
      </button>
      <button class="header__user" type="button" aria-label="用户菜单">
        <span class="header__avatar">YX</span>
        <span class="header__user-name">投资者</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header { height: var(--header-height); flex: none; position: sticky; top: 0; z-index: var(--z-header); background: rgba(8,17,31,0.92); backdrop-filter: blur(6px); border-bottom: 1px solid var(--border-default); display: flex; align-items: center; justify-content: space-between; padding: 0 var(--page-padding); gap: var(--space-4); }
.header__menu { display: none; width: 36px; height: 36px; place-items: center; border-radius: var(--radius-control); border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; flex: none; }
@media (max-width: 767px) { .header__menu { display: grid; } }
.header__market { display: flex; align-items: center; gap: var(--space-3); }
.header__date { font-weight: 600; font-size: 14px; }
.header__session { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--border-default); }
.header__delay { font-size: 12px; color: var(--text-muted); }
.header__delay--warn { color: var(--warning); }
.header__right { display: flex; align-items: center; gap: var(--space-3); }
.header__status-wrap { position: relative; }
.header__status { display: flex; align-items: center; gap: 6px; height: 36px; padding: 0 10px; border-radius: var(--radius-control); border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; }
.header__status--block { border-color: rgba(240,93,111,0.5); background: var(--status-block-bg); color: var(--danger); }
.header__status-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.tone-success { color: var(--success); } .tone-warn { color: var(--warning); } .tone-block { color: var(--danger); } .tone-info { color: var(--info); }
.header__status-count { background: var(--danger); color: #fff; font-size: 11px; border-radius: 999px; padding: 0 6px; line-height: 16px; }
.header__dropdown { position: absolute; right: 0; top: 44px; width: 320px; background: var(--bg-card-elevated); border: 1px solid var(--border-default); border-radius: var(--radius-card); padding: var(--space-3); box-shadow: 0 12px 32px rgba(0,0,0,0.5); z-index: var(--z-dialog); }
.header__dropdown-title { margin: 0 0 8px; font-size: 12px; color: var(--text-muted); }
.header__issues { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.header__issue { display: flex; flex-direction: column; gap: 2px; padding-bottom: 8px; border-bottom: 1px solid var(--border-default); }
.header__issue:last-child { border-bottom: none; padding-bottom: 0; }
.header__issue-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.header__icon-btn { position: relative; width: 36px; height: 36px; display: grid; place-items: center; border-radius: var(--radius-control); border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-secondary); cursor: pointer; }
.header__bell-dot { position: absolute; top: 6px; right: 6px; width: 8px; height: 8px; border-radius: 50%; background: var(--danger); border: 2px solid var(--bg-card); }
.header__user { display: flex; align-items: center; gap: 8px; height: 36px; padding: 0 10px 0 4px; border-radius: var(--radius-control); border: 1px solid var(--border-default); background: var(--bg-card); color: var(--text-primary); cursor: pointer; }
.header__avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--brand-primary); color: #fff; font-size: 12px; font-weight: 700; display: grid; place-items: center; }
.header__user-name { font-size: 13px; }
</style>
