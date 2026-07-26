import { describe, it, expect } from 'vitest'
import { buildScenario } from '@/shared/api/mock/scenarios'
import type { OverviewScenario, SignalCandidate } from '@/shared/api/types'

function signalsOf(scenario: OverviewScenario): SignalCandidate[] {
  return buildScenario(scenario).data.pendingSignals
}

describe('healthy mock 数据合规（§复验 P1-2）', () => {
  const healthy = buildScenario('healthy').data

  it('不存在做空信号（首期不支持做空）', () => {
    const shorts = healthy.pendingSignals.filter((s) => s.signal === 'short')
    expect(shorts).toHaveLength(0)
  })

  it('NVDA 再入场最大亏损占净值落在 0.25%–0.5%', () => {
    const nvda = healthy.pendingSignals.find((s) => s.symbol === 'NVDA')
    expect(nvda).toBeDefined()
    expect(nvda!.entryType).toBe('reentry')
    expect(nvda!.maxLossPctOfNav).toBeGreaterThanOrEqual(0.25)
    expect(nvda!.maxLossPctOfNav).toBeLessThanOrEqual(0.5)
  })

  it('特殊产品仓首版禁用：数值归零且 disabled 标注', () => {
    const special = healthy.sleeves.find((s) => s.key === 'special')
    expect(special).toBeDefined()
    expect(special!.disabled).toBe(true)
    expect(special!.marketValuePct).toBe(0)
    expect(special!.riskBudgetPct).toBe(0)
  })
})

describe('数据健康口径独立于交易风险（§复验 P1-3）', () => {
  it('硬风险阻断态数据健康仍为 100%（不被风险警告拉低）', () => {
    const dq = buildScenario('hard_risk_block').data.dataQuality
    expect(dq.healthPct).toBe(100)
    expect(dq.reconciliation).toBe('OK')
  })

  it('对账失败态数据健康下降且对账状态为 FAILED（独立口径）', () => {
    const dq = buildScenario('accounting_block').data.dataQuality
    expect(dq.healthPct).toBeLessThan(100)
    expect(dq.reconciliation).toBe('FAILED')
    expect(dq.anomalyCount).toBeGreaterThan(0)
  })

  it('风险预警态数据健康仍为 100%', () => {
    const dq = buildScenario('risk_warning').data.dataQuality
    expect(dq.healthPct).toBe(100)
  })

  it('数据延迟态仅及时性下降，完整性/对账不受影响', () => {
    const dq = buildScenario('data_delayed').data.dataQuality
    expect(dq.timelinessPct).toBeLessThan(100)
    expect(dq.completenessPct).toBe(100)
    expect(dq.reconciliation).toBe('OK')
  })
})

describe('healthy 信号样本语义', () => {
  it('healthy 含两个待审批信号，无缺失风险数据', () => {
    const sigs = signalsOf('healthy')
    expect(sigs).toHaveLength(2)
    expect(sigs.every((s) => !s.missingMaxLoss && !s.missingCombinedRisk)).toBe(true)
  })
})
