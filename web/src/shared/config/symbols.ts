/* ============================================================
   品种注册表 — 全平台唯一品种定义
   只包含 US 股票 / ETF + BTC
   ============================================================ */

export interface SymbolInfo {
  canonical: string
  display: string
  assetClass: 'US_EQUITY' | 'US_ETF' | 'US_INDEX' | 'CRYPTO_BTC'
  currency: 'USD'
  tz: string
}

export const SYMBOL_REGISTRY: Record<string, SymbolInfo> = {
  'US:AAPL': {
    canonical: 'US:AAPL',
    display: 'Apple Inc.',
    assetClass: 'US_EQUITY',
    currency: 'USD',
    tz: 'America/New_York',
  },
  'US:MSFT': {
    canonical: 'US:MSFT',
    display: 'Microsoft Corp.',
    assetClass: 'US_EQUITY',
    currency: 'USD',
    tz: 'America/New_York',
  },
  'US:NVDA': {
    canonical: 'US:NVDA',
    display: 'NVIDIA Corp.',
    assetClass: 'US_EQUITY',
    currency: 'USD',
    tz: 'America/New_York',
  },
  'US:SPY': {
    canonical: 'US:SPY',
    display: 'SPDR S&P 500 ETF',
    assetClass: 'US_ETF',
    currency: 'USD',
    tz: 'America/New_York',
  },
  'US:QQQ': {
    canonical: 'US:QQQ',
    display: 'Invesco QQQ Trust',
    assetClass: 'US_ETF',
    currency: 'USD',
    tz: 'America/New_York',
  },
  'CRYPTO:BTC-USD': {
    canonical: 'CRYPTO:BTC-USD',
    display: 'Bitcoin / USD',
    assetClass: 'CRYPTO_BTC',
    currency: 'USD',
    tz: 'UTC',
  },
}
