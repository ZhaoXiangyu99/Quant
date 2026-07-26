/**
 * ECharts 按需引入 — Milestone 2
 * 只导入 LineChart + 基本组件，避免全量 ~1MB
 */
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

export default echarts
export type { EChartsOption } from 'echarts'
