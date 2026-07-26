/* ============================================================
   Candle Mock Fixtures — Milestone 2.1
   确定性 PRNG 生成的 K 线数据，符合 CandleSchema 约束。
   美股日内对齐交易时段边界，BTC 24/7 UTC 自然日。
   ============================================================ */
import type { Candle, DataStatus } from '../schemas'
import { SYMBOL_REGISTRY } from '@/shared/config/symbols'
import { DEV_MARKET_CLOCK } from '@/shared/config/market-clock'

const MAX_LOOP_ITERATIONS = 100000 // 硬上限防死循环

/* ---------------- 确定性 PRNG ---------------- */
function mulberry32(seed: number): () => number {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ---------------- 工具 ---------------- */

function getTimeframeMs(timeframe: string): number {
  const map: Record<string, number> = { '1m': 60_000, '5m': 300_000, '15m': 900_000, '1h': 3_600_000, '4h': 14_400_000, '1D': 86_400_000, '1W': 604_800_000 }
  return map[timeframe] ?? 86_400_000
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay()
  return day === 0 || day === 6
}

/** 美东 EDT（7 月：UTC-4）交易时段对齐 */
function alignToTradingBoundary(utcDate: Date, timeframe: string): Date {
  const offsetMs = -4 * 3_600_000  // EDT = UTC-4
  const ny = new Date(utcDate.getTime() + offsetMs)
  const d = new Date(ny)
  // 标准化到当天 00:00:00 EDT
  d.setUTCHours(0, 0, 0, 0)

  switch (timeframe) {
    case '1D':
    case '1W':
      return d // 交易日当天
    case '4h':
      // 对齐到最近的有效 4h 锚点：09:30 或 13:30 EDT
      if (ny.getUTCHours() < 11) {
        // 上午 → 09:30 EDT
        return new Date(d.getTime() - offsetMs + 9 * 3_600_000 + 30 * 60_000)
      }
      // 下午 → 13:30 EDT
      return new Date(d.getTime() - offsetMs + 13 * 3_600_000 + 30 * 60_000)
    case '1h':
      // 对齐到交易时段内最近 :30
      {
        const h = Math.max(9, Math.min(15, ny.getUTCHours()))
        return new Date(d.getTime() - offsetMs + h * 3_600_000 + 30 * 60_000)
      }
    default: // 1m/5m/15m
      return utcDate // 细粒度不需特殊对齐
  }
}

/* ---------------- 预置品种 ---------------- */
export const PRESET_SYMBOLS: Record<string, { basePrice: number }> = {
  'US:AAPL': { basePrice: 175 },
  'US:MSFT': { basePrice: 420 },
  'US:NVDA': { basePrice: 1125 },
  'US:SPY': { basePrice: 550 },
  'US:QQQ': { basePrice: 520 },
  'CRYPTO:BTC-USD': { basePrice: 85000 },
}

/** 动态品种（搜索后生成 on-the-fly） */
export function getDynamicBasePrice(symbol: string): number | undefined {
  const map: Record<string, number> = {
    'US:TSLA': 350, 'US:META': 520, 'US:AMZN': 380,
    'US:GOOGL': 185, 'US:AMD': 140, 'US:HOOD': 35,
  }
  return map[symbol]
}

/**
 * 检查 UTC 时间戳是否属于美股的正常交易时段。
 * EDT = UTC-4（2026 年 7 月）
 */
function isValidUSTradingTimestamp(utcTimestamp: Date, timeframe: string): boolean {
  const ny = new Date(utcTimestamp.getTime() - 4 * 3_600_000)
  const h = ny.getUTCHours()
  const m = ny.getUTCMinutes()
  const day = ny.getUTCDay()
  if (day === 0 || day === 6) return false
  if (h < 9 || h >= 16 || (h === 9 && m < 30)) return false

  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
      return true
    case '1h':
      return m === 30 && h >= 9 && h <= 15
    case '4h':
      return m === 30 && (h === 9 || h === 13)
    default:
      return true
  }
}

/* ---------------- 蜡烛数据生成 ---------------- */

