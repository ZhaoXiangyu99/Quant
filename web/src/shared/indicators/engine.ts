/* ============================================================
   指标引擎 — 独立、可测试的技术指标计算
   无前瞻偏差、暖机期返回 null、参数校验
   ============================================================ */

import type { IndicatorDefinition } from '@/shared/api/schemas'

/* ---------------- 配置 ---------------- */

export const BB_DEFAULTS = { period: 20, stdDev: 2 }
export const RSI_DEFAULTS = { period: 14 }

/* ---------------- 类型 ---------------- */

export interface BollingerBandsResult {
  middle: number | null
  upper: number | null
  lower: number | null
}

export interface RsiResult {
  value: number | null
}

/* ---------------- BollingerBands ---------------- */

export function computeBollingerBands(
  prices: number[],
  period: number = BB_DEFAULTS.period,
  stdDev: number = BB_DEFAULTS.stdDev,
): BollingerBandsResult[] {
  if (!Array.isArray(prices)) {
    throw new Error('BollingerBands: prices 必须是一个数组')
  }
  if (!Number.isFinite(period) || period < 2) {
    throw new Error('BollingerBands: period 必须是 >= 2 的整数')
  }
  if (!Number.isFinite(stdDev) || stdDev <= 0) {
    throw new Error('BollingerBands: stdDev 必须是正数')
  }

  const n = prices.length
  const result: BollingerBandsResult[] = new Array(n)

  for (let i = 0; i < n; i++) {
    if (i < period - 1) {
      result[i] = { middle: null, upper: null, lower: null }
      continue
    }

    const slice = prices.slice(i - period + 1, i + 1)
    const sum = slice.reduce((a, b) => a + b, 0)
    const mean = sum / period

    const sqDiffs = slice.reduce((a, v) => a + (v - mean) ** 2, 0)
    const stdev = Math.sqrt(sqDiffs / (period - 1)) // 样本标准差

    result[i] = {
      middle: Number(mean.toFixed(4)),
      upper: Number((mean + stdDev * stdev).toFixed(4)),
      lower: Number((mean - stdDev * stdev).toFixed(4)),
    }
  }

  return result
}

/* ---------------- RSI（Wilder 平滑） ---------------- */

export function computeRsi(
  prices: number[],
  period: number = RSI_DEFAULTS.period,
): RsiResult[] {
  if (!Array.isArray(prices)) {
    throw new Error('RSI: prices 必须是一个数组')
  }
  if (!Number.isFinite(period) || period < 2) {
    throw new Error('RSI: period 必须是 >= 2 的整数')
  }

  const n = prices.length
  const result: RsiResult[] = new Array(n)

  if (n <= period) {
    return result.fill({ value: null })
  }

  // 前 period 个位置为 null（暖机期）
  for (let i = 0; i < period; i++) {
    result[i] = { value: null }
  }

  // 计算第一组 avgGain / avgLoss
  let avgGain = 0
  let avgLoss = 0
  for (let i = 1; i <= period; i++) {
    const delta = prices[i] - prices[i - 1]
    if (delta > 0) avgGain += delta
    else avgLoss += -delta
  }
  avgGain /= period
  avgLoss /= period

  const firstRsi = computeRsiValue(avgGain, avgLoss)
  result[period] = { value: firstRsi }

  // Wilder 平滑后续值
  for (let i = period + 1; i < n; i++) {
    const delta = prices[i] - prices[i - 1]
    const gain = delta > 0 ? delta : 0
    const loss = delta > 0 ? 0 : -delta

    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period

    result[i] = { value: computeRsiValue(avgGain, avgLoss) }
  }

  return result
}

function computeRsiValue(avgGain: number, avgLoss: number): number {
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  const rsi = 100 - 100 / (1 + rs)
  return Math.min(100, Math.max(0, Number(rsi.toFixed(2))))
}

/* ---------------- 指标定义 ---------------- */

export const BB_DEFINITION: IndicatorDefinition = {
  id: 'bb',
  label: 'Bollinger Bands',
  category: 'overlay',
  defaultParams: { period: BB_DEFAULTS.period, stdDev: BB_DEFAULTS.stdDev },
  paramSchema: {
    period: { min: 2, max: 100, step: 1, label: '周期' },
    stdDev: { min: 0.5, max: 5, step: 0.5, label: '标准差倍数' },
  },
}

export const RSI_DEFINITION: IndicatorDefinition = {
  id: 'rsi',
  label: 'RSI',
  category: 'oscillator',
  defaultParams: { period: RSI_DEFAULTS.period },
  paramSchema: {
    period: { min: 2, max: 100, step: 1, label: '周期' },
  },
}

export const DEFAULT_INDICATOR_DEFINITIONS: IndicatorDefinition[] = [
  BB_DEFINITION,
  RSI_DEFINITION,
]
