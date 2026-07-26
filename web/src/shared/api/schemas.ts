/* ============================================================
   Zod 数据契约 — Milestone 2
   所有 HTTP 和 Mock 响应须经此处校验（§4.1）。
   types.ts 从本文件推导类型，保持单一数据真值。
   ============================================================ */
import { z } from 'zod'

/* ---------------- 通用信封 ---------------- */
export const CurrencySchema = z.enum(['USD', 'CNY', 'HKD'])
export type Currency = z.infer<typeof CurrencySchema>

export const DataSourceSchema = z.enum(['mock', 'live'])
export type DataSource = z.infer<typeof DataSourceSchema>

export const DataStatusSchema = z.enum(['HEALTHY', 'DEGRADED', 'STALE', 'BLOCKED', 'ERROR'])
export type DataStatus = z.infer<typeof DataStatusSchema>

export const MoneySchema = z.object({
  amount: z.string(),
  currency: CurrencySchema,
})
export type Money = z.infer<typeof MoneySchema>

export function apiEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    asOf: z.string(),
    availableAt: z.string(),
    source: DataSourceSchema,
    dataStatus: DataStatusSchema,
    requestId: z.string(),
    data: dataSchema,
  })
}
export type ApiEnvelope<T> = z.infer<ReturnType<typeof apiEnvelopeSchema<z.ZodType<T>>>>

/* ---------------- 分页 ---------------- */
export const PaginationParamsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
export type PaginationParams = z.infer<typeof PaginationParamsSchema>

export function paginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number().int().min(0),
    limit: z.number().int().min(1),
    offset: z.number().int().min(0),
  })
}

/* ---------------- 枚举 ---------------- */
export const SystemStatusSchema = z.enum([
  'HEALTHY', 'DEGRADED', 'DATA_BLOCKED',
  'RISK_BLOCKED', 'BROKER_RECONCILIATION_FAILED', 'ACCOUNTING_BLOCKED',
])
export type SystemStatus = z.infer<typeof SystemStatusSchema>

export const MarketSessionSchema = z.enum(['PRE', 'REGULAR', 'AFTER', 'CLOSED'])
export type MarketSession = z.infer<typeof MarketSessionSchema>

export const RuntimeEnvSchema = z.enum(['research', 'simulation', 'shadow', 'live'])
export type RuntimeEnv = z.infer<typeof RuntimeEnvSchema>

export const WarningStatusSchema = z.enum(['PASS', 'WARN', 'HARD_BLOCK'])
export type WarningStatus = z.infer<typeof WarningStatusSchema>

export const LifecycleStageSchema = z.enum([
  'research', 'validation', 'simulation', 'shadow',
  'restricted_live', 'live', 'retired',
])
export type LifecycleStage = z.infer<typeof LifecycleStageSchema>

export const OrderStatusSchema = z.enum([
  'PROPOSED', 'AWAITING_APPROVAL', 'APPROVED', 'SUBMITTED',
  'PARTIALLY_FILLED', 'FILLED', 'CANCELLED', 'EXPIRED',
  'REJECTED', 'RECONCILIATION_REQUIRED',
])
export type OrderStatus = z.infer<typeof OrderStatusSchema>

export const ReconciliationStatusSchema = z.enum(['OK', 'FAILED', 'PENDING'])
export type ReconciliationStatus = z.infer<typeof ReconciliationStatusSchema>

export const PositionTypeSchema = z.enum(['core', 'active', 'special'])
export type PositionType = z.infer<typeof PositionTypeSchema>

export const EntryTypeSchema = z.enum(['first', 'reentry'])
export type EntryType = z.infer<typeof EntryTypeSchema>

export const SignalDirectionSchema = z.enum(['long', 'short'])
export type SignalDirection = z.infer<typeof SignalDirectionSchema>

export const PlanStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED', 'EXPIRED'])
export type PlanStatus = z.infer<typeof PlanStatusSchema>

export const SleeveKeySchema = z.enum(['core', 'active', 'cash', 'special'])
export type SleeveKey = z.infer<typeof SleeveKeySchema>

