/* ============================================================
   Mock 客户端 — Milestone 2
   覆盖全部 7 个只读端点 + overview 原有 9 种审查状态
   所有���应带 source: "mock"，页面必须展示「演示数据」
   ============================================================ */
import type {
  ApiEnvelope,
  OverviewData,
  OverviewScenario,
  SystemHealth,
  AccountSnapshot,
  PortfolioRiskSummary,
  StrategySummary,
  StrategyFilter,
  BacktestRunSummary,
  BacktestFilter,
  BacktestRunDetail,
  OrderIntent,
  BrokerOrder,
  Fill,
  ReconciliationIssue,
  OrderFilter,
  Instrument,
  CandleSeriesResponse,
} from '../schemas'
import { buildScenario } from './scenarios'
import {
  envelope,
  makeSystemHealth,
  makeAccountSnapshot,
  makePortfolioRisk,
  makeStrategies,
  makeBacktests,
  makeBacktestDetail,
  makeOrders,
} from './fixtures'
import { generateCandles, PRESET_SYMBOLS, getDynamicBasePrice } from './fixtures-candles'
import { DEV_MARKET_CLOCK } from '@/shared/config/market-clock'
import { SYMBOL_REGISTRY } from '@/shared/config/symbols'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ---------------- 总览（M1 兼容，6 种审查状态） ---------------- */
export async function fetchOverviewMock(scenario?: OverviewScenario): Promise<ApiEnvelope<OverviewData>> {
  const sc = scenario ?? 'healthy'
  if (sc === 'api_error') throw new Error('Mock API 错误：无法获取总览数据')
  if (sc === 'api_loading') return new Promise(() => {}) // 永不 resolve
  await delay(250)
  return buildScenario(sc)
}

/* ---------------- 系统健康 ---------------- */
export async function fetchSystemHealthMock(): Promise<ApiEnvelope<SystemHealth>> {
  await delay(120)
  return envelope(makeSystemHealth())
}

/* ---------------- 账户快照 ---------------- */
export async function fetchAccountSnapshotMock(): Promise<ApiEnvelope<AccountSnapshot>> {
  await delay(120)
  return envelope(makeAccountSnapshot())
}

