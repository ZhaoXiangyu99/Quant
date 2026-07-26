/* ============================================================
   TanStack Query hooks — Milestone 2
   Pinia 仅管理 UI/客户端状态（§4.1）。
   ============================================================ */
import { toRef } from 'vue'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/vue-query'
import {
  fetchOverview,
  fetchSystemHealth,
  fetchPortfolioRisk,
  fetchStrategies,
  fetchBacktests,
  fetchBacktestDetail,
  fetchOrders,
  fetchInstruments,
  fetchCandles,
} from './client'
import type {
  PortfolioRiskSummary,
  SystemHealth,
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
  ApiEnvelope,
  OverviewData,
  Instrument,
  CandleSeriesResponse,
} from './schemas'
import { useOverviewStore } from '@/shared/state/overview'

export function useOverviewQuery() {
  const store = useOverviewStore()
  const scenario = toRef(() => store.scenario)
  return useQuery({
    queryKey: ['overview', scenario] as any,
    queryFn: () => fetchOverview(store.scenario) as Promise<ApiEnvelope<OverviewData>>,
    staleTime: 30000,
    retry: 1,
  })
}

export function useSystemHealthQuery() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => fetchSystemHealth() as Promise<ApiEnvelope<SystemHealth>>,
    staleTime: 60000,
    refetchInterval: 120000,
  })
}

export function usePortfolioRiskQuery() {
  return useQuery({
    queryKey: ['portfolio-risk'],
    queryFn: () => fetchPortfolioRisk() as Promise<ApiEnvelope<PortfolioRiskSummary>>,
    staleTime: 30000,
    refetchInterval: 60000,
  })
}

export function useStrategiesQuery(getFilter: () => StrategyFilter) {
  return useQuery({
    queryKey: ['strategies', getFilter] as any,
    queryFn: () => fetchStrategies(getFilter()) as Promise<ApiEnvelope<{ items: StrategySummary[]; total: number; limit: number; offset: number }>>,
    staleTime: 60000,
    placeholderData: keepPreviousData as any,
  })
}

export function useBacktestsQuery(getFilter: () => BacktestFilter) {
  return useQuery({
    queryKey: ['backtests', getFilter] as any,
    queryFn: () => fetchBacktests(getFilter()) as Promise<ApiEnvelope<{ items: BacktestRunSummary[]; total: number; limit: number; offset: number }>>,
    staleTime: 60000,
    placeholderData: keepPreviousData as any,
  })
}

export function useBacktestDetailQuery(getRunId: () => string | null) {
  return useQuery({
    queryKey: ['backtest-detail', getRunId] as any,
    queryFn: () => fetchBacktestDetail(getRunId()!) as Promise<ApiEnvelope<BacktestRunDetail>>,
    enabled: !!getRunId(),
    staleTime: 120000,
  })
}

export function useOrdersQuery(getFilter: () => OrderFilter) {
  return useQuery({
    queryKey: ['orders', getFilter] as any,
    queryFn: () => fetchOrders(getFilter()) as Promise<ApiEnvelope<{
      intents: OrderIntent[]
      brokerOrders: BrokerOrder[]
      fills: Fill[]
      reconciliationIssues: ReconciliationIssue[]
      total: number
      limit: number
      offset: number
    }>>,
    staleTime: 15000,
    refetchInterval: 30000,
    placeholderData: keepPreviousData as any,
  })
}

export function useInstrumentsQuery(query?: () => string) {
  return useQuery({
    queryKey: ['instruments', query] as any,
    queryFn: () => fetchInstruments(query?.()) as Promise<ApiEnvelope<{ items: Instrument[] }>>,
    staleTime: 300000,
  })
}

export function useCandlesQuery(symbol: () => string, timeframe: () => string, from: () => string | undefined, to: () => string | undefined, limit: () => number) {
  return useQuery({
    queryKey: ['candles', symbol, timeframe, from, to, limit] as any,
    queryFn: () => fetchCandles(symbol(), timeframe(), from(), to(), limit()) as Promise<ApiEnvelope<CandleSeriesResponse>>,
    staleTime: 60000,
    refetchInterval: 60000,
  })
}

export function useInvalidateAll() {
  const qc = useQueryClient()
  return () => qc.invalidateQueries()
}
