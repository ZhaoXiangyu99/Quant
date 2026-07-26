# WorkBuddy Milestone 2 实施任务单

> 项目：个人量化交易核心策略系统 Web  
> 工作目录：`/Users/zhaoxiangyu/Documents/invest/web`  
> 阶段：Milestone 2 — 只读数据层  
> 前置状态：Milestone 1 已通过 Codex 二次验收

## 1. 本阶段目标

把 Milestone 1 的只读总览原型升级为一个可扩展、可验证的“只读控制台”：

1. 建立生产只读 HTTP API 客户端和运行时 Schema 校验；
2. 让 SystemHealth、AccountSnapshot、PortfolioRiskSummary 具有正式数据契约；
3. 完成组合风险、策略列表、回测列表、回测详情和订单状态页面；
4. 开发环境继续使用明确标记的 Mock Adapter；
5. 生产环境只接受配置的只读 API，不得回退到 Mock；
6. 所有页面只展示和查询，不产生交易、审批、回测执行或券商写操作。

本阶段的核心不是“功能数量”，而是建立可信的只读数据边界，使后续 Milestone 3 审批流程可以复用同一套 DTO、状态、错误处理和审计字段。

## 2. 开始前必须完整阅读

1. `AGENTS.md`
2. `量化交易核心策略系统设计.md`
3. `网页产品设计与WorkBuddy交接规范.md`
4. `WORKBUDDY_WEB_IMPLEMENTATION_BRIEF.md`
5. `WORKBUDDY_MILESTONE1_ACCEPTANCE_REVIEW.md`
6. `开单前检查表.md`
7. `交易复盘_2024至今.md`
8. `错失机会复盘_日线为主周线为辅.md`
9. `web/README.md`

如果设计图与书面规则冲突，以书面规则为准。

## 3. 必须交付的路由

### 3.1 `/overview`

保留 Milestone 1 已验收能力，同时完成：

- SystemHealth、AccountSnapshot、PortfolioRiskSummary 正式只读数据契约；
- 开发 Mock 与生产 HTTP Client 使用相同 Schema；
- API 返回值先经过 Zod 校验再进入页面；
- Schema 不合法时显示“数据契约校验失败”，不得静默使用部分字段；
- 不得在前端重算权威风险数字。

### 3.2 `/risk` — 组合风险

必须显示：

- 账户净值、现金与更新时间；
- 主动风险预算：已用、剩余、上限；
- 市值占比和风险预算占比，使用不同标签；
- 核心仓、主动仓、现金、特殊产品仓；
- Gross Exposure、Net Exposure；
- 单标的集中度；
- 主题合并风险；
- 当前回撤、峰值回撤；
- 数据质量和对账状态；
- 当前硬阻断与阻断原因；
- 缺失风险数据统一显示 `缺少数据，无法计算`。

Milestone 2 不实现“停止新增风险”写操作，只允许展示当前停止/阻断状态。

### 3.3 `/research/strategies` — 策略列表

列表字段：

- 策略名称；
- `strategy_id`；
- 当前版本；
- 生命周期；
- 市场与频率；
- 基准；
- 允许方向；
- 样本数；
- 最近样本外结果；
- 数据快照；
- 更新时间；
- 阻断原因。

功能：

- 按生命周期、市场、频率、状态筛选；
- 文本搜索；
- 可排序；
- 空状态、加载态、错误态和降级态；
- 点击只能进入只读详情占位或筛选回测，不能创建、修改、验证、运行或部署策略。

Milestone 2 不实现创建策略、新建版本、运行验证、生命周期申请或部署。

### 3.4 `/backtests` — 回测列表

筛选字段：

- 策略；
- 版本；
- 生命周期；
- 时间范围；
- 数据快照；
- 结果状态；
- 是否通过晋级标准。

列表至少显示：

- `run_id`；
- 策略和版本；
- 数据快照；
- 运行时间；
- 状态；
- CAGR；
- 最大回撤；
- 对 SPY 超额；
- Sharpe；
- 费用与滑点；
- 成交数；
- 同规则样本数；
- 晋级结论。

允许最多选择 4 个运行进行只读比较。Milestone 2 不实现“发起回测”。

### 3.5 `/backtests/:runId` — 回测详情

顶部摘要：

- CAGR；
- 最大回撤；
- 对 SPY 超额；
- Sharpe、Calmar；
- 换手；
- 费用与滑点；
- 成交数；
- 同规则样本数；
- 最大盈利集中度。

必须可见：

