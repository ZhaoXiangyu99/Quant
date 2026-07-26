import { describe, it, expect } from 'vitest'
import {
  formatMoney,
  formatPercent,
  formatSignedPercent,
  formatNumber,
  formatDelay,
  formatDate,
  formatMarketTime,
} from '@/shared/utils/format'
import type { Money } from '@/shared/api/types'

describe('formatMoney', () => {
  it('带币种符号与千分位、两位小数', () => {
    const m: Money = { amount: '301245.67', currency: 'USD' }
    expect(formatMoney(m)).toBe('$301,245.67')
  })
  it('人民币使用 ¥', () => {
    expect(formatMoney({ amount: '1234.5', currency: 'CNY' })).toBe('¥1,234.50')
  })
  it('港币使用 HK$', () => {
    expect(formatMoney({ amount: '9800', currency: 'HKD' })).toBe('HK$9,800.00')
  })
  it('负数保留负号', () => {
    expect(formatMoney({ amount: '-960.12', currency: 'USD' })).toBe('-$960.12')
  })
  it('缺失金额返回 —', () => {
    expect(formatMoney(null)).toBe('—')
    expect(formatMoney(undefined)).toBe('—')
  })
  it('非有限数字返回 —', () => {
    expect(formatMoney({ amount: 'NaN', currency: 'USD' })).toBe('$—')
  })
})

describe('百分比格式化', () => {
  it('formatPercent 无符号', () => {
    expect(formatPercent(12.345)).toBe('12.35%')
    expect(formatPercent(0)).toBe('0.00%')
  })
  it('formatSignedPercent 正加 + 负自动带 -', () => {
    expect(formatSignedPercent(1.4)).toBe('+1.40%')
    expect(formatSignedPercent(-0.32)).toBe('-0.32%')
    expect(formatSignedPercent(0)).toBe('+0.00%')
  })
  it('非有限返回 —', () => {
    expect(formatPercent(NaN)).toBe('—')
    expect(formatSignedPercent(Infinity)).toBe('—')
  })
})

describe('formatNumber', () => {
  it('千分位分组', () => {
    expect(formatNumber(1234567.891)).toBe('1,234,567.89')
  })
})

describe('formatDelay', () => {
  it('0 为实时', () => {
    expect(formatDelay(0)).toBe('实时')
  })
  it('秒', () => {
    expect(formatDelay(45)).toBe('延迟 45s')
  })
  it('分钟与秒', () => {
    expect(formatDelay(1800)).toBe('延迟 30m')
    expect(formatDelay(1815)).toBe('延迟 30m15s')
  })
})

describe('formatDate', () => {
  it('截取 YYYY-MM-DD', () => {
    expect(formatDate('2026-07-24T20:00:00Z')).toBe('2026-07-24')
  })
  it('空返回 —', () => {
    expect(formatDate('')).toBe('—')
  })
})

describe('formatMarketTime（按系统市场时区，不依赖浏览器本地时区，§复验 P1-4）', () => {
  it('美东时间：UTC 14:30 夏季 -> 10:30 EDT', () => {
    const out = formatMarketTime('2026-07-27T14:30:00Z', 'America/New_York')
    expect(out).toBe('2026-07-27 10:30 EDT')
  })
  it('同一时刻在 Asia/Shanghai 应显示 22:30，证明与时区相关而非本地时区', () => {
    const out = formatMarketTime('2026-07-27T14:30:00Z', 'Asia/Shanghai')
    expect(out).toContain('22:30')
    expect(out).not.toContain('10:30')
  })
  it('默认时区为 America/New_York', () => {
    expect(formatMarketTime('2026-07-27T14:30:00Z')).toBe('2026-07-27 10:30 EDT')
  })
  it('空返回 —', () => {
    expect(formatMarketTime('')).toBe('—')
  })
  it('非法时间原样返回', () => {
    expect(formatMarketTime('not-a-date')).toBe('not-a-date')
  })
})