/* ---------------- 组合风险 ---------------- */
export async function fetchPortfolioRiskMock(): Promise<ApiEnvelope<PortfolioRiskSummary>> {
  await delay(200)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取组合风险数据')
  if (sc === 'delayed') await delay(2000)

  if (sc === 'empty') {
    return envelope({
      nav: { amount: '0', currency: 'USD' },
      cash: { amount: '0', currency: 'USD' },
      updatedAt: '2026-07-24T20:00:00Z',
      riskBudget: { used: { amount: '0', currency: 'USD' }, remaining: { amount: '0', currency: 'USD' }, usedPctOfNav: 0, remainingPctOfNav: 0, policyLimitPctOfNav: 12, missing: true },
      exposure: { grossExposure: 0, netExposure: 0, longExposure: 0, shortExposure: 0, cashPctOfNav: 100, missing: true },
      concentrations: [],
      themes: [],
      sleeves: [
        { key: 'core', label: '核心仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [50, 65], marketValuePctMissing: true, riskBudgetPctMissing: true },
        { key: 'active', label: '主动仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [15, 30], marketValuePctMissing: true, riskBudgetPctMissing: true },
        { key: 'cash', label: '现金', marketValuePct: 100, riskBudgetPct: 0, targetRange: [10, 25] },
        { key: 'special', label: '特殊产品仓', marketValuePct: 0, riskBudgetPct: 0, targetRange: [0, 0], disabled: true },
      ],
      currentDrawdown: 0,
      peakDrawdown: 0,
      dataQuality: { completenessPct: 0, timelinessPct: 0, reconciliation: 'OK' as const, anomalyCount: 0, healthPct: 0 },
      hardBlock: false,
      hardBlockReasons: [],
    })
  }

  if (sc === 'hard-block') {
    const data = makePortfolioRisk(false)
    data.hardBlock = true
    data.hardBlockReasons = ['场景模拟：硬阻断已激活']
    data.dataQuality.reconciliation = 'OK'
    return envelope(data)
  }

  if (sc === 'reconciliation-failed') {
    const data = makePortfolioRisk(true)
    data.dataQuality.reconciliation = 'FAILED'
    data.hardBlock = true
    data.hardBlockReasons = ['对账失败：券商与账户对账不一致，风险数据暂停计算']
    return envelope(data)
  }

  if (sc === 'schema-invalid') {
    // Return data missing required fields
    return envelope({
      nav: { amount: '301245.67', currency: 'USD' },
      cash: { amount: '48200.00', currency: 'USD' },
      updatedAt: '2026-07-24T20:00:00Z',
      riskBudget: undefined as unknown as PortfolioRiskSummary['riskBudget'],
      exposure: undefined as unknown as PortfolioRiskSummary['exposure'],
      concentrations: undefined as unknown as PortfolioRiskSummary['concentrations'],
      themes: undefined as unknown as PortfolioRiskSummary['themes'],
      sleeves: undefined as unknown as PortfolioRiskSummary['sleeves'],
      currentDrawdown: -1.2,
      peakDrawdown: -8.5,
      dataQuality: { completenessPct: 0, timelinessPct: 0, reconciliation: 'OK' as const, anomalyCount: 0, healthPct: 0 },
      hardBlock: false,
      hardBlockReasons: [],
    } as unknown as PortfolioRiskSummary)
  }

  return envelope(makePortfolioRisk(true))
}

/* ---------------- 策略列表 ---------------- */
export async function fetchStrategiesMock(filter: StrategyFilter): Promise<ApiEnvelope<{
  items: StrategySummary[]
  total: number
  limit: number
  offset: number
}>> {
  await delay(150)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取策略列表')
  if (sc === 'delayed') await delay(2000)

  let items = makeStrategies()

  if (sc === 'empty') {
    items = []
  } else if (sc === 'partial-missing') {
    // Keep only first 3 items
    items = items.slice(0, 3)
  } else if (sc === 'schema-invalid') {
    // Return items with missing name field to trigger schema error
    const corrupted = items.slice(0, 5).map((s, i) => {
      const copy: Record<string, unknown> = { ...s }
      if (i === 2) (copy as Record<string, unknown>).name = undefined
      return copy as unknown as StrategySummary
    })
    items = corrupted
  }

  // 筛选
  if (filter.lifecycle?.length) {
    items = items.filter((s) => filter.lifecycle!.includes(s.lifecycle))
  }
  if (filter.market?.length) {
    items = items.filter((s) => filter.market!.includes(s.market))
  }
  if (filter.frequency?.length) {
    items = items.filter((s) => filter.frequency!.includes(s.frequency))
  }
  if (filter.search) {
    const kw = filter.search.toLowerCase()
    items = items.filter((s) => s.name.toLowerCase().includes(kw) || s.strategyId.toLowerCase().includes(kw))
  }

  // 排序
  const sortBy = filter.sortBy ?? 'name'
  const sortDir = filter.sortDir ?? 'asc'
  items.sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'updatedAt') cmp = a.updatedAt.localeCompare(b.updatedAt)
    else if (sortBy === 'sampleCount') cmp = a.sampleCount - b.sampleCount
    else if (sortBy === 'lifecycle') cmp = a.lifecycle.localeCompare(b.lifecycle)
    return sortDir === 'desc' ? -cmp : cmp
  })

  const total = items.length
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0
  items = items.slice(offset, offset + limit)

  return envelope({ items, total, limit, offset })
}

