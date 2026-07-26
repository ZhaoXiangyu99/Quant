/** 侧边栏导航：固定顺序（§5.2）。 */
export interface NavItem {
  path: string
  label: string
  icon: string
  /** 是否允许产生交易动作（§4 路由框架） */
  allowsTradeAction: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { path: '/overview', label: '总览', icon: 'overview', allowsTradeAction: false },
  { path: '/research/strategies', label: '策略研究', icon: 'research', allowsTradeAction: false },
  { path: '/backtests', label: '回测实验', icon: 'backtest', allowsTradeAction: false },
  { path: '/approvals', label: '信号审批', icon: 'approval', allowsTradeAction: true },
  { path: '/risk', label: '组合风险', icon: 'risk', allowsTradeAction: false },
  { path: '/execution', label: '订单执行', icon: 'execution', allowsTradeAction: false },
  { path: '/market/chart', label: '行情图表', icon: 'chart', allowsTradeAction: false },
  { path: '/reviews', label: '复盘报告', icon: 'review', allowsTradeAction: false },
  { path: '/settings', label: '系统设置', icon: 'settings', allowsTradeAction: false },
]
