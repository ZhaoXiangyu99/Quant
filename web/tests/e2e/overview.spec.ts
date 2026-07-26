import { test, expect, type Page } from '@playwright/test'

const FORBIDDEN = ['买入', '卖出', '批准']

function attachConsoleGuard(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  page.on('pageerror', (err) => errors.push(String(err)))
  return errors
}

async function screenshot(page: Page, name: string) {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.screenshot({ path: `tests/e2e/screenshots/${name}.png`, fullPage: true })
}

test.describe('总览页冒烟测试', () => {
  test('健康态：结构完整、演示数据标识、无直接买卖/批准按钮、无控制台错误', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/overview')

    // 历史错误警告面板（最高风险权重）存在
    await expect(page.getByText('历史错误警告')).toBeVisible()

    // 演示数据标识可见（mock 数据边界，§Mock data rules）
    await expect(page.getByText('演示数据', { exact: true })).toBeVisible()

    // 账户净值带币种
    await expect(page.getByText('账户净值')).toBeVisible()

    // 总览页不得出现直接买入/卖出/批准按钮（§6.4 / 非协商规则）
    for (const t of FORBIDDEN) {
      const cnt = await page.locator(`button:has-text("${t}"), a:has-text("${t}")`).count()
      expect(cnt, `不应出现「${t}」按钮/链接`).toBe(0)
    }

    // 最大亏损同时展示金额与净值占比
    await expect(page.getByText('最大亏损占净值')).toBeVisible()
    await expect(page.locator('td.num', { hasText: '%' }).first()).toBeVisible()

    // 特殊产品仓首版禁用标注（§复验 P1-2）
    await expect(page.getByText('首版禁用').first()).toBeVisible()

    // 数据健康口径独立于风险（健康态=100%，§复验 P1-3）
    await expect(page.locator('.kpi', { hasText: '数据健康' })).toContainText('100%')

    // 执行时间按美东时区展示（含 ET/EDT/EST 标签，§复验 P1-4）
    await expect(page.getByText(/EDT|EST/).first()).toBeVisible()

    await screenshot(page, 'overview-healthy')
    expect(errors, `不应有控制台错误：${errors.join(' | ')}`).toEqual([])
  })

  test('风险硬阻断态：硬阻断文字标签 + 数据健康不受风险影响 + 无控制台错误', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/overview?scenario=hard_risk_block')

    await expect(page.getByText('风险硬阻断：已阻断')).toBeVisible()
    await expect(page.getByText('硬阻断', { exact: true })).toBeVisible()

    // 风险硬阻断不得降低数据健康度（仍为 100%，§复验 P1-3）
    await expect(page.locator('.kpi', { hasText: '数据健康' })).toContainText('100%')

    await screenshot(page, 'overview-hard-block')
    expect(errors, `不应有控制台错误：${errors.join(' | ')}`).toEqual([])
  })

  test('对账失败态：缺失风险数据展示「缺少数据，无法计算」+ 数据质量下降 + 无控制台错误', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/overview?scenario=accounting_block')

    await expect(page.getByText('对账失败：已阻断')).toBeVisible()
    await expect(page.getByText('缺少数据，无法计算').first()).toBeVisible()

    // 对账失败应反映在数据质量（健康度下降、对账失败），而非交易风险警告
    await expect(page.locator('.kpi', { hasText: '数据健康' })).toContainText('40%')

    expect(errors, `不应有控制台错误：${errors.join(' | ')}`).toEqual([])
  })

  test('响应式：1440/1024/768 三档均无 document 级横向溢出，历史错误警告完整显示', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    const widths = [1440, 1024, 768]
    for (const w of widths) {
      await page.setViewportSize({ width: w, height: 900 })
      await page.goto('/overview')
      await expect(page.getByText('历史错误警告')).toBeVisible()
      const measured = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        inner: window.innerWidth,
      }))
      expect(
        measured.scroll,
        `视口 ${w}px 出现横向溢出（scrollWidth=${measured.scroll} > innerWidth=${measured.inner}）`,
      ).toBeLessThanOrEqual(measured.inner)
    }
    expect(errors, `不应有控制台错误：${errors.join(' | ')}`).toEqual([])
  })
})