/* ---------------- 回测列表 ---------------- */
export async function fetchBacktestsMock(filter: BacktestFilter): Promise<ApiEnvelope<{
  items: BacktestRunSummary[]
  total: number
  limit: number
  offset: number
}>> {
  await delay(150)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取回测列表')
  if (sc === 'delayed') await delay(2000)

  let items = makeBacktests()

  if (sc === 'empty') {
    items = []
  } else if (sc === 'no-signals') {
    // Modify all backtests to show NO_SIGNALS status
    items = items.map((r) => ({ ...r, status: 'NO_SIGNALS' as const }))
  } else if (sc === 'open-position-only') {
    // Modify all backtests to show OPEN_POSITION_ONLY status
    items = items.map((r) => ({ ...r, status: 'OPEN_POSITION_ONLY' as const, missing: false }))
  } else if (sc === 'partial-missing') {
    // Keep only first 3 items
    items = items.slice(0, 3)
  } else if (sc === 'schema-invalid') {
    // Corrupt item data to trigger schema validation error
    const corrupted = items.map((r, i) => {
      const copy: Record<string, unknown> = { ...r }
      if (i === 2) (copy as Record<string, unknown>).runId = undefined
      return copy as unknown as BacktestRunSummary
    })
    items = corrupted
  }

  if (filter.strategyId) {
    items = items.filter((r) => r.strategyId === filter.strategyId)
  }
  if (filter.strategyVersion) {
    items = items.filter((r) => r.strategyVersion === filter.strategyVersion)
  }
  if (filter.lifecycle?.length) {
    items = items.filter((r) => filter.lifecycle!.includes(r.lifecycle))
  }
  if (filter.status?.length) {
    items = items.filter((r) => filter.status!.includes(r.status))
  }
  if (filter.fromDate) {
    items = items.filter((r) => r.startDate >= filter.fromDate!)
  }
  if (filter.toDate) {
    items = items.filter((r) => r.endDate <= filter.toDate!)
  }
  if (filter.dataSnapshotId) {
    items = items.filter((r) => r.dataSnapshotId === filter.dataSnapshotId)
  }
  if (filter.passPromotion !== undefined) {
    items = items.filter((r) => r.passPromotion === filter.passPromotion)
  }

  const sortBy = filter.sortBy ?? 'runAt'
  const sortDir = filter.sortDir ?? 'desc'
  items.sort((a, b) => {
    const cmp = sortBy === 'runAt' ? a.runAt.localeCompare(b.runAt)
      : sortBy === 'cagr' ? a.cagr - b.cagr
        : sortBy === 'maxDrawdown' ? a.maxDrawdown - b.maxDrawdown
          : sortBy === 'excessVsSpy' ? a.excessVsSpy - b.excessVsSpy
            : a.sharpe - b.sharpe
    return sortDir === 'desc' ? -cmp : cmp
  })

  const total = items.length
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0
  items = items.slice(offset, offset + limit)

  return envelope({ items, total, limit, offset })
}

/* ---------------- 回测详情 ---------------- */

const KNOWN_RUN_IDS = [
  'bt-20260724-001', 'bt-20260724-002', 'bt-20260723-003',
  'bt-20260722-004', 'bt-20260721-005', 'bt-20260720-006',
  'bt-20260719-007', 'bt-20260718-008',
]

export async function fetchBacktestDetailMock(runId: string): Promise<ApiEnvelope<BacktestRunDetail>> {
  await delay(200)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  // Task B: Unknown runId → throw 'Not Found'
  if (!KNOWN_RUN_IDS.includes(runId)) {
    throw new Error('Not Found')
  }

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取回测详情')
  if (sc === 'delayed') await delay(2000)

  const detail = makeBacktestDetail(runId)

  if (sc === 'no-signals') {
    detail.status = 'NO_SIGNALS'
    detail.noSignals = true
    detail.cagr = 0
    detail.sharpe = 0
    detail.maxDrawdown = 0
  } else if (sc === 'open-position-only') {
    detail.status = 'OPEN_POSITION_ONLY'
    detail.openPositionOnly = true
  } else if (sc === 'schema-invalid') {
    // Corrupt the detail data to trigger schema error
    const corrupted = detail as Record<string, unknown>
    corrupted.runId = undefined
    return envelope(corrupted as unknown as BacktestRunDetail)
  }

  return envelope(detail)
}

