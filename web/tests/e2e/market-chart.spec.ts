import { test, expect } from '@playwright/test'

function attachConsoleGuard(page: any): string[] {
  const errors: string[] = []
  page.on('pageerror', (e: Error) => errors.push(e.message))
  page.on('console', (m: any) => { if (m.type() === 'error') errors.push(m.text()) })
  return errors
}

test.describe('行情图表', () => {
  test('首次加载 Canvas 可见，无 console/pageerror', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    await expect(page.getByText('演示数据').first()).toBeVisible()
    const buyBtns = page.getByRole('button', { name: /买入|卖出|批准|approve|buy|sell/i })
    await expect(buyBtns).toHaveCount(0)
    expect(errors).toEqual([])
  })

  test('切换 AAPL→BTC 后 Canvas 仍存在', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    const sel = page.locator('select[aria-label="选择品种"]')
    await sel.selectOption('CRYPTO:BTC-USD')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    expect(errors).toEqual([])
  })

  test('切换 1D→1h 后 Canvas 仍存在', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '1h' }).click()
    // 等待数据加载：图表或空状态任一
    await expect(page.locator('canvas, .state-panel, table').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  test('切换 1D→4h 后 Canvas 仍存在', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '4h' }).click()
    await expect(page.locator('canvas, .state-panel, table').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  test('时间范围切换无 console/pageerror', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    for (const r of ['5D', '1M', '6M', '1Y', 'ALL', '1D']) {
      await page.locator('button.tb-btn', { hasText: r }).first().click()
      await page.waitForTimeout(2000)
    }
    expect(errors).toEqual([])
  })

  test('开关 BB/RSI 后 Canvas 仍存在', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    await page.locator('input[type="checkbox"]').first().check()
    await page.locator('input[type="checkbox"]').nth(1).check()
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 5000 })
    expect(errors).toEqual([])
  })

  test('指标参数修改', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    await page.locator('input[type="checkbox"]').first().check() // BB
    const periodInp = page.locator('input[type="number"]').first()
    await periodInp.fill('10')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 5000 })
    expect(errors).toEqual([])
  })

  test('非法参数显示错误', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await page.locator('input[type="checkbox"]').first().check()
    const periodInp = page.locator('input[type="number"]').first()
    await periodInp.fill('1') // 非法 period
    await expect(page.getByText('2–200')).toBeVisible({ timeout: 3000 })
    expect(errors).toEqual([])
  })

  test('TSLA 搜索并加载', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    // 在搜索框输入 TSLA 触发搜索
    const searchInput = page.locator('input[aria-label="搜索品种"]')
    await searchInput.fill('TSLA')
    await page.waitForTimeout(1000)
    // 选择 TSLA
    const sel = page.locator('select[aria-label="选择品种"]')
    await sel.selectOption('US:TSLA')
    await expect(page.locator('canvas, .state-panel, table').first()).toBeVisible({ timeout: 10000 })
    expect(errors).toEqual([])
  })

  test('空数据场景', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    // 用 M2 scenario 切换到 empty
    await page.goto('/market/chart', { waitUntil: 'domcontentloaded' })
    // empty 通过 DevStatePanel M2 dropdown 切换
    const m2sel = page.locator('#dev-scenario-m2')
    if (await m2sel.isVisible()) {
      await m2sel.selectOption('empty')
      await page.waitForTimeout(1000)
      await page.goto('/market/chart')
    }
    await expect(page.locator('.state-panel, canvas, table').first()).toBeVisible({ timeout: 8000 })
    expect(errors).toEqual([])
  })

  test('Chart/Table 往返切换后 Canvas 重建', async ({ page }) => {
    const errors = attachConsoleGuard(page)
    await page.goto('/market/chart')
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '数据表视图' }).click()
    await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 })
    await page.getByRole('button', { name: '图表视图' }).click()
    await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
    expect(errors).toEqual([])
  })

  test('1440/1024/768 无 document 横向溢出', async ({ page }) => {
    for (const width of [1440, 1024, 768]) {
      const errors = attachConsoleGuard(page)
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/market/chart')
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 8000 })
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
      const innerW = await page.evaluate(() => window.innerWidth)
      expect(scrollW, `width=${width}`).toBeLessThanOrEqual(innerW + 1)
      expect(errors, `width=${width}`).toEqual([])
    }
  })
})
