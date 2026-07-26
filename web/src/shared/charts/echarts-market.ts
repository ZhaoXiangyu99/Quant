/**
 * ECharts 按需引入 — 行情图表专用（Candlestick + Bar + Line + MarkLine + DataZoom）
 */
import * as echarts from 'echarts/core'
import { CandlestickChart, BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  MarkLineComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  CandlestickChart, BarChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent,
  DataZoomComponent, MarkLineComponent,
  CanvasRenderer,
])

export default echarts
export type { EChartsOption } from 'echarts'