/* ---------------- 订单 ---------------- */
export async function fetchOrdersMock(filter: OrderFilter): Promise<ApiEnvelope<{
  intents: OrderIntent[]
  brokerOrders: BrokerOrder[]
  fills: Fill[]
  reconciliationIssues: ReconciliationIssue[]
  total: number
  limit: number
  offset: number
}>> {
  await delay(200)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取订单数据')
  if (sc === 'delayed') await delay(2000)

  const { intents: allIntents, brokerOrders: allBroker, fills: allFills, reconciliationIssues: allRecon } = makeOrders()

  let intents = allIntents
  let brokerOrders = allBroker
  let fills = allFills

  if (sc === 'empty') {
    intents = []
    brokerOrders = []
    fills = []
  } else if (sc === 'partial-fill') {
    // Set all orders to PARTIALLY_FILLED
    intents = intents.map((i) => ({
      ...i,
      status: 'PARTIALLY_FILLED' as const,
      filledQty: Math.max(1, Math.floor(i.requestedQty * 0.5)),
      remainingQty: i.requestedQty - Math.max(1, Math.floor(i.requestedQty * 0.5)),
    }))
    brokerOrders = brokerOrders.map((bo) => ({
      ...bo,
      status: 'PARTIALLY_FILLED' as const,
      filledQty: Math.max(1, Math.floor(bo.requestedQty * 0.5)),
      remainingQty: bo.requestedQty - Math.max(1, Math.floor(bo.requestedQty * 0.5)),
    }))
  } else if (sc === 'rejected') {
    // Set all orders to REJECTED
    intents = intents.map((i) => ({
      ...i,
      status: 'REJECTED' as const,
      reasonCode: '场景模拟：订单已拒绝',
      filledQty: 0,
      remainingQty: i.requestedQty,
    }))
    brokerOrders = brokerOrders.map((bo) => ({
      ...bo,
      status: 'REJECTED' as const,
      rejectionReason: '场景模拟：订单已拒绝',
      filledQty: 0,
      remainingQty: bo.requestedQty,
    }))
  } else if (sc === 'reconciliation-required') {
    // Set all orders to RECONCILIATION_REQUIRED
    intents = intents.map((i) => ({
      ...i,
      status: 'RECONCILIATION_REQUIRED' as const,
      reasonCode: 'RECONCILIATION_MISMATCH',
      filledQty: 0,
      remainingQty: i.requestedQty,
    }))
    brokerOrders = brokerOrders.map((bo) => ({
      ...bo,
      status: 'RECONCILIATION_REQUIRED' as const,
      reconciliationStatus: 'FAILED' as const,
      filledQty: 0,
      remainingQty: bo.requestedQty,
    }))
  } else if (sc === 'partial-missing') {
    // Only return first 3 intents
    intents = intents.slice(0, 3)
  } else if (sc === 'schema-invalid') {
    // Corrupt intent data to trigger schema error
    const corrupted = intents.map((i, idx) => {
      const copy: Record<string, unknown> = { ...i }
      if (idx === 2) (copy as Record<string, unknown>).intentId = undefined
      return copy as unknown as OrderIntent
    })
    intents = corrupted
  }

  if (filter.status?.length) {
    intents = intents.filter((i) => filter.status!.includes(i.status))
  }
  if (filter.symbol) {
    intents = intents.filter((i) => i.symbol === filter.symbol)
  }
  if (filter.strategyId) {
    intents = intents.filter((i) => i.tradePlanId.includes(filter.strategyId!))
  }

  const sortBy = filter.sortBy ?? 'updatedAt'
  const sortDir = filter.sortDir ?? 'desc'
  intents.sort((a, b) => {
    const cmp = sortBy === 'createdAt' ? a.createdAt.localeCompare(b.createdAt)
      : sortBy === 'symbol' ? a.symbol.localeCompare(b.symbol)
        : a.updatedAt.localeCompare(b.updatedAt)
    return sortDir === 'desc' ? -cmp : cmp
  })

  const total = intents.length
  const limit = filter.limit ?? 50
  const offset = filter.offset ?? 0
  const pageIntents = intents.slice(offset, offset + limit)

  // Filter related broker orders and fills for the paged intents
  const intentIds = new Set(pageIntents.map((i) => i.intentId))
  const pagedBrokerOrders = brokerOrders.filter((bo) => intentIds.has(bo.intentId))
  const brokerOrderIds = new Set(pagedBrokerOrders.map((bo) => bo.brokerOrderId).filter(Boolean) as string[])
  const pagedFills = fills.filter((f) => brokerOrderIds.has(f.brokerOrderId))

  return envelope({ intents: pageIntents, brokerOrders: pagedBrokerOrders, fills: pagedFills, reconciliationIssues: allRecon, total, limit, offset })
}

/* ---------------- 品种列表 ---------------- */

function buildInstruments(): Instrument[] {
  return Object.values(SYMBOL_REGISTRY).map((info) => ({
    canonicalSymbol: info.canonical,
    displayName: info.display,
    assetClass: info.assetClass,
    currency: info.currency,
    timezone: info.tz,
    minTimeframe: '1D' as const,
    availableTimeframes: ['1m', '5m', '15m', '1h', '4h', '1D', '1W'] as const,
    tradingHours: info.canonical.startsWith('CRYPTO:') ? '24/7' : '9:30-16:00 EST',
    dataAvailable: true,
    source: 'mock' as const,
  }))
}

