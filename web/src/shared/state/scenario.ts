/* ============================================================
   M2 审查场景 Store
   控制 M2 各页面的 mock 数据响应行为（13 种场景）
   ============================================================ */
import { defineStore } from 'pinia'

export const M2_SCENARIOS = [
  'normal', 'empty', 'delayed', 'partial-missing', 'schema-invalid',
  'api-error', 'hard-block', 'reconciliation-failed', 'no-signals',
  'open-position-only', 'partial-fill', 'rejected', 'reconciliation-required',
  'missing-data',
] as const

export type M2Scenario = (typeof M2_SCENARIOS)[number]

export const M2_SCENARIO_LABELS: Record<M2Scenario, string> = {
  'normal': '正常',
  'empty': '空列表',
  'delayed': '延迟加载',
  'partial-missing': '部分缺失',
  'schema-invalid': '数据不合规',
  'api-error': 'API 错误',
  'hard-block': '风险硬阻断',
  'reconciliation-failed': '对账失败',
  'no-signals': '无信号',
  'open-position-only': '仅持仓',
  'partial-fill': '部分成交',
  'rejected': '订单拒绝',
  'reconciliation-required': '待对账',
  'missing-data': '数据缺失',
}

export const useScenarioStore = defineStore('scenario', {
  state: () => ({
    m2: 'normal' as M2Scenario,
  }),
  actions: {
    setM2(scenario: M2Scenario) {
      this.m2 = scenario
    },
  },
})
