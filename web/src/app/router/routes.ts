import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/overview' },
  {
    path: '/overview',
    name: 'overview',
    component: () => import('@/pages/overview/OverviewPage.vue'),
    meta: { title: '总览' },
  },
  {
    path: '/research/strategies',
    name: 'research',
    component: () => import('@/pages/research/StrategiesPage.vue'),
    meta: { title: '策略研究' },
  },
  {
    path: '/backtests',
    name: 'backtests',
    component: () => import('@/pages/backtests/BacktestsPage.vue'),
    meta: { title: '回测实验' },
  },
  {
    path: '/backtests/:runId',
    name: 'backtestDetail',
    component: () => import('@/pages/backtests/BacktestDetailPage.vue'),
    meta: { title: '回测详情' },
  },
  {
    path: '/approvals',
    name: 'approvals',
    component: () => import('@/pages/PlaceholderPage.vue'),
    meta: { title: '信号审批', milestone: 3 },
  },
  {
    path: '/risk',
    name: 'risk',
    component: () => import('@/pages/risk/RiskPage.vue'),
    meta: { title: '组合风险' },
  },
  {
    path: '/execution',
    name: 'execution',
    component: () => import('@/pages/execution/ExecutionPage.vue'),
    meta: { title: '订单执行' },
  },
  {
    path: '/market/chart',
    name: 'marketChart',
    component: () => import('@/pages/market/MarketChartPage.vue'),
    meta: { title: '行情图表' },
  },
  {
    path: '/reviews',
    name: 'reviews',
    component: () => import('@/pages/PlaceholderPage.vue'),
    meta: { title: '复盘报告', milestone: 2 },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/PlaceholderPage.vue'),
    meta: { title: '系统设置', milestone: 2 },
  },
  { path: '/:pathMatch(.*)*', redirect: '/overview' },
]
