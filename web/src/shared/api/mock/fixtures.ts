/* ============================================================
   Milestone 2 Mock Fixtures
   覆盖 §5 全部场景：正常 / 空 / 延迟 / 缺失 / 不合规 / 错误 / 阻断 / 对账失败
   / no-signals / open-position-only / 部分成交 / 拒绝 / 待对账
   所有数据符合 Zod schema 契约
   ============================================================ */
import type {
  SystemHealth,
  AccountSnapshot,
  PortfolioRiskSummary,
  StrategySummary,
  BacktestRunSummary,
  BacktestRunDetail,
  BacktestTradeSample,
  BacktestOrderLedgerItem,
  OrderIntent,
  BrokerOrder,
  Fill,
  ReconciliationIssue,
  DataStatus,
} from '../schemas'

/* ---------------- 工具 ---------------- */

/** mulberry32: 确定性伪随机数生成器，seed=42 */
function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)

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

/* ---------------- 系统健康 ---------------- */

export function makeSystemHealth(): SystemHealth {
  return {
    status: 'HEALTHY',
    marketDate: '2026-07-24',
    marketTimezone: 'America/New_York',
    usMarketSession: 'CLOSED',
    dataDelaySeconds: 0,
    hardBlocks: 0,
    issues: [],
    env: 'simulation',
  }
}

/* ---------------- 账户快照 ---------------- */

export function makeAccountSnapshot(): AccountSnapshot {
  return {
    nav: { amount: '301245.67', currency: 'USD' },
    dayChange: { amount: '1820.45', currency: 'USD' },
    dayChangePct: 0.61,
    updatedAt: '2026-07-24T20:00:00Z',
  }
}

/* ---------------- 组合风险 ---------------- */

