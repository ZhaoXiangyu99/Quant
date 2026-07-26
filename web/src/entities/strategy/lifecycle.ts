import type { LifecycleStage, StrategyLifecycleSummary } from '@/shared/api/types'

/** 固定生命周期阶段顺序（§6.6）：研究 → 验证 → 模拟 → 影子 → 受限实盘 → 实盘 → 退役。 */
export const LIFECYCLE_ORDER: LifecycleStage[] = [
  'research',
  'validation',
  'simulation',
  'shadow',
  'restricted_live',
  'live',
  'retired',
]

export const LIFECYCLE_LABEL: Record<LifecycleStage, string> = {
  research: '研究',
  validation: '验证',
  simulation: '模拟',
  shadow: '影子',
  restricted_live: '受限实盘',
  live: '实盘',
  retired: '退役',
}

/** 构造空的生命周期分布（每个阶段计数为 0），便于 mock 填充。 */
export function emptyLifecycle(): StrategyLifecycleSummary[] {
  return LIFECYCLE_ORDER.map((stage) => ({
    stage,
    label: LIFECYCLE_LABEL[stage],
    count: 0,
  }))
}
