import type {
  SystemStatus,
  WarningStatus,
  PlanStatus,
  PositionType,
  EntryType,
  SignalDirection,
} from '@/shared/api/types'

/** 警告状态优先级：HARD_BLOCK 最严重（§6.3）。 */
export const WARNING_STATUS_RANK: Record<WarningStatus, number> = {
  PASS: 0,
  WARN: 1,
  HARD_BLOCK: 2,
}

/** 全局系统状态优先级（§5.3）：数值越大越优先展示。 */
export const SYSTEM_STATUS_RANK: Record<SystemStatus, number> = {
  ACCOUNTING_BLOCKED: 5,
  BROKER_RECONCILIATION_FAILED: 4,
  DATA_BLOCKED: 3,
  RISK_BLOCKED: 2,
  DEGRADED: 1,
  HEALTHY: 0,
}

/** 是否为硬阻断类状态（红色 + 文字标签，§视觉目标 / §6.3）。 */
export function isHardBlock(status: SystemStatus | WarningStatus): boolean {
  return status === 'HARD_BLOCK' || status === 'ACCOUNTING_BLOCKED' || status === 'BROKER_RECONCILIATION_FAILED' || status === 'DATA_BLOCKED' || status === 'RISK_BLOCKED'
}

/** 全局状态中文标签。 */
export const SYSTEM_STATUS_LABEL: Record<SystemStatus, string> = {
  HEALTHY: '正常',
  DEGRADED: '降级',
  DATA_BLOCKED: '数据阻断',
  RISK_BLOCKED: '风险阻断',
  BROKER_RECONCILIATION_FAILED: '券商对账失败',
  ACCOUNTING_BLOCKED: '对账失败',
}

/** 全局状态色调：block=红, warn=琥珀, info=蓝, success=绿。 */
export function systemStatusTone(status: SystemStatus): 'block' | 'warn' | 'info' | 'success' {
  if (isHardBlock(status)) return 'block'
  if (status === 'DEGRADED') return 'warn'
  if (status === 'HEALTHY') return 'success'
  return 'info'
}

/** 警告状态中文标签：HARD_BLOCK 必须文字呈现（§视觉目标 red+text）。 */
export const WARNING_STATUS_LABEL: Record<WarningStatus, string> = {
  PASS: '通过',
  WARN: '预警',
  HARD_BLOCK: '硬阻断',
}

/** 警告状态色调。 */
export function warningStatusTone(status: WarningStatus): 'block' | 'warn' | 'success' | 'info' {
  if (status === 'HARD_BLOCK') return 'block'
  if (status === 'WARN') return 'warn'
  if (status === 'PASS') return 'success'
  return 'info'
}

/** 取一组警告中最严重的状态（用于风险权重展示）。 */
export function worstWarningStatus(statuses: WarningStatus[]): WarningStatus {
  return statuses.reduce<WarningStatus>(
    (worst, s) => (WARNING_STATUS_RANK[s] > WARNING_STATUS_RANK[worst] ? s : worst),
    'PASS',
  )
}

/** 计划状态标签。 */
export const PLAN_STATUS_LABEL: Record<PlanStatus, string> = {
  PENDING: '待审批',
  APPROVED: '已批准',
  REJECTED: '已拒绝',
  EXPIRED: '已过期',
}

/** 仓位类型标签。 */
export const POSITION_TYPE_LABEL: Record<PositionType, string> = {
  core: '核心仓',
  active: '主动仓',
  special: '特殊产品仓',
}

/** 首次/再入场标签。 */
export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  first: '首次',
  reentry: '再入场',
}

/** 信号方向标签。 */
export const SIGNAL_DIRECTION_LABEL: Record<SignalDirection, string> = {
  long: '做多',
  short: '做空',
}
