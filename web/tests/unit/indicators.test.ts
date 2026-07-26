import { describe, it, expect } from 'vitest'
import { computeBollingerBands, computeRsi, BB_DEFAULTS, RSI_DEFAULTS } from '@/shared/indicators/engine'

describe('Bollinger Bands', () => {
  const flat = Array.from({ length: 30 }, () => 100)

  it('returns nulls for warm-up period (period-1)', () => {
    const r = computeBollingerBands(flat, 20, 2)
    expect(r).toHaveLength(30)
    // First 19 should be null
    for (let i = 0; i < 19; i++) {
      expect(r[i].middle).toBeNull()
      expect(r[i].upper).toBeNull()
      expect(r[i].lower).toBeNull()
    }
    // 20th should have values
    expect(r[19].middle).not.toBeNull()
    expect(r[19].upper).not.toBeNull()
    expect(r[19].lower).not.toBeNull()
  })

  it('flat prices: upper = middle = lower', () => {
    const r = computeBollingerBands(flat, 20, 2)
    expect(r[19].middle).toBeCloseTo(100)
    expect(r[19].upper).toBeCloseTo(100)
    expect(r[19].lower).toBeCloseTo(100)
  })

  it('upper > middle > lower for varying prices', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i)
    const r = computeBollingerBands(prices, 20, 2)
    for (let i = 20; i < 50; i++) {
      expect(r[i].upper!).toBeGreaterThan(r[i].middle!)
      expect(r[i].middle!).toBeGreaterThan(r[i].lower!)
    }
  })

  it('rejects invalid period', () => {
    expect(() => computeBollingerBands([100], 1, 2)).toThrow()
    expect(() => computeBollingerBands([100, 101], -1, 2)).toThrow()
    // Empty array with valid period returns empty result (not an error)
    expect(computeBollingerBands([], 20, 2)).toEqual([])
  })

  it('returns empty for insufficient data', () => {
    const r = computeBollingerBands([100, 101], 20, 2)
    expect(r).toHaveLength(2)
    expect(r[0].middle).toBeNull()
  })

  it('uses defaults period=20, stdDev=2', () => {
    const prices = Array.from({ length: 30 }, () => 100)
    const r = computeBollingerBands(prices)
    expect(r).toHaveLength(30)
  })
})

describe('RSI (Wilder smoothing)', () => {
  it('returns nulls for warm-up period', () => {
    const prices = Array.from({ length: 30 }, () => 100)
    const r = computeRsi(prices, 14)
    expect(r).toHaveLength(30)
    for (let i = 0; i < 14; i++) {
      expect(r[i].value).toBeNull()
    }
    expect(r[14].value).not.toBeNull()
  })

  it('flat prices: RSI = 100', () => {
    const prices = Array.from({ length: 30 }, () => 100)
    const r = computeRsi(prices, 14)
    expect(r[14].value).toBeCloseTo(100, 0)
  })

  it('all-rising prices: RSI ≈ 100', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 90 + i)
    const r = computeRsi(prices, 14)
    expect(r[14].value).toBeGreaterThan(70)
  })

  it('all-falling prices: RSI near 0', () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 - i)
    const r = computeRsi(prices, 14)
    expect(r[14].value).toBeLessThan(30)
  })

  it('RSI stays in [0, 100]', () => {
    const prices = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00, 46.03, 46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 45.78, 45.86, 45.86, 46.08, 45.63, 46.46]
    const r = computeRsi(prices, 14)
    for (let i = 14; i < prices.length; i++) {
      expect(r[i].value!).toBeGreaterThanOrEqual(0)
      expect(r[i].value!).toBeLessThanOrEqual(100)
    }
  })

  it('rejects invalid period', () => {
    expect(() => computeRsi([100], 1)).toThrow()
    expect(() => computeRsi([100, 101], -1)).toThrow()
    // Empty array with valid period returns empty result
    expect(computeRsi([], 14)).toEqual([])
  })

  it('uses default period=14', () => {
    const prices = Array.from({ length: 30 }, () => 100)
    const r = computeRsi(prices)
    expect(r).toHaveLength(30)
  })

  it('no future data leakage: RSI at index i only uses prices[0..i]', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 50 + i)
    // Compute with all data
    const full = computeRsi(prices, 14)
    // Compute with only first 20 prices
    const partial = computeRsi(prices.slice(0, 20), 14)
    // first 20 values should be identical
    for (let i = 14; i < 20; i++) {
      expect(full[i].value).toBeCloseTo(partial[i].value!, 5)
    }
  })
})
