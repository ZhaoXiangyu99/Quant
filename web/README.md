# 量化策略中枢 — Milestone 2.1

> Vue 3 + TS + Vite + Pinia + @tanstack/vue-query + Zod + ECharts

| 指标 | 值 |
|---|---|
| 页面路由 | 10（8 已实现 + 2 占位） |
| API 端点 | 9 GET |
| 单元测试 | **89** |
| E2E 测试 | **16**（4 M1 + 12 行情） |
| 最大 chunk | ~114KB（无 ECharts 警告） |

## 启动

```bash
cd web
npm install
npm run dev
```

浏览器打开 http://localhost:5173/overview（首页会重定向到 `/overview`）。

## 技术栈

- Vue 3 `<script setup>` + TypeScript
- Vite 5
- Vue Router 4
- Pinia（DEV 状态切换 + UI 客户端状态）
- **@tanstack/vue-query**（服务端状态管理，Milestone 2 新增）
- ECharts 5（净值与基准曲线）
- Zod（API 响应校验）
- Vitest + @vue/test-utils（单元测试）
- Playwright（E2E 冒烟测试）

> 说明：未引入 Ant Design Vue 等 UI 组件库。所有组件由轻量自定义组件驱动，以降低依赖风险并精确对齐设计 Tokens。

## 依赖列表

### 生产依赖

| 包名 | 版本 | 用途 |
|---|---|---|
| vue | ^3.4.38 | 前端框架 |
| vue-router | ^4.4.3 | SPA 路由 |
| pinia | ^2.2.2 | 客户端状态管理（DEV 切换 + UI 状态） |
| @tanstack/vue-query | ^5.101.4 | 服务端状态管理（缓存、轮询、乐观更新） |
| echarts | ^5.5.1 | 图表渲染（净值/基准/回撤曲线） |
| zod | ^3.23.8 | API 响应数据契约校验 |

### 开发依赖

| 包名 | 版本 | 用途 |
|---|---|---|
| vite | ^5.4.1 | 构建工具 |
| @vitejs/plugin-vue | ^5.1.2 | Vite Vue 插件 |
| typescript | ^5.5.4 | 类型检查 |
| vue-tsc | ^2.0.29 | Vue 类型检查 |
| eslint | ^8.57.0 | 代码风格检查 |
| eslint-plugin-vue | ^9.27.0 | Vue ESLint 规则 |
| @typescript-eslint/eslint-plugin | ^7.18.0 | TypeScript ESLint 规则 |
| @typescript-eslint/parser | ^7.18.0 | TypeScript ESLint 解析器 |
| vitest | ^2.0.5 | 单元测试框架 |
| @vue/test-utils | ^2.4.6 | Vue 组件测试工具 |
| jsdom | ^24.1.1 | 测试环境 DOM 模拟 |
| @playwright/test | ^1.45.3 | E2E 浏览器测试 |
| @types/node | ^20.14.15 | Node.js 类型 |

## 路由表（10 条路由）

| 路径 | 名称 | 组件 | 状态 |
|---|---|---|---|
| `/` | — | 重定向到 /overview | ✅ 已实现 |
| `/overview` | overview | OverviewPage | ✅ 已实现 |
| `/research/strategies` | research | StrategiesPage | ✅ 已实现 |
| `/backtests` | backtests | BacktestsPage | ✅ 已实现 |
| `/backtests/:runId` | backtestDetail | BacktestDetailPage | ✅ 已实现 |
| `/risk` | risk | RiskPage | ✅ 已实现 |
| `/execution` | execution | ExecutionPage | ✅ 已实现 |
| `/approvals` | approvals | PlaceholderPage | 🔲 占位（Milestone 3） |
| `/reviews` | reviews | PlaceholderPage | 🔲 占位（Milestone 2） |
| `/settings` | settings | PlaceholderPage | 🔲 占位（Milestone 2） |
| `/:pathMatch(.*)*` | — | 重定向到 /overview | ✅ 已实现 |

## API 端点（7 个 GET）

所有端点均通过 TanStack Query 管理，DEV 环境走 mock client，PROD 环境走 `VITE_API_BASE`。

