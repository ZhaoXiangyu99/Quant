<script setup lang="ts">
import { useOverviewStore } from '@/shared/state/overview'
import { useScenarioStore, M2_SCENARIOS, M2_SCENARIO_LABELS } from '@/shared/state/scenario'
import { OVERVIEW_SCENARIOS, SCENARIO_LABELS } from '@/shared/api/schemas'
import { useQueryClient } from '@tanstack/vue-query'

const overview = useOverviewStore()
const scenario = useScenarioStore()
const qc = useQueryClient()

function onChange(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  overview.setScenario(v as (typeof OVERVIEW_SCENARIOS)[number])
  qc.invalidateQueries()
}

function onChangeM2(e: Event) {
  const v = (e.target as HTMLSelectElement).value
  scenario.setM2(v as (typeof M2_SCENARIOS)[number])
  qc.invalidateQueries()
}
</script>

<template>
  <div class="devpanel" role="region" aria-label="演示状态切换（仅开发环境）">
    <span class="devpanel__tag">DEV</span>
    <label class="devpanel__label" for="dev-scenario">审查状态</label>
    <select id="dev-scenario" class="devpanel__select" :value="overview.scenario" @change="onChange">
      <option v-for="s in OVERVIEW_SCENARIOS" :key="s" :value="s">{{ SCENARIO_LABELS[s] }}</option>
    </select>
    <label class="devpanel__label" for="dev-scenario-m2">M2 状态</label>
    <select id="dev-scenario-m2" class="devpanel__select" :value="scenario.m2" @change="onChangeM2">
      <option v-for="s in M2_SCENARIOS" :key="s" :value="s">{{ M2_SCENARIO_LABELS[s] }}</option>
    </select>
  </div>
</template>

<style scoped>
.devpanel { position: fixed; left: var(--space-4); bottom: var(--space-4); z-index: var(--z-devpanel); display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg-card-elevated); border: 1px solid var(--brand-primary); border-radius: 999px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); font-size: 12px; }
.devpanel__tag { background: var(--brand-primary); color: #fff; font-weight: 700; padding: 1px 6px; border-radius: 6px; }
.devpanel__label { color: var(--text-secondary); }
.devpanel__select { background: var(--bg-card); color: var(--text-primary); border: 1px solid var(--border-default); border-radius: 6px; padding: 4px 6px; font-size: 12px; min-height: 32px; }
</style>
