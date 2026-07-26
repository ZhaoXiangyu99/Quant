import { describe, it, expect } from 'vitest'
import { runningDrawdownAt } from '@/shared/utils/metrics'

describe('runningDrawdownAt（去前视偏差，§复验 P2-6）', () => {
  it('回撤只用截至该日期的运行峰值，不使用未来高点', () => {
    // 索引2 处出现更高峰值 120，之后回落；在索引5 查看时不得用 120 之后不存在的更高点
    const v = [100, 110, 120, 115, 105, 108]
    // 截至索引5 的运行峰值 = 120（历史高点），当前 108 → dd = (108-120)/120 = -10%
    expect(runningDrawdownAt(v, 5)).toBeCloseTo(-10, 5)
  })

  it('早期高点之后的低点回撤基于早期高点，而非后期更高的未来峰值', () => {
    // 索引1 = 130（峰值），索引3 = 90（低点），索引4 = 140 是未来更高点
    const v = [100, 130, 120, 90, 140]
    // 在索引3 查看时，运行峰值=130（不能用到索引4的140）→ dd = (90-130)/130 ≈ -30.77%
    expect(runningDrawdownAt(v, 3)).toBeCloseTo(-30.769, 2)
  })

  it('峰值点本身回撤为 0', () => {
    expect(runningDrawdownAt([100, 130, 120], 1)).toBe(0)
  })

  it('单调上升序列回撤恒为 0', () => {
    const v = [100, 101, 102, 103]
    for (let i = 0; i < v.length; i++) expect(runningDrawdownAt(v, i)).toBe(0)
  })

  it('越界索引返回 0', () => {
    expect(runningDrawdownAt([1, 2, 3], 99)).toBe(0)
    expect(runningDrawdownAt([], 0)).toBe(0)
  })
})
