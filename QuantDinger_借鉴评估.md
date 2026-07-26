# QuantDinger 借鉴评估

> 评估日期：2026-07-26  
> 参考项目：[OpenByteInc/QuantDinger](https://github.com/OpenByteInc/QuantDinger)  
> 官网：[quantdinger.com](https://www.quantdinger.com/)  
> 代码基线：评估时 `main` 最新可见提交 `23b1aad65c87ef9c5e5424830e99794075a0e632`

## 一句话结论

QuantDinger 值得借鉴的是交易系统的工程契约和运行安全机制，不是直接复用整个产品，也不是照搬它的内置策略。

建议：

- 不把 QuantDinger 安装成当前系统的核心依赖；
- 不复制其完整 Flask/PostgreSQL/双 Redis/Celery/Web/Mobile 架构；
- 吸收 Strategy Manifest、点时股票池、下一开盘成交、内容寻址快照、规范化订单意图、订单审计账本、幂等键、保护状态和长驻进程所有权等设计；
- 保留现有 Qlib + Vibe-Trading 研究路线和长桥执行适配；
- 对 QuantDinger 当前公开问题暴露出的会计、时序和模拟盘风险增加强制不变量测试。

## 1. 项目实际定位

QuantDinger 是一个完整的自托管交易产品，覆盖：

- AI 市场研究；
- Python 策略开发；
- 服务端回测；
- 模拟/实盘运行；
- Web、移动端、API 和 MCP；
- PostgreSQL 持久化；
- 独立 API、交易、调度和 Celery 进程；
- 可选 Prometheus、Grafana 和 Alertmanager。

它解决的是“多用户、多市场、多进程交易平台”的问题。我们的首期目标是“单用户、美股日线/周线、可审计策略核心”，两者的工程规模不同。

因此应当按模式选取，不应整体照搬。

## 2. 最值得借鉴的实现

| 能力 | QuantDinger 实现 | 本系统结论 |
|---|---|---|
| 策略清单 | 编译策略源码得到 universe、频率、基准、依赖、warm-up、方向和杠杆能力 | 立即采用 |
| 策略代码哈希 | SHA-256 生成 `code_hash` | 立即采用 |
| 点时股票池 | 动态 universe 按回测日期解析成员 | 立即采用 |
| 时间语义 | 已完成 K 线产生信号，下一根 K 线开盘成交 | 立即采用 |
| 数据快照 | 规范化数据后按内容哈希保存和校验 | 立即采用，扩展元数据 |
| 规范化动作 | `open/add/reduce/close` 与 long/short 明确区分 | 立即采用 |
| 目标仓位 API | 目标数量、目标金额、目标权重 | 立即采用 |
| 订单账本 | 记录 filled、partial、deferred、rejected 及原因 | 立即采用 |
| 幂等订单 | 持久化幂等键与唯一约束 | 立即采用 |
| 保护引擎 | 止损、止盈、跟踪止损、时间止损共用确定性语义 | 采用思想，重写实现 |
| 保守的日内触发顺序 | 同一根 K 线多个保护条件触发时优先不利结果 | 立即采用 |
| 进程所有权 | 租约、心跳、fencing token 防止多进程重复执行 | Phase 3 后采用 |
| Agent 最小权限 | Read/Write/Backtest/Trade 分权，实盘额外总开关 | 未来 MCP 阶段采用 |

### 2.1 Strategy Manifest

QuantDinger 的 `initialize(context)` 在编译阶段声明：

- 股票池；
- 订阅频率和字段；
- warm-up；
- 基准；
- 调度；
- 依赖因子；
- 允许方向；
- 是否允许杠杆和最大杠杆；
- 源码哈希。

这解决了“回测时选一个参数、实盘时悄悄换另一个参数”的问题。

我们的实现应拆成两份：

1. `StrategyManifest`：策略需要什么、最多能做什么；
2. `DeploymentPolicy`：本次部署实际允许什么，只能比 Manifest 更严格。

例如，策略声明支持最大 1 倍普通多头，不代表部署自动获得满仓权限；账户风控仍然有最终否决权。

参考实现：

- [Strategy V2 contract.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_v2/contract.py)
- [Strategy V2 models.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_v2/models.py)
- [Strategy API V2 开发指南](https://github.com/OpenByteInc/QuantDinger/blob/main/docs/trading/STRATEGY_DEV_GUIDE.md)

### 2.2 双层信号契约

QuantDinger 的动作模型比单纯的 `[-1, 1]` 信号更适合执行和审计：

```text
open_long
add_long
reduce_long
close_long
open_short
add_short
reduce_short
close_short
```

我们的系统不应放弃 Vibe 的连续信号，而应形成双层契约：

```text
AlphaSignal[-1, 1]
    -> 组合与风险引擎
    -> PositionProposal
    -> CanonicalTradeAction
    -> OrderIntent
```

连续信号适合排序，规范化动作适合执行。首版只允许多头动作，空头动作保留在类型系统中但由部署政策阻断。

参考实现：

- [signals.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_runtime/signals.py)

### 2.3 确定性事件时序

QuantDinger 明确规定：

1. 上一根 K 线结束后排队的订单先在当前开盘处理；
2. 当前 K 线完成后才对策略可见；
3. 当前 K 线产生的信号下一根开盘执行；
4. 同一根已完成 K 线不得重复触发。

这正好匹配我们日线策略需要的时序。我们的回测、模拟和实盘必须共享一个 `ClockPolicy`，不能分别写三套含糊逻辑。

同时增加两个标识：

- `signal_bar_end`：信号所依据 K 线的结束时间；
- `eligible_execution_at`：最早允许执行时间。

### 2.4 内容寻址数据快照

QuantDinger 对规范化 OHLCV 计算 SHA-256，并以哈希作为快照 ID。相同数据得到相同 ID，加载时重新校验哈希。

我们的版本不能只复制它的单表 JSON gzip，需要包含：

- 原始/复权价格；
- 公司行动；
- 交易日历与时区；
- 点时股票池；
- 数据源和抓取时间；
- 字段 schema 版本；
- 质量检查结果；
- 每张分区表的内容哈希；
- 总清单的 manifest hash。

参考实现：

- [snapshot.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_v2/snapshot.py)

### 2.5 订单账本与幂等键

QuantDinger 会把策略信号先保存为订单意图，再进入待执行队列，并以策略运行、标的、动作和信号时间组成幂等键。

我们的建议键：

```text
strategy_run_id
+ trade_plan_id
+ symbol
+ canonical_action
+ eligible_execution_at
+ revision
```

数据库或本地事务存储必须对该键设置唯一约束。API 重试、进程重启和网络超时都不能产生第二张订单。

订单账本必须同时保存：

- 请求数量；
- 可成交数量；
- 成交数量；
- 剩余数量；
- 参考价；
- 成交价；
- 费用；
- 状态；
- 拒绝/延迟原因；
- 对应风险决策；
- 对应券商订单和成交。

参考实现：

- [live_execution.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_v2/live_execution.py)
- [order_intents.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_runtime/order_intents.py)

### 2.6 共用保护语义

QuantDinger 的保护引擎让回测和实盘共享：

- 固定止损；
- 固定止盈；
- 跟踪止损；
- 激活阈值；
- 时间退出；
- 跳空穿越价格；
- 同 K 线多个条件的优先级。

我们应采用共用语义，但不能只支持固定百分比。首版还需要：

- 结构失效价；
- ATR 风险距离；
- 交易日数量而不只是自然秒数；
- 尾仓的独立保护状态；
- 日线交易仓与周线核心仓的独立保护策略；
- 账户和主题风险的外层否决。

风险参数非法时应 fail fast，不应静默截断到某个范围。

参考实现：

- [protection.py](https://github.com/OpenByteInc/QuantDinger/blob/main/backend_api_python/app/services/strategy_v2/protection.py)

### 2.7 长驻运行的所有权

QuantDinger v5 把 HTTP、交易循环、调度和有限后台任务分开：

- HTTP 只验证和写入持久化命令；
- trading worker 拥有策略循环、券商会话和未完成订单；
- scheduler worker 管理调度；
- Celery 只处理可序列化、可重试的有限任务；
- 租约、心跳和 fencing token 防止旧 worker 在失去所有权后继续下单。

首期研究和回测不需要这套基础设施。进入持续影子运行或实盘后，应引入同样的所有权概念，但可以先用：

- 单个 `trading-worker`；
- DuckDB/SQLite 或 PostgreSQL 的唯一租约行；
- 心跳；
- 单调递增 fencing token；
- 失去租约立即停止新增订单。

不需要一开始部署双 Redis、Celery 和完整监控栈。

参考文档：

- [Backend Process Roles](https://github.com/OpenByteInc/QuantDinger/blob/main/docs/architecture/PROCESS_ROLES_AND_TASKS.md)
- [Concurrency Model](https://github.com/OpenByteInc/QuantDinger/blob/main/docs/architecture/CONCURRENCY_MODEL.md)

## 3. 不建议照搬的部分

### 3.1 完整产品栈

暂不需要：

- Web 和移动端；
- 多用户、租户、会员、计费和支付；
- 多 LLM 投票；
- 多交易所和多券商；
- 双 Redis；
- Celery；
- Prometheus/Grafana/Alertmanager；
- 任意用户策略代码沙箱；
- 公网 API 和 OAuth。

这些能力会显著增加故障面，却不直接提高首个策略的样本外质量。

### 3.2 内置网格、马丁和 DCA

这些策略不适合作为当前系统的核心基线。尤其马丁和无上限加仓与“风险预算优先、不能因亏损改变仓位性质”的历史规则冲突。

### 3.3 通用成本默认值

QuantDinger 示例默认佣金与滑点各为 5 bps。我们不能把通用默认值当作真实成本，应从长桥成交历史估计：

- 不同产品的实际费用；
- 不同标的流动性下的价差；
- 订单金额与成交额比例；
- 常规时段和非正常时段的滑点；
- 取消、改单和未成交机会成本。

### 3.4 默认市价执行

其部分实盘请求对象默认 `market`。考虑到历史上追价和高噪声时段成交较多，我们的新增风险订单仍默认限价，市价单必须进入额外审批。

### 3.5 直接依赖其执行与会计代码

不建议直接复制当前执行代码。公开问题显示，模拟/实盘边界仍在快速演进。

## 4. 公开问题带来的额外教训

### 4.1 成交配对和 PnL 必须有会计不变量

公开问题 [#140](https://github.com/OpenByteInc/QuantDinger/issues/140) 报告过：

- 平仓记录缺少匹配开仓价；
- 无对应开仓的 ghost close；
- 由此产生虚假的巨额利润。

不论该问题后续何时修复，它说明只靠策略/订单状态机不足以保证账户正确。

我们的系统必须在每次成交后检查：

```text
平仓数量 <= 对应方向的可用持仓数量
已实现 PnL 必须来自明确匹配的 lot
没有开仓 lot 就不能生成盈利平仓
持仓数量 = 历史成交净和 = 券商持仓（允许已知结算差异）
现金变化 = 成交现金流 + 费用 + 公司行动
权益 = 现金 + 持仓市值
```

若任何不变量失败：

- 停止新增风险；
- 不得用缓存值继续计算 PnL；
- 保存原始事件；
- 启动券商对账；
- 只能通过显式更正事件修复，不能静默删除历史。

### 4.2 调度时间必须成为可测试契约

公开问题 [#178](https://github.com/OpenByteInc/QuantDinger/issues/178) 报告组合策略 schedule time 不正确。我们的日线首版应避免伪精确的盘中调度：

- 信号以交易所完成日线为准；
- 明确交易所时区；
- 记录数据实际可用时间；
- 下一可执行窗口由市场日历计算；
- 测试夏令时、节假日、半日市和时区转换。

### 4.3 模拟盘必须自己实现和验证

公开问题 [#148](https://github.com/OpenByteInc/QuantDinger/issues/148) 和 [#156](https://github.com/OpenByteInc/QuantDinger/issues/156) 仍在请求内建模拟账户。不能仅凭官网“paper/live”描述假设已有完全符合我们需求的模拟交易账本。

我们的模拟盘应直接复用回测的订单、成交和会计核心，只替换时钟和行情输入。

## 5. 对现有设计的具体修改

### 5.1 新增两个明确层次

```text
AlphaSignal
    -> PortfolioProposal
    -> RiskDecision
    -> CanonicalTradeAction
    -> OrderIntent
    -> BrokerOrder
    -> Fill
    -> LotAccounting
```

### 5.2 新增领域对象

- `StrategyManifest`
- `DeploymentPolicy`
- `ClockPolicy`
- `CanonicalTradeAction`
- `ProtectionSpec`
- `ProtectionState`
- `OrderLedgerEntry`
- `PositionLot`
- `AccountingInvariantResult`
- `RuntimeLease`

### 5.3 新增强制测试

- 相同数据和配置得到相同快照哈希与结果；
- 当前收盘信号不能在当前收盘成交；
- 重复处理同一已完成 K 线不会重复下单；
- 同一幂等键最多产生一个订单意图；
- 没有持仓时不能执行 `close_long`；
- 平仓不能意外反向；
- 部分成交后剩余数量正确；
- 跳空止损按可交易开盘价处理；
- 同 K 线止损和止盈同时触发时采用保守结果；
- 日线/周线持仓和尾仓分别归因；
- 失去 runtime lease 后不能生成新订单；
- 任何会计不变量失败时停止新增风险。

## 6. 最终采纳清单

### Phase 1 立即实现

- 策略 manifest 与代码哈希；
- canonical instrument；
- 点时股票池接口；
- 明确 bar-close/next-open 时序；
- 内容寻址数据快照；
- 双层信号契约；
- target quantity/value/weight；
- 订单审计账本；
- 模拟成交与会计不变量；
- 保守的保护触发逻辑；
- 相关单元和性质测试。

### Phase 3 再实现

- 独立 trading worker；
- 持久化命令；
- runtime lease、heartbeat 和 fencing token；
- 进程重启后的状态恢复；
- MCP/API 最小权限；
- Prometheus 类监控。

### 明确不采用

- QuantDinger 作为核心运行时；
- 它的前端或 SaaS 功能；
- 当前内置 Grid/Martingale/DCA 作为基线；
- 通用固定成本参数；
- 默认市价的新风险订单；
- 未经独立验证的执行和 PnL 代码。

## 7. 结论

QuantDinger 证实了我们原设计的大方向是对的：策略、组合、风险、执行和审计必须分层，回测与实盘需要共享时序与订单语义。

它让我们的设计进一步明确了三件事：

1. Vibe 的连续信号需要一个规范化交易动作层；
2. 可复现不仅是保存参数，还要对数据和源码做内容寻址；
3. 交易系统的正确性最终取决于订单幂等、持仓 lot 会计和可验证不变量，而不是漂亮的策略曲线。