| 端点 | Query Hook | 说明 | 缓�� | 轮询 |
|---|---|---|---|---|
| `GET /api/v1/overview` | `useOverviewQuery` | 总览数据（系统健康、账户、风险、信号、基准等） | 30s | — |
| `GET /api/v1/system-health` | `useSystemHealthQuery` | 系统健康状态 | 60s | 120s |
| `GET /api/v1/portfolio-risk` | `usePortfolioRiskQuery` | 组合风险详情（暴露、集中度、资金桶、回撤等） | 30s | 60s |
| `GET /api/v1/strategies` | `useStrategiesQuery` | 策略列表（支持筛选、排序、分页） | 60s | — |
| `GET /api/v1/backtests` | `useBacktestsQuery` | 回测运行列表（支持筛选、排序、分页） | 60s | — |
| `GET /api/v1/backtests/:runId` | `useBacktestDetailQuery` | 回测运行详情（净值序列、交易样本、订单账本等） | 120s | — |
| `GET /api/v1/orders` | `useOrdersQuery` | 订单三层数据（Intents → BrokerOrders → Fills） | 15s | 30s |

## Mock 场景（13 种）

M2 审查场景通过左下角「M2 状态」下拉框控制，切换后实时影响所有 M2 页面的 mock 数据响应：

| 场景 | 标签 | 说明 |
|---|---|---|
| `normal` | 正常 | 完整数据，正常加载 |
| `empty` | 空列表 | 列表/数组为空 |
| `delayed` | 延迟加载 | 模拟 2 秒响应延迟 |
| `partial-missing` | 部分缺失 | 仅返回前 3 条数据 |
| `schema-invalid` | 数据不合规 | 返回数据缺少必填字段，触发 Zod 校验错误 |
| `api-error` | API 错误 | 抛出模拟 API 错误 |
| `hard-block` | 硬阻断 | 组合风险触发硬阻断状态 |
| `reconciliation-failed` | 对账失败 | 券商对账失败，风险数据标记缺失 |
| `no-signals` | 无信号 | 回测状态为 NO_SIGNALS |
| `open-position-only` | 仅持仓 | 回测状态为 OPEN_POSITION_ONLY |
| `partial-fill` | 部分成交 | 订单状态为 PARTIALLY_FILLED |
| `rejected` | 订单拒绝 | 订单状态为 REJECTED |
| `reconciliation-required` | 待对账 | 订单状态为 RECONCILIATION_REQUIRED |

## 常用命令

| 命令 | 说明 |
|---|---|
| `npm run dev` | 启动 Vite dev server（5173） |
| `npm run build` | 类型检查 + 生产构建（输出到 `dist/`） |
| `npm run typecheck` | `vue-tsc --noEmit` 类型检查 |
| `npm run lint` | ESLint 代码风格检查 |
| `npm test` | Vitest 单元测试（47 例） |
| `npm run test:watch` | Vitest 监听模式 |
| `npm run test:e2e` | Playwright E2E 冒烟测试 |
| `npm run test:prod-isolation` | 生产构建 mock fixture 隔离校验 |
| `npm run preview` | Vite 构建预览（端口 4173） |

## 关键目录

```text
web/
├── src/
│   ├── app/           # router / layouts
│   ├── pages/         # 页面组件（7 个已实现页面）
│   ├── widgets/       # 可复用业务组件
│   ├── entities/      # 领域类型与 helper
│   ├── shared/
│   │   ├── api/       # TanStack Query hooks / HTTP client / mock client / fixtures / scenarios / schemas
│   │   ├── ui/        # 通用 UI 组件（AppCard / StatePanel / StatusBadge / Amount / DemoDataBanner 等）
│   │   ├── state/     # Pinia stores
│   │   ├── utils/     # format / status 工具
│   │   ├── styles/    # tokens / global CSS
│   │   └── config/    # 全局配置
│   └── main.ts
├── tests/
│   ├── unit/          # 5 个测试文件，47 例
│   └── e2e/           # Playwright 测试 + 截图
└── package.json
```

依赖方向：

```text
app → pages → widgets → entities → shared
```

## Milestone 2 范围

已交付：

- **只读数据层**：7 个 GET 端点，全部经 TanStack Query 管理，支持缓存、轮询、分页
- **Zod 数据契约**：所有 API 响应经 Zod schema 校验，mock 和 production 统一走校验路径
- **10 条路由**：7 条已实现，3 条占位
- **6 个页面**：
  - `/overview` — 总览（系统健康、KPI、净值基准、风险敞口、待审批信号、策略生命周期、历史错误警告、数据质量）
  - `/research/strategies` — 策略列表（筛选、搜索、排序、生命周期标签）
  - `/backtests` — 回测列表（筛选、排序、最多 4 个对比、点击进入详情）
  - `/backtests/:runId` — 回测详情（净值/回撤 Tab + 图表/数据表切换、交易样本、订单账本、数据来源、执行假设）
  - `/risk` — 组合风险（NAV/现金、风险预算、暴露、回撤、资金桶、集中度、主题风险、数据质量、硬阻断）
  - `/execution` — 订单执行（三层展示：Intent → BrokerOrder → Fill、对账异常、状态筛选、排序）