- `code_hash`；
- `config_hash`；
- `data_snapshot_id`；
- 信号生成和成交时序；
- commission/slippage；
- 被拒绝、延迟和未成交订单数量；
- `open-position-only` / `no-signals` 标识；
- 是否费用后；
- 基准；
- 数据时间和运行时间。

本阶段至少实现以下只读区域：

1. 净值与回撤；
2. 基准比较；
3. 交易样本；
4. 订单账本；
5. 数据来源；
6. 执行假设。

图表必须提供可访问的数据表替代视图。

### 3.6 `/execution` — 订单状态

只读展示并明确区分：

1. Order Intent；
2. Broker Order；
3. Fill。

字段至少包括：

- 幂等键；
- TradePlan ID；
- 风险决策；
- 请求数量；
- 成交数量；
- 剩余数量；
- 参考价；
- 限价；
- 成交均价；
- 费用；
- 状态；
- 延迟/拒绝原因；
- 修改次数；
- 券商订单 ID；
- 对账状态；
- 创建、更新时间。

支持状态：

```text
PROPOSED
AWAITING_APPROVAL
APPROVED
SUBMITTED
PARTIALLY_FILLED
FILLED
CANCELLED
EXPIRED
REJECTED
RECONCILIATION_REQUIRED
```

不得提供创建、提交、改单、撤单、批准、拒绝、重试订单等按钮。

## 4. 数据层要求

### 4.1 技术边界

- 使用 `@tanstack/vue-query` 管理服务端只读状态、缓存、刷新和错误；
- Pinia 继续只管理 UI/客户端状态；
- 使用 Zod 校验所有 HTTP 和 Mock 响应；
- 金额 API 真值继续使用 `{ amount, currency }`；
- 账户、风险、回测和订单对象必须带时间戳；
- 所有通用响应继续带：
  - `asOf`
  - `availableAt`
  - `source`
  - `dataStatus`
  - `requestId`

### 4.2 建议 DTO

在现有 DTO 基础上补齐：

- `PortfolioRiskSummary`
- `ExposureSummary`
- `ConcentrationRisk`
- `ThemeRisk`
- `StrategySummary`
- `BacktestRunSummary`
- `BacktestRunDetail`
- `BacktestTradeSample`
- `BacktestOrderLedgerItem`
- `OrderIntent`
- `BrokerOrder`
- `Fill`
- `ReconciliationIssue`
- 分页响应和筛选参数

DTO 与 Zod Schema 应放在清晰的 entities/shared contracts 边界，避免页面自己声明重复类型。

### 4.3 API Client

实现真正可调用的生产只读 HTTP Client：

- 从 `VITE_API_BASE` 读取基础地址；
- 只允许 `GET`；
- 支持 `AbortSignal`；
- 非 2xx、超时、网络错误、JSON 错误和 Schema 错误使用不同错误类型；
- 页面展示可理解的错误信息，但不得泄漏凭证、完整响应或内部堆栈；
- 不实现任何 Token、券商凭证或 Longbridge 连接；
- 不实现自动重试写操作；本阶段没有写操作。

建议只读端点：

```text
GET /api/v1/system-health
GET /api/v1/account-snapshot
GET /api/v1/portfolio-risk
GET /api/v1/strategies
GET /api/v1/backtests
GET /api/v1/backtests/:runId
GET /api/v1/orders
```

若没有真实后端，可在开发环境使用 Mock Adapter；生产 API 未配置或不可用时必须显示明确错误，不得回退到演示数据。

## 5. Mock 与审查状态

开发环境提供确定性、明确标记的 Mock 场景，至少覆盖：

- 正常；
- 空列表；
- 数据延迟；
- 部分字段缺失；
- Schema 不合法；
- API 错误；
- 硬阻断；
- 对账失败；
- 回测 `no-signals`；
- 回测 `open-position-only`；
- 订单部分成交；
- 订单拒绝；
- 订单待对账。

规则：

- Mock 响应必须显示 `演示数据`；
- Mock fixture 不得进入生产构建；
- 生产构建不得包含 DEV 状态切换组件和场景名称；
- 生产 URL 参数不得激活 Mock。

## 6. 交易安全与数据正确性

以下为不可协商要求：