export function makePortfolioRisk(healthy = true): PortfolioRiskSummary {
  if (!healthy) {
    return {
      nav: { amount: '301245.67', currency: 'USD' },
      cash: { amount: '48200.00', currency: 'USD' },
      updatedAt: '2026-07-24T20:00:00Z',
      riskBudget: {
        used: { amount: '0', currency: 'USD' },
        remaining: { amount: '0', currency: 'USD' },
        usedPctOfNav: 0,
        remainingPctOfNav: 0,
        policyLimitPctOfNav: 12,
        missing: true,
      },
      exposure: {
        grossExposure: 0,
        netExposure: 0,
        longExposure: 0,
        shortExposure: 0,
        cashPctOfNav: 100,
        missing: true,
      },
      concentrations: [],
      themes: [],
      sleeves: [
        { key: 'core', label: '核心仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [50, 65], marketValuePctMissing: true, riskBudgetPctMissing: true },
        { key: 'active', label: '主动仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [15, 30], marketValuePctMissing: true, riskBudgetPctMissing: true },
        { key: 'cash', label: '现金', marketValuePct: 100, riskBudgetPct: 0, targetRange: [10, 25] },
        { key: 'special', label: '特殊产品仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [0, 0], disabled: true },
      ],
      currentDrawdown: -1.2,
      peakDrawdown: -8.5,
      dataQuality: {
        completenessPct: 60,
        timelinessPct: 100,
        reconciliation: 'FAILED',
        anomalyCount: 5,
        healthPct: 40,
      },
      hardBlock: true,
      hardBlockReasons: ['对账失败：券商与账户对账不一致，风险数据暂停计算'],
      missingFields: ['riskBudget', 'exposure', 'concentrations', 'themes'],
    }
  }

  return {
    nav: { amount: '301245.67', currency: 'USD' },
    cash: { amount: '48200.00', currency: 'USD' },
    updatedAt: '2026-07-24T20:00:00Z',
    riskBudget: {
      used: { amount: '18600.00', currency: 'USD' },
      remaining: { amount: '17400.00', currency: 'USD' },
      usedPctOfNav: 6.17,
      remainingPctOfNav: 5.78,
      policyLimitPctOfNav: 12,
    },
    exposure: {
      grossExposure: 84,
      netExposure: 84,
      longExposure: 84,
      shortExposure: 0,
      cashPctOfNav: 15.98,
    },
    concentrations: [
      { symbol: 'NVDA', description: 'NVIDIA Corp', marketValuePct: 14.2, riskBudgetPct: 28.5, sleeve: 'active', status: 'PASS' },
      { symbol: 'SPY', description: 'SPDR S&P 500 ETF', marketValuePct: 22.0, riskBudgetPct: 15.0, sleeve: 'core', status: 'PASS' },
      { symbol: 'QQQ', description: 'Invesco QQQ Trust', marketValuePct: 18.0, riskBudgetPct: 12.0, sleeve: 'core', status: 'PASS' },
      { symbol: 'MSFT', description: 'Microsoft Corp', marketValuePct: 10.5, riskBudgetPct: 18.2, sleeve: 'active', status: 'PASS' },
      { symbol: 'AMZN', description: 'Amazon.com Inc', marketValuePct: 8.3, riskBudgetPct: 14.5, sleeve: 'active', status: 'WARN' },
      { symbol: 'TSLA', description: 'Tesla Inc', marketValuePct: 5.1, riskBudgetPct: 11.8, sleeve: 'active', status: 'PASS' },
    ],
    themes: [
      { theme: 'AI/半导体', description: 'NVDA + AMD + SMH', combinedMarketValuePct: 28.5, combinedRiskBudgetPct: 38.2, memberCount: 3, status: 'WARN' },
      { theme: '大盘科技', description: 'MSFT + AMZN + GOOGL', combinedMarketValuePct: 25.1, combinedRiskBudgetPct: 35.5, memberCount: 3, status: 'PASS' },
      { theme: '大盘指数', description: 'SPY + QQQ', combinedMarketValuePct: 40.0, combinedRiskBudgetPct: 27.0, memberCount: 2, status: 'PASS' },
      { theme: '电动车', description: 'TSLA', combinedMarketValuePct: 5.1, combinedRiskBudgetPct: 11.8, memberCount: 1, status: 'PASS' },
    ],
    sleeves: [
      { key: 'core', label: '核心仓', marketValuePct: 58, riskBudgetPct: 30, targetRange: [50, 65] },
      { key: 'active', label: '主动仓', marketValuePct: 26, riskBudgetPct: 55, targetRange: [15, 30] },
      { key: 'cash', label: '现金', marketValuePct: 16, riskBudgetPct: 0, targetRange: [10, 25] },
      { key: 'special', label: '特殊产品仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [0, 0], disabled: true },
    ],
    currentDrawdown: -1.2,
    peakDrawdown: -8.5,
    dataQuality: {
      completenessPct: 98,
      timelinessPct: 100,
      reconciliation: 'OK',
      anomalyCount: 1,
      healthPct: 97,
    },
    hardBlock: false,
    hardBlockReasons: [],
  }
}

/* ---------------- 策略列表 ---------------- */

function makeStrategy(id: number): StrategySummary {
  const strategies: StrategySummary[] = [
    {
      strategyId: 'daily_trend_v1',
      name: '日线趋势突破（20日突破+均线确认）',
      currentVersion: 'v3.2.1',
      lifecycle: 'live',
      market: 'US',
      frequency: 'daily',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 47,
      latestOosResult: '+12.4% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260723-1200',
      updatedAt: '2026-07-23T18:00:00Z',
      blockReason: null,
    },
    {
      strategyId: 'weekly_core_trend',
      name: '周线核心趋势（10/30周均线）',
      currentVersion: 'v2.1.0',
      lifecycle: 'restricted_live',
      market: 'US',
      frequency: 'weekly',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 32,
      latestOosResult: '+5.8% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260723-1200',
      updatedAt: '2026-07-23T18:00:00Z',
      blockReason: null,
    },
    {
      strategyId: 'daily_reentry_v1',
      name: '清仓后再入场（20日突破+均线确认）',
      currentVersion: 'v1.5.0',
      lifecycle: 'shadow',
      market: 'US',
      frequency: 'daily',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 22,
      latestOosResult: '+3.2% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260723-1200',
      updatedAt: '2026-07-22T18:00:00Z',
      blockReason: null,
    },
    {
      strategyId: 'mean_reversion_vol',
      name: '均值回归（波动率加权）',
      currentVersion: 'v1.8.0',
      lifecycle: 'validation',
      market: 'US',
      frequency: 'daily',
      benchmark: 'QQQ',
      allowedDirections: ['long'],
      sampleCount: 14,
      latestOosResult: '-1.5% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260720-1200',
      updatedAt: '2026-07-20T18:00:00Z',
      blockReason: '样本数 14，不足 20',
    },
    {
      strategyId: 'momentum_atr_v1',
      name: '动量-ATR 突破',
      currentVersion: 'v3.2.1',
      lifecycle: 'live',
      market: 'US',
      frequency: 'daily',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 61,
      latestOosResult: '+15.1% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260723-1200',
      updatedAt: '2026-07-24T18:00:00Z',
      blockReason: null,
    },
    {
      strategyId: 'sector_rotation_v1',
      name: '板块轮动（相对强度）',
      currentVersion: 'v0.8.0',
      lifecycle: 'research',
      market: 'US',
      frequency: 'weekly',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 8,
      latestOosResult: null,
      dataSnapshotId: 'snap-20260719-1200',
      updatedAt: '2026-07-19T18:00:00Z',
      blockReason: '样本数 8，不足 20',
    },
    {
      strategyId: 'earnings_breakout',
      name: '财报前突破看涨',
      currentVersion: 'v1.2.1',
      lifecycle: 'simulation',
      market: 'US',
      frequency: 'daily',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 26,
      latestOosResult: '+8.3% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260722-1200',
      updatedAt: '2026-07-22T18:00:00Z',
      blockReason: null,
    },
    {
      strategyId: 'volatility_arb_v1',
      name: '波动率套利（VIX 信号）',
      currentVersion: 'v0.5.0',
      lifecycle: 'retired',
      market: 'US',
      frequency: 'daily',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 35,
      latestOosResult: '-3.8% vs SPY（费用后）',
      dataSnapshotId: 'snap-20260701-1200',
      updatedAt: '2026-07-01T18:00:00Z',
      blockReason: '策略退役：实盘与回测行为显著偏离',
    },
    {
      strategyId: 'dual_horizon_trend',
      name: '双周期趋势（日线+周线）',
      currentVersion: 'v0.7.0',
      lifecycle: 'research',
      market: 'US',
      frequency: 'daily',
      benchmark: 'SPY',
      allowedDirections: ['long'],
      sampleCount: 11,
      latestOosResult: null,
      dataSnapshotId: 'snap-20260721-1200',
      updatedAt: '2026-07-21T18:00:00Z',
      blockReason: '样本数 11，不足 20',
    },
  ]
  return strategies[id % strategies.length]
}

export function makeStrategies(): StrategySummary[] {
  return Array.from({ length: 10 }, (_, i) => makeStrategy(i))
}

/* ---------------- 回测列表 ---------------- */

function makeBacktestRun(id: number): BacktestRunSummary {
  const runs: BacktestRunSummary[] = [
    {
      runId: 'bt-20260724-001',
      strategyId: 'momentum_atr_v1',
      strategyName: '动量-ATR 突破',
      strategyVersion: 'v3.2.0',
      lifecycle: 'live',
      dataSnapshotId: 'snap-20260723-1200',
      startDate: '2024-01-02',
      endDate: '2026-06-30',
      status: 'PASS',
      cagr: 18.5,
      maxDrawdown: -12.3,
      excessVsSpy: 12.4,
      sharpe: 1.42,
      commissionAndSlippage: { amount: '2340.00', currency: 'USD' },
      tradeCount: 61,
      siblingSampleCount: 61,
      passPromotion: true,
      runAt: '2026-07-24T10:30:00Z',
    },
    {
      runId: 'bt-20260724-002',
      strategyId: 'daily_trend_v1',
      strategyName: '日线趋势突破',
      strategyVersion: 'v3.2.1',
      lifecycle: 'live',
      dataSnapshotId: 'snap-20260723-1200',
      startDate: '2024-01-02',
      endDate: '2026-06-30',
      status: 'PASS',
      cagr: 15.2,
      maxDrawdown: -14.1,
      excessVsSpy: 9.1,
      sharpe: 1.18,
      commissionAndSlippage: { amount: '1980.00', currency: 'USD' },
      tradeCount: 47,
      siblingSampleCount: 47,
      passPromotion: true,
      runAt: '2026-07-24T10:35:00Z',
    },
    {
      runId: 'bt-20260723-003',
      strategyId: 'weekly_core_trend',
      strategyName: '周线核心趋势',
      strategyVersion: 'v2.1.0',
      lifecycle: 'restricted_live',
      dataSnapshotId: 'snap-20260722-1200',
      startDate: '2023-01-02',
      endDate: '2026-06-30',
      status: 'PASS',
      cagr: 11.8,
      maxDrawdown: -8.2,
      excessVsSpy: 5.8,
      sharpe: 1.55,
      commissionAndSlippage: { amount: '580.00', currency: 'USD' },
      tradeCount: 32,
      siblingSampleCount: 32,
      passPromotion: false,
      runAt: '2026-07-23T12:00:00Z',
    },
    {
      runId: 'bt-20260722-004',
      strategyId: 'mean_reversion_vol',
      strategyName: '均值回归（波动率加权）',
      strategyVersion: 'v1.8.0',
      lifecycle: 'validation',
      dataSnapshotId: 'snap-20260720-1200',
      startDate: '2024-06-01',
      endDate: '2026-06-30',
      status: 'FAIL',
      cagr: 2.3,
      maxDrawdown: -19.5,
      excessVsSpy: -3.8,
      sharpe: 0.42,
      commissionAndSlippage: { amount: '1240.00', currency: 'USD' },
      tradeCount: 14,
      siblingSampleCount: 14,
      passPromotion: false,
      runAt: '2026-07-22T09:00:00Z',
    },
    {
      runId: 'bt-20260721-005',
      strategyId: 'daily_reentry_v1',
      strategyName: '清仓后再入场',
      strategyVersion: 'v1.5.0',
      lifecycle: 'shadow',
      dataSnapshotId: 'snap-20260721-1200',
      startDate: '2024-01-02',
      endDate: '2026-06-30',
      status: 'PASS',
      cagr: 10.1,
      maxDrawdown: -6.8,
      excessVsSpy: 4.1,
      sharpe: 1.35,
      commissionAndSlippage: { amount: '860.00', currency: 'USD' },
      tradeCount: 22,
      siblingSampleCount: 22,
      passPromotion: false,
      runAt: '2026-07-21T15:00:00Z',
    },
    {
      runId: 'bt-20260720-006',
      strategyId: 'earnings_breakout',
      strategyName: '财报前突破看涨',
      strategyVersion: 'v1.2.0',
      lifecycle: 'simulation',
      dataSnapshotId: 'snap-20260720-1200',
      startDate: '2024-01-02',
      endDate: '2025-12-31',
      status: 'OPEN_POSITION_ONLY',
      cagr: 25.1,
      maxDrawdown: -22.4,
      excessVsSpy: 19.0,
      sharpe: 0.95,
      commissionAndSlippage: { amount: '4500.00', currency: 'USD' },
      tradeCount: 15,
      siblingSampleCount: 15,
      passPromotion: false,
      runAt: '2026-07-20T11:00:00Z',
      missing: false,
    },
    {
      runId: 'bt-20260719-007',
      strategyId: 'sector_rotation_v1',
      strategyName: '板块轮动（相对强度）',
      strategyVersion: 'v0.8.0',
      lifecycle: 'research',
      dataSnapshotId: 'snap-20260719-1200',
      startDate: '2024-01-02',
      endDate: '2025-12-31',
      status: 'NO_SIGNALS',
      cagr: 0,
      maxDrawdown: 0,
      excessVsSpy: 0,
      sharpe: 0,
      commissionAndSlippage: { amount: '0', currency: 'USD' },
      tradeCount: 0,
      siblingSampleCount: 0,
      passPromotion: false,
      runAt: '2026-07-19T08:00:00Z',
      missing: false,
    },
    {
      runId: 'bt-20260718-008',
      strategyId: 'volatility_arb_v1',
      strategyName: '波动率套利（VIX 信号）',
      strategyVersion: 'v0.5.0',
      lifecycle: 'retired',
      dataSnapshotId: 'snap-20260701-1200',
      startDate: '2023-01-02',
      endDate: '2025-12-31',
      status: 'FAIL',
      cagr: -5.2,
      maxDrawdown: -35.1,
      excessVsSpy: -20.3,
      sharpe: -0.35,
      commissionAndSlippage: { amount: '7800.00', currency: 'USD' },
      tradeCount: 120,
      siblingSampleCount: 35,
      passPromotion: false,
      runAt: '2026-07-18T14:00:00Z',
    },
  ]
  return runs[id % runs.length]
}

export function makeBacktests(): BacktestRunSummary[] {
  return Array.from({ length: 8 }, (_, i) => makeBacktestRun(i))
}

/* ---------------- 回测详情 ---------------- */

export function makeBacktestDetail(runId: string): BacktestRunDetail {
  const run = makeBacktests().find((r) => r.runId === runId) ?? makeBacktestRun(0)

  const navDates = tradingDays(504, '2026-06-30')
  const navSeries: { date: string; nav: number; benchmark: number }[] = []
  let nav = 100, bm = 100
  for (const date of navDates) {
    const rp = (rand() - 0.48) * 0.025
    const rb = (rand() - 0.50) * 0.018
    nav *= (1 + rp)
    bm *= (1 + rb)
    navSeries.push({ date, nav: Number(nav.toFixed(2)), benchmark: Number(bm.toFixed(2)) })
  }

  const sampleTradeCount = Math.min(run.tradeCount, 8)
  const trades: BacktestTradeSample[] = Array.from({ length: sampleTradeCount }, (_, i) => ({
    tradeId: `trade-${runId}-${String(i + 1).padStart(2, '0')}`,
    symbol: ['NVDA', 'MSFT', 'AMZN', 'META', 'TSLA', 'GOOGL', 'AAPL', 'AMD'][i],
    entryDate: `202${4 + Math.floor(i / 4)}-0${(i % 12) + 1}-${String(10 + i).padStart(2, '0')}`,
    exitDate: i < 5 ? `202${4 + Math.floor(i / 4)}-0${(i % 12) + 6}-${String(5 + i).padStart(2, '0')}` : null,
    direction: 'long' as const,
    entryPrice: 100 + i * 15,
    exitPrice: i < 5 ? 100 + i * 15 + (rand() > 0.3 ? 10 + i * 3 : -5 - i) : null,
    pnl: { amount: String((rand() > 0.3 ? 500 + i * 200 : -(200 + i * 50)).toFixed(2)), currency: 'USD' },
    pnlPct: Number((rand() > 0.3 ? 5 + i * 2 : -(2 + i * 0.5)).toFixed(1)),
    holdingDays: i < 5 ? 30 + i * 10 : null,
    reason: i < 5 ? (rand() > 0.3 ? '目标止盈' : '止损退出') : '持仓中',
  }))

  const ledger: BacktestOrderLedgerItem[] = [
    { orderId: `ord-${runId}-01`, symbol: 'NVDA', direction: 'long', requestedQty: 50, filledQty: 50, status: 'FILLED', limitPrice: 115.0, avgFillPrice: 115.2, commission: { amount: '5.00', currency: 'USD' }, slippage: 0.002, reasonCode: null, occurredAt: '2024-03-15T14:35:00Z' },
    { orderId: `ord-${runId}-02`, symbol: 'MSFT', direction: 'long', requestedQty: 30, filledQty: 30, status: 'FILLED', limitPrice: 420.0, avgFillPrice: 420.1, commission: { amount: '5.00', currency: 'USD' }, slippage: 0.001, reasonCode: null, occurredAt: '2024-05-20T10:15:00Z' },
    { orderId: `ord-${runId}-03`, symbol: 'AMZN', direction: 'long', requestedQty: 40, filledQty: 25, status: 'PARTIALLY_FILLED', limitPrice: 185.0, avgFillPrice: 185.5, commission: { amount: '3.50', currency: 'USD' }, slippage: 0.003, reasonCode: null, occurredAt: '2024-07-10T11:30:00Z' },
    { orderId: `ord-${runId}-04`, symbol: 'TSLA', direction: 'long', requestedQty: 60, filledQty: 0, status: 'REJECTED', limitPrice: 250.0, avgFillPrice: null, commission: { amount: '0', currency: 'USD' }, slippage: 0, reasonCode: 'RISK_THEME_CONCENTRATION', occurredAt: '2025-01-14T09:35:00Z' },
    { orderId: `ord-${runId}-05`, symbol: 'AAPL', direction: 'long', requestedQty: 25, filledQty: 0, status: 'EXPIRED', limitPrice: 190.0, avgFillPrice: null, commission: { amount: '0', currency: 'USD' }, slippage: 0, reasonCode: null, occurredAt: '2025-09-05T16:30:00Z' },
  ]

  return {
    ...run,
    codeHash: 'a1b2c3d4e5f67890abcdef1234567890abcdef12',
    configHash: 'f1234abcd5678ef90123456789012345678901234',
    calmar: Number((run.cagr / Math.abs(run.maxDrawdown || 0.01)).toFixed(2)),
    turnover: 1.8,
    maxWinnerConcentration: 42.5,
    rejectedOrderCount: 1,
    delayedOrderCount: 2,
    unfilledOrderCount: 1,
    openPositionOnly: run.status === 'OPEN_POSITION_ONLY',
    noSignals: run.status === 'NO_SIGNALS',
    afterFee: true,
    benchmark: 'SPY',
    signalTimestamp: '2026-07-01T16:00:00Z',
    tradeTimestamp: '2026-07-02T09:35:00Z',
    dataTimestamp: '2026-07-02T04:00:00Z',
    navSeries,
    tradeSamples: trades,
    orderLedger: ledger,
  }
}

/* ---------------- 订单 ---------------- */

export function makeOrders(): {
  intents: OrderIntent[]
  brokerOrders: BrokerOrder[]
  fills: Fill[]
  reconciliationIssues: ReconciliationIssue[]
} {
  const intents: OrderIntent[] = [
    {
      intentId: 'int-20260724-001',
      idempotencyKey: 'idem-momentum-atr-nvda-20260723',
      tradePlanId: 'tp-20260724-001',
      riskDecision: 'PASS',
      symbol: 'NVDA',
      direction: 'long',
      requestedQty: 30,
      filledQty: 30,
      remainingQty: 0,
      limitPrice: { amount: '1120.00', currency: 'USD' },
      referencePrice: { amount: '1125.00', currency: 'USD' },
      status: 'FILLED',
      reasonCode: null,
      modificationCount: 0,
      createdAt: '2026-07-23T18:00:00Z',
      updatedAt: '2026-07-24T14:35:00Z',
    },
    {
      intentId: 'int-20260724-002',
      idempotencyKey: 'idem-mean-reversion-tsla-20260724',
      tradePlanId: 'tp-20260724-002',
      riskDecision: 'WARN',
      symbol: 'TSLA',
      direction: 'long',
      requestedQty: 50,
      filledQty: 0,
      remainingQty: 50,
      limitPrice: { amount: '350.00', currency: 'USD' },
      referencePrice: { amount: '348.00', currency: 'USD' },
      status: 'SUBMITTED',
      reasonCode: null,
      modificationCount: 1,
      createdAt: '2026-07-24T09:15:00Z',
      updatedAt: '2026-07-24T14:30:00Z',
    },
    {
      intentId: 'int-20260724-003',
      idempotencyKey: 'idem-daily-trend-amzn-20260724',
      tradePlanId: 'tp-20260724-003',
      riskDecision: 'PASS',
      symbol: 'AMZN',
      direction: 'long',
      requestedQty: 25,
      filledQty: 15,
      remainingQty: 10,
      limitPrice: { amount: '380.00', currency: 'USD' },
      referencePrice: { amount: '382.00', currency: 'USD' },
      status: 'PARTIALLY_FILLED',
      reasonCode: null,
      modificationCount: 0,
      createdAt: '2026-07-24T09:30:00Z',
      updatedAt: '2026-07-24T14:38:00Z',
    },
    {
      intentId: 'int-20260723-004',
      idempotencyKey: 'idem-daily-trend-msft-20260723',
      tradePlanId: 'tp-20260723-004',
      riskDecision: 'HARD_BLOCK',
      symbol: 'MSFT',
      direction: 'long',
      requestedQty: 20,
      filledQty: 0,
      remainingQty: 20,
      limitPrice: { amount: '480.00', currency: 'USD' },
      referencePrice: { amount: '482.00', currency: 'USD' },
      status: 'REJECTED',
      reasonCode: 'RISK_EXECUTION_WINDOW',
      modificationCount: 0,
      createdAt: '2026-07-23T09:32:00Z',
      updatedAt: '2026-07-23T09:32:00Z',
    },
    {
      intentId: 'int-20260722-005',
      idempotencyKey: 'idem-momentum-atr-meta-20260722',
      tradePlanId: 'tp-20260722-005',
      riskDecision: 'PASS',
      symbol: 'META',
      direction: 'long',
      requestedQty: 10,
      filledQty: 0,
      remainingQty: 10,
      limitPrice: { amount: '520.00', currency: 'USD' },
      referencePrice: { amount: '518.00', currency: 'USD' },
      status: 'RECONCILIATION_REQUIRED',
      reasonCode: 'RECONCILIATION_MISMATCH',
      modificationCount: 0,
      createdAt: '2026-07-22T10:00:00Z',
      updatedAt: '2026-07-23T08:00:00Z',
    },
    {
      intentId: 'int-20260721-006',
      idempotencyKey: 'idem-earnings-amd-20260721',
      tradePlanId: 'tp-20260721-006',
      riskDecision: 'PASS',
      symbol: 'AMD',
      direction: 'long',
      requestedQty: 40,
      filledQty: 0,
      remainingQty: 40,
      limitPrice: { amount: '175.00', currency: 'USD' },
      referencePrice: { amount: '173.50', currency: 'USD' },
      status: 'CANCELLED',
      reasonCode: null,
      modificationCount: 0,
      createdAt: '2026-07-21T09:45:00Z',
      updatedAt: '2026-07-21T16:00:00Z',
    },
    {
      intentId: 'int-20260720-007',
      idempotencyKey: 'idem-weekly-core-spy-20260720',
      tradePlanId: 'tp-20260720-007',
      riskDecision: 'PASS',
      symbol: 'QQQ',
      direction: 'long',
      requestedQty: 15,
      filledQty: 0,
      remainingQty: 15,
      limitPrice: { amount: '520.00', currency: 'USD' },
      referencePrice: { amount: '521.00', currency: 'USD' },
      status: 'EXPIRED',
      reasonCode: 'EXPIRED_DAY_ORDER',
      modificationCount: 0,
      createdAt: '2026-07-20T10:30:00Z',
      updatedAt: '2026-07-20T21:00:00Z',
    },
    {
      intentId: 'int-20260719-008',
      idempotencyKey: 'idem-daily-trend-aapl-20260719',
      tradePlanId: 'tp-20260719-008',
      riskDecision: 'PASS',
      symbol: 'AAPL',
      direction: 'long',
      requestedQty: 35,
      filledQty: 0,
      remainingQty: 35,
      limitPrice: { amount: '230.00', currency: 'USD' },
      referencePrice: { amount: '232.00', currency: 'USD' },
      status: 'AWAITING_APPROVAL',
      reasonCode: null,
      modificationCount: 0,
      createdAt: '2026-07-19T18:00:00Z',
      updatedAt: '2026-07-19T18:00:00Z',
    },
  ]

  const brokerOrders: BrokerOrder[] = [
    { brokerOrderId: 'lb-ord-001', intentId: 'int-20260724-001', requestedQty: 30, filledQty: 30, remainingQty: 0, avgFillPrice: { amount: '1120.50', currency: 'USD' }, commission: { amount: '5.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'FILLED', submittedAt: '2026-07-24T14:30:00Z', latestUpdateAt: '2026-07-24T14:35:00Z', delayDescription: null, rejectionReason: null },
    { brokerOrderId: 'lb-ord-002', intentId: 'int-20260724-002', requestedQty: 50, filledQty: 0, remainingQty: 50, avgFillPrice: null, commission: { amount: '0.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'SUBMITTED', submittedAt: '2026-07-24T14:29:00Z', latestUpdateAt: '2026-07-24T14:30:00Z', delayDescription: '延迟 65s', rejectionReason: null },
    { brokerOrderId: 'lb-ord-003', intentId: 'int-20260724-003', requestedQty: 25, filledQty: 15, remainingQty: 10, avgFillPrice: { amount: '380.20', currency: 'USD' }, commission: { amount: '3.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'PARTIALLY_FILLED', submittedAt: '2026-07-24T14:34:00Z', latestUpdateAt: '2026-07-24T14:38:00Z', delayDescription: null, rejectionReason: null },
    { brokerOrderId: null, intentId: 'int-20260723-004', requestedQty: 20, filledQty: 0, remainingQty: 20, avgFillPrice: null, commission: { amount: '0.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'REJECTED', submittedAt: null, latestUpdateAt: null, delayDescription: null, rejectionReason: '执行时段违规：开盘后 30 分钟内，触发硬阻断' },
    { brokerOrderId: 'lb-ord-005', intentId: 'int-20260722-005', requestedQty: 10, filledQty: 0, remainingQty: 10, avgFillPrice: null, commission: { amount: '0.00', currency: 'USD' }, reconciliationStatus: 'FAILED', status: 'RECONCILIATION_REQUIRED', submittedAt: '2026-07-22T10:05:00Z', latestUpdateAt: '2026-07-23T08:00:00Z', delayDescription: null, rejectionReason: null },
    { brokerOrderId: 'lb-ord-006', intentId: 'int-20260721-006', requestedQty: 40, filledQty: 0, remainingQty: 40, avgFillPrice: null, commission: { amount: '0.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'CANCELLED', submittedAt: '2026-07-21T09:50:00Z', latestUpdateAt: '2026-07-21T16:00:00Z', delayDescription: null, rejectionReason: null },
    { brokerOrderId: 'lb-ord-007', intentId: 'int-20260720-007', requestedQty: 15, filledQty: 0, remainingQty: 15, avgFillPrice: null, commission: { amount: '0.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'EXPIRED', submittedAt: '2026-07-20T10:35:00Z', latestUpdateAt: '2026-07-20T21:00:00Z', delayDescription: null, rejectionReason: null },
    { brokerOrderId: null, intentId: 'int-20260719-008', requestedQty: 35, filledQty: 0, remainingQty: 35, avgFillPrice: null, commission: { amount: '0.00', currency: 'USD' }, reconciliationStatus: 'OK', status: 'AWAITING_APPROVAL', submittedAt: null, latestUpdateAt: null, delayDescription: null, rejectionReason: null },
  ]

  const fills: Fill[] = [
    { fillId: 'fill-001', brokerOrderId: 'lb-ord-001', filledQty: 30, avgFillPrice: { amount: '1120.50', currency: 'USD' }, commission: { amount: '5.00', currency: 'USD' }, occurredAt: '2026-07-24T14:35:00Z', createdAt: '2026-07-24T14:35:00Z', status: 'CONFIRMED' },
    { fillId: 'fill-002', brokerOrderId: 'lb-ord-003', filledQty: 15, avgFillPrice: { amount: '380.20', currency: 'USD' }, commission: { amount: '3.00', currency: 'USD' }, occurredAt: '2026-07-24T14:38:00Z', createdAt: '2026-07-24T14:38:00Z', status: 'CONFIRMED' },
    { fillId: null, brokerOrderId: 'lb-ord-005', filledQty: 10, avgFillPrice: { amount: '518.50', currency: 'USD' }, commission: { amount: '2.00', currency: 'USD' }, occurredAt: null, createdAt: null, status: 'MISSING' },
  ]

  const reconciliationIssues: ReconciliationIssue[] = [
    {
      intentId: 'int-20260722-005',
      description: '券商成交与内部账本不一致',
      severity: 'BLOCK',
      detail: 'META 成交 10 股，券商确认成交但内部账本未同步；差价 $15.00 待确认',
      createdAt: '2026-07-23T08:00:00Z',
    },
  ]

  return { intents, brokerOrders, fills, reconciliationIssues }
}

/* ---------------- 信封包装 ---------------- */

export function envelope<T>(data: T, source: 'mock' | 'live' = 'mock', dataStatus: DataStatus = 'HEALTHY', asOf = '2026-07-24T20:00:00Z'): { asOf: string; availableAt: string; source: typeof source; dataStatus: DataStatus; requestId: string; data: T } {
  return {
    asOf,
    availableAt: `${asOf.slice(0, -1)}5Z`,
    source,
    dataStatus,
    requestId: `mock-${Date.now().toString(36)}`,
    data,
  }
}
