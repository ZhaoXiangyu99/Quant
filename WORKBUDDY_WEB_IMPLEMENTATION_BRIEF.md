# WorkBuddy Web Implementation Brief

## Objective

Build the first front-end milestone for the personal quantitative trading core system.

This milestone is a UI shell and a read-only overview prototype. It must not place, simulate, approve, or submit real orders.

## Required reading

Before implementation, read:

1. `AGENTS.md`
2. `量化交易核心策略系统设计.md`
3. `QuantDinger_借鉴评估.md`
4. `网页产品设计与WorkBuddy交接规范.md`
5. `开单前检查表.md`

Visual reference:

- `design/quant-system-dashboard-v1.png`

If the image conflicts with the written specifications, follow the written specifications.

## Milestone 1 scope

Implement:

- Vue 3 + TypeScript application shell;
- Vite;
- Vue Router;
- Sidebar and top header;
- design tokens;
- `/overview`;
- reusable KPI card;
- benchmark equity chart;
- historical error warning panel;
- pending approval table;
- risk-sleeve allocation card;
- strategy lifecycle card;
- loading, empty, degraded, blocked, and error states;
- mock-data boundary clearly separated from production API clients;
- unit tests for status and formatting logic;
- one Playwright overview smoke test.

Do not implement:

- broker credentials;
- Longbridge connectivity;
- live market data;
- real approvals;
- real backtests;
- real order submission;
- automatic trading;
- quick-trade controls;
- mobile approval;
- backend services;
- arbitrary strategy code execution.

## Non-negotiable product rules

- No direct buy/sell button on `/overview`.
- Risk status is more visually prominent than returns.
- `HARD_BLOCK` is red and uses a text label.
- All amounts include currency.
- Maximum loss shows both money and NAV percentage.
- Market-value exposure and risk exposure use different labels.
- Missing risk data renders `缺少数据，无法计算`; never infer it on the client.
- Mock values must display a visible `演示数据` label.
- The client must not calculate authoritative risk.
- Approval actions are outside Milestone 1.

## Suggested project location

```text
web/
```

Use the directory structure defined in `网页产品设计与WorkBuddy交接规范.md`.

## Visual target

The visual target is:

- dark navy enterprise fintech;
- restrained blue/violet charts;
- amber warnings;
- red only for hard blocks;
- 232px fixed desktop sidebar;
- 56px top header;
- 12-column content grid;
- 12px cards;
- subtle borders;
- minimal shadows;
- Chinese interface;
- readable tabular numerals.

Do not imitate:

- crypto exchange dashboards;
- neon terminals;
- black/green hacker UI;
- casino-like PnL emphasis;
- dense candlestick walls.

## Mock data rules

Keep mock fixtures under an explicit development-only boundary, for example:

```text
src/shared/api/mock/
```

Every mock response includes:

```text
asOf
availableAt
source: "mock"
dataStatus
requestId
```

The page must display an `演示数据` indicator whenever the source is `mock`.

## Required overview states

Create Storybook-like fixtures or a local state switch for:

1. healthy;
2. data delayed;
3. risk warning;
4. hard risk block;
5. accounting reconciliation block;
6. no pending signals;
7. two pending signals;
8. API loading;
9. API error.

The state switch is development-only and cannot be exposed in a production build.

## Acceptance

Milestone 1 is complete when:

- the app runs locally with one documented command;
- `/overview` matches the information hierarchy of the design;
- all states above can be reviewed;
- no production trading integration exists;
- lint, typecheck, unit tests, and the overview smoke test pass;
- responsive layouts work at 1440px, 1024px, and 768px;
- the implementation has no console errors;
- the README documents setup and verification;
- screenshots are captured for healthy and hard-block states.

## Handoff response

When finished, report:

- files created;
- commands used;
- tests run and results;
- known visual differences;
- assumptions;
- what remains for Milestone 2;
- screenshots.