export function generateCandles(
  symbol: string,
  timeframe: string,
  count: number,
  basePrice: number,
  from?: string,
  to?: string,
): Candle[] {
  const isCrypto = symbol.startsWith('CRYPTO:')
  const intervalMs = getTimeframeMs(timeframe)

  // 收集有效时间戳
  const endDate = new Date(DEV_MARKET_CLOCK.endIso)
  let current = isCrypto ? new Date(endDate) : alignToTradingBoundary(endDate, timeframe)
  const timestamps: Date[] = []

  for (let iter = 0; iter < MAX_LOOP_ITERATIONS && timestamps.length < count; iter++) {
    const valid = isCrypto
      ? true
      : (timeframe === '1D' || timeframe === '1W')
        ? !isWeekend(current)
        : isValidUSTradingTimestamp(current, timeframe)

    if (valid) timestamps.push(new Date(current))
    current = new Date(current.getTime() - intervalMs)

    // 日内：到达 09:30 EDT 则跳到前一个交易日
    if (!isCrypto && timeframe !== '1D' && timeframe !== '1W') {
      const ny = new Date(current.getTime() - 4 * 3_600_000)
      if (ny.getUTCHours() < 9 || (ny.getUTCHours() === 9 && ny.getUTCMinutes() < 30)) {
        // 回退到前一个交易日
        let prev = new Date(current.getTime() - 16 * 3_600_000)
        // 去掉周末
        while (isWeekend(new Date(prev.getTime() - 4 * 3_600_000))) {
          prev = new Date(prev.getTime() - 24 * 3_600_000)
        }
        // 对齐：跳到该交易日最后一个有效锚点
        const prevOffset = new Date(prev.getTime() - 4 * 3_600_000)
        if (timeframe === '4h') {
          prevOffset.setUTCHours(13, 30, 0, 0) // 4h: 最后一个锚点 13:30 EDT
        } else if (timeframe === '1h') {
          prevOffset.setUTCHours(15, 30, 0, 0) // 1h: 最后一个锚点 15:30 EDT
        } else {
          prevOffset.setUTCHours(15, 59, 0, 0) // 1m/5m/15m: 15:59 EDT
        }
        current = new Date(prevOffset.getTime() + 4 * 3_600_000) // back to UTC
      }
    }
  }
  timestamps.reverse()

  // 生成 OHLC
  const rng = mulberry32(42)
  const candles: Candle[] = []
  let prevClose = basePrice

  const info = {
    canonical: symbol,
    assetClass: isCrypto ? 'CRYPTO_BTC' as const : 'US_EQUITY' as const,
    tz: isCrypto ? 'UTC' : 'America/New_York',
  }

  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i]
    const o = i === 0 ? basePrice * (1 + (rng() - 0.5) * 0.02) : prevClose
    const drift = rng() - 0.48
    const vol = basePrice * 0.02 * (1 + rng())
    const c = o * (1 + drift * 0.01) + (rng() - 0.5) * vol * 0.3
    const maxOc = Math.max(o, c)
    const minOc = Math.min(o, c)
    const h = maxOc + Math.abs(rng() * vol * 0.5)
    const l = minOc - Math.abs(rng() * vol * 0.5)

    candles.push({
      canonicalSymbol: info.canonical,
      assetClass: info.assetClass,
      timeframe: timeframe as Candle['timeframe'],
      timestamp: ts.toISOString(),
      open: Number(o.toFixed(2)),
      high: Number(h.toFixed(2)),
      low: Number(l.toFixed(2)),
      close: Number(c.toFixed(2)),
      volume: Math.round(Math.abs(rng() * 1_000_000) + 100),
      currency: 'USD',
      timezone: info.tz,
      source: 'mock',
      dataStatus: 'HEALTHY' as DataStatus,
    })
    prevClose = c
  }

  // 修复异常 OHLC
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]
    if (c.high < Math.max(c.open, c.close, c.low) || c.low > Math.min(c.open, c.close, c.high)) {
      const maxVal = Math.max(c.open, c.close)
      const minVal = Math.min(c.open, c.close)
      candles[i] = {
        ...c,
        high: Number((maxVal + Math.abs(maxVal * 0.005)).toFixed(2)),
        low: Number((minVal - Math.abs(minVal * 0.005)).toFixed(2)),
      }
    }
  }

  // from/to 筛选
  let result = candles
  if (from) result = result.filter((c) => c.timestamp >= from)
  if (to) {
    // to 是 inclusive（包含当天/该时点）
    result = result.filter((c) => c.timestamp <= to)
  }

  return result
}
