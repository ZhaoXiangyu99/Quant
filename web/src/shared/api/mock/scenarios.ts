import type {
  ApiEnvelope,
  OverviewData,
  OverviewScenario,
  WarningItem,
  SignalCandidate,
  RiskSleeve,
  StrategyLifecycleSummary,
  SystemHealth,
  DataStatus,
  BenchmarkSeries,
  BenchmarkPoint,
  DataQuality,
} from '@/shared/api/types'
import { emptyLifecycle, LIFECYCLE_LABEL } from '@/entities/strategy/lifecycle'

/* ---------------- 确定性伪随机（保证截图/测试稳定） ---------------- */
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function tradingDays(count: number, endDate: string): string[] {
  const dates: string[] = []
  const d = new Date(`${endDate}T00:00:00Z`)
  while (dates.length < count) {
    const day = d.getUTCDay()
    if (day !== 0 && day !== 6) dates.unshift(d.toISOString().slice(0, 10))
    d.setUTCDate(d.getUTCDate() - 1)
  }
  return dates
}

function buildBenchmark(seed: number): BenchmarkSeries {
  const dates = tradingDays(252, '2026-07-24')
  const rnd = mulberry32(seed)
  let portfolio = 100
  let spy = 100
  let qqq = 100
  let peak = 100
  const points: BenchmarkPoint[] = []
  for (const date of dates) {
    const rp = (rnd() - 0.47) * 0.02
    const rs = (rnd() - 0.49) * 0.017
    const rq = (rnd() - 0.485) * 0.021
    portfolio *= 1 + rp
    spy *= 1 + rs
    qqq *= 1 + rq
    peak = Math.max(peak, portfolio)
    points.push({
      date,
      portfolio: Number(portfolio.toFixed(2)),
      spy: Number(spy.toFixed(2)),
      qqq: Number(qqq.toFixed(2)),
    })
  }
  const last = points[points.length - 1]
  const cumulativeExcess = Number((last.portfolio - last.spy).toFixed(2))
  const currentDrawdown = Number((((portfolio - peak) / peak) * 100).toFixed(2))
  return {
    points,
    afterFee: true,
    window: '1Y',
    cumulativeExcess,
    currentDrawdown,
  }
}

