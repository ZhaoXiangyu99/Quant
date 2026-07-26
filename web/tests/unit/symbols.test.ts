import { describe, it, expect } from 'vitest'
import { SYMBOL_REGISTRY } from '@/shared/config/symbols'

describe('Symbol Registry', () => {
  it('contains only US equities, ETFs, indices, and BTC', () => {
    for (const s of Object.values(SYMBOL_REGISTRY)) {
      expect(['US_EQUITY', 'US_ETF', 'US_INDEX', 'CRYPTO_BTC']).toContain(s.assetClass)
    }
  })

  it('all US symbols use America/New_York timezone', () => {
    for (const s of Object.values(SYMBOL_REGISTRY)) {
      if (s.assetClass !== 'CRYPTO_BTC') {
        expect(s.tz).toBe('America/New_York')
      }
    }
  })

  it('BTC uses UTC timezone', () => {
    const btc = SYMBOL_REGISTRY['CRYPTO:BTC-USD']
    expect(btc).toBeDefined()
    expect(btc.tz).toBe('UTC')
  })

  it('BTC has canonical symbol CRYPTO:BTC-USD', () => {
    expect(SYMBOL_REGISTRY['CRYPTO:BTC-USD'].canonical).toBe('CRYPTO:BTC-USD')
  })

  it('all currencies are USD', () => {
    for (const s of Object.values(SYMBOL_REGISTRY)) {
      expect(s.currency).toBe('USD')
    }
  })

  it('has at least 1 BTC and several US symbols', () => {
    const keys = Object.keys(SYMBOL_REGISTRY)
    expect(keys.length).toBeGreaterThanOrEqual(2)
    expect(keys.some((k) => k.startsWith('US:'))).toBe(true)
    expect(keys.some((k) => k.startsWith('CRYPTO:'))).toBe(true)
  })
})
