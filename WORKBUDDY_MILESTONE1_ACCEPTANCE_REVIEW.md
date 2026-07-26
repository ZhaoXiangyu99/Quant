# WorkBuddy Milestone 1 验收报告

> 验收日期：2026-07-26  
> 验收对象：`web/` 量化策略中枢 Milestone 1  
> 结论：**暂不签收，修复 P1 问题后复验**

## 1. 验收概况

以下检查已经通过：

- `npm run typecheck`
- `npm run lint`
- `npm test`：25/25 通过
- `npm run test:e2e`：3/3 通过
- `npm run build`
- 9 种总览状态均可通过开发状态开关显示
- `演示数据` 标签可见
- 总览不存在直接买入、卖出或批准按钮
- `HARD_BLOCK` 使用红色和文字标签
- 对账失败时显示 `缺少数据，无法计算`
- healthy 与 hard-block 截图已经生成

构建存在非阻断警告：

- `OverviewPage` JavaScript chunk 约 1,051KB，超过 Vite 500KB 提示阈值。

## 2. P1：响应式布局不符合验收要求

验收规范要求支持 1440px、1024px 和 768px。

人工浏览器实测：

| 视口宽度 | document 实际宽度 | 结果 |
|---:|---:|---|
| 1440px | 1473px | 存在整页横向滚动 |
| 1024px | 1473px | 页面右侧严重截断 |
| 768px | 1473px | 页面右侧严重截断，Sidebar 未折叠 |

原因：

- `web/src/widgets/approval-queue/PendingApprovalTable.vue`
  - 表格所有单元格使用 `white-space: nowrap`；
  - 表格外没有受控的 `overflow-x: auto` 容器；
  - 表格最小内容宽度把整个页面撑宽。
- `web/src/app/layouts/Sidebar.vue`
  - 没有 Tablet 响应式折叠逻辑。
- `web/src/shared/styles/global.css`
  - 只调整了网格列数，没有处理 Sidebar 和宽表格。

整改要求：

1. Tablet `768–1279px` 下折叠 Sidebar。
2. 待审批表格采用以下任一方案：
   - 固定关键列并用详情抽屉显示其他字段；或
   - 在卡片内部提供横向滚动，不能让 `document` 横向溢出。
3. 1440、1024、768 三档均满足：
   - `document.documentElement.scrollWidth <= window.innerWidth`；
   - 主要内容可阅读；
   - 历史错误警告完整显示。
4. 增加 Playwright 响应式回归测试。

## 3. P1：健康态 Mock 数据违反首期交易规则

文件：`web/src/shared/api/mock/scenarios.ts`

当前问题：

1. NVDA 被标记为“再入场”，最大亏损占净值 1.40%，风险状态却为 `PASS`。
   - 复盘规则要求首次再入场最大亏损为净值 0.25%–0.5%，或正常风险的一半，取更低者。
2. TSLA 是 `short` 做空信号，风险状态却为 `PASS`。
   - 首期明确不支持做空。
3. “特殊产品仓”显示 4% 市值占比和 25% 风险预算占比。
   - 系统设计规定特殊产品仓首版禁用。

整改要求：

- healthy 状态不得出现首期禁止的产品或交易方向。
- NVDA 再入场风险必须符合 0.25%–0.5% 上限，或者改为非再入场的合规示例。
- TSLA 改为普通股票做多信号，或从 healthy 状态删除。
- 特殊产品仓可以保留展示位置，但首版数值应为 0，并明确显示“首版禁用”。
- 增加健康态领域规则单元测试。

## 4. P1：“数据健康”计算口径错误

文件：`web/src/pages/overview/OverviewPage.vue`

当前 `passRate` 使用“历史错误警告”中的 `PASS` 数量计算数据健康度。

后果：

- 风险警告会错误降低数据健康度；
- hard risk block 页面显示数据健康 78%，但这个数字实际是风险规则通过率；
- 数据质量与交易风险被错误混用。

整改要求：

- 数据健康必须来自独立的数据质量 DTO 或数据质量检查结果。
- 至少区分：
  - 数据完整性；
  - 数据及时性；
  - 对账状态；
  - 缺失值或异常价格检查。