/* ---------------- 历史错误警告：固定 9 项（§6.3） ---------------- */
function baseWarnings(): WarningItem[] {
  return [
    { key: 'benchmark_config', label: '基准与资金配置', status: 'PASS', reason: '已定义 SPY 基准与资金配置框架', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/risk' },
    { key: 'leverage_inverse', label: '杠杆/反向产品', status: 'PASS', reason: '未持有杠杆/反向 ETF', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/risk' },
    { key: 'concentration', label: '单标的、期权或主题集中', status: 'PASS', reason: '单一标的与主题集中度在阈值内', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/risk' },
    { key: 'sample_repeatability', label: '策略样本可重复性', status: 'PASS', reason: '样本数 ≥ 20 且费用后正期望已验证', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/reviews' },
    { key: 'chasing_amend', label: '订单追价与改单', status: 'PASS', reason: '近 20 日无追价/改单', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/execution' },
    { key: 'execution_window', label: '执行时段', status: 'PASS', reason: '不在盘前盘后或开盘 30 分钟内', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/approvals' },
    { key: 'reentry_rule', label: '清仓后再入场', status: 'PASS', reason: '清仓后存在再入场规则', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/reviews' },
    { key: 'timeframe_tiering', label: '日线仓/周线仓分层', status: 'PASS', reason: '日线交易仓与周线核心仓已分层', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/risk' },
    { key: 'tail_position', label: '强趋势尾仓计划', status: 'PASS', reason: '强趋势止盈含尾仓计划', updatedAt: '2026-07-24T08:00:00Z', evidencePath: '/reviews' },
  ]
}

/* ---------------- 待审批信号 ---------------- */
// 首期交易规则（§系统设计 / AGENTS.md）：
// - 首期不支持做空 → 所有信号强制 long
// - 再入场最大亏损上限取「净值 0.25%–0.5%」与「正常风险一半」中的更低者
// - 特殊产品仓首版禁用
function signalA(): SignalCandidate {
  return {
    symbol: 'NVDA',
    strategy: 'Momentum-ATR',
    strategyVersion: 'v3.2.1',
    positionType: 'active',
    entryType: 'reentry',
    signal: 'long',
    // 再入场：最大亏损占净值 0.40%（落在 0.25%–0.5% 区间，且低于正常风险一半）
    maxLossAmount: { amount: '1204.98', currency: 'USD' },
    maxLossPctOfNav: 0.4,
    combinedThemeRisk: { amount: '3200.00', currency: 'USD' },
    earliestExecutionTime: '2026-07-27T14:30:00Z',
    riskStatus: 'PASS',
    planStatus: 'PENDING',
  }
}
function signalB(warn = false): SignalCandidate {
  return {
    symbol: 'TSLA',
    strategy: 'MeanReversion-Vol',
    strategyVersion: 'v1.8.0',
    positionType: 'active',
    entryType: 'first',
    signal: 'long',
    maxLossAmount: { amount: '3100.00', currency: 'USD' },
    maxLossPctOfNav: 1.03,
    combinedThemeRisk: { amount: '6400.00', currency: 'USD' },
    earliestExecutionTime: '2026-07-27T15:00:00Z',
    riskStatus: warn ? 'WARN' : 'PASS',
    planStatus: 'PENDING',
  }
}

/* ---------------- 风险敞口资金桶（§6.5） ---------------- */
function baseSleeves(): RiskSleeve[] {
  return [
    { key: 'core', label: '核心仓', marketValuePct: 58, riskBudgetPct: 30, targetRange: [50, 65] },
    { key: 'active', label: '主动仓', marketValuePct: 22, riskBudgetPct: 45, targetRange: [15, 30] },
    { key: 'cash', label: '现金', marketValuePct: 16, riskBudgetPct: 0, targetRange: [10, 25] },
    // 特殊产品仓首版禁用：数值归零并标注，不得显示非零占比（§系统设计）
    { key: 'special', label: '特殊产品仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [0, 0], disabled: true },
  ]
}

/* ---------------- 生命周期分布 ---------------- */
function baseLifecycle(): StrategyLifecycleSummary[] {
  const base = emptyLifecycle()
  const counts: Record<string, number> = {
    research: 12,
    validation: 5,
    simulation: 3,
    shadow: 2,
    restricted_live: 1,
    live: 1,
    retired: 4,
  }
  return base.map((s) => ({ ...s, count: counts[s.stage] ?? 0, label: LIFECYCLE_LABEL[s.stage] }))
}

/* ---------------- 数据质量（独立口径，禁止与交易风险混用，§复验 P1-3） ---------------- */
function makeDataQuality(scenario: OverviewScenario): DataQuality {
  switch (scenario) {
    case 'data_delayed':
      // 仅及时性下降，完整性/对账不受影响
      return { completenessPct: 100, timelinessPct: 88, reconciliation: 'OK', anomalyCount: 0, healthPct: 94 }
    case 'accounting_block':
      // 对账失败：数据质量下降，与风险硬阻断口径相互独立
      return { completenessPct: 60, timelinessPct: 100, reconciliation: 'FAILED', anomalyCount: 5, healthPct: 40 }
    case 'risk_warning':
    case 'hard_risk_block':
      // 风险类问题不得降低数据健康度
      return { completenessPct: 100, timelinessPct: 100, reconciliation: 'OK', anomalyCount: 0, healthPct: 100 }
    default:
      // healthy / two_pending_signals / no_pending_signals：数据完全健康
      return { completenessPct: 100, timelinessPct: 100, reconciliation: 'OK', anomalyCount: 0, healthPct: 100 }
  }
}

/* ---------------- 系统健康构造 ---------------- */
function makeSystem(over: Partial<SystemHealth>): SystemHealth {
  return {
    status: 'HEALTHY',
    marketDate: '2026-07-24',
    marketTimezone: 'America/New_York',
    usMarketSession: 'CLOSED',
    dataDelaySeconds: 0,
    hardBlocks: 0,
    issues: [],
    env: 'simulation',
    ...over,
  }
}

/* ============================================================
   构造每个可审查状态的信封数据
   ============================================================ */
export function buildScenario(scenario: OverviewScenario): ApiEnvelope<OverviewData> {
  const benchmark = buildBenchmark(20260724)
  const warnings = baseWarnings()
  const sleeves = baseSleeves()
  const lifecycle = baseLifecycle()

  let system: SystemHealth = makeSystem({})
  let dataStatus: DataStatus = 'HEALTHY'
  let pendingSignals: SignalCandidate[] = [signalA(), signalB()]
  let riskBudgetMissing = false
  let signalsMissingMaxLoss = false
  let sleevesMissing = false
  let dayChange = { amount: '1820.45', currency: 'USD' as const }
  let dayChangePct = 0.61

  switch (scenario) {
    case 'healthy':
      break
    case 'two_pending_signals':
      // 强调表格：两个信号，其中一个带 WARN 风险状态
      pendingSignals = [signalA(), signalB(true)]
      break
    case 'no_pending_signals':
      pendingSignals = []
      break
    case 'data_delayed':
      system = makeSystem({
        status: 'DEGRADED',
        dataDelaySeconds: 1800,
        issues: [{ code: 'DEGRADED', label: '数据延迟', detail: '行情数据延迟约 30 分钟，净值以最近可用时点为准' }],
      })
      dataStatus = 'STALE'
      break
    case 'risk_warning':
      warnings[1].status = 'WARN'
      warnings[1].reason = '检测到杠杆/反向产品方向反复 1 次'
      warnings[2].status = 'WARN'
      warnings[2].reason = '单一标的集中度接近阈值上沿'
      warnings[3].status = 'WARN'
      warnings[3].reason = '样本数 14，尚未达到 20 阈值'
      system = makeSystem({
        status: 'DEGRADED',
        issues: [{ code: 'DEGRADED', label: '风险预警', detail: '杠杆、集中度与样本可重复性预警' }],
      })
      dataStatus = 'DEGRADED'
      break
    case 'hard_risk_block':
      warnings[5].status = 'HARD_BLOCK'
      warnings[5].reason = '信号最早执行时间落在开盘后 30 分钟内，触发硬阻断'
      warnings[2].status = 'WARN'
      warnings[2].reason = '单一标的集中度接近阈值上沿'
      system = makeSystem({
        status: 'RISK_BLOCKED',
        hardBlocks: 1,
        issues: [{ code: 'RISK_BLOCKED', label: '风险硬阻断', detail: '执行时段违规，禁止新增风险' }],
      })
      dataStatus = 'BLOCKED'
      dayChange = { amount: '-960.12', currency: 'USD' }
      dayChangePct = -0.32
      break
    case 'accounting_block':
      // 对账失败：风险数据不可信，必须展示「缺少数据，无法计算」
      riskBudgetMissing = true
      signalsMissingMaxLoss = true
      sleevesMissing = true
      system = makeSystem({
        status: 'ACCOUNTING_BLOCKED',
        hardBlocks: 1,
        issues: [{ code: 'ACCOUNTING_BLOCKED', label: '对账失败', detail: '券商与账户对账不一致，风险数据暂停计算' }],
      })
      dataStatus = 'BLOCKED'
      dayChange = { amount: '-540.00', currency: 'USD' }
      dayChangePct = -0.18
      break
    case 'api_loading':
    case 'api_error':
      // 这两种由客户端/组合层处理，不应进入数据构造
      break
  }

  const account = {
    nav: { amount: '301245.67', currency: 'USD' as const },
    dayChange,
    dayChangePct,
    updatedAt: '2026-07-24T20:00:00Z',
  }

  const riskBudget = riskBudgetMissing
    ? {
        used: { amount: '0', currency: 'USD' as const },
        remaining: { amount: '0', currency: 'USD' as const },
        usedPctOfNav: 0,
        remainingPctOfNav: 0,
        policyLimitPctOfNav: 12,
        missing: true,
      }
    : {
        used: { amount: '18600.00', currency: 'USD' as const },
        remaining: { amount: '17400.00', currency: 'USD' as const },
        usedPctOfNav: 6.17,
        remainingPctOfNav: 5.78,
        policyLimitPctOfNav: 12,
      }

  const finalSleeves = sleevesMissing
    ? sleeves.map((s) => ({ ...s, marketValuePctMissing: true, riskBudgetPctMissing: true }))
    : sleeves

  const finalSignals = signalsMissingMaxLoss
    ? pendingSignals.map((s) => ({ ...s, missingMaxLoss: true, missingCombinedRisk: true }))
    : pendingSignals

  const data: OverviewData = {
    system,
    account,
    riskBudget,
    sleeves: finalSleeves,
    lifecycle,
    warnings,
    pendingSignals: finalSignals,
    benchmark,
    dataQuality: makeDataQuality(scenario),
  }

  return {
    asOf: '2026-07-24T20:00:00Z',
    availableAt: '2026-07-24T20:00:05Z',
    source: 'mock',
    dataStatus,
    requestId: `mock-${scenario}-${Date.now().toString(36)}`,
    data,
  }
}
