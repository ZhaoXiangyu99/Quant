import { describe, it, expect } from 'vitest'
import { generateCandles } from '@/shared/api/mock/fixtures-candles'

describe('4h candles', () => {
  it('AAPL 4h returns non-empty', () => {
    const candles = generateCandles('US:AAPL', '4h', 50, 175)
    expect(candles.length).toBeGreaterThan(0)
    expect(candles.length).toBeLessThanOrEqual(50)
  })

  it('timestamps strictly increasing', () => {
    const candles = generateCandles('US:AAPL', '4h', 50, 175)
    for (let i = 1; i < candles.length; i++) {
      expect(candles[i].timestamp > candles[i - 1].timestamp).toBe(true)
    }
  })

  it('all timestamps at valid 4h anchors (09:30 or 13:30 EDT)', () => {
    const candles = generateCandles('US:AAPL', '4h', 50, 175)
    for (const c of candles) {
      const utc = new Date(c.timestamp)
      const ny = new Date(utc.getTime() - 4 * 3600000) // EDT
      const h = ny.getUTCHours()
      const m = ny.getUTCMinutes()
      const day = ny.getUTCDay()
      // Must not be weekend
      expect([0, 6]).not.toContain(day)
      // Must be 09:30 or 13:30 EDT
      expect(m).toBe(30)
      expect([9, 13]).toContain(h)
    }
  })

  it('timestamps are valid ISO datetime', () => {
    const candles = generateCandles('US:AAPL', '4h', 20, 175)
    for (const c of candles) {
      expect(() => new Date(c.timestamp)).not.toThrow()
      expect(isNaN(new Date(c.timestamp).getTime())).toBe(false)
    }
  })
})