- 页面不得出现直接买入、卖出、批准或提交订单按钮；
- 首期不得把做空、杠杆 ETF、反向 ETF 或特殊产品显示为可交易；
- 特殊产品仓继续显示“首版禁用”；
- 最大亏损同时显示金额和净值比例；
- 缺失风险数据不得由客户端猜测；
- 市值暴露与风险暴露不得混用；
- 所有交易和市场时间按 `America/New_York` 展示并附 EDT/EST；
- 回测指标必须标明费用前/后、时间窗口和基准；
- 不得用未来数据计算历史回撤或其他历史指标；
- 单次盈利或少量样本不得显示为稳定优势；
- 少于 20 个样本且未验证费用后正期望时，不得显示“可扩大”；
- 数据质量、交易风险、系统状态必须使用独立字段和视觉标签。

## 7. UI、响应式与无障碍

- 延续 Milestone 1 的深色机构金融风格和现有组件；
- 不要引入另一套冲突的视觉系统；
- 1440、1024、768 三档不得出现 document 级横向滚动；
- 宽表格只允许在组件内部滚动，或使用关键列 + 详情抽屉；
- Tablet 保持折叠 Sidebar；
- Mobile 保持只读；
- 状态不能只依赖颜色；
- 表格提供标题/列头；
- 图表提供数据表切换；
- 键盘可访问筛选、Tab 和详情；
- 焦点样式清晰。

## 8. Milestone 1 非阻断项顺手关闭

在不影响主要交付的前提下：

1. `DevStatePanel` 改为 DEV-only 动态导入，生产包中不得再出现 `审查状态` 和场景名称；
2. 使用 ECharts 按需引入或合理拆包，目标是生产构建不再出现单 chunk 超过 500KB 的警告。

## 9. 明确不做

Milestone 2 不实现：

- 真实券商连接或凭证；
- Longbridge 连接；
- 实时行情接入；
- 创建或修改策略；
- 策略版本和 Manifest 编辑；
- 发起真实回测；
- 真实审批；
- 批准/拒绝；
- 创建、提交、修改或撤销订单；
- 自动交易；
- 后端交易服务；
- 任意策略代码执行；
- 移动端风险增加操作。

## 10. 测试要求

### 单元测试

至少覆盖：

- 每个 Zod Schema 的正常、缺失字段和非法字段；
- Money、市场时区、状态格式化；
- 筛选和排序；
- 回撤无未来数据；
- 样本数与晋级标签；
- Mock 交易方向和特殊产品合规；
- API 错误分类；
- 生产环境不回退 Mock。

### 组件/集成测试

至少覆盖：

- 加载、空、延迟、错误、阻断、Schema 失败；
- 风险缺失数据固定文案；
- 策略列表筛选；
- 回测最多比较 4 个；
- 订单 Intent/Broker Order/Fill 分层；
- 所有禁止动作不出现。

### Playwright

至少覆盖：

1. Overview 生产只读客户端错误边界；
2. Risk 页面关键风险字段；
3. Strategy 列表筛选；
4. Backtest 列表进入详情；
5. Backtest 详情哈希、费用和数据来源；
6. Execution 页面三层订单状态；
7. 1440/1024/768 无 document 横向溢出；
8. 全部检查页面无 console/page errors。

### 生产隔离

构建后检查：

- 无 Mock fixture；
- 无 `DevStatePanel`；
- 无 `审查状态`；
- 无开发场景名称；
- 无券商凭证或交易写端点；
- 不产生 chunk size warning。

## 11. 验收命令

至少提供并通过：

```bash
cd web
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
npm run test:prod-isolation
```

如增加新检查脚本，应纳入 `package.json` 并在 README 中说明。

## 12. 验收完成条件

Milestone 2 完成必须同时满足：

- 本任务单第 3 节的页面全部完成；
- 只读 API Client 和 Zod Schema 可独立测试；
- 开发 Mock 与生产 Client 共享同一数据契约；
- 所有页面具备必要的状态和响应式处理；
- 无任何交易、审批或回测写操作；
- 所有自动化测试通过；
- 生产构建无 Mock/DEV 场景泄漏；
- README 已更新启动、环境变量、Mock、测试和页面说明；
- 提供主要页面截图；
- WorkBuddy 交付说明列出：
  - 文件变更；
  - 数据契约；
  - API 端点；
  - 测试结果；
  - 已知差异；
  - Milestone 3 前置条件。

## 13. WorkBuddy 完成后

不要自行宣称最终签收。完成实现和自测后：

1. 将完成情况写入 `.workbuddy/memory/`；
2. 在项目根目录新增 `WORKBUDDY_MILESTONE2_HANDOFF.md`；
3. 通知用户交由 Codex 做独立验收。