export async function fetchInstrumentsMock(query?: string): Promise<ApiEnvelope<{ items: Instrument[] }>> {
  await delay(150)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取品种列表')
  if (sc === 'delayed') await delay(2000)

  let items = buildInstruments()

  if (sc === 'empty') {
    items = []
  }

  if (query) {
    const q = query.toLowerCase()
    items = items.filter((i) =>
      i.canonicalSymbol.toLowerCase().includes(q) ||
      i.displayName.toLowerCase().includes(q),
    )

    // 为已知美股代码或 US: 前缀生成即时品种
    let synthCanonical: string | undefined
    let synthDisplay: string | undefined

    if (q.startsWith('us:')) {
      const ticker = q.slice(3).toUpperCase()
      if (ticker && ticker !== 'BTC-USD') {
        synthCanonical = `US:${ticker}`
        synthDisplay = `US:${ticker}`
      }
    } else {
      const known: Record<string, string> = {
        tsla: 'Tesla Inc.',
        meta: 'Meta Platforms Inc.',
        amzn: 'Amazon.com Inc.',
      }
      synthDisplay = known[q]
      if (synthDisplay) {
        synthCanonical = `US:${q.toUpperCase()}`
      }
    }

    if (synthCanonical && !items.some((i) => i.canonicalSymbol === synthCanonical)) {
      items = [...items, {
        canonicalSymbol: synthCanonical,
        displayName: synthDisplay!,
        assetClass: 'US_EQUITY' as const,
        currency: 'USD' as const,
        timezone: 'America/New_York',
        minTimeframe: '1D' as const,
        availableTimeframes: ['1m', '5m', '15m', '1h', '4h', '1D', '1W'] as const,
        tradingHours: '9:30-16:00 EST',
        dataAvailable: true,
        source: 'mock' as const,
      }]
    }
  }

  return envelope({ items })
}

/* ---------------- K 线系列 ---------------- */

export async function fetchCandlesMock(
  symbol: string,
  timeframe: string = '1D',
  from?: string,
  to?: string,
  limit: number = 200,
): Promise<ApiEnvelope<CandleSeriesResponse>> {
  await delay(200)
  const { useScenarioStore } = await import('@/shared/state/scenario')
  const sc = useScenarioStore().m2

  if (sc === 'api-error') throw new Error('Mock API 错误：无法获取 K 线数据')
  if (sc === 'delayed') await delay(2000)

  let info = SYMBOL_REGISTRY[symbol]
  // 动态品种（搜索后加载）：不在 registry 中但可通过 US: 前缀识别
  if (!info && symbol.startsWith('US:')) {
    info = {
      canonical: symbol,
      display: symbol,
      assetClass: 'US_EQUITY' as const,
      currency: 'USD' as const,
      tz: 'America/New_York',
    }
  }
  if (!info) throw new Error(`Mock API 错误：未知品种 ${symbol}`)

  let basePrice = PRESET_SYMBOLS[symbol]?.basePrice
  if (basePrice === undefined) {
    basePrice = getDynamicBasePrice(symbol) ?? 100
  }

  const endIso = DEV_MARKET_CLOCK.endIso

  if (sc === 'empty') {
    return envelope({
      symbol, timeframe: timeframe as CandleSeriesResponse['timeframe'],
      from: '2026-01-01T00:00:00Z', to: endIso,
      candles: [], timezone: info.tz, source: 'mock',
      dataStatus: 'HEALTHY', availableAt: endIso,
    })
  }

  const candles = generateCandles(symbol, timeframe, limit, basePrice, from, to)

  if (sc === 'schema-invalid') {
    candles[0] = { ...candles[0], high: 1, low: 999 }
  }

  const fromIso = candles.length > 0 ? candles[0].timestamp : '2026-01-01T00:00:00Z'
  const toIso = candles.length > 0 ? candles[candles.length - 1].timestamp : endIso

  if (sc === 'missing-data') {
    const gapped = candles.filter((_, i) => (i + 1) % 20 !== 0)
    return envelope({
      symbol, timeframe: timeframe as CandleSeriesResponse['timeframe'],
      from: gapped.length > 0 ? gapped[0].timestamp : fromIso,
      to: gapped.length > 0 ? gapped[gapped.length - 1].timestamp : toIso,
      candles: gapped, timezone: info.tz, source: 'mock',
      dataStatus: 'DEGRADED', availableAt: endIso,
    })
  }

  return envelope({
    symbol, timeframe: timeframe as CandleSeriesResponse['timeframe'],
    from: fromIso, to: toIso,
    candles, timezone: info.tz, source: 'mock',
    dataStatus: 'HEALTHY', availableAt: endIso,
  })
}
