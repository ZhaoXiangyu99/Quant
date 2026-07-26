/**
 * 行情数据统一时钟 — 集中管理 Mock/DEV 基准时间
 * 生产环境通过 VITE_API_BASE 请求，不依赖此配置
 */
export const DEV_MARKET_CLOCK = {
  /** 基准日期（YYYY-MM-DD） */
  baseDate: '2026-07-26',
  /** 基准时间 ISO */
  baseIso: '2026-07-26T00:00:00Z',
  /** 结束时间 ISO（当日 23:59:59 UTC） */
  endIso: '2026-07-26T23:59:59Z',
} as const
