import { describe, it, expect } from 'vitest'
import { CandleSeriesResponseSchema } from '@/shared/api/schemas'

const baseSeries = {
  symbol: 'US:AAPL',
  timeframe: '1D' as const,
  from: '2026-01-01T00:00:00Z',
  to: '2026-07-26T23:59:59Z',
  timezone: 'America/New_York',
  source: 'mock' as const,
  dataStatus: 'HEALTHY' as const,
  availableAt: '2026-07-26T23:59:59Z',
  candles: [
    {
      canonicalSymbol: 'US:AAPL', assetClass: 'US_EQUITY' as const, timeframe: '1D' as const,
      timestamp: '2026-07-24T16:00:00Z', open: 174, high: 178, low: 173, close: 177,
      volume: 50000000, currency: 'USD' as const, timezone: 'America/New_York',
      source: 'mock' as const, dataStatus: 'HEALTHY' as const,
    },
    {
      canonicalSymbol: 'US:AAPL', assetClass: 'US_EQUITY' as const, timeframe: '1D' as const,
      timestamp: '2026-07-25T16:00:00Z', open: 177, high: 180, low: 176, close: 179,
      volume: 48000000, currency: 'USD' as const, timezone: 'America/New_York',
      source: 'mock' as const, dataStatus: 'HEALTHY' as const,
    },
  ],
}

describe('CandleSeriesResponseSchema', () => {
  it('accepts valid series', () => {
    expect(CandleSeriesResponseSchema.safeParse(baseSeries).success).toBe(true)
  })

  it('rejects duplicate timestamps', () => {
    const s = JSON.parse(JSON.stringify(baseSeries))
    s.candles[1].timestamp = s.candles[0].timestamp
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('rejects reverse order', () => {
    const s = JSON.parse(JSON.stringify(baseSeries))
    s.candles[1].timestamp = '2026-07-23T16:00:00Z' // older than first
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('rejects first candle symbol mismatch', () => {
    const s = JSON.parse(JSON.stringify(baseSeries))
    s.candles[0].canonicalSymbol = 'US:MSFT'
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('accepts single candle with correct metadata', () => {
    const s = JSON.parse(JSON.stringify(baseSeries))
    s.candles = [baseSeries.candles[0]]
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(true)
  })

  it('rejects single candle with wrong symbol', () => {
    const s = JSON.parse(JSON.stringify(baseSeries))
    s.candles = [{ ...baseSeries.candles[0], canonicalSymbol: 'US:MSFT' }]
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('rejects invalid from date', () => {
    const s = { ...baseSeries, from: 'not-a-date' }
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('rejects invalid to date', () => {
    const s = { ...baseSeries, to: 'bad' }
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('rejects invalid availableAt', () => {
    const s = { ...baseSeries, availableAt: 'yesterday' }
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })

  it('accepts empty candles array', () => {
    const s = { ...baseSeries, candles: [] }
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(true)
  })

  it('rejects candle with wrong timeframe', () => {
    const s = JSON.parse(JSON.stringify(baseSeries))
    s.candles[0].timeframe = '1h'
    expect(CandleSeriesResponseSchema.safeParse(s).success).toBe(false)
  })
})