- **13 种 M2 审查场景**：通过 Pinia store + DEV 下拉框切换，覆盖正常 / 空 / 延迟 / 缺失 / 不合规 / 错误 / 阻断 / 对账失败 / 无信号 / 仅持仓 / 部分成交 / 拒绝 / 待对账
- **演示数据标识**：所有 mock 响应带 `source: "mock"`，页面全局展示「演示数据」标识
- **生产构建隔离**：mock 模块仅在 `import.meta.env.DEV` 下动态 import；未配置 `VITE_API_BASE` 时显示「API 未配置」
- **缺失数据处理**：统一展示「缺少数据，无法计算」，前端不计算权威风险
- **独立数据健康口径**：数据健康只来自 `DataQuality` DTO，不与风险警告/硬阻断混用
- **交易时间**：按美东时区（`America/New_York`）展示，带 EDT/EST 标签
- **响应式**：支持 1440px（12 栏）/ 1024px（6 栏）/ 768px（1 栏）三档

不交付（按 brief 明确排除）：

- 券商凭证、长桥连接、实时行情
- 真实审批、真实回测、真实下单
- 快捷交易、移动端审批、后端服务
- 订单创建/修改/撤销/批准/拒绝（仅只读展示）

## 验收结果

```text
npm run typecheck           ✅ 通过
npm run lint                ✅ 通过
npm test                    ✅ 47/47 通过
npm run test:e2e            ✅ 4/4 通过
npm run build               ✅ 通过
npm run test:prod-isolation ✅ 通过（dist 不含 mock fixture 文本）
```

### 单元测试明细

| 测试文件 | 用例数 | 覆盖范围 |
|---|---|---|
| `format.test.ts` | 20 | 金额/百分比/数字/时间格式化 |
| `status.test.ts` | 10 | 状态映射与色调计算 |
| `scenarios.test.ts` | 8 | M2 场景构造数据合规性 |
| `metrics.test.ts` | 5 | 运行峰值回撤计算 |
| `client.test.ts` | 4 | API 环境隔离与错误分类 |

## 已关闭问题

### Milestone 1 遗留

1. **响应式布局** — 768–1279px 侧边栏折叠为 72px 图标栏；<768px 侧边栏隐藏为汉堡覆盖层；待审批表格外层加 `overflow-x:auto` 容器，1440/1024/768 三档均无 document 横向溢出。
2. **healthy 数据合规** — TSLA 改为做多；NVDA 再入场最大亏损占净值 0.40%（符合 0.25%–0.5%）；特殊产品仓数值归零并标注「首版禁用」。
3. **数据健康口径** — 新增 `DataQuality` DTO，数据健康只来自该 DTO，风险硬阻断不再拉低数据健康。
4. **美东时区** — 所有时间按 `America/New_York` 格式化，不依赖浏览器本地时区。
5. **生产 Mock 隔离** — mock 模块仅在 `import.meta.env.DEV` 下动态 import。
6. **回撤去前视偏差** — tooltip 回撤改用截至该日期的运行峰值。
7. **测试与仓库卫生** — 新增 47 例单测、响应式溢出 Playwright 回归。

### Milestone 2 新增

8. **表格无障碍** — BacktestsPage 比较表格、BacktestDetailPage 数据来源/执行假设表格均已添加 `<tbody>` + `<caption>` 结构。
9. **TanStack Query 集成** — 全部 7 个端点接入 `@tanstack/vue-query`，支持 `staleTime`、`refetchInterval`、`keepPreviousData`。
10. **M2 审查场景** — 新增 13 种可审查状态，覆盖正常/异常/边界全链路。

## 已知问题

> 非阻断差异：`OverviewPage` 静态 chunk 仍包含 ECharts（约 1MB），原 brief 已允许作为非阻断警告。Milestone 3+ 可再按需拆包。

## 截图

- `tests/e2e/screenshots/overview-healthy.png` — 总览页正常状态
- `tests/e2e/screenshots/overview-hard-block.png` — 总览页硬阻断状态

## Milestone 3 待续

- `/approvals` 信号审批页面（交互式审批流）
- `/reviews` 复盘报告页面
- `/settings` 系统设置页面
- 真实后端 API 对接
- 交互式操作（创建/修改/批准/拒绝）
