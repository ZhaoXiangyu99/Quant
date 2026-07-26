import type { Money, Currency } from '@/shared/api/types'

/** 币种符号（§6.1 / §6.4：所有金额必须带币种）。 */
const CURRENCY_SYMBOL: Record<Currency, string> = {
  USD: '$',
  CNY: '¥',
  HKD: 'HK$',
}

/**
 * 格式化金额。amount 为字符串真值，前端仅负责展示（§16）。
 * 两位小数点 + 千分位分组，配合 tabular-nums 对齐。
 */
export function formatMoney(money: Money | undefined | null): string {
  if (!money) return '—'
  const symbol = CURRENCY_SYMBOL[money.currency] ?? ''
  const num = Number(money.amount)
  if (!Number.isFinite(num)) return `${symbol}—`
  const grouped = Math.abs(num).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const sign = num < 0 ? '-' : ''
  return `${sign}${symbol}${grouped}`
}

/** 仅币种符号，用于紧凑展示。 */
export function currencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOL[currency] ?? ''
}

/** 百分比（无符号），默认 2 位小数。 */
export function formatPercent(pct: number, digits = 2): string {
  if (!Number.isFinite(pct)) return '—'
  return `${pct.toFixed(digits)}%`
}

/** 带符号百分比（盈亏用），非负加 +，负自动带 -。 */
export function formatSignedPercent(pct: number, digits = 2): string {
  if (!Number.isFinite(pct)) return '—'
  const sign = pct >= 0 ? '+' : ''
  return `${sign}${pct.toFixed(digits)}%`
}

/** 千分位整数/小数。 */
export function formatNumber(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

/** 日期（YYYY-MM-DD）。 */
export function formatDate(iso: string): string {
  if (!iso) return '—'
  return iso.slice(0, 10)
}

/** 日期时间（YYYY-MM-DD HH:mm），使用浏览器本地时区（仅用于非交易时间的次要展示）。 */
export function formatDateTime(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * 按指定时区格式化日期时间，并附加时区缩写标签（首期固定 America/New_York，显示 ET/EDT/EST）。
 * 不依赖运行浏览器本地时区（§复验 P1-4：交易执行时间必须按 system.marketTimezone 展示）。
 * 例：'2026-07-27T14:30:00Z' → '2026-07-27 10:30 EDT'
 */
export function formatMarketTime(iso: string, timeZone = 'America/New_York'): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const dtf = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = dtf.formatToParts(d)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const date = `${get('year')}-${get('month')}-${get('day')}`
  const time = `${get('hour')}:${get('minute')}`
  const tzName = new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName')?.value ?? ''
  return `${date} ${time} ${tzName}`.trim()
}

/** 延迟秒数 -> 可读文本。 */
export function formatDelay(seconds: number): string {
  if (seconds <= 0) return '实时'
  if (seconds < 60) return `延迟 ${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `延迟 ${m}m` : `延迟 ${m}m${s}s`
}
