/* ============================================================
   只读 HTTP API Client — Milestone 2
   - 只允许 GET（§4.3）
   - 支持 AbortSignal
   - 非 2xx / 超时 / 网络 / JSON / Schema 错误分类
   - 不泄漏凭证、完整响应或堆栈
   - DEV: 动态 import mock → 生产摇树移除
   - PROD: 从 VITE_API_BASE 读基址，未配置/不可用时不回退 mock
   ============================================================ */
import type {
  ApiEnvelope,
  OverviewData,
  OverviewScenario,
  BacktestRunDetail,
  BacktestRunSummary,
  BacktestFilter,
  OrderFilter,
  StrategyFilter,
  StrategySummary,
  PortfolioRiskSummary,
  SystemHealth,
  AccountSnapshot,
  Instrument,
  CandleSeriesResponse,
} from './schemas'
import { ApiError } from './schemas'
import {
  OverviewDataSchema,
  BacktestRunDetailSchema,
  paginatedResponseSchema,
  BacktestRunSummarySchema,
  StrategySummarySchema,
  PortfolioRiskSummarySchema,
  SystemHealthSchema,
  AccountSnapshotSchema,
  OrderIntentSchema,
  BrokerOrderSchema,
  FillSchema,
  ReconciliationIssueSchema,
  apiEnvelopeSchema,
  InstrumentSchema,
  CandleSeriesResponseSchema,
} from './schemas'
import { z } from 'zod'

/* ---------------- HTTP 工具 ---------------- */

const PAGE_TIMEOUT_MS = 30000

export function apiBase(): string {
  return import.meta.env.VITE_API_BASE ?? ''
}

async function get<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  const base = apiBase()
  if (!base) {
    throw new ApiError('API 未配置：生产环境缺少 VITE_API_BASE，请设置环境变量。', 'HTTP', undefined, undefined)
  }
  const url = `${base.replace(/\/$/, '')}${path}`
  const controller = new AbortController()
  const linked = signal
  if (linked) {
    if (linked.aborted) throw new ApiError('请求已取消', 'TIMEOUT')
    linked.addEventListener('abort', () => controller.abort(), { once: true })
  }
  const timer = setTimeout(() => controller.abort(), PAGE_TIMEOUT_MS)

  let resp: Response
  try {
    resp = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
  } catch (e: unknown) {
    clearTimeout(timer)
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('请求超时或已取消', 'TIMEOUT')
    }
    throw new ApiError('网络请求失败，请检查连接。', 'NETWORK')
  } finally {
    clearTimeout(timer)
  }

  if (!resp.ok) {
    const rid = resp.headers.get('x-request-id') ?? undefined
    throw new ApiError(`服务返回错误 ${resp.status}`, 'HTTP', resp.status, rid)
  }

  let body: unknown
  try {
    body = await resp.json()
  } catch {
    throw new ApiError('响应格式错误：无效的 JSON', 'JSON')
  }

  const result = schema.safeParse(body)
  if (!result.success) {
    throw new ApiError('数据契约校验失败：服务端返回数据与预期格式不一致', 'SCHEMA')
  }
  return result.data
}

/* ---------------- 端点函数（DEV 走 mock，PROD 走 HTTP；均经 Zod 校验） ---------------- */

/** 统一验证：mock 和 production 响应均经 Zod safeParse，Schema 错误转为 ApiError */
async function validateWith<T>(promise: Promise<T>, schema: z.ZodType<T>, label: string): Promise<T> {
  const data = await promise
  const result = schema.safeParse(data)
  if (!result.success) {
    throw new ApiError(`数据契约校验失败：${label} 返回格式与预期不一致`, 'SCHEMA')
  }
  return result.data
}

// --- 总览 ---
export async function fetchOverview(scenario?: OverviewScenario): Promise<ApiEnvelope<OverviewData>> {
  if (import.meta.env.DEV) {
    const { fetchOverviewMock } = await import('./mock/client')
    return validateWith(fetchOverviewMock(scenario ?? 'healthy'), apiEnvelopeSchema(OverviewDataSchema), 'Overview')
  }
  return get('/api/v1/overview', apiEnvelopeSchema(OverviewDataSchema))
}

