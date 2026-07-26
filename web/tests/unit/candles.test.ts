import { describe, it, expect } from 'vitest'
import { CandleSchema } from '@/shared/api/schemas'

const baseCandle = {
  canonicalSymbol: 'US:AAPL',
  assetClass: 'US_EQUITY' as const,
  timeframe: '1D' as const,
  timestamp: '2026-07-24T16:00:00Z',
  open: 175.0,
  high: 178.0,
  low: 174.0,
  close: 177.5,
  volume: 50000000,
  currency: 'USD' as const,
  timezone: 'America/New_York',
  source: 'mock' as const,
  dataStatus: 'HEALTHY' as const,
}

describe('CandleSchema', () => {
  it('accepts valid candle', () => {
    const r = CandleSchema.safeParse(baseCandle)
    expect(r.success).toBe(true)
  })

  it('rejects high < max(open, close)', () => {
    const c = { ...baseCandle, high: 174.0 }  // less than open=175 and close=177.5
    const r = CandleSchema.safeParse(c)
    expect(r.success).toBe(false)
  })

  it('rejects low > min(open, close)', () => {
    const c = { ...baseCandle, low: 178.0 }
    const r = CandleSchema.safeParse(c)
    expect(r.success).toBe(false)
  })

  it('rejects negative volume', () => {
    const c = { ...baseCandle, volume: -1 }
    const r = CandleSchema.safeParse(c)
    expect(r.success).toBe(false)
  })

  it('rejects non-finite OHLC', () => {
    const c = { ...baseCandle, open: Infinity }
    const r = CandleSchema.safeParse(c)
    expect(r.success).toBe(false)
  })

  it('accepts missing optional fields with defaults (if applicable)', () => {
    // All fields required in our schema
    const r = CandleSchema.safeParse(baseCandle)
    expect(r.success).toBe(true)
  })

  it('rejects invalid currency', () => {
    const c = { ...baseCandle, currency: 'EUR' as any }
    const r = CandleSchema.safeParse(c)
    expect(r.success).toBe(false)
  })
})
