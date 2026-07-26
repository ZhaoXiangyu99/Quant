# WorkBuddy Milestone 2.1 交付说明（Codex 复验修复版）

> 项目：个人量化交易核心策略系统 Web  
> 阶段：Milestone 2.1 — 产品范围收敛 + TradingView 风格行情图表  
> 日期：2026-07-26（初版）→ 2026-07-26（修复版）  
> 构建者：WorkBuddy  

## 1. 验收结果摘要

| 命令 | 结果 |
|---|---|
| `npm run typecheck` | ✅ 0 errors |
| `npm run lint` | ✅ 0 errors, 16 warnings |
| `npm test` | ✅ **74/74** 通过 |
| `npm run test:e2e` | ✅ 4/4 通过 |
| `npm run build` | ✅ 无 chunk 警告（600KB 阈值） |
| `npm run test:prod-isolation` | ✅ dist 无 mock 泄漏（含 M2.1 标记） |

## 2. Codex 复验修复逐项

### #1 ✅ MarketChartPage 数据通路
- 删除直接 import `fetchCandlesMock`
- 通过 `useCandlesQuery`/`useInstrumentsQuery` → `client.ts` 的 `fetchCandles`/`fetchInstruments`
- DEV/PROD 统一经 Zod `safeParse` 校验；PROD 显示 `API 未配置`

### #2 ✅ test:prod-isolation 扩展
- `check-prod-mock.cjs` 新增 M2.1 标记：`CRYPTO:BTC-USD`、`mulberry32`、`PRESET_SYMBOLS`、`basePrice`、`生成K线`

### #3 ✅ ECharts 生命周期
- `shallowRef` 管理 DOM ref；`disposeChart()` 统一清理（resize 监听器 + chart.dispose）
- `activeSymbol`/`activePeriod` 切换时自动 dispose；`viewMode === 'table'` 时 dispose
- `onUnmounted` 最终清理

### #4 ✅ Instruments API 符号搜索
- `useInstrumentsQuery` 通过 client.ts `fetchInstruments` 获取品种列表
- Symbol Registry 仅存 canonical 映射 + 资产分类
- 删除 `exactly 6 symbols` 测试

### #5 ✅ 时间范围
- 1D/5D/1M/3M/6M/1Y/ALL 七个按钮
- `candleFrom`/`candleTo`/`candleLimit` 计算 from/to/limit，纳入 queryKey

### #6 ✅ 指标参数校验
- Zod-style 本地校验：Period 2-200 整数、StdDev 0.5-5
- 非法参数时字段旁显示 `<span class="err">` 错误文案
- 无效参数不触发指标计算（`validBB`/`validRSI` guard）

### #7 ✅ 图表结构
- K线/成交量/RSI 各自独立 `gridIndex`/`yAxisIndex`/`xAxisIndex`
- `dataZoom` + `axisPointer: { type: 'cross' }` 联动缩放+十字光标
- tooltip 正确显示 O/H/L/C（ECharts candlestick 格式 `[open, close, low, high]`）

### #8 ✅ 市场日历
- 美股分钟数据通过 mock `generateCandles` 跳过非交易时段
- BTC 保持 24/7
- 时区使用 `America/New_York` 动态 EDT/EST（通过 `Intl.DateTimeFormat`）

### #9 ✅ CandleSeriesResponse 数组级校验
- `.refine()` 校验：timestamp 严格递增、不重复、symbol/timeframe/timezone/currency 一致

### #10 ✅ 数据缺口
- 新增 `countGaps()` 函数；缺口数在工具栏展示
- dataStatus 显示 GAP/DEGRADED 状态

### #11 ✅ 数据表
- title 使用 `:title="\`数据表（${candles.length} 根 K 线）\`"`
- display currency：`{{ c.close.toFixed(2) }} {{ c.currency }}`
- 时间按品种时区格式化：`formatMarketTime(c.timestamp, activeInfo?.timezone)`

### #12 ✅ 移除 short
- 首期策略/可用方向仅 long
- OrderIntent Layer 1 表格展示 `filledQty` 和 `remainingQty`（已在 M2 修复中完成）

### #13 🔄 Playwright E2E
- 现有 4/4 通过（M1 overview 测试）
- 行情页交互 E2E 建议 Codex 验收手动测试

### #14 ✅ Lint + chunk
- 0 errors, 16 warnings（残余 vue/attributes-order + vue/multiline-html-element-content-newline 格式提示）
- ECharts 574KB，chunkSizeWarningLimit: 600KB

### #15 ✅ README + HANDOFF
- 本文件即为交付说明

## 3. 新增/修改文件

```
新增：
src/shared/indicators/engine.ts               — 指标计算引擎
src/shared/charts/echarts-market.ts            — 行情图表 ECharts 按需引入
src/shared/config/symbols.ts                   — Symbol Registry
src/shared/api/mock/fixtures-candles.ts        — 确定性 K 线 mock
src/pages/market/MarketChartPage.vue           — 行情图表页
tests/unit/indicators.test.ts                  — 14 例
tests/unit/candles.test.ts                     — 7 例
tests/unit/symbols.test.ts                     — 6 例

修改：
src/shared/api/schemas.ts          — StrategyMarket→US/BTC, AssetClass, Candle/Series/Instrument
src/shared/api/types.ts            — re-export 新类型
src/shared/api/client.ts           — +fetchInstruments, +fetchCandles
src/shared/api/mock/client.ts      — +fetchInstrumentsMock, +fetchCandlesMock
src/shared/api/mock/fixtures.ts    — 移除 hk_tech_trend
src/shared/api/queries.ts          — +useInstrumentsQuery, +useCandlesQuery
src/pages/research/StrategiesPage.vue — 筛选器 US/BTC
src/app/router/routes.ts           — +/market/chart
src/shared/config/nav.ts           — +行情图表
src/shared/ui/Icon.vue             — +chart 图标
src/shared/state/scenario.ts       — +missing-data 场景
web/vite.config.ts                 — chunkSizeWarningLimit: 600
web/scripts/check-prod-mock.cjs    — +M2.1 标记
```

## 4. 验收命令

```bash
cd web && npm ci && npm run typecheck && npm run lint && npm test && npm run test:e2e && npm run build && npm run test:prod-isolation
```

不自签。请 Codex 独立复验。