export const BacktestStatusSchema = z.enum(['PASS', 'FAIL', 'RUNNING', 'NO_SIGNALS', 'OPEN_POSITION_ONLY'])
export type BacktestStatus = z.infer<typeof BacktestStatusSchema>

export const StrategyMarketSchema = z.enum(['US', 'BTC'])
export type StrategyMarket = z.infer<typeof StrategyMarketSchema>

export const AssetClassSchema = z.enum(['US_EQUITY', 'US_ETF', 'US_INDEX', 'CRYPTO_BTC'])
export type AssetClass = z.infer<typeof AssetClassSchema>

export const StrategyFrequencySchema = z.enum(['daily', 'weekly', 'monthly'])
export type StrategyFrequency = z.infer<typeof StrategyFrequencySchema>

/* ---------------- 系统健康 ---------------- */
export const SystemIssueSchema = z.object({
  code: SystemStatusSchema,
  label: z.string(),
  detail: z.string(),
})
export type SystemIssue = z.infer<typeof SystemIssueSchema>

export const SystemHealthSchema = z.object({
  status: SystemStatusSchema,
  marketDate: z.string(),
  marketTimezone: z.string(),
  usMarketSession: MarketSessionSchema,
  dataDelaySeconds: z.number(),
  hardBlocks: z.number().int().min(0),
  issues: z.array(SystemIssueSchema),
  env: RuntimeEnvSchema,
})
export type SystemHealth = z.infer<typeof SystemHealthSchema>

/* ---------------- 账户快照 ---------------- */
export const AccountSnapshotSchema = z.object({
  nav: MoneySchema,
  dayChange: MoneySchema,
  dayChangePct: z.number(),
  updatedAt: z.string(),
})
export type AccountSnapshot = z.infer<typeof AccountSnapshotSchema>

/* ---------------- 风险管理 ---------------- */
export const RiskBudgetSchema = z.object({
  used: MoneySchema,
  remaining: MoneySchema,
  usedPctOfNav: z.number(),
  remainingPctOfNav: z.number(),
  policyLimitPctOfNav: z.number(),
  missing: z.boolean().optional(),
})
export type RiskBudget = z.infer<typeof RiskBudgetSchema>

export const RiskSleeveSchema = z.object({
  key: SleeveKeySchema,
  label: z.string(),
  marketValuePct: z.number(),
  riskBudgetPct: z.number(),
  targetRange: z.tuple([z.number(), z.number()]),
  marketValuePctMissing: z.boolean().optional(),
  riskBudgetPctMissing: z.boolean().optional(),
  disabled: z.boolean().optional(),
})
export type RiskSleeve = z.infer<typeof RiskSleeveSchema>

export const ExposureSummarySchema = z.object({
  grossExposure: z.number(),
  netExposure: z.number(),
  longExposure: z.number(),
  shortExposure: z.number(),
  cashPctOfNav: z.number(),
  missing: z.boolean().optional(),
})
export type ExposureSummary = z.infer<typeof ExposureSummarySchema>

export const ConcentrationRiskSchema = z.object({
  symbol: z.string(),
  description: z.string(),
  marketValuePct: z.number(),
  riskBudgetPct: z.number(),
  sleeve: SleeveKeySchema,
  status: WarningStatusSchema,
  missing: z.boolean().optional(),
})
export type ConcentrationRisk = z.infer<typeof ConcentrationRiskSchema>

export const ThemeRiskSchema = z.object({
  theme: z.string(),
  description: z.string(),
  combinedMarketValuePct: z.number(),
  combinedRiskBudgetPct: z.number(),
  memberCount: z.number().int().min(0),
  status: WarningStatusSchema,
  missing: z.boolean().optional(),
})
export type ThemeRisk = z.infer<typeof ThemeRiskSchema>

export const PortfolioRiskSummarySchema = z.object({
  nav: MoneySchema,
  cash: MoneySchema,
  updatedAt: z.string(),
  riskBudget: RiskBudgetSchema,
  exposure: ExposureSummarySchema,
  concentrations: z.array(ConcentrationRiskSchema),
  themes: z.array(ThemeRiskSchema),
  sleeves: z.array(RiskSleeveSchema),
  currentDrawdown: z.number(),
  peakDrawdown: z.number(),
  dataQuality: z.object({
    completenessPct: z.number(),
    timelinessPct: z.number(),
    reconciliation: ReconciliationStatusSchema,
    anomalyCount: z.number().int().min(0),
    healthPct: z.number(),
  }),
  hardBlock: z.boolean(),
  hardBlockReasons: z.array(z.string()),
  missingFields: z.array(z.string()).optional(),
})
export type PortfolioRiskSummary = z.infer<typeof PortfolioRiskSummarySchema>