// --- 系统健康 ---
export async function fetchSystemHealth(signal?: AbortSignal): Promise<ApiEnvelope<SystemHealth>> {
  if (import.meta.env.DEV) {
    const { fetchSystemHealthMock } = await import('./mock/client')
    return validateWith(fetchSystemHealthMock(), apiEnvelopeSchema(SystemHealthSchema), 'SystemHealth')
  }
  return get('/api/v1/system-health', apiEnvelopeSchema(SystemHealthSchema), signal)
}

// --- 账户快照 ---
export async function fetchAccountSnapshot(signal?: AbortSignal): Promise<ApiEnvelope<AccountSnapshot>> {
  if (import.meta.env.DEV) {
    const { fetchAccountSnapshotMock } = await import('./mock/client')
    return validateWith(fetchAccountSnapshotMock(), apiEnvelopeSchema(AccountSnapshotSchema), 'AccountSnapshot')
  }
  return get('/api/v1/account-snapshot', apiEnvelopeSchema(AccountSnapshotSchema), signal)
}

// --- 组合风险 ---
export async function fetchPortfolioRisk(signal?: AbortSignal): Promise<ApiEnvelope<PortfolioRiskSummary>> {
  if (import.meta.env.DEV) {
    const { fetchPortfolioRiskMock } = await import('./mock/client')
    return validateWith(fetchPortfolioRiskMock(), apiEnvelopeSchema(PortfolioRiskSummarySchema), 'PortfolioRisk')
  }
  return get('/api/v1/portfolio-risk', apiEnvelopeSchema(PortfolioRiskSummarySchema), signal)
}

// --- 策略列表 ---
export async function fetchStrategies(
  filter: Partial<StrategyFilter> = {},
  signal?: AbortSignal,
): Promise<ApiEnvelope<{ items: StrategySummary[]; total: number; limit: number; offset: number }>> {
  const s = apiEnvelopeSchema(paginatedResponseSchema(StrategySummarySchema))
  if (import.meta.env.DEV) {
    const { fetchStrategiesMock } = await import('./mock/client')
    return validateWith(fetchStrategiesMock(filter as StrategyFilter), s, 'Strategies')
  }
  const qs = buildStrategyQuery(filter)
  return get(`/api/v1/strategies${qs}`, s, signal)
}

