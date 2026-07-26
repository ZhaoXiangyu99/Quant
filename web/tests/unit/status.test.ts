import { describe, it, expect } from 'vitest'
import {
  SYSTEM_STATUS_RANK,
  isHardBlock,
  systemStatusTone,
  SYSTEM_STATUS_LABEL,
  WARNING_STATUS_LABEL,
  warningStatusTone,
  worstWarningStatus,
  PLAN_STATUS_LABEL,
} from '@/shared/utils/status'
import type { WarningStatus, SystemStatus } from '@/shared/api/types'

describe('系统状态优先级（§5.3）', () => {
  it('对账失败 > 券商对账失败 > 数据阻断 > 风险阻断 > 降级 > 正常', () => {
    const order: SystemStatus[] = [
      'HEALTHY',
      'DEGRADED',
      'RISK_BLOCKED',
      'DATA_BLOCKED',
      'BROKER_RECONCILIATION_FAILED',
      'ACCOUNTING_BLOCKED',
    ]
    const ranks = order.map((s) => SYSTEM_STATUS_RANK[s])
    for (let i = 1; i < ranks.length; i++) {
      expect(ranks[i]).toBeGreaterThan(ranks[i - 1])
    }
  })
  it('标签映射', () => {
    expect(SYSTEM_STATUS_LABEL.ACCOUNTING_BLOCKED).toBe('对账失败')
    expect(SYSTEM_STATUS_LABEL.RISK_BLOCKED).toBe('风险阻断')
    expect(SYSTEM_STATUS_LABEL.HEALTHY).toBe('正常')
  })
})

describe('isHardBlock', () => {
  it('阻断类状态为 true', () => {
    expect(isHardBlock('ACCOUNTING_BLOCKED')).toBe(true)
    expect(isHardBlock('RISK_BLOCKED')).toBe(true)
    expect(isHardBlock('DATA_BLOCKED')).toBe(true)
    expect(isHardBlock('BROKER_RECONCILIATION_FAILED')).toBe(true)
  })
  it('正常/降级为 false', () => {
    expect(isHardBlock('HEALTHY')).toBe(false)
    expect(isHardBlock('DEGRADED')).toBe(false)
  })
  it('警告项 HARD_BLOCK 为 true', () => {
    expect(isHardBlock('HARD_BLOCK')).toBe(true)
    expect(isHardBlock('WARN')).toBe(false)
  })
})

describe('systemStatusTone', () => {
  it('阻断为 block，降级为 warn，正常为 success', () => {
    expect(systemStatusTone('ACCOUNTING_BLOCKED')).toBe('block')
    expect(systemStatusTone('RISK_BLOCKED')).toBe('block')
    expect(systemStatusTone('DEGRADED')).toBe('warn')
    expect(systemStatusTone('HEALTHY')).toBe('success')
  })
})

describe('警告状态', () => {
  it('标签', () => {
    expect(WARNING_STATUS_LABEL.PASS).toBe('通过')
    expect(WARNING_STATUS_LABEL.WARN).toBe('预警')
    expect(WARNING_STATUS_LABEL.HARD_BLOCK).toBe('硬阻断')
  })
  it('色调：HARD_BLOCK 为 block', () => {
    expect(warningStatusTone('HARD_BLOCK')).toBe('block')
    expect(warningStatusTone('WARN')).toBe('warn')
    expect(warningStatusTone('PASS')).toBe('success')
  })
})

describe('worstWarningStatus', () => {
  it('取最严重状态', () => {
    const list: WarningStatus[] = ['PASS', 'WARN', 'PASS']
    expect(worstWarningStatus(list)).toBe('WARN')
    expect(worstWarningStatus(['PASS', 'HARD_BLOCK', 'WARN'])).toBe('HARD_BLOCK')
    expect(worstWarningStatus([])).toBe('PASS')
  })
})

describe('计划状态标签', () => {
  it('映射', () => {
    expect(PLAN_STATUS_LABEL.PENDING).toBe('待审批')
    expect(PLAN_STATUS_LABEL.APPROVED).toBe('已批准')
    expect(PLAN_STATUS_LABEL.REJECTED).toBe('已拒绝')
    expect(PLAN_STATUS_LABEL.EXPIRED).toBe('已过期')
  })
})