/* ---------------- 策略 ---------------- */
export const StrategySummarySchema = z.object({
  strategyId: z.string(),
  name: z.string(),
  currentVersion: z.string(),
  lifecycle: LifecycleStageSchema,
  market: StrategyMarketSchema,
  frequency: StrategyFrequencySchema,
  benchmark: z.string(),
  allowedDirections: z.array(SignalDirectionSchema),
  sampleCount: z.number().int().min(0),
  latestOosResult: z.string().nullable(),
  dataSnapshotId: z.string(),
  updatedAt: z.string(),
  blockReason: z.string().nullable(),
})
export type StrategySummary = z.infer<typeof StrategySummarySchema>

export const StrategyFilterSchema = z.object({
  lifecycle: z.array(LifecycleStageSchema).optional(),
  market: z.array(StrategyMarketSchema).optional(),
  frequency: z.array(StrategyFrequencySchema).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'updatedAt', 'sampleCount', 'lifecycle']).default('name'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
export type StrategyFilter = z.infer<typeof StrategyFilterSchema>

/* ---------------- 回测 ---------------- */
export const BacktestRunSummarySchema = z.object({
  runId: z.string(),
  strategyId: z.string(),
  strategyName: z.string(),
  strategyVersion: z.string(),
  lifecycle: LifecycleStageSchema,
  dataSnapshotId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: BacktestStatusSchema,
  cagr: z.number(),
  maxDrawdown: z.number(),
  excessVsSpy: z.number(),
  sharpe: z.number(),
  commissionAndSlippage: MoneySchema,
  tradeCount: z.number().int().min(0),
  siblingSampleCount: z.number().int().min(0),
  passPromotion: z.boolean(),
  runAt: z.string(),
  missing: z.boolean().optional(),
})
export type BacktestRunSummary = z.infer<typeof BacktestRunSummarySchema>

export const BacktestFilterSchema = z.object({
  strategyId: z.string().optional(),
  strategyVersion: z.string().optional(),
  lifecycle: z.array(LifecycleStageSchema).optional(),
  status: z.array(BacktestStatusSchema).optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  dataSnapshotId: z.string().optional(),
  passPromotion: z.coerce.boolean().optional(),
  sortBy: z.enum(['runAt', 'cagr', 'maxDrawdown', 'excessVsSpy', 'sharpe']).default('runAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
export type BacktestFilter = z.infer<typeof BacktestFilterSchema>

export const BacktestTradeSampleSchema = z.object({
  tradeId: z.string(),
  symbol: z.string(),
  entryDate: z.string(),
  exitDate: z.string().nullable(),
  direction: SignalDirectionSchema,
  entryPrice: z.number(),
  exitPrice: z.number().nullable(),
  pnl: MoneySchema,
  pnlPct: z.number(),
  holdingDays: z.number().int().min(0).nullable(),
  reason: z.string(),
})
export type BacktestTradeSample = z.infer<typeof BacktestTradeSampleSchema>

export const BacktestOrderLedgerItemSchema = z.object({
  orderId: z.string(),
  symbol: z.string(),
  direction: SignalDirectionSchema,
  requestedQty: z.number(),
  filledQty: z.number(),
  status: z.enum(['FILLED', 'PARTIALLY_FILLED', 'REJECTED', 'CANCELLED', 'EXPIRED']),
  limitPrice: z.number(),
  avgFillPrice: z.number().nullable(),
  commission: MoneySchema,
  slippage: z.number(),
  reasonCode: z.string().nullable(),
  occurredAt: z.string(),
})
export type BacktestOrderLedgerItem = z.infer<typeof BacktestOrderLedgerItemSchema>

export const BacktestRunDetailSchema = z.object({
  runId: z.string(),
  strategyId: z.string(),
  strategyName: z.string(),
  strategyVersion: z.string(),
  codeHash: z.string(),
  configHash: z.string(),
  dataSnapshotId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  status: BacktestStatusSchema,
  // 绩效摘要
  cagr: z.number(),
  maxDrawdown: z.number(),
  excessVsSpy: z.number(),
  sharpe: z.number(),
  calmar: z.number(),
  turnover: z.number(),
  commissionAndSlippage: MoneySchema,
  tradeCount: z.number().int().min(0),
  siblingSampleCount: z.number().int().min(0),
  maxWinnerConcentration: z.number(),
  // 执行元信息
  rejectedOrderCount: z.number().int().min(0),
  delayedOrderCount: z.number().int().min(0),
  unfilledOrderCount: z.number().int().min(0),
  openPositionOnly: z.boolean(),
  noSignals: z.boolean(),
  afterFee: z.boolean(),
  benchmark: z.string(),
  // 时序
  signalTimestamp: z.string(),
  tradeTimestamp: z.string(),
  dataTimestamp: z.string(),
  runAt: z.string(),
  // 子集合
  navSeries: z.array(z.object({
    date: z.string(),
    nav: z.number(),
    benchmark: z.number(),
  })),
  tradeSamples: z.array(BacktestTradeSampleSchema),
  orderLedger: z.array(BacktestOrderLedgerItemSchema),
  missing: z.boolean().optional(),
})
export type BacktestRunDetail = z.infer<typeof BacktestRunDetailSchema>

/* ---------------- 订单 ---------------- */
export const OrderIntentSchema = z.object({
  intentId: z.string(),
  idempotencyKey: z.string(),
  tradePlanId: z.string(),
  riskDecision: WarningStatusSchema,
  symbol: z.string(),
  direction: SignalDirectionSchema,
  requestedQty: z.number(),
  filledQty: z.number().int().min(0),
  remainingQty: z.number().int().min(0),
  referencePrice: MoneySchema.nullable(),
  limitPrice: MoneySchema.nullable(),
  status: OrderStatusSchema,
  reasonCode: z.string().nullable(),
  modificationCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type OrderIntent = z.infer<typeof OrderIntentSchema>

export const BrokerOrderSchema = z.object({
  brokerOrderId: z.string().nullable(),
  intentId: z.string(),
  requestedQty: z.number(),
  filledQty: z.number().int().min(0),
  remainingQty: z.number().int().min(0),
  avgFillPrice: MoneySchema.nullable(),
  commission: MoneySchema,
  status: OrderStatusSchema,
  submittedAt: z.string().nullable(),
  latestUpdateAt: z.string().nullable(),
  delayDescription: z.string().nullable(),
  rejectionReason: z.string().nullable(),
  reconciliationStatus: ReconciliationStatusSchema,
})
export type BrokerOrder = z.infer<typeof BrokerOrderSchema>

export const FillSchema = z.object({
  fillId: z.string().nullable(),
  brokerOrderId: z.string(),
  filledQty: z.number(),
  avgFillPrice: MoneySchema,
  commission: MoneySchema,
  occurredAt: z.string().nullable(),
  status: z.enum(['CONFIRMED', 'MISSING']),
  createdAt: z.string().nullable(),
})
export type Fill = z.infer<typeof FillSchema>

export const ReconciliationIssueSchema = z.object({
  intentId: z.string(),
  description: z.string(),
  severity: z.enum(['WARN', 'BLOCK']),
  detail: z.string(),
  createdAt: z.string(),
})
export type ReconciliationIssue = z.infer<typeof ReconciliationIssueSchema>

export const OrderFilterSchema = z.object({
  status: z.array(OrderStatusSchema).optional(),
  symbol: z.string().optional(),
  strategyId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'symbol']).default('updatedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})
export type OrderFilter = z.infer<typeof OrderFilterSchema>

/* ---------------- 行情（Milestone 2.1） ---------------- */
export const TimeframeSchema = z.enum(['1m', '5m', '15m', '1h', '4h', '1D', '1W'])
export type Timeframe = z.infer<typeof TimeframeSchema>

export const CandleSchema = z.object({
  canonicalSymbol: z.string(),
  assetClass: AssetClassSchema,
  timeframe: TimeframeSchema,
  timestamp: z.string().datetime(),
  open: z.number().finite(),
  high: z.number().finite(),
  low: z.number().finite(),
  close: z.number().finite(),
  volume: z.number().min(0),
  currency: CurrencySchema,
  timezone: z.string(),
  source: DataSourceSchema,
  dataStatus: DataStatusSchema,
}).refine(
  (c) => c.high >= Math.max(c.open, c.close, c.low) && c.low <= Math.min(c.open, c.close, c.high),
  { message: 'high must be >= max(open, close, low) and low must be <= min(open, close, high)' },
)
export type Candle = z.infer<typeof CandleSchema>

export const CandleSeriesResponseSchema = z.object({
  symbol: z.string(),
  timeframe: TimeframeSchema,
  from: z.string().datetime(),
  to: z.string().datetime(),
  candles: z.array(CandleSchema),
  timezone: z.string(),
  source: DataSourceSchema,
  dataStatus: DataStatusSchema,
  availableAt: z.string().datetime(),
}).refine((s) => {
  const candles = s.candles
  if (candles.length === 0) return true
  // 第一根/单根 K线必须匹配系列元数据
  const first = candles[0]
  if (first.canonicalSymbol !== s.symbol) return false
  if (first.timeframe !== s.timeframe) return false
  if (first.timezone !== s.timezone) return false
  if (candles.length < 2) return true
  for (let i = 1; i < candles.length; i++) {
    if (candles[i].timestamp <= candles[i - 1].timestamp) return false
    if (candles[i].canonicalSymbol !== s.symbol) return false
    if (candles[i].timeframe !== s.timeframe) return false
    if (candles[i].timezone !== s.timezone) return false
    if (candles[i].currency !== candles[0].currency) return false
  }
  return true
}, { message: 'Candles must have strictly increasing timestamps, no duplicates, consistent metadata; first candle must match series symbol/timeframe/timezone' })
export type CandleSeriesResponse = z.infer<typeof CandleSeriesResponseSchema>

export const InstrumentSchema = z.object({
  canonicalSymbol: z.string(),
  displayName: z.string(),
  assetClass: AssetClassSchema,
  currency: CurrencySchema,
  timezone: z.string(),
  minTimeframe: TimeframeSchema,
  availableTimeframes: z.array(TimeframeSchema),
  tradingHours: z.string(),
  dataAvailable: z.boolean(),
  source: DataSourceSchema,
})
export type Instrument = z.infer<typeof InstrumentSchema>

export const SymbolSearchResultSchema = z.object({
  canonicalSymbol: z.string(),
  displayName: z.string(),
  assetClass: AssetClassSchema,
  currency: CurrencySchema,
})
export type SymbolSearchResult = z.infer<typeof SymbolSearchResultSchema>

export const MarketDataStatusSchema = z.object({
  symbol: z.string(),
  timeframe: TimeframeSchema,
  dataDelaySeconds: z.number().min(0),
  lastCandleTime: z.string().nullable(),
  gapCount: z.number().int().min(0),
  quality: z.enum(['CLEAN', 'GAP', 'STALE', 'BLOCKED']),
})
export type MarketDataStatus = z.infer<typeof MarketDataStatusSchema>

export const IndicatorDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  category: z.enum(['overlay', 'oscillator', 'volume', 'custom']),
  defaultParams: z.record(z.number()),
  paramSchema: z.record(z.object({
    min: z.number(),
    max: z.number(),
    step: z.number(),
    label: z.string(),
  })),
})
export type IndicatorDefinition = z.infer<typeof IndicatorDefinitionSchema>

export const IndicatorInstanceSchema = z.object({
  definitionId: z.string(),
  params: z.record(z.number()),
  enabled: z.boolean(),
})
export type IndicatorInstance = z.infer<typeof IndicatorInstanceSchema>

export const BollingerBandPointSchema = z.object({
  middle: z.number().nullable(),
  upper: z.number().nullable(),
  lower: z.number().nullable(),
})
export type BollingerBandPoint = z.infer<typeof BollingerBandPointSchema>

export const RsiPointSchema = z.object({
  value: z.number().nullable(),
})
export type RsiPoint = z.infer<typeof RsiPointSchema>

/* ---------------- 总览（M1 已有） ---------------- */
export const WarningItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  status: WarningStatusSchema,
  reason: z.string(),
  updatedAt: z.string(),
  evidencePath: z.string(),
})
export type WarningItem = z.infer<typeof WarningItemSchema>

export const SignalCandidateSchema = z.object({
  symbol: z.string(),
  strategy: z.string(),
  strategyVersion: z.string(),
  positionType: PositionTypeSchema,
  entryType: EntryTypeSchema,
  signal: SignalDirectionSchema,
  maxLossAmount: MoneySchema,
  maxLossPctOfNav: z.number(),
  combinedThemeRisk: MoneySchema,
  earliestExecutionTime: z.string(),
  riskStatus: WarningStatusSchema,
  planStatus: PlanStatusSchema,
  missingMaxLoss: z.boolean().optional(),
  missingCombinedRisk: z.boolean().optional(),
})
export type SignalCandidate = z.infer<typeof SignalCandidateSchema>

export const StrategyLifecycleSummarySchema = z.object({
  stage: LifecycleStageSchema,
  label: z.string(),
  count: z.number().int().min(0),
})
export type StrategyLifecycleSummary = z.infer<typeof StrategyLifecycleSummarySchema>

export const BenchmarkPointSchema = z.object({
  date: z.string(),
  portfolio: z.number(),
  spy: z.number(),
  qqq: z.number().optional(),
})
export type BenchmarkPoint = z.infer<typeof BenchmarkPointSchema>

export const BenchmarkSeriesSchema = z.object({
  points: z.array(BenchmarkPointSchema),
  afterFee: z.boolean(),
  window: z.string(),
  cumulativeExcess: z.number(),
  currentDrawdown: z.number(),
})
export type BenchmarkSeries = z.infer<typeof BenchmarkSeriesSchema>

export const DataQualitySchema = z.object({
  completenessPct: z.number(),
  timelinessPct: z.number(),
  reconciliation: ReconciliationStatusSchema,
  anomalyCount: z.number().int().min(0),
  healthPct: z.number(),
})
export type DataQuality = z.infer<typeof DataQualitySchema>

export const OverviewDataSchema = z.object({
  system: SystemHealthSchema,
  account: AccountSnapshotSchema,
  riskBudget: RiskBudgetSchema,
  sleeves: z.array(RiskSleeveSchema),
  lifecycle: z.array(StrategyLifecycleSummarySchema),
  warnings: z.array(WarningItemSchema),
  pendingSignals: z.array(SignalCandidateSchema),
  benchmark: BenchmarkSeriesSchema,
  dataQuality: DataQualitySchema,
})
export type OverviewData = z.infer<typeof OverviewDataSchema>

/* ---------------- 总览审查场景（M1 兼容） ---------------- */
export const OverviewScenarioSchema = z.enum([
  'healthy', 'data_delayed', 'risk_warning', 'hard_risk_block',
  'accounting_block', 'no_pending_signals', 'two_pending_signals',
  'api_loading', 'api_error',
])
export type OverviewScenario = z.infer<typeof OverviewScenarioSchema>

export const OVERVIEW_SCENARIOS: OverviewScenario[] = [
  'healthy', 'data_delayed', 'risk_warning', 'hard_risk_block',
  'accounting_block', 'no_pending_signals', 'two_pending_signals',
  'api_loading', 'api_error',
] as const

export const SCENARIO_LABELS: Record<OverviewScenario, string> = {
  healthy: '正常',
  data_delayed: '数据延迟',
  risk_warning: '风险预警',
  hard_risk_block: '风险硬阻断',
  accounting_block: '对账失败阻断',
  no_pending_signals: '无待审批信号',
  two_pending_signals: '两个待审批信号',
  api_loading: '接口加载中',
  api_error: '接口错误',
}

/* ---------------- API 错误类型 ---------------- */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: 'NETWORK' | 'HTTP' | 'TIMEOUT' | 'JSON' | 'SCHEMA',
    public readonly status?: number,
    public readonly requestId?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
