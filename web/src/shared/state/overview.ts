/* ============================================================
   Overview UI 状态（仅 scenario — §4.1 Pinia 只管理客户端状态）
   服务端数据由 @tanstack/vue-query 管理。
   M1 兼容：DevStatePanel 仍通过此 store 改变 scenario。
   ============================================================ */
import { defineStore } from 'pinia'
import type { OverviewScenario } from '@/shared/api/schemas'
import { OVERVIEW_SCENARIOS } from '@/shared/api/schemas'

function isScenario(v: string | null): v is OverviewScenario {
  return v != null && (OVERVIEW_SCENARIOS as string[]).includes(v)
}

export function readInitialScenario(): OverviewScenario {
  if (!import.meta.env.DEV || typeof window === 'undefined') return 'healthy'
  const v = new URLSearchParams(window.location.search).get('scenario')
  return isScenario(v) ? v : 'healthy'
}

function syncUrl(scenario: OverviewScenario) {
  if (!import.meta.env.DEV || typeof window === 'undefined') return
  const url = new URL(window.location.href)
  url.searchParams.set('scenario', scenario)
  window.history.replaceState({}, '', url.toString())
}

export const useOverviewStore = defineStore('overview', {
  state: () => ({
    scenario: readInitialScenario() as OverviewScenario,
  }),
  actions: {
    setScenario(scenario: OverviewScenario) {
      if (this.scenario === scenario) return
      this.scenario = scenario
      syncUrl(scenario)
    },
  },
})
