/* ============================================================
   生产构建 mock 隔离校验（Milestone 2）
   断言 dist 产物中不包含 mock 场景 fixture 文本。
   ============================================================ */
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
if (!fs.existsSync(distDir)) {
  console.error('dist 不存在，请先执行 `npm run build`')
  process.exit(1)
}

const FORBIDDEN = [
  // M1 markers
  'Momentum-ATR',
  'MeanReversion-Vol',
  '清仓后再入场',
  '对账失败：券商与账户对账不一致',
  '杠杆/反向产品方向反复',
  // M2 markers
  'idem-momentum-atr-nvda-20260723',
  'lb-ord-001',
  'int-20260724-001',
  'bt-20260724-001',
  'daily_trend_v1',
  'AI/半导体',
  'trade-bt-20260724-001-01',
  'idem-daily-trend-aapl-20260719',
  // M2.1 markers + clock
  'CRYPTO:BTC-USD',
  'mulberry32',
  'PRESET_SYMBOLS',
  'basePrice',
  '生成K线',
  'DEV_MARKET_CLOCK',
  'fixtures-candles',
  'fetchCandlesMock',
  'fetchInstrumentsMock',
]

const jsDir = path.join(distDir, 'assets')
const files = fs.existsSync(jsDir) ? fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')) : []
let leaked = []
for (const f of files) {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8')
  for (const marker of FORBIDDEN) {
    if (content.includes(marker)) leaked.push(`${f}: ${marker}`)
  }
}

if (leaked.length) {
  console.error('❌ 生产构建仍包含 mock fixture 文本：\n' + leaked.join('\n'))
  process.exit(1)
}
console.log('✅ 生产构建未包含 mock fixture 文本（已摇树移除）')