- 如果 Milestone 1 暂无独立质量检查数据，应显示 `dataStatus`、延迟和异常数量，不得伪造通过率。
- 增加风险警告不影响数据质量口径的单元测试。

## 5. P1：最早执行时间使用浏览器本地时区

涉及文件：

- `web/src/shared/utils/format.ts`
- `web/src/widgets/approval-queue/PendingApprovalTable.vue`
- `web/src/app/layouts/AppHeader.vue`

当前问题：

- Header 声明“美东时间”；
- `formatDateTime` 使用浏览器本地时区；
- `2026-07-27T14:30:00Z` 在 Asia/Shanghai 环境显示为 `2026-07-27 22:30`；
- 待审批表格没有显示时区。

整改要求：

- 交易执行时间按 `system.marketTimezone` 格式化；
- 当前首期应按 `America/New_York` 展示；
- 时间文本必须带 `ET`、`EDT/EST` 或明确的时区标签；
- 不得依赖运行浏览器的本地时区；
- 增加跨时区格式化测试。

## 6. P1：生产构建仍然包含并使用 Mock 场景

涉及文件：

- `web/src/shared/api/client.ts`
- `web/src/shared/state/overview.ts`
- `web/src/shared/api/mock/`

当前问题：

- 统一 API 入口无条件导出 `fetchOverviewMock`；
- 生产构建继续包含全部 Mock fixture；
- `readInitialScenario()` 在生产环境仍读取 `?scenario=`；
- DEV 面板虽然不渲染，但生产 URL 仍能激活隐藏的演示状态。

整改要求：

1. Mock 客户端和场景只允许在开发或测试环境导入。
2. 生产构建不得通过 `?scenario=` 激活演示状态。
3. 生产只读 API 未配置时，显示明确的“API 未配置/不可用”状态。
4. 生产构建产物中不应包含场景切换器或完整 Mock fixture 文本。
5. 增加 production build 检查。

## 7. P2：图表 Tooltip 回撤存在前视偏差

文件：`web/src/widgets/benchmark-chart/BenchmarkChart.vue`

当前计算：

```ts
const dd = ((p - Math.max(...portfolio)) / Math.max(...portfolio)) * 100
```

这里使用整个显示窗口的最高点。查看历史日期时，可能使用该日期之后的未来最高点计算回撤。

整改要求：

- 每个历史日期的回撤只能使用截至该日期的运行峰值；
- 最好由后端/分析层直接提供审计过的 drawdown 序列；
- 增加“历史日期不得使用未来峰值”的单元测试。

## 8. P2：测试和仓库卫生

### 测试覆盖

- 当前只有 healthy 测试监听 console error；
- hard-block 和 accounting-block 没有单独收集 console/page errors；
- 没有响应式溢出测试；
- 没有交易规则语义测试；
- 没有生产 Mock 隔离测试。

### `.gitignore`

当前项目没有发现有效的 `.gitignore`，以下目录未被忽略：

- `web/node_modules/`，约 216MB；
- `web/dist/`；
- `web/test-results/`；
- Playwright 临时产物。

整改要求：

- 增加合适的 `.gitignore`；
- 保留要求交付的 healthy/hard-block 截图；
- 不提交依赖目录、构建目录和临时测试结果。

## 9. 复验命令

修复后至少执行：

```bash
cd web
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run build
```

复验还需人工检查：

1. 1440、1024、768 三档没有 document 级横向滚动。
2. 9 种状态均可在开发环境查看。
3. 生产构建没有状态切换面板、URL 场景入口和 Mock fixture。
4. 所有最早执行时间显示明确的美东时区。
5. healthy 状态不存在做空、特殊产品持仓或超限再入场风险。
6. 数据健康与历史风险警告采用不同的数据口径。

## 10. 复验通过条件

以下条件全部满足后，Milestone 1 才可签收：

- 本报告第 2–6 节的 P1 问题全部关闭；
- typecheck、lint、unit、e2e、build 全部通过；
- 响应式和生产 Mock 隔离具备自动化回归测试；
- 不新增真实券商、真实审批或真实下单能力；
- WorkBuddy 在交付说明中列明改动文件、测试结果和剩余差异。