function buildStrategyQuery(f: Partial<StrategyFilter>): string {
  const p = new URLSearchParams()
  if (f.lifecycle?.length) p.set('lifecycle', f.lifecycle.join(','))
  if (f.market?.length) p.set('market', f.market.join(','))
  if (f.frequency?.length) p.set('frequency', f.frequency.join(','))
  if (f.search) p.set('search', f.search)
  p.set('sortBy', f.sortBy ?? 'name')
  p.set('sortDir', f.sortDir ?? 'asc')
  p.set('limit', String(f.limit ?? 50))
  p.set('offset', String(f.offset ?? 0))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// --- 回测列表 ---
export async function fetchBacktests(
  filter: Partial<BacktestFilter> = {},
  signal?: AbortSignal,
): Promise<ApiEnvelope<{ items: BacktestRunSummary[]; total: number; limit: number; offset: number }>> {
  const s = apiEnvelopeSchema(paginatedResponseSchema(BacktestRunSummarySchema))
  if (import.meta.env.DEV) {
    const { fetchBacktestsMock } = await import('./mock/client')
    return validateWith(fetchBacktestsMock(filter as BacktestFilter), s, 'Backtests')
  }
  const qs = buildBacktestQuery(filter)
  return get(`/api/v1/backtests${qs}`, s, signal)
}

function buildBacktestQuery(f: Partial<BacktestFilter>): string {
  const p = new URLSearchParams()
  if (f.strategyId) p.set('strategyId', f.strategyId)
  if (f.strategyVersion) p.set('strategyVersion', f.strategyVersion)
  if (f.lifecycle?.length) p.set('lifecycle', f.lifecycle.join(','))
  if (f.status?.length) p.set('status', f.status.join(','))
  if (f.fromDate) p.set('fromDate', f.fromDate)
  if (f.toDate) p.set('toDate', f.toDate)
  if (f.dataSnapshotId) p.set('dataSnapshotId', f.dataSnapshotId)
  if (f.passPromotion !== undefined) p.set('passPromotion', String(f.passPromotion))
  p.set('sortBy', f.sortBy ?? 'runAt')
  p.set('sortDir', f.sortDir ?? 'desc')
  p.set('limit', String(f.limit ?? 50))
  p.set('offset', String(f.offset ?? 0))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// --- 回测详情 ---
export async function fetchBacktestDetail(
  runId: string,
  signal?: AbortSignal,
): Promise<ApiEnvelope<BacktestRunDetail>> {
  const s = apiEnvelopeSchema(BacktestRunDetailSchema)
  if (import.meta.env.DEV) {
    const { fetchBacktestDetailMock } = await import('./mock/client')
    return validateWith(fetchBacktestDetailMock(runId), s, 'BacktestDetail')
  }
  return get(`/api/v1/backtests/${encodeURIComponent(runId)}`, s, signal)
}

// --- 订单 ---
const OrdersDataSchema = z.object({
  intents: z.array(OrderIntentSchema),
  brokerOrders: z.array(BrokerOrderSchema),
  fills: z.array(FillSchema),
  reconciliationIssues: z.array(ReconciliationIssueSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
})

export async function fetchOrders(
  filter: Partial<OrderFilter> = {},
  signal?: AbortSignal,
): Promise<ApiEnvelope<z.infer<typeof OrdersDataSchema>>> {
  const s = apiEnvelopeSchema(OrdersDataSchema)
  if (import.meta.env.DEV) {
    const { fetchOrdersMock } = await import('./mock/client')
    return validateWith(fetchOrdersMock(filter as OrderFilter), s, 'Orders')
  }
  const qs = buildOrderQuery(filter)
  return get(`/api/v1/orders${qs}`, s, signal)
}

function buildOrderQuery(f: Partial<OrderFilter>): string {
  const p = new URLSearchParams()
  if (f.status?.length) p.set('status', f.status.join(','))
  if (f.symbol) p.set('symbol', f.symbol)
  if (f.strategyId) p.set('strategyId', f.strategyId)
  p.set('sortBy', f.sortBy ?? 'updatedAt')
  p.set('sortDir', f.sortDir ?? 'desc')
  p.set('limit', String(f.limit ?? 50))
  p.set('offset', String(f.offset ?? 0))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// --- 品种列表 ---

const InstrumentsResponseSchema = apiEnvelopeSchema(z.object({ items: z.array(InstrumentSchema) }))

export async function fetchInstruments(
  query?: string,
  signal?: AbortSignal,
): Promise<ApiEnvelope<{ items: Instrument[] }>> {
  if (import.meta.env.DEV) {
    const { fetchInstrumentsMock } = await import('./mock/client')
    return validateWith(fetchInstrumentsMock(query), InstrumentsResponseSchema, 'Instruments')
  }
  const qs = query ? `?q=${encodeURIComponent(query)}` : ''
  return get(`/api/v1/instruments${qs}`, InstrumentsResponseSchema, signal)
}

// --- K 线系列 ---

const CandleSeriesEnvelopeSchema = apiEnvelopeSchema(CandleSeriesResponseSchema)

function buildCandlesQuery(symbol: string, timeframe: string, from?: string, to?: string, limit?: number): string {
  const p = new URLSearchParams()
  p.set('symbol', symbol)
  p.set('timeframe', timeframe)
  if (from) p.set('from', from)
  if (to) p.set('to', to)
  if (limit !== undefined) p.set('limit', String(limit))
  return `?${p.toString()}`
}

export async function fetchCandles(
  symbol: string,
  timeframe: string = '1D',
  from?: string,
  to?: string,
  limit: number = 200,
  signal?: AbortSignal,
): Promise<ApiEnvelope<CandleSeriesResponse>> {
  if (import.meta.env.DEV) {
    const { fetchCandlesMock } = await import('./mock/client')
    return validateWith(
      fetchCandlesMock(symbol, timeframe, from, to, limit),
      CandleSeriesEnvelopeSchema,
      'Candles',
    )
  }
  const qs = buildCandlesQuery(symbol, timeframe, from, to, limit)
  return get(`/api/v1/candles${qs}`, CandleSeriesEnvelopeSchema, signal)
}
