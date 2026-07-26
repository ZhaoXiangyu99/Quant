/**
 * 截至 index 的运行峰值回撤（%），不使用 index 之后的未来峰值（§复验 P2-6：去前视偏差）。
 * 回撤定义：dd = (value - runningPeak) / runningPeak * 100，恒 <= 0。
 * 用于历史日期查看净值曲线时，回撤只能由该日期及之前的数据推导。
 */
export function runningDrawdownAt(values: number[], index: number): number {
  if (!values.length || index < 0 || index >= values.length) return 0
  let peak = values[0]
  for (let i = 1; i <= index; i++) {
    if (values[i] > peak) peak = values[i]
  }
  const v = values[index]
  if (peak <= 0) return 0
  return ((v - peak) / peak) * 100
}
